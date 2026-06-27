import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, CheckCircle, QrCode, MapPin as LocationIcon, Play } from 'lucide-react';
import Sidebar from '../Sidebar';
import DataManager from '../../services/dataManager';
import { useNavigate } from 'react-router-dom';

const UserTrainingCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trainings, setTrainings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedDateResults, setSelectedDateResults] = useState(null);

  const loadCurrentUser = useCallback(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const loadTrainings = useCallback(async () => {
    try {
      console.log('UserTrainingCalendar: Checking localStorage for trainingSchedules...');
      const localStorageData = localStorage.getItem('trainingSchedules');
      console.log('UserTrainingCalendar: localStorage trainingSchedules raw:', localStorageData);
      
      const storedTrainings = await DataManager.getTrainingSchedules();
      console.log('UserTrainingCalendar: Loaded trainings from DataManager:', storedTrainings);
      
      const userData = localStorage.getItem('currentUser');
      if (!userData) {
        console.log('UserTrainingCalendar: No current user found');
        return;
      }
      
      const user = JSON.parse(userData);
      console.log('UserTrainingCalendar: Current user:', user);
      
      // Filter trainings where the user is a participant AND training is approved AND not completed AND not expired
      const userTrainings = storedTrainings.filter(training => {
        const participants = training.participants || [];
        console.log(`UserTrainingCalendar: Training "${training.title}" has participants:`, participants);
        if (!Array.isArray(participants)) return false;
        
        // Match by ID, userId, email, or phone
        const isParticipant = participants.some(p => 
          p.id === user.id || 
          p.userId === user.id ||
          p.id === user.employeeId ||
          p.userId === user.employeeId ||
          (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
          (p.phone && user.phone && p.phone === user.phone)
        );
        
        console.log(`UserTrainingCalendar: Checking participation for user ${user.id} (${user.email}) in training ${training.id}:`, isParticipant);
        
        const isApproved = training.status === 'approved' || !training.status;
        
        // Check if user has completed this training
        const attendances = JSON.parse(localStorage.getItem('attendances') || '[]');
        console.log(`UserTrainingCalendar: Training "${training.title}" (ID: ${training.id})`);
        console.log(`UserTrainingCalendar: User ID: ${user.id}`);
        console.log('All attendances:', attendances);
        
        // Log all attendance records for this specific training
        const trainingAttendances = attendances.filter(a => a.trainingId === training.id);
        console.log(`UserTrainingCalendar: Attendance records for training ID ${training.id}:`, trainingAttendances);
        console.log(`UserTrainingCalendar: Attendance statuses for training ID ${training.id}:`, trainingAttendances.map(a => ({userId: a.userId, status: a.status})));
        
        const completedAttendance = attendances.find(a => 
          a.trainingId === training.id && 
          a.userId === user.id && 
          a.status === 'completed'
        );
        let isCompleted = !!completedAttendance;
        
        // Fallback: Check if user has completed the quiz for this training
        if (!isCompleted && training.ltContentIds && training.ltContentIds.length > 0) {
          const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
          console.log(`UserTrainingCalendar: Training "${training.title}" ltContentIds:`, training.ltContentIds);
          console.log(`UserTrainingCalendar: All quizResults:`, quizResults);
          console.log(`UserTrainingCalendar: User quizResults for user ${user.id}:`, quizResults.filter(qr => qr.userId === user.id));
          console.log(`UserTrainingCalendar: User quizIds:`, quizResults.filter(qr => qr.userId === user.id).map(qr => qr.quizId));
          
          const hasCompletedQuiz = training.ltContentIds.some(contentId => {
            const quizResult = quizResults.find(qr => 
              qr.quizId === contentId && 
              qr.userId === user.id
            );
            console.log(`UserTrainingCalendar: Checking contentId ${contentId}, found quizResult:`, quizResult);
            return quizResult && quizResult.score !== undefined;
          });
          
          console.log(`UserTrainingCalendar: hasCompletedQuiz for training "${training.title}":`, hasCompletedQuiz);
          
          if (hasCompletedQuiz) {
            console.log(`UserTrainingCalendar: Fallback - User has completed quiz for training "${training.title}"`);
            // Auto-mark attendance as completed
            const attendanceIndex = attendances.findIndex(a => 
              a.trainingId === training.id && 
              a.userId === user.id
            );
            if (attendanceIndex !== -1) {
              attendances[attendanceIndex].status = 'completed';
              attendances[attendanceIndex].checkOutTime = new Date().toISOString();
              localStorage.setItem('attendances', JSON.stringify(attendances));
              console.log(`UserTrainingCalendar: Auto-marked attendance as completed for training "${training.title}"`);
              isCompleted = true;
            }
          }
        }
        
        // Check if training has expired: only hide if end date is strictly before today (not today)
        const isExpired = (() => {
          if (!training.endDate) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(training.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate < today; // Only expired if end date is before today
        })();
        
        const isGraceTimeExpired = false; // Grace time no longer hides trainings from calendar
        
        console.log(`UserTrainingCalendar: Is participant: ${isParticipant}, Is approved: ${isApproved}, Is completed: ${isCompleted}, Is expired: ${isExpired}, Is grace time expired: ${isGraceTimeExpired}, Completed attendance:`, completedAttendance);
        return isParticipant && isApproved && !isCompleted && !isExpired && !isGraceTimeExpired;
      });
      
      console.log('UserTrainingCalendar: Filtered user trainings:', userTrainings);
      setTrainings(userTrainings);
      loadAttendanceStatus(user.id);
    } catch (error) {
      console.error('Error loading trainings:', error);
      // Fallback to localStorage
      const storedTrainings = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
      console.log('UserTrainingCalendar: Fallback - Loaded trainings from localStorage:', storedTrainings);
      
      const userData = localStorage.getItem('currentUser');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      console.log('UserTrainingCalendar: Fallback - Current user:', user);
      
      const userTrainings = storedTrainings.filter(training => {
        const participants = training.participants || [];
        console.log(`UserTrainingCalendar: Fallback - Training "${training.title}" has participants:`, participants);
        if (!Array.isArray(participants)) return false;
        
        const isParticipant = participants.some(p => 
          p.id === user.id || 
          p.userId === user.id ||
          p.id === user.employeeId ||
          p.userId === user.employeeId ||
          (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
          (p.phone && user.phone && p.phone === user.phone)
        );
        
        const isApproved = training.status === 'approved' || !training.status;
        
        // Check if user has completed this training
        const attendances = JSON.parse(localStorage.getItem('attendances') || '[]');
        console.log('UserTrainingCalendar: Fallback - All attendances:', attendances);
        const completedAttendance = attendances.find(a => 
          a.trainingId === training.id && 
          a.userId === user.id && 
          a.status === 'completed'
        );
        const isCompleted = !!completedAttendance;
        
        // Check if training has expired: only hide if end date is strictly before today
        const isExpired = (() => {
          if (!training.endDate) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(training.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate < today;
        })();
        
        const isGraceTimeExpired = false; // Grace time no longer hides trainings from calendar
        
        console.log(`UserTrainingCalendar: Fallback - Is participant: ${isParticipant}, Is approved: ${isApproved}, Is completed: ${isCompleted}, Is expired: ${isExpired}, Is grace time expired: ${isGraceTimeExpired}, Completed attendance:`, completedAttendance);
        return isParticipant && isApproved && !isCompleted && !isExpired && !isGraceTimeExpired;
      });
      
      console.log('UserTrainingCalendar: Fallback - Filtered user trainings:', userTrainings);
      setTrainings(userTrainings);
      loadAttendanceStatus(user.id);
    }
  }, []);

  useEffect(() => {
    loadTrainings();
    loadCurrentUser();
  }, [loadTrainings, loadCurrentUser]);

  const loadAttendanceStatus = async (userId) => {
    try {
      const attendances = await DataManager.getAttendances();
      const statusMap = {};
      attendances.forEach(att => {
        if (att.userId === userId) {
          statusMap[att.trainingId] = att.status;
        }
      });
      setAttendanceStatus(statusMap);
    } catch (error) {
      console.error('Error loading attendance status:', error);
      // Fallback to localStorage
      const attendances = JSON.parse(localStorage.getItem('attendances') || '[]');
      const statusMap = {};
      attendances.forEach(att => {
        if (att.userId === userId) {
          statusMap[att.trainingId] = att.status;
        }
      });
      setAttendanceStatus(statusMap);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];
    
    // Add padding days
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

  const handleCheckIn = (training) => {
    setSelectedTraining(training);
    setShowCheckInModal(true);
    setCheckInSuccess(false);
    setLocation(null);
    setLocationError(null);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationError(null);
      },
      (error) => {
        setLocationError('Unable to retrieve your location. Please enable location services.');
      }
    );
  };

  const handleConfirmCheckIn = async () => {
    if (!currentUser || !selectedTraining) return;

    try {
      const newAttendance = {
        id: `attendance-${Date.now()}`,
        trainingId: selectedTraining.id,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email,
        checkInTime: new Date().toISOString(),
        checkInMethod: location ? 'location' : 'manual',
        location: location,
        status: 'present'
      };

      await DataManager.saveAttendance(newAttendance);
      
      setAttendanceStatus(prev => ({
        ...prev,
        [selectedTraining.id]: 'present'
      }));
      
      setCheckInSuccess(true);
      setTimeout(() => {
        setShowCheckInModal(false);
        setSelectedTraining(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving attendance:', error);
      // Fallback to localStorage
      const attendances = JSON.parse(localStorage.getItem('attendances') || '[]');
      
      const newAttendance = {
        id: `attendance-${Date.now()}`,
        trainingId: selectedTraining.id,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email,
        checkInTime: new Date().toISOString(),
        checkInMethod: location ? 'location' : 'manual',
        location: location,
        status: 'present'
      };

      attendances.push(newAttendance);
      localStorage.setItem('attendances', JSON.stringify(attendances));
      
      setAttendanceStatus(prev => ({
        ...prev,
        [selectedTraining.id]: 'present'
      }));
      
      setCheckInSuccess(true);
      setTimeout(() => {
        setShowCheckInModal(false);
        setSelectedTraining(null);
      }, 2000);
    }
  };

  const handleShowQrCode = (training) => {
    setSelectedTraining(training);
    setShowQrModal(true);
  };

  const handleShowScores = (date) => {
    if (!date) return;
    
    // Load quiz results from localStorage
    const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Filter results for the current user
    const userResults = quizResults.filter(result => 
      result.userId === userData.id && 
      new Date(result.completedAt).toDateString() === date.toDateString()
    );
    
    if (userResults.length > 0) {
      setSelectedDateResults(userResults);
      setShowScoreModal(true);
    } else {
      alert('No quiz results found for this date.');
    }
  };

  const handleAttendTraining = (training) => {
    // Get learning content IDs from the training schedule
    const ltContentIds = training.ltContentIds || [];
    console.log('Attend Training clicked. ltContentIds:', ltContentIds);
    
    // Check all content sources
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const videos = JSON.parse(localStorage.getItem('videos') || '[]');
    const trainingItems = JSON.parse(localStorage.getItem('trainingItems') || '[]');
    
    console.log('Available quizzes:', quizzes.map(t => ({ id: t.id, title: t.title })));
    console.log('Available videos:', videos.map(t => ({ id: t.id, title: t.title })));
    console.log('Available trainingItems:', trainingItems.map(t => ({ id: t.id, title: t.title })));
    
    if (ltContentIds.length > 0) {
      const contentId = ltContentIds[0];
      
      // Check if content is a quiz
      const quiz = quizzes.find(q => String(q.id) === String(contentId));
      if (quiz) {
        console.log(`Found quiz: ${quiz.title}`);
        navigate(`/quiz/${contentId}`);
        return;
      }
      
      // Check if content is a video
      const video = videos.find(v => String(v.id) === String(contentId));
      if (video) {
        console.log(`Found video: ${video.title}`);
        navigate(`/quiz/${contentId}`);
        return;
      }
      
      // Check if content is a training item
      const trainingItem = trainingItems.find(t => String(t.id) === String(contentId));
      if (trainingItem) {
        console.log(`Found training item: ${trainingItem.title}`);
        navigate(`/training/${contentId}`);
        return;
      }
      
      // Content not found - show alert with available items
      const availableItemsList = [
        ...quizzes.map(t => `- [Quiz] ID: ${t.id}, Title: ${t.title}`),
        ...videos.map(t => `- [Video] ID: ${t.id}, Title: ${t.title}`),
        ...trainingItems.map(t => `- [Training] ID: ${t.id}, Title: ${t.title}`)
      ].join('\n');
      alert(`Learning content with ID "${contentId}" not found for training "${training.title}".\n\nAvailable training items:\n${availableItemsList}\n\nPlease contact your administrator to update the training schedule with the correct learning content ID.`);
    } else {
      alert('No learning content is associated with this training. Please contact your administrator.');
    }
  };

  const getTrainingColor = (type) => {
    const colors = {
      'classroom': 'bg-blue-500',
      'e-learning': 'bg-orange-500',
      'workshop': 'bg-pink-500',
      'seminar': 'bg-indigo-500',
      'webinar': 'bg-teal-500',
      'certification': 'bg-red-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentUser={currentUser} />
      <div className="flex-1 ml-0 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">My Training Calendar</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Calendar Navigation */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {days.map((day, index) => {
                const dayTrainings = day.date ? getTrainingsForDate(day.date) : [];
                const isToday = day.date && day.date.toDateString() === today.toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-24 p-2 rounded-lg border ${
                      day.isPadding ? 'border-transparent bg-gray-50' : 
                      isToday ? 'border-blue-500 bg-blue-50' : 
                      'border-gray-200 bg-white hover:bg-gray-50'
                    } cursor-pointer transition`}
                    onClick={() => day.date && handleShowScores(day.date)}
                  >
                    {day.date && (
                      <>
                        <div className={`text-sm font-medium ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {day.date.getDate()}
                        </div>
                        <div className="mt-1 space-y-1">
                          {dayTrainings.slice(0, 2).map((training, idx) => (
                            <div
                              key={idx}
                              className={`w-2 h-2 rounded-full ${getTrainingColor(training.trainingType)}`}
                              title={training.title}
                            />
                          ))}
                          {dayTrainings.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayTrainings.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Trainings */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Trainings</h3>
            {getTrainingsForDate(today).length > 0 ? (
              <div className="space-y-4">
                {getTrainingsForDate(today).map((training, index) => {
                  const status = attendanceStatus[training.id];
                  const isCheckedIn = status === 'present';
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${getTrainingColor(training.trainingType)}`}></div>
                            <h4 className="font-semibold text-gray-900">{training.title}</h4>
                            {isCheckedIn && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {training.startTime} - {training.endTime}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {training.venue || training.location}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {!isCheckedIn && (
                            <button
                              onClick={() => handleCheckIn(training)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                              Check In
                            </button>
                          )}
                          {isCheckedIn && (
                            <button
                              onClick={() => handleAttendTraining(training)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Attend Training
                            </button>
                          )}
                          <button
                            onClick={() => handleShowQrCode(training)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                <p>No trainings scheduled for today.</p>
                <p className="text-xs text-gray-400 mt-2">Trainings only appear here if: (1) you are enrolled as a participant, (2) the training is approved, and (3) the training date/time has not expired.</p>
              </div>
            )}
          </div>

          {/* Upcoming Trainings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Trainings</h3>
            {trainings
              .filter(t => new Date(t.startDate) > today)
              .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
              .slice(0, 5)
              .length > 0 ? (
              <div className="space-y-4">
                {trainings
                  .filter(t => new Date(t.startDate) > today)
                  .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                  .slice(0, 5)
                  .map((training, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${getTrainingColor(training.trainingType)}`}></div>
                            <h4 className="font-semibold text-gray-900">{training.title}</h4>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(training.startDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {training.startTime} - {training.endTime}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {training.venue || training.location}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No upcoming trainings</p>
            )}
          </div>
        </main>
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && selectedTraining && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Check In for Training</h3>
            <div className="mb-4">
              <p className="font-medium text-gray-900">{selectedTraining.title}</p>
              <p className="text-sm text-gray-600">{selectedTraining.venue || selectedTraining.location}</p>
            </div>
            
            {checkInSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900">Check-in Successful!</p>
                <p className="text-sm text-gray-600">Your attendance has been marked.</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <button
                    onClick={handleGetLocation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                  >
                    <LocationIcon className="w-5 h-5" />
                    {location ? 'Location Captured' : 'Get Current Location'}
                  </button>
                  {location && (
                    <p className="text-xs text-gray-500 mt-2">
                      Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
                    </p>
                  )}
                  {locationError && (
                    <p className="text-sm text-red-600 mt-2">{locationError}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCheckInModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCheckIn}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Confirm Check-in
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && selectedTraining && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Training QR Code</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="font-medium text-gray-900">{selectedTraining.title}</p>
              <p className="text-sm text-gray-600">{selectedTraining.venue || selectedTraining.location}</p>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-32 h-32 text-gray-800 mx-auto" />
                <p className="text-xs text-gray-500 mt-2">Training ID: {selectedTraining.id}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-4 text-center">
              Show this QR code to the trainer to verify your attendance
            </p>
          </div>
        </div>
      )}

      {/* Score Modal */}
      {showScoreModal && selectedDateResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quiz Results</h3>
              <button
                onClick={() => setShowScoreModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {selectedDateResults.map((result, index) => {
                const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{result.quizTitle}</h4>
                      <div className={`text-2xl font-bold ${percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {percentage}%
                      </div>
                    </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Correct Answers:</span> {result.correctAnswers}/{result.totalQuestions}
                    </div>
                    <div>
                      <span className="font-medium">Time Taken:</span> {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                    </div>
                    <div>
                      <span className="font-medium">Completed:</span> {new Date(result.completedAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Training Type:</span> {result.trainingType}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTrainingCalendar;
