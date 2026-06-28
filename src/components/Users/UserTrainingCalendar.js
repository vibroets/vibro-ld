import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, CheckCircle, QrCode, MapPin as LocationIcon, Play, Award } from 'lucide-react';
import Sidebar from '../Sidebar';
import MobileNav from '../MobileNav';
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
    try {
      // Get learning content IDs from the training schedule
      const ltContentIds = training.ltContentIds || [];
      console.log('Attend Training clicked. ltContentIds:', ltContentIds);
      
      // Check all content sources with array guards
      const quizzesRaw = localStorage.getItem('quizzes');
      const videosRaw = localStorage.getItem('videos');
      const trainingItemsRaw = localStorage.getItem('trainingItems');
      
      const quizzes = Array.isArray(quizzesRaw) ? quizzesRaw : (quizzesRaw ? JSON.parse(quizzesRaw) : []);
      const videos = Array.isArray(videosRaw) ? videosRaw : (videosRaw ? JSON.parse(videosRaw) : []);
      const trainingItems = Array.isArray(trainingItemsRaw) ? trainingItemsRaw : (trainingItemsRaw ? JSON.parse(trainingItemsRaw) : []);
      
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
          console.log(`Video has file: ${!!video.file}, url: ${!!video.url}, videoUrl: ${!!video.videoUrl}, referenceType: ${video.referenceType}`);
          // Check if video has a file in IndexedDB or URL
          navigate(`/quiz/${contentId}`);
          return;
        }
        
        // Content not found - show error
        console.error(`Content ID ${contentId} not found in quizzes, videos, or trainingItems`);
        alert('Training content not found. Please contact the administrator to update the training content.');
        return;
      } else {
        // No content IDs in training
        alert('This training has no content assigned. Please contact the administrator.');
      }
    } catch (error) {
      console.error('Error in handleAttendTraining:', error);
      alert('An error occurred while accessing the training. Please try again or contact your administrator.');
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
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar currentUser={currentUser} />
      </div>
      
      {/* Main Content */}
      <div className="md:ml-64">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/user-dashboard')}
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-lg md:text-2xl font-semibold text-gray-900">Schedule</h1>
              </div>
            </div>
          </div>
          
          {/* Month Selector */}
          <div className="px-4 pb-3 md:px-6 md:pb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateMonth(-1)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h2 className="text-base md:text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-3 py-3 md:px-6 md:py-6 pb-20 md:pb-6 overflow-x-hidden">
          {/* Calendar - Horizontal Scroll on Mobile */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <h2 className="text-sm md:text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            </div>
            
            <div className="md:hidden overflow-x-auto -mx-3 px-3">
              <div className="flex gap-1 min-w-max">
                {days.map((day, index) => {
                  const dayTrainings = day.date ? getTrainingsForDate(day.date) : [];
                  const isToday = day.date && day.date.toDateString() === today.toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`w-12 h-16 flex flex-col items-center justify-center rounded-xl text-xs cursor-pointer transition flex-shrink-0 ${
                        day.isPadding ? 'opacity-30' : 
                        isToday ? 'bg-blue-600 text-white font-semibold' : 
                        dayTrainings.length > 0 ? 'bg-blue-50 text-blue-600 font-medium' : 
                        'bg-white border border-gray-200'
                      }`}
                      onClick={() => day.date && handleShowScores(day.date)}
                    >
                      <span className="text-xs mb-1">{day.date ? day.date.getDate() : ''}</span>
                      {dayTrainings.length > 0 && (
                        <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-blue-600'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Calendar Grid */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const dayTrainings = day.date ? getTrainingsForDate(day.date) : [];
                  const isToday = day.date && day.date.toDateString() === today.toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`aspect-square md:min-h-24 flex flex-col items-center justify-center rounded-lg text-sm cursor-pointer transition ${
                        day.isPadding ? '' : 
                        isToday ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200' : 
                        dayTrainings.length > 0 ? 'bg-blue-50 text-blue-600 font-medium hover:bg-blue-100' : 
                        'hover:bg-gray-50'
                      }`}
                      onClick={() => day.date && handleShowScores(day.date)}
                    >
                      <span>{day.date ? day.date.getDate() : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Today's Section */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Today</h3>
            {getTrainingsForDate(today).length > 0 ? (
              <div className="space-y-2">
                {getTrainingsForDate(today).map((training, index) => {
                  const status = attendanceStatus[training.id];
                  const isCheckedIn = status === 'present';
                  
                  return (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{training.title}</h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{training.startTime}</span>
                            <span>-</span>
                            <span>{training.endTime}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{training.venue || training.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isCheckedIn ? (
                          <button
                            onClick={() => handleAttendTraining(training)}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-1 text-xs"
                          >
                            <Play className="w-3 h-3" />
                            Start
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckIn(training)}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium text-xs"
                          >
                            Check In
                          </button>
                        )}
                        <button
                          onClick={() => handleShowQrCode(training)}
                          className="py-2 px-3 bg-gray-100 text-gray-700 rounded-lg font-medium border border-gray-200"
                        >
                          <QrCode className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 bg-white rounded-lg border border-gray-200">
                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-1" />
                <p className="text-xs text-gray-400">No trainings today</p>
              </div>
            )}
          </div>

          {/* Upcoming Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Upcoming</h3>
            {trainings
              .filter(t => new Date(t.startDate) > today)
              .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
              .length > 0 ? (
              <div className="space-y-2">
                {trainings
                  .filter(t => new Date(t.startDate) > today)
                  .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                  .slice(0, 5)
                  .map((training, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getTrainingColor(training.trainingType)}`}>
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{training.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span>{new Date(training.startDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{training.startTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-white rounded-lg border border-gray-200">
                <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-1" />
                <p className="text-xs text-gray-400">No upcoming trainings</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Check-in Modal */}
      {showCheckInModal && selectedTraining && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Check In</h3>
            </div>
            <div className="mb-6 bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-gray-900">{selectedTraining.title}</p>
              <p className="text-sm text-gray-500 mt-1">{selectedTraining.venue || selectedTraining.location}</p>
            </div>
            
            {checkInSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900">Success!</p>
                <p className="text-sm text-gray-500">Attendance marked</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <button
                    onClick={handleGetLocation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                  >
                    <LocationIcon className="w-5 h-5" />
                    {location ? 'Location Captured' : 'Get Current Location'}
                  </button>
                  {location && (
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </p>
                  )}
                  {locationError && (
                    <p className="text-sm text-red-600 mt-2 text-center">{locationError}</p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCheckInModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCheckIn}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium"
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && selectedTraining && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6 bg-gray-50 rounded-xl p-4">
              <p className="font-semibold text-gray-900">{selectedTraining.title}</p>
              <p className="text-sm text-gray-500 mt-1">{selectedTraining.venue || selectedTraining.location}</p>
            </div>
            
            <div className="bg-gray-100 rounded-2xl p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-white p-4 rounded-xl shadow-sm inline-block">
                  <QrCode className="w-32 h-32 text-gray-800" />
                </div>
                <p className="text-xs text-gray-400 mt-3">ID: {selectedTraining.id}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-6 text-center">
              Show this to the trainer
            </p>
          </div>
        </div>
      )}

      {/* Score Modal */}
      {showScoreModal && selectedDateResults && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Quiz Results</h3>
              </div>
              <button
                onClick={() => setShowScoreModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedDateResults.map((result, index) => {
                const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
                return (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900">{result.quizTitle}</h4>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        percentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {percentage}%
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white p-3 rounded-lg">
                        <span className="text-gray-400 block text-xs">Correct</span>
                        <span className="font-semibold text-gray-900">{result.correctAnswers}/{result.totalQuestions}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <span className="text-gray-400 block text-xs">Time</span>
                        <span className="font-semibold text-gray-900">{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</span>
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
