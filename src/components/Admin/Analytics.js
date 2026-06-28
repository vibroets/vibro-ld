import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, TrendingUp, Award, Clock, MapPin } from 'lucide-react';
import Sidebar from '../Sidebar';

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

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
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

    // Calculate total trainings
    const totalTrainings = trainingSchedules.length;

    // Calculate total trainers
    const totalTrainers = trainers.length;

    // Calculate total attendees
    const totalAttendees = attendances.length;

    // Calculate attendance rate (attendees / enrollments)
    const attendanceRate = enrollments.length > 0 
      ? Math.round((attendances.length / enrollments.length) * 100) 
      : 0;

    // Calculate quiz pass/fail rates
    const passedQuizzes = quizResults.filter(r => r.passed).length;
    const quizPassRate = quizResults.length > 0 
      ? Math.round((passedQuizzes / quizResults.length) * 100) 
      : 0;
    const quizFailRate = quizResults.length > 0 
      ? 100 - quizPassRate 
      : 0;

    // Calculate completion rate (completed trainings / total trainings)
    const completedTrainings = trainingSchedules.filter(t => t.status === 'completed').length;
    const completionRate = totalTrainings > 0 
      ? Math.round((completedTrainings / totalTrainings) * 100) 
      : 0;

    // Calculate total unique venues
    const venues = [...new Set(trainingSchedules.map(t => t.venue).filter(Boolean))];
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
      const trainerTrainings = trainingSchedules.filter(t => t.trainer === trainer.name);
      const trainerAttendances = attendances.filter(a => {
        const training = trainingSchedules.find(t => t.id === a.trainingId);
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

    setTrainerStats(trainerData);

    // Get recent trainings (last 5)
    const sortedTrainings = [...trainingSchedules]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    setRecentTrainings(sortedTrainings);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              </div>
              <button
                onClick={loadAnalytics}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <TrendingUp className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Trainings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTrainings}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Trainers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTrainers}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Attendees</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAttendees}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Second Row Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quiz Pass Rate</p>
                  <p className="text-2xl font-bold text-green-600">{stats.quizPassRate}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quiz Fail Rate</p>
                  <p className="text-2xl font-bold text-red-600">{stats.quizFailRate}%</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                </div>
                <Award className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Certificates Issued</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.certificatesIssued}</p>
                </div>
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
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
    </div>
  );
};

export default Analytics;
