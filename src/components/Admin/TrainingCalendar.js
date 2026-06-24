import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, Plus, Filter, Download } from 'lucide-react';
import Sidebar from '../Sidebar';
import TrainingSchedule from './TrainingSchedule';
import DataManager from '../../services/dataManager';

const TrainingCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', 'day', 'agenda'
  const [trainings, setTrainings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [scheduleMode, setScheduleMode] = useState('create');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    venue: 'all'
  });

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    console.log('Loading trainings...');
    try {
      const storedTrainings = await DataManager.getTrainingSchedules();
      console.log('Loaded from DataManager:', storedTrainings);
      setTrainings(storedTrainings);
    } catch (error) {
      console.error('Error loading trainings:', error);
      // Fallback to localStorage
      const storedTrainings = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
      console.log('Loaded from localStorage:', storedTrainings);
      setTrainings(storedTrainings);
    }
  };

  const handleSaveTraining = async (formData) => {
    const trainingData = {
      ...formData,
      id: scheduleMode === 'edit' && editingTraining ? editingTraining.id : `training-${Date.now()}`,
      status: scheduleMode === 'edit' && editingTraining ? editingTraining.status : 'pending',
      createdAt: scheduleMode === 'edit' && editingTraining ? editingTraining.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      let updatedTrainings;
      if (scheduleMode === 'edit' && editingTraining) {
        updatedTrainings = trainings.map(t => t.id === editingTraining.id ? trainingData : t);
      } else {
        updatedTrainings = [...trainings, trainingData];
        
        // Create approval request for new training
        const approvalRequest = {
          id: `approval-${Date.now()}`,
          type: 'training-request',
          title: `Training Request: ${formData.title}`,
          requestedBy: 'Admin',
          department: formData.department || 'Training',
          status: 'pending',
          currentLevel: 'manager',
          approvalLevels: ['manager', 'hr', 'management'],
          trainingId: trainingData.id,
          trainingTitle: formData.title,
          expectedOutcome: formData.objectives,
          amount: 0,
          justification: formData.description,
          createdAt: new Date().toISOString()
        };
        
        const existingApprovals = JSON.parse(localStorage.getItem('approvals') || '[]');
        localStorage.setItem('approvals', JSON.stringify([...existingApprovals, approvalRequest]));

        // Create attendance records for enrolled participants
        const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
        const trainingEnrollments = enrollments.filter(e => e.trainingId === trainingData.id && e.status === 'approved');
        
        const attendanceRecords = trainingEnrollments.map(enrollment => ({
          id: `attendance-${Date.now()}-${enrollment.participantId}`,
          trainingId: trainingData.id,
          participantId: enrollment.participantId,
          participantName: enrollment.participantName || `Participant ${enrollment.participantId}`,
          status: 'pending',
          checkInTime: null,
          checkOutTime: null,
          checkInMethod: null,
          location: formData.location || formData.venue,
          notes: '',
          createdAt: new Date().toISOString()
        }));
        
        const existingAttendances = JSON.parse(localStorage.getItem('attendances') || '[]');
        localStorage.setItem('attendances', JSON.stringify([...existingAttendances, ...attendanceRecords]));
      }

      await DataManager.saveTrainingSchedule(updatedTrainings);
      console.log('Saved trainings:', updatedTrainings);
      setTrainings(updatedTrainings);
      setShowCreateModal(false);
      setEditingTraining(null);
      setScheduleMode('create');
    } catch (error) {
      console.error('Error saving training:', error);
      // Fallback to localStorage
      let updatedTrainings;
      if (scheduleMode === 'edit' && editingTraining) {
        updatedTrainings = trainings.map(t => t.id === editingTraining.id ? trainingData : t);
      } else {
        updatedTrainings = [...trainings, trainingData];
        
        const approvalRequest = {
          id: `approval-${Date.now()}`,
          type: 'training-request',
          title: `Training Request: ${formData.title}`,
          requestedBy: 'Admin',
          department: formData.department || 'Training',
          status: 'pending',
          currentLevel: 'manager',
          approvalLevels: ['manager', 'hr', 'management'],
          trainingId: trainingData.id,
          trainingTitle: formData.title,
          expectedOutcome: formData.objectives,
          amount: 0,
          justification: formData.description,
          createdAt: new Date().toISOString()
        };
        
        const existingApprovals = JSON.parse(localStorage.getItem('approvals') || '[]');
        localStorage.setItem('approvals', JSON.stringify([...existingApprovals, approvalRequest]));

        const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
        const trainingEnrollments = enrollments.filter(e => e.trainingId === trainingData.id && e.status === 'approved');
        
        const attendanceRecords = trainingEnrollments.map(enrollment => ({
          id: `attendance-${Date.now()}-${enrollment.participantId}`,
          trainingId: trainingData.id,
          participantId: enrollment.participantId,
          participantName: enrollment.participantName || `Participant ${enrollment.participantId}`,
          status: 'pending',
          checkInTime: null,
          checkOutTime: null,
          checkInMethod: null,
          location: formData.location || formData.venue,
          notes: '',
          createdAt: new Date().toISOString()
        }));
        
        const existingAttendances = JSON.parse(localStorage.getItem('attendances') || '[]');
        localStorage.setItem('attendances', JSON.stringify([...existingAttendances, ...attendanceRecords]));
      }

      localStorage.setItem('trainingSchedules', JSON.stringify(updatedTrainings));
      setTrainings(updatedTrainings);
      setShowCreateModal(false);
      setEditingTraining(null);
      setScheduleMode('create');
    }
  };

  const handleEditTraining = (training) => {
    setEditingTraining(training);
    setScheduleMode('edit');
    setShowCreateModal(true);
  };

  const handleCreateTraining = () => {
    setEditingTraining(null);
    setScheduleMode('create');
    setShowCreateModal(true);
  };

  const handleExport = () => {
    const csvContent = [
      ['Title', 'Type', 'Start Date', 'End Date', 'Venue', 'Status', 'Participants'].join(','),
      ...trainings.map(t => [
        t.title || '',
        t.type || '',
        t.startDate || '',
        t.endDate || '',
        t.venue || '',
        t.status || '',
        Array.isArray(t.participants) ? t.participants.length : (t.participants || 0)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-calendar-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFilter = () => {
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    let filtered = trainings;
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters.venue !== 'all') {
      filtered = filtered.filter(t => t.venue === filters.venue);
    }
    
    setTrainings(filtered);
    setShowFilterModal(false);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];
    
    // Add padding for days before the first day of the month
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, isPadding: true });
    }
    
    // Add actual days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({ date: new Date(year, month, day), isPadding: false });
    }
    
    return days;
  };

  const getTrainingsForDate = (date) => {
    if (!date) return [];
    return trainings.filter(training => {
      if (!training.startDate) return false;
      const trainingDate = new Date(training.startDate);
      if (isNaN(trainingDate.getTime())) return false;
      return trainingDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getTrainingColor = (type) => {
    const colors = {
      'classroom': 'bg-blue-500',
      'virtual': 'bg-green-500',
      'hybrid': 'bg-purple-500',
      'e-learning': 'bg-orange-500',
      'workshop': 'bg-pink-500',
      'seminar': 'bg-indigo-500',
      'webinar': 'bg-teal-500',
      'certification': 'bg-red-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const todayTrainings = trainings.filter(training => {
    if (!training.startDate) return false;
    const trainingDate = new Date(training.startDate);
    if (isNaN(trainingDate.getTime())) return false;
    return trainingDate.toDateString() === new Date().toDateString();
  });

  const upcomingTrainings = trainings
    .filter(training => {
      if (!training.startDate) return false;
      const trainingDate = new Date(training.startDate);
      if (isNaN(trainingDate.getTime())) return false;
      return trainingDate > new Date();
    })
    .sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return isNaN(dateA.getTime()) || isNaN(dateB.getTime()) ? 0 : dateA - dateB;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Training Calendar</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={handleFilter} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={handleCreateTraining}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Create Training
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Today's Trainings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Today's Trainings</h2>
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              {todayTrainings.length > 0 ? (
                <div className="space-y-3">
                  {todayTrainings.map((training, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => handleEditTraining(training)}
                    >
                      <div className={`w-2 h-2 rounded-full ${getTrainingColor(training.trainingType)} mt-2`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{training.title}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {training.startTime ? (
                            typeof training.startTime === 'string' && training.startTime.includes('T') 
                              ? new Date(training.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                              : training.startTime
                          ) : 'Time not set'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No trainings scheduled for today</p>
              )}
            </div>

            {/* Upcoming Trainings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Trainings</h2>
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              {upcomingTrainings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTrainings.map((training, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => handleEditTraining(training)}
                    >
                      <div className={`w-2 h-2 rounded-full ${getTrainingColor(training.trainingType)} mt-2`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{training.title}</p>
                        <p className="text-sm text-gray-600">
                          {training.startDate ? (
                            new Date(training.startDate).toLocaleDateString() !== 'Invalid Date'
                              ? new Date(training.startDate).toLocaleDateString()
                              : training.startDate
                          ) : 'Date not set'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No upcoming trainings</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Trainings</span>
                  <span className="font-semibold text-gray-900">{trainings.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-semibold text-gray-900">
                    {trainings.filter(t => {
                      if (!t.startDate) return false;
                      const d = new Date(t.startDate);
                      if (isNaN(d.getTime())) return false;
                      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Participants</span>
                  <span className="font-semibold text-gray-900">
                    {trainings.reduce((sum, t) => sum + (Array.isArray(t.participants) ? t.participants.length : (t.participants || 0)), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-white rounded-lg shadow">
            {/* Calendar Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">{getMonthName(currentDate)}</h2>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {['month', 'week', 'day', 'agenda'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      view === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Month View */}
            {view === 'month' && (
              <div className="p-4">
                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="bg-gray-50 p-3 text-center font-semibold text-gray-700 text-sm">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentDate).map((day, index) => {
                    const dayTrainings = day.date ? getTrainingsForDate(day.date) : [];
                    const isToday = day.date && day.date.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={index}
                        className={`bg-white min-h-32 p-2 cursor-pointer hover:bg-gray-50 transition ${
                          isToday ? 'bg-blue-50' : ''
                        } ${day.isPadding ? 'bg-gray-50' : ''}`}
                        onClick={() => {
                          if (day.date) {
                            setShowCreateModal(true);
                          }
                        }}
                      >
                        <span className={`text-sm font-medium ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {day.date ? day.date.getDate() : ''}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayTrainings.slice(0, 2).map((training, idx) => (
                            <div
                              key={idx}
                              className={`text-xs p-1 rounded text-white truncate ${getTrainingColor(training.trainingType)} cursor-pointer hover:opacity-80`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTraining(training);
                              }}
                              title={training.title}
                            >
                              {training.title}
                            </div>
                          ))}
                          {dayTrainings.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayTrainings.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Week/Day/Agenda Views - Placeholder */}
            {view !== 'month' && (
              <div className="p-8 text-center text-gray-500">
                <p>{view.charAt(0).toUpperCase() + view.slice(1)} view coming soon</p>
              </div>
            )}
          </div>

          {/* Training Type Legend */}
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Training Types</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries({
                classroom: 'Classroom',
                virtual: 'Virtual',
                hybrid: 'Hybrid',
                'e-learning': 'E-Learning',
                workshop: 'Workshop',
                seminar: 'Seminar',
                webinar: 'Webinar',
                certification: 'Certification'
              }).map(([type, label]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getTrainingColor(type)}`}></div>
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Training Schedule Modal */}
      <TrainingSchedule
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTraining(null);
          setScheduleMode('create');
        }}
        mode={scheduleMode}
        trainingData={editingTraining}
        onSave={handleSaveTraining}
      />

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Trainings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="classroom">Classroom</option>
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingCalendar;
