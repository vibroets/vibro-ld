import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, MapPin, UserCheck, QrCode, Camera, MapPin as LocationIcon, Database } from 'lucide-react';
import Sidebar from '../Sidebar';
import { seedTrainingData } from '../../utils/seedTrainingData';
import DataManager from '../../services/dataManager';

const AttendanceManagement = () => {
  const [attendances, setAttendances] = useState([]);
  const [ltContent, setLtContent] = useState([]); // L&T content (quizzes, videos, training items)
  const [filter, setFilter] = useState('all'); // all, present, absent, late
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedAttendances = await DataManager.getAttendances();
      
      // Load L&T content from Quiz, Video, and Training libraries
      const quizzes = await DataManager.getQuizzes();
      const videos = await DataManager.getVideos();
      const trainingItems = JSON.parse(localStorage.getItem('trainingItems') || '[]');
      
      // Combine all L&T content into a single array with type labels
      const allLtContent = [
        ...quizzes.map(q => ({ ...q, contentType: 'quiz', libraryName: 'Quiz Library' })),
        ...videos.map(v => ({ ...v, contentType: 'video', libraryName: 'Video Library' })),
        ...trainingItems.map(t => ({ ...t, contentType: 'training', libraryName: 'Training Library' }))
      ];
      
      setAttendances(storedAttendances);
      setLtContent(allLtContent);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      // Fallback to localStorage
      const storedAttendances = JSON.parse(localStorage.getItem('attendances') || '[]');
      const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      const videos = JSON.parse(localStorage.getItem('videos') || '[]');
      const trainingItems = JSON.parse(localStorage.getItem('trainingItems') || '[]');
      
      const allLtContent = [
        ...quizzes.map(q => ({ ...q, contentType: 'quiz', libraryName: 'Quiz Library' })),
        ...videos.map(v => ({ ...v, contentType: 'video', libraryName: 'Video Library' })),
        ...trainingItems.map(t => ({ ...t, contentType: 'training', libraryName: 'Training Library' }))
      ];
      
      setAttendances(storedAttendances);
      setLtContent(allLtContent);
    }
  };

  const handleSeedData = () => {
    if (window.confirm('This will add sample training calendar data. Continue?')) {
      const result = seedTrainingData();
      loadData();
      alert(`Sample data seeded successfully:\n${result.categories} categories\n${result.trainingTypes} training types\n${result.attendances} attendance records\n${result.trainings} trainings\n${result.users} users`);
    }
  };

  const handleCheckIn = async (attendanceId) => {
    const updatedAttendances = attendances.map(att => {
      if (att.id === attendanceId) {
        return {
          ...att,
          checkInTime: new Date().toISOString(),
          checkInMethod: 'manual',
          status: 'present'
        };
      }
      return att;
    });
    
    try {
      const updatedAttendance = updatedAttendances.find(att => att.id === attendanceId);
      if (updatedAttendance) {
        await DataManager.saveAttendance(updatedAttendance);
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      localStorage.setItem('attendances', JSON.stringify(updatedAttendances));
    }
    
    setAttendances(updatedAttendances);
  };

  const handleCheckOut = async (attendanceId) => {
    const updatedAttendances = attendances.map(att => {
      if (att.id === attendanceId) {
        return {
          ...att,
          checkOutTime: new Date().toISOString(),
          checkOutMethod: 'manual'
        };
      }
      return att;
    });
    try {
      const updatedAttendance = updatedAttendances.find(att => att.id === attendanceId);
      if (updatedAttendance) {
        await DataManager.saveAttendance(updatedAttendance);
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      localStorage.setItem('attendances', JSON.stringify(updatedAttendances));
    }
    setAttendances(updatedAttendances);
  };

  const getStatusColor = (status) => {
    const colors = {
      'present': 'bg-green-100 text-green-800',
      'absent': 'bg-red-100 text-red-800',
      'late': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getMethodIcon = (method) => {
    const icons = {
      'qr-code': QrCode,
      'face-recognition': Camera,
      'biometric': UserCheck,
      'gps': LocationIcon,
      'manual': CheckCircle
    };
    return icons[method] || CheckCircle;
  };

  const getContentTitle = (contentId) => {
    const content = ltContent.find(c => c.id === contentId);
    return content ? `${content.libraryName} - ${content.title}` : 'Unknown Content';
  };

  const filteredAttendances = attendances.filter(att => {
    if (filter !== 'all' && att.status !== filter) return false;
    if (dateFilter && !att.checkInTime?.startsWith(dateFilter)) return false;
    return true;
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSeedData}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  <Database className="w-4 h-4" />
                  Seed Data
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Check-ins</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {attendances.filter(a => a.checkInTime?.startsWith(today)).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {attendances.filter(a => a.status === 'present').length}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {attendances.filter(a => a.status === 'absent').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Late</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {attendances.filter(a => a.status === 'late').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Date:</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Attendance List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
            </div>
            
            {filteredAttendances.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredAttendances.map((attendance) => {
                  const MethodIcon = getMethodIcon(attendance.checkInMethod);
                  return (
                    <div key={attendance.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{attendance.participantName}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance.status)}`}>
                              {attendance.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{getContentTitle(attendance.contentId)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{attendance.location || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MethodIcon className="w-4 h-4" />
                              <span>{attendance.checkInMethod || 'manual'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-900">Check-in</p>
                              <p>{attendance.checkInTime ? new Date(attendance.checkInTime).toLocaleString() : 'Not checked in'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Check-out</p>
                              <p>{attendance.checkOutTime ? new Date(attendance.checkOutTime).toLocaleString() : 'Not checked out'}</p>
                            </div>
                          </div>

                          {attendance.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium text-gray-900">Notes:</span> {attendance.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {!attendance.checkInTime && (
                            <button
                              onClick={() => handleCheckIn(attendance.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Check In
                            </button>
                          )}
                          {attendance.checkInTime && !attendance.checkOutTime && (
                            <button
                              onClick={() => handleCheckOut(attendance.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                            >
                              <Clock className="w-4 h-4" />
                              Check Out
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No attendance records found</p>
                <p className="text-sm mt-2">Attendance will be recorded when participants check in for trainings</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AttendanceManagement;
