import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Users, CheckCircle, XCircle, TrendingUp, Award, Clock, 
  MapPin, Download, X 
} from 'lucide-react';
import Sidebar from '../Sidebar';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalTrainings: 0,
    totalTrainers: 0,
    totalAttendees: 0,
    attendanceRate: 0,
    quizPassRate: 0,
    quizFailRate: 0,
    completionRate: 0,
    totalVenues: 0,
    certificatesIssued: 0
  });

  const [trainerStats, setTrainerStats] = useState([]);
  const [recentTrainings, setRecentTrainings] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [drillDownData, setDrillDownData] = useState([]);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState(null); // { type: 'user' | 'training', id: string, name: string }

  const loadAnalytics = useCallback(() => {
    // Load data with array guards
    const trainingSchedulesRaw = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
    const trainingSchedules = Array.isArray(trainingSchedulesRaw) ? trainingSchedulesRaw : [];

    const attendancesRaw = JSON.parse(localStorage.getItem('attendances') || '[]');
    const attendances = Array.isArray(attendancesRaw) ? attendancesRaw : [];

    const quizResultsRaw = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const quizResults = Array.isArray(quizResultsRaw) ? quizResultsRaw : [];

    const enrollmentsRaw = JSON.parse(localStorage.getItem('enrollments') || '[]');
    const enrollments = Array.isArray(enrollmentsRaw) ? enrollmentsRaw : [];

    const certificatesRaw = JSON.parse(localStorage.getItem('certificates') || '[]');
    const certificates = Array.isArray(certificatesRaw) ? certificatesRaw : [];

    const usersRaw = JSON.parse(localStorage.getItem('users') || '[]');
    const users = Array.isArray(usersRaw) ? usersRaw : [];

    const adminsRaw = JSON.parse(localStorage.getItem('admins') || '[]');
    const admins = Array.isArray(adminsRaw) ? adminsRaw : [];

    const trainers = [...users.filter(u => u.role === 'trainer'), ...admins.filter(a => a.role === 'trainer')];

    // Apply active filter
    let filteredTrainings = trainingSchedules;
    let filteredAttendances = attendances;
    let filteredQuizResults = quizResults;
    let filteredEnrollments = enrollments;

    if (activeFilter) {
      if (activeFilter.type === 'user') {
        // Filter by user
        filteredAttendances = attendances.filter(a => a.userId === activeFilter.id);
        filteredQuizResults = quizResults.filter(q => q.userId === activeFilter.id);
        filteredEnrollments = enrollments.filter(e => e.userId === activeFilter.id);
        // Get trainings that this user attended or enrolled in
        const userTrainingIds = new Set([...filteredAttendances.map(a => a.trainingId), ...filteredEnrollments.map(e => e.trainingId)]);
        filteredTrainings = trainingSchedules.filter(t => userTrainingIds.has(t.id));
      } else if (activeFilter.type === 'training') {
        // Filter by training
        filteredTrainings = trainingSchedules.filter(t => t.id === activeFilter.id);
        filteredAttendances = attendances.filter(a => a.trainingId === activeFilter.id);
        filteredQuizResults = quizResults.filter(q => q.trainingId === activeFilter.id);
        filteredEnrollments = enrollments.filter(e => e.trainingId === activeFilter.id);
      }
    }

    // Filter by time
    filteredTrainings = filterByTime(filteredTrainings, timeFilter);
    filteredAttendances = filterByTime(filteredAttendances, timeFilter);
    filteredQuizResults = filterByTime(filteredQuizResults, timeFilter);
    filteredEnrollments = filterByTime(filteredEnrollments, timeFilter);

    // Calculate total trainings
    const totalTrainings = filteredTrainings.length;

    // Calculate total trainers
    const totalTrainers = trainers.length;

    // Calculate total attendees
    const totalAttendees = filteredAttendances.length;

    // Calculate attendance rate (attendees / enrollments)
    const attendanceRate = filteredEnrollments.length > 0 
      ? Math.round((filteredAttendances.length / filteredEnrollments.length) * 100) 
      : 0;

    // Calculate quiz pass/fail rates
    const passedQuizzes = filteredQuizResults.filter(r => r.passed).length;
    const quizPassRate = filteredQuizResults.length > 0 
      ? Math.round((passedQuizzes / filteredQuizResults.length) * 100) 
      : 0;
    const quizFailRate = filteredQuizResults.length > 0 
      ? 100 - quizPassRate 
      : 0;

    // Calculate completion rate (completed trainings / total trainings)
    const completedTrainings = filteredTrainings.filter(t => t.status === 'completed').length;
    const completionRate = totalTrainings > 0 
      ? Math.round((completedTrainings / totalTrainings) * 100) 
      : 0;

    // Calculate total unique venues
    const venues = [...new Set(filteredTrainings.map(t => t.venue).filter(Boolean))];
    const totalVenues = venues.length;

    // Calculate certificates issued
    const certificatesIssued = certificates.length;

    setStats({
      totalTrainings,
      totalTrainers,
      totalAttendees,
      attendanceRate,
      quizPassRate,
      quizFailRate,
      completionRate,
      totalVenues,
      certificatesIssued
    });

    // Calculate trainer stats
    const trainerData = trainers.map(trainer => {
      const trainerTrainings = filteredTrainings.filter(t => t.trainer === trainer.name);
      const trainerAttendances = filteredAttendances.filter(a => {
        const training = filteredTrainings.find(t => t.id === a.trainingId);
        return training && training.trainer === trainer.name;
      });
      
      return {
        name: trainer.name,
        trainingsAssigned: trainerTrainings.length,
        totalAttendees: trainerAttendances.length,
        avgAttendance: trainerTrainings.length > 0 
          ? Math.round((trainerAttendances.length / trainerTrainings.length) * 100) 
          : 0
      };
    }).sort((a, b) => b.trainingsAssigned - a.trainingsAssigned);

    // If filtering by user, show only trainers assigned to that user's trainings
    if (activeFilter && activeFilter.type === 'user') {
      const userTrainerNames = new Set(filteredTrainings.map(t => t.trainer));
      return trainerData.filter(t => userTrainerNames.has(t.name));
    }

    setTrainerStats(trainerData);

    // Get recent trainings (last 5)
    const sortedTrainings = [...filteredTrainings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    setRecentTrainings(sortedTrainings);
  }, [timeFilter, activeFilter]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const filterByTime = (data, filter) => {
    if (filter === 'all') return data;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    if (filter === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (filter === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    } else if (filter === 'quarter') {
      cutoffDate.setMonth(now.getMonth() - 3);
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.createdAt || item.date);
      return itemDate >= cutoffDate;
    });
  };

  const handleMetricClick = (metric) => {
    setSelectedMetric(metric);
    const data = getDrillDownData(metric);
    setDrillDownData(data);
    setDrillDownTitle(getDrillDownTitle(metric));
  };

  const getDrillDownData = (metric) => {
    const trainingSchedulesRaw = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
    const trainingSchedules = Array.isArray(trainingSchedulesRaw) ? trainingSchedulesRaw : [];

    const attendancesRaw = JSON.parse(localStorage.getItem('attendances') || '[]');
    const attendances = Array.isArray(attendancesRaw) ? attendancesRaw : [];

    const quizResultsRaw = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const quizResults = Array.isArray(quizResultsRaw) ? quizResultsRaw : [];

    const enrollmentsRaw = JSON.parse(localStorage.getItem('enrollments') || '[]');
    const enrollments = Array.isArray(enrollmentsRaw) ? enrollmentsRaw : [];

    const usersRaw = JSON.parse(localStorage.getItem('users') || '[]');
    const users = Array.isArray(usersRaw) ? usersRaw : [];

    switch (metric) {
      case 'totalTrainings':
        return trainingSchedules.map(t => {
          const trainingAttendances = attendances.filter(a => a.trainingId === t.id);
          const trainingEnrollments = enrollments.filter(e => e.trainingId === t.id);
          const totalParticipants = t.participants?.length || trainingEnrollments.length || 0;
          const attendedCount = trainingAttendances.length;
          const adherenceRate = totalParticipants > 0 ? Math.round((attendedCount / totalParticipants) * 100) : 0;
          
          return {
            title: t.title,
            date: t.startDate,
            venue: t.venue,
            trainer: t.trainer,
            status: t.status,
            totalParticipants,
            attendedCount,
            adherenceRate: `${adherenceRate}%`,
            trainingId: t.id
          };
        });
      
      case 'totalAttendees':
        return attendances.map(a => {
          const training = trainingSchedules.find(t => t.id === a.trainingId);
          const user = users.find(u => u.id === a.userId);
          return {
            userName: user?.name || 'Unknown',
            userEmail: user?.email || 'Unknown',
            userId: a.userId,
            trainingTitle: training?.title || 'Unknown',
            date: a.attendedAt,
            status: a.status
          };
        });
      
      case 'attendanceRate':
        const notAttended = enrollments.filter(e => 
          !attendances.some(a => a.trainingId === e.trainingId && a.userId === e.userId)
        ).map(e => {
          const training = trainingSchedules.find(t => t.id === e.trainingId);
          const user = users.find(u => u.id === e.userId);
          return {
            userName: user?.name || 'Unknown',
            userEmail: user?.email || 'Unknown',
            userId: e.userId,
            trainingTitle: training?.title || 'Unknown',
            date: training?.startDate,
            status: 'Not Attended'
          };
        });
        return [...attendances.map(a => {
          const training = trainingSchedules.find(t => t.id === a.trainingId);
          const user = users.find(u => u.id === a.userId);
          return {
            userName: user?.name || 'Unknown',
            userEmail: user?.email || 'Unknown',
            userId: a.userId,
            trainingTitle: training?.title || 'Unknown',
            date: a.attendedAt,
            status: 'Attended'
          };
        }), ...notAttended];
      
      case 'quizPassRate':
        return quizResults.map(q => {
          const user = users.find(u => u.id === q.userId);
          return {
            userName: user?.name || 'Unknown',
            userEmail: user?.email || 'Unknown',
            userId: q.userId,
            quizTitle: q.quizTitle,
            score: q.score,
            passed: q.passed,
            date: q.completedAt
          };
        });
      
      default:
        return [];
    }
  };

  const getDrillDownTitle = (metric) => {
    const titles = {
      totalTrainings: 'All Trainings',
      totalAttendees: 'Attendee Details',
      attendanceRate: 'Attendance Details',
      quizPassRate: 'Quiz Results'
    };
    return titles[metric] || 'Details';
  };

  const closeDrillDown = () => {
    setSelectedMetric(null);
    setDrillDownData([]);
  };

  const handleRowClick = (row, metric) => {
    closeDrillDown();
    
    if (metric === 'totalAttendees' || metric === 'attendanceRate') {
      // Filter by user
      const user = JSON.parse(localStorage.getItem('users') || '[]').find(u => u.name === row.userName);
      if (user) {
        setActiveFilter({ type: 'user', id: user.id, name: row.userName });
      }
    } else if (metric === 'totalTrainings') {
      // Filter by training
      const training = JSON.parse(localStorage.getItem('trainingSchedules') || '[]').find(t => t.title === row.title);
      if (training) {
        setActiveFilter({ type: 'training', id: training.id, name: row.title });
      }
    }
  };

  const clearFilter = () => {
    setActiveFilter(null);
  };

  // Chart data preparation
  const getAttendanceByMonth = () => {
    const attendancesRaw = JSON.parse(localStorage.getItem('attendances') || '[]');
    let attendances = Array.isArray(attendancesRaw) ? attendancesRaw : [];
    
    // Apply active filter
    if (activeFilter && activeFilter.type === 'user') {
      attendances = attendances.filter(a => a.userId === activeFilter.id);
    } else if (activeFilter && activeFilter.type === 'training') {
      attendances = attendances.filter(a => a.trainingId === activeFilter.id);
    }
    
    const months = {};
    attendances.forEach(a => {
      const date = new Date(a.attendedAt);
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      months[monthKey] = (months[monthKey] || 0) + 1;
    });
    
    return Object.entries(months).map(([month, count]) => ({ month, count }));
  };

  const getQuizPassFailData = () => {
    return [
      { name: 'Passed', value: stats.quizPassRate, color: '#10B981' },
      { name: 'Failed', value: stats.quizFailRate, color: '#EF4444' }
    ];
  };

  const getTrainingStatusData = () => {
    const trainingSchedulesRaw = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
    let trainingSchedules = Array.isArray(trainingSchedulesRaw) ? trainingSchedulesRaw : [];
    
    // Apply active filter
    if (activeFilter) {
      if (activeFilter.type === 'training') {
        trainingSchedules = trainingSchedules.filter(t => t.id === activeFilter.id);
      } else if (activeFilter.type === 'user') {
        // Get trainings for this user
        const attendancesRaw = JSON.parse(localStorage.getItem('attendances') || '[]');
        const enrollmentsRaw = JSON.parse(localStorage.getItem('enrollments') || '[]');
        const userTrainingIds = new Set([
          ...attendancesRaw.filter(a => a.userId === activeFilter.id).map(a => a.trainingId),
          ...enrollmentsRaw.filter(e => e.userId === activeFilter.id).map(e => e.trainingId)
        ]);
        trainingSchedules = trainingSchedules.filter(t => userTrainingIds.has(t.id));
      }
    }
    
    const statusCounts = {};
    trainingSchedules.forEach(t => {
      const status = t.status || 'scheduled';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };

  const StatCard = ({ title, value, icon: Icon, color, metric, onClick }) => (
    <div 
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
      onClick={() => onClick(metric)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
      <p className="text-xs text-blue-600 mt-2">Click for details →</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                  {activeFilter && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      <span>Filter: {activeFilter.type === 'user' ? 'User' : 'Training'} - {activeFilter.name}</span>
                      <button onClick={clearFilter} className="hover:text-blue-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                  </select>
                  <button
                    onClick={loadAnalytics}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Trainings"
              value={stats.totalTrainings}
              icon={Calendar}
              color="text-blue-600"
              metric="totalTrainings"
              onClick={handleMetricClick}
            />
            <StatCard
              title="Total Trainers"
              value={stats.totalTrainers}
              icon={Users}
              color="text-purple-600"
              metric="totalTrainers"
              onClick={handleMetricClick}
            />
            <StatCard
              title="Total Attendees"
              value={stats.totalAttendees}
              icon={CheckCircle}
              color="text-green-600"
              metric="totalAttendees"
              onClick={handleMetricClick}
            />
            <StatCard
              title="Attendance Rate"
              value={`${stats.attendanceRate}%`}
              icon={TrendingUp}
              color="text-emerald-600"
              metric="attendanceRate"
              onClick={handleMetricClick}
            />
          </div>

          {/* Second Row Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Quiz Pass Rate"
              value={`${stats.quizPassRate}%`}
              icon={CheckCircle}
              color="text-green-600"
              metric="quizPassRate"
              onClick={handleMetricClick}
            />
            <StatCard
              title="Quiz Fail Rate"
              value={`${stats.quizFailRate}%`}
              icon={XCircle}
              color="text-red-600"
              metric="quizFailRate"
              onClick={handleMetricClick}
            />
            <StatCard
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              icon={Award}
              color="text-amber-600"
              metric="completionRate"
              onClick={handleMetricClick}
            />
            <StatCard
              title="Certificates Issued"
              value={stats.certificatesIssued}
              icon={Award}
              color="text-yellow-600"
              metric="certificatesIssued"
              onClick={handleMetricClick}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Attendance Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getAttendanceByMonth()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Quiz Pass/Fail */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getQuizPassFailData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getQuizPassFailData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Training Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTrainingStatusData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Trainer Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trainer Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trainerStats.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="trainingsAssigned" fill="#10B981" name="Trainings" />
                  <Bar dataKey="totalAttendees" fill="#3B82F6" name="Attendees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trainer Stats */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Trainer Performance</h2>
            </div>
            <div className="p-6">
              {trainerStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 border-b">
                        <th className="pb-3 font-medium">Trainer</th>
                        <th className="pb-3 font-medium">Trainings Assigned</th>
                        <th className="pb-3 font-medium">Total Attendees</th>
                        <th className="pb-3 font-medium">Avg Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainerStats.map((trainer, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 text-sm text-gray-900">{trainer.name}</td>
                          <td className="py-3 text-sm text-gray-600">{trainer.trainingsAssigned}</td>
                          <td className="py-3 text-sm text-gray-600">{trainer.totalAttendees}</td>
                          <td className="py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              trainer.avgAttendance >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {trainer.avgAttendance}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No trainer data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Trainings */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Trainings</h2>
            </div>
            <div className="p-6">
              {recentTrainings.length > 0 ? (
                <div className="space-y-4">
                  {recentTrainings.map((training) => (
                    <div key={training.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{training.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {training.startDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {training.startTime} - {training.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {training.venue}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        training.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        training.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {training.status || 'Scheduled'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No training data available</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Drill Down Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">{drillDownTitle}</h2>
              <button onClick={closeDrillDown} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">Total records: {drillDownData.length}</p>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
              {drillDownData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 border-b bg-gray-50">
                        {Object.keys(drillDownData[0]).map(key => (
                          <th key={key} className="pb-3 px-3 font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {drillDownData.map((row, index) => (
                        <tr 
                          key={index} 
                          className="border-b hover:bg-blue-50 cursor-pointer transition"
                          onClick={() => handleRowClick(row, selectedMetric)}
                        >
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="py-3 px-3 text-sm text-gray-600">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;
