import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, Award, DollarSign, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import Sidebar from '../Sidebar';

const TrainingAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalTrainings: 0,
    completedTrainings: 0,
    totalParticipants: 0,
    averageAttendance: 0,
    totalBudget: 0,
    actualCost: 0,
    trainerUtilization: 0,
    completionRate: 0,
    ltContentLinked: 0, // Number of trainings with L&T content
    ltQuizAttempts: 0, // Total quiz attempts
    ltQuizPassRate: 0 // Quiz pass rate
  });
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter, year

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = () => {
    const trainings = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
    const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
    const attendances = JSON.parse(localStorage.getItem('attendances') || '[]');
    const trainers = JSON.parse(localStorage.getItem('trainers') || '[]');
    
    // Load L&T data
    const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');

    const totalTrainings = trainings.length;
    const completedTrainings = trainings.filter(t => new Date(t.endDate) < new Date()).length;
    const totalParticipants = enrollments.length;
    
    const presentAttendances = attendances.filter(a => a.status === 'present').length;
    const averageAttendance = totalParticipants > 0 ? Math.round((presentAttendances / totalParticipants) * 100) : 0;

    const totalBudget = trainings.reduce((sum, t) => sum + (t.budget || 0), 0);
    const actualCost = trainings.reduce((sum, t) => sum + (t.actualCost || 0), 0);

    const trainerUtilization = trainers.length > 0 ? Math.round((completedTrainings / trainers.length) * 100) : 0;
    const completionRate = totalTrainings > 0 ? Math.round((completedTrainings / totalTrainings) * 100) : 0;
    
    // L&T Analytics
    const ltContentLinked = trainings.filter(t => t.ltContentIds && t.ltContentIds.length > 0).length;
    const ltQuizAttempts = quizResults.length;
    const passedQuizzes = quizResults.filter(r => {
      const quiz = quizzes.find(q => q.id === r.quizId);
      const passThreshold = quiz?.passPercentage || 70;
      return (r.score || 0) >= passThreshold;
    }).length;
    const ltQuizPassRate = ltQuizAttempts > 0 ? Math.round((passedQuizzes / ltQuizAttempts) * 100) : 0;

    setAnalytics({
      totalTrainings,
      completedTrainings,
      totalParticipants,
      averageAttendance,
      totalBudget,
      actualCost,
      trainerUtilization,
      completionRate,
      ltContentLinked,
      ltQuizAttempts,
      ltQuizPassRate
    });
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
                <h1 className="text-2xl font-bold text-gray-900">Training Analytics</h1>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Trainings</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalTrainings}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +12% from last period
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +5% from last period
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Participants</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalParticipants}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +8% from last period
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.averageAttendance}%</p>
                  <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    -2% from last period
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* L&T Integration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Trainings with L&T Content</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.ltContentLinked}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.totalTrainings > 0 ? Math.round((analytics.ltContentLinked / analytics.totalTrainings) * 100) : 0}% of total
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">L&T Quiz Attempts</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.ltQuizAttempts}</p>
                  <p className="text-xs text-gray-500 mt-1">Total quiz completions</p>
                </div>
                <Award className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">L&T Quiz Pass Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.ltQuizPassRate}%</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Assessment performance
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Budget & Utilization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Budget Analysis</h3>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Total Budget</span>
                    <span className="font-medium">${analytics.totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Actual Cost</span>
                    <span className="font-medium">${analytics.actualCost.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${analytics.totalBudget > 0 ? (analytics.actualCost / analytics.totalBudget) * 100 : 0}%` }} 
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget Variance</span>
                    <span className={`font-medium ${analytics.totalBudget > analytics.actualCost ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(analytics.totalBudget - analytics.actualCost).toLocaleString()} {analytics.totalBudget > analytics.actualCost ? 'under' : 'over'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Trainer Utilization</h3>
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Utilization Rate</span>
                    <span className="font-medium">{analytics.trainerUtilization}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${analytics.trainerUtilization}%` }} />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{analytics.completedTrainings}</p>
                      <p className="text-sm text-gray-600">Trainings Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">0</p>
                      <p className="text-sm text-gray-600">Pending Approvals</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Training by Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training by Type</h3>
              <div className="space-y-3">
                {[
                  { type: 'Classroom', value: 45, color: 'bg-blue-500' },
                  { type: 'Virtual', value: 30, color: 'bg-green-500' },
                  { type: 'Workshop', value: 15, color: 'bg-purple-500' },
                  { type: 'Webinar', value: 10, color: 'bg-yellow-500' }
                ].map((item) => (
                  <div key={item.type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.type}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Training by Department */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training by Department</h3>
              <div className="space-y-3">
                {[
                  { dept: 'IT', value: 35, color: 'bg-blue-500' },
                  { dept: 'Operations', value: 28, color: 'bg-green-500' },
                  { dept: 'HR', value: 20, color: 'bg-purple-500' },
                  { dept: 'Management', value: 17, color: 'bg-orange-500' }
                ].map((item) => (
                  <div key={item.dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.dept}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Key Metrics</h3>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Training Hours Delivered</p>
                <p className="text-2xl font-bold text-gray-900">128</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Certifications Issued</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Skill Development Score</p>
                <p className="text-2xl font-bold text-gray-900">87%</p>
                <p className="text-xs text-gray-500 mt-1">Average improvement</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TrainingAnalytics;
