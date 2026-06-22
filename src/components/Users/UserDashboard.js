import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Video, FileText, LogOut, TrendingUp, Award, CheckCircle, XCircle, Eye, Lock, Menu, RefreshCw, ChevronRight, X, Calendar } from 'lucide-react';
import Sidebar from '../Sidebar';
import MobileNav from '../MobileNav';
import { triggerUserSync, teardownUserAutoSync, isFirebaseConfigured } from '../../services/dataSync';
import DataManager from '../../services/dataManager';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userQuizzes, setUserQuizzes] = useState([]);
  const [userVideos, setUserVideos] = useState([]);
  const [userTrainings, setUserTrainings] = useState([]);
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [certSearchTerm, setCertSearchTerm] = useState('');
  const [sourceLookup, setSourceLookup] = useState(() => () => ({ title: null, type: null }));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    const onSwitchTab = (e) => setActiveTab(e.detail);
    window.addEventListener('switchTab', onSwitchTab);

    return () => {
    window.removeEventListener('switchTab', onSwitchTab);
  };
  }, []);

  useEffect(() => {
    const loadAssignments = async () => {
      // Check if user is logged in
      const userData = localStorage.getItem('currentUser');
      if (!userData) {
        navigate('/user-login');
        return;
      }
      const currentUser = JSON.parse(userData);
      setUser(currentUser);

      // Load all source data using DataManager
      try {
        const quizzes = await DataManager.getQuizzes();
        const videos = await DataManager.getVideos();
        const trainingItems = JSON.parse(localStorage.getItem('trainingItems') || '[]').map(item => ({
          ...item,
          selectedUsers: Array.isArray(item.selectedUsers) ? item.selectedUsers : [],
          sharedWith: Array.isArray(item.sharedWith) ? item.sharedWith : [],
          allowDownload: item.allowDownload ?? false,
          allowPrint: item.allowPrint ?? false,
          allowShare: item.allowShare ?? false,
          followUpType: item.followUpType || 'quiz',
          followUpId: item.followUpId || '',
          questionsPerUser: item.questionsPerUser || 15,
          timeLimit: item.timeLimit || 30,
          passPercentage: item.passPercentage || 60,
          assetType: item.assetType || 'document',
          sourceType: item.sourceType || 'url',
          type: 'training'
        }));
        const allResults = await DataManager.getQuizResults();

      // Helper function to get correct source info for a result
      const getSourceInfo = (quizId) => {
        // First check if it's a follow-up quiz (quizId matches followUpId) - use parent title
        const parentTraining = trainingItems.find(t => t.followUpType === 'quiz' && String(t.followUpId) === String(quizId));
        if (parentTraining) return { title: parentTraining.title, type: 'Training' };
        
        const parentVideo = videos.find(v => v.followUpType === 'quiz' && String(v.followUpId) === String(quizId));
        if (parentVideo) return { title: parentVideo.title, type: 'Video' };
        
        // Then check if it's a direct quiz match
        const quiz = quizzes.find(q => q.id === quizId);
        if (quiz) return { title: quiz.title, type: 'Quiz' };
        
        // Then check if it's a direct video match
        const video = videos.find(v => v.id === quizId);
        if (video) return { title: video.title, type: 'Video' };
        
        // Then check if it's a direct training match
        const training = trainingItems.find(t => t.id === quizId);
        if (training) return { title: training.title, type: 'Training' };
        
        return { title: null, type: null };
      };

    // MIGRATION: Fix quizTitle in existing results by looking up the correct title
    let needsMigration = false;
    const migratedResults = allResults.map(r => {
      const sourceInfo = getSourceInfo(r.quizId);
      if (sourceInfo.title && r.quizTitle !== sourceInfo.title) {
        needsMigration = true;
        return { ...r, quizTitle: sourceInfo.title };
      }
      return r;
    });

    // Save migrated results if any changes were made
    if (needsMigration) {
      try {
        await DataManager.saveQuizResult(migratedResults[0]);
      } catch (e) {
        // ignore storage errors
      }
    }

      // Filter quizzes assigned to current user
      const assignedQuizzes = quizzes.filter(quiz => 
        quiz.selectedUsers && quiz.selectedUsers.includes(currentUser.id)
      );

      // Filter videos assigned to current user
      const assignedVideos = videos.filter(video => 
        video.selectedUsers && video.selectedUsers.includes(currentUser.id)
      );

      const assignedTrainings = trainingItems.filter(item => 
        (item.selectedUsers && item.selectedUsers.includes(currentUser.id)) ||
        (item.sharedWith && item.sharedWith.includes(currentUser.id))
      );

      // Store source lookup function in state for use in render
      setSourceLookup(() => getSourceInfo);

      // Filter results for current user only
      const userResults = allResults.filter(result => result.userId === currentUser.id);
      // Sort by completion date (newest first)
      userResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      // Load certificates for current user - only show certificates for passed quizzes
      const allCertificates = await DataManager.getCertificates(currentUser.id);
      const userCertificates = allCertificates
        .filter(cert => {
          // Only show certificates where the score meets the pass threshold
          const passThreshold = cert.passPercentage || 70;
          return (cert.score ?? 0) >= passThreshold;
        });
      userCertificates.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

      setUserQuizzes(assignedQuizzes);
      setUserVideos(assignedVideos);
      setUserTrainings(assignedTrainings);
      setResults(userResults);
      setCertificates(userCertificates);
      } catch (error) {
        console.error('Error loading assignments:', error);
        // Fallback to localStorage
        const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
        const videos = JSON.parse(localStorage.getItem('videos') || '[]');
        const trainingItems = JSON.parse(localStorage.getItem('trainingItems') || '[]');
        const allResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
        const allCertificates = JSON.parse(localStorage.getItem('certificates') || '[]');
        
        // Continue with localStorage data...
        const assignedQuizzes = quizzes.filter(quiz => 
          quiz.selectedUsers && quiz.selectedUsers.includes(currentUser.id)
        );
        const assignedVideos = videos.filter(video => 
          video.selectedUsers && video.selectedUsers.includes(currentUser.id)
        );
        const assignedTrainings = trainingItems.filter(item => 
          (item.selectedUsers && item.selectedUsers.includes(currentUser.id)) ||
          (item.sharedWith && item.sharedWith.includes(currentUser.id))
        );
        const userResults = allResults.filter(result => result.userId === currentUser.id);
        const userCertificates = allCertificates.filter(cert => cert.userId === currentUser.id);
        
        setUserQuizzes(assignedQuizzes);
        setUserVideos(assignedVideos);
        setUserTrainings(assignedTrainings);
        setResults(userResults);
        setCertificates(userCertificates);
      }
    };

    loadAssignments();

    const onStorage = (e) => {
      if (e.key === 'trainingItems' || e.key === 'quizzes' || e.key === 'videos' || e.key === 'quizResults' || e.key === 'currentUser' || e.key === 'certificates') {
        loadAssignments();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === '/user-dashboard/quizzes') {
      setActiveTab('quizzes');
    } else {
      // Restore previously saved tab when coming back from certificate/quiz pages
      const savedTab = sessionStorage.getItem('lastUserActiveTab');
      if (savedTab) {
        setActiveTab(savedTab);
        sessionStorage.removeItem('lastUserActiveTab');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = results.filter(result => {
      if (!query) return true;
      // Use stored quizTitle first, fallback to source lookup
      const sourceInfo = sourceLookup(result.quizId);
      const searchTitle = result.quizTitle || sourceInfo.title || '';
      return (
        searchTitle.toLowerCase().includes(query) ||
        (result.userName && result.userName.toLowerCase().includes(query))
      );
    });

    setFilteredResults(filtered);
  }, [results, searchTerm, sourceLookup]);

  // Filter certificates by certificate number
  useEffect(() => {
    const query = certSearchTerm.trim().toLowerCase();

    const filtered = certificates.filter(cert => {
      if (!query) return true;
      return (
        cert.certificateNumber?.toLowerCase().includes(query) ||
        cert.quizTitle?.toLowerCase().includes(query) ||
        cert.userName?.toLowerCase().includes(query)
      );
    });

    setFilteredCertificates(filtered);
  }, [certificates, certSearchTerm]);

  const handleLogout = () => {
    teardownUserAutoSync();
    localStorage.removeItem('currentUser');
    navigate('/user-login');
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      await triggerUserSync(currentUser.id);
    }
    setRefreshing(false);
    // Reload the page to re-read localStorage
    window.location.reload();
  };

  const getResultKey = (result) => result.id || `${result.quizId}--${result.completedAt}`;

  const handleQuizClick = (quizId, resultKey = null) => {
    const fromRoute = location.pathname;
    const state = { from: fromRoute };
    sessionStorage.setItem('lastUserBackRoute', fromRoute);
    if (resultKey) {
      navigate(`/quiz/${quizId}?mode=review&resultId=${encodeURIComponent(resultKey)}`, { state });
    } else {
      navigate(`/quiz/${quizId}`, { state });
    }
  };

  const handleViewCertificate = (cert) => {
    setSelectedCertificate(cert);
    setShowCertificateModal(true);
  };

  const closeCertificateModal = () => {
    setSelectedCertificate(null);
    setShowCertificateModal(false);
  };

  const getStats = () => {
    if (results.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        totalTime: 0
      };
    }

    const totalAttempts = results.length;
    const averageScore = Math.round(
      results.reduce((sum, result) => sum + result.score, 0) / totalAttempts
    );
    const passRate = Math.round(
      (results.filter(result => result.score >= (result.passPercentage || 60)).length / totalAttempts) * 100
    );
    const avgTimeSeconds = Math.round(
      results.reduce((sum, result) => sum + result.timeTaken, 0) / totalAttempts
    );
    const totalTime = {
      minutes: Math.floor(avgTimeSeconds / 60),
      seconds: avgTimeSeconds % 60
    };

    return { totalAttempts, averageScore, passRate, totalTime };
  };

  const myQuizzies = [
    ...userQuizzes.map((quiz) => ({ ...quiz, type: 'quiz' })),
    ...userVideos.map((video) => ({ ...video, type: 'video' })),
    ...userTrainings.map((training) => ({ ...training, type: 'training' }))
  ];

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentUser={user} />
      {mobileSidebarOpen && <Sidebar currentUser={user} onCloseMobile={() => setMobileSidebarOpen(false)} />}
      
      <div className="md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 md:h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden mr-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-base md:text-xl font-semibold text-gray-900">User Dashboard</h1>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
                <span className="hidden md:inline text-sm text-gray-600">Welcome, {user?.name} (User)</span>
                {isFirebaseConfigured && (
                  <button
                    onClick={handleRefreshData}
                    disabled={refreshing}
                    className="flex items-center px-2 md:px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200 disabled:opacity-50"
                    title="Refresh data from cloud"
                  >
                    <RefreshCw className={`w-4 h-4 md:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden md:inline">{refreshing ? 'Syncing...' : 'Refresh'}</span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8 pb-20 md:pb-8">
        {/* Stats - compact on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-8">
          <div className="bg-white rounded-lg md:rounded-lg shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2 md:p-3">
                <BookOpen className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Quizzes</p>
                <p className="text-lg md:text-2xl font-semibold text-gray-900">{userQuizzes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg md:rounded-lg shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-2 md:p-3">
                <Video className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Videos</p>
                <p className="text-lg md:text-2xl font-semibold text-gray-900">{userVideos.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg md:rounded-lg shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-2 md:p-3">
                <FileText className="w-4 h-4 md:w-6 md:h-6 text-indigo-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Trainings</p>
                <p className="text-lg md:text-2xl font-semibold text-gray-900">{userTrainings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg md:rounded-lg shadow p-3 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-2 md:p-3">
                <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
              </div>
              <div className="ml-2 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-lg md:text-2xl font-semibold text-gray-900">{stats.averageScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab buttons - scrollable on mobile */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3 border-b border-slate-200 pb-3 md:mb-6 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                navigate('/user-dashboard');
              }}
              className={`px-3 md:px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition ${activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab('quizzes');
                navigate('/user-dashboard/quizzes');
              }}
              className={`px-3 md:px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition ${activeTab === 'quizzes' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              My Quizzes
            </button>
            <button
              onClick={() => {
                setActiveTab('certificates');
              }}
              className={`px-3 md:px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition flex items-center ${activeTab === 'certificates' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              <Award className="w-4 h-4 mr-1" />
              Certificates ({certificates.length})
            </button>
            <button
              onClick={() => {
                navigate('/user-training-calendar');
              }}
              className="px-3 md:px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Training Calendar
            </button>
          </div>

          {activeTab === 'dashboard' ? (
            <>
              {/* Results Panel */}
              <div className="bg-white rounded-lg shadow p-3 md:p-6 mb-4 md:mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-900">My Results</h2>
                    <p className="text-xs md:text-sm text-gray-500 hidden md:block">Showing only your own completed quiz and video assessments.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by quiz title"
                      className="rounded-lg border border-gray-200 px-3 md:px-4 py-2 text-sm w-full md:w-72 focus:border-blue-500 focus:ring-blue-200 focus:outline-none"
                    />
                  </div>
                </div>

                {filteredResults.length > 0 ? (
                  <>
                    {/* Mobile: Card layout */}
                    <div className="md:hidden space-y-3">
                      {filteredResults.map((result) => {
                        const resultCert = (() => {
                          const passed = (result.score ?? 0) >= (result.passPercentage ?? 70);
                          if (!passed) return null;
                          // Only show certificate if it's specifically linked to this result
                          const certByResultId = certificates.find(c => c.resultId === result.id);
                          return certByResultId || null;
                        })();
                        const isCertExpired = resultCert?.expiresAt && new Date(resultCert.expiresAt) < new Date();
                        const hasPassed = result.score >= (result.passPercentage || 60);
                        const sourceInfo = sourceLookup(result.quizId);
                        const displayTitle = result.quizTitle || sourceInfo.title || 'Unknown';
                        const displayType = result.trainingType || sourceInfo.type || 'Quiz';

                        return (
                          <div
                            key={`${result.quizId}-${result.completedAt}`}
                            className="border border-gray-200 rounded-lg p-3 active:bg-gray-50 cursor-pointer"
                            onClick={() => handleQuizClick(result.quizId, getResultKey(result))}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{displayTitle}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                    displayType === 'Video' || displayType === 'Video training'
                                      ? 'bg-blue-100 text-blue-800'
                                      : displayType === 'Training'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {displayType}
                                  </span>
                                  {hasPassed ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                                      <CheckCircle className="w-3 h-3" /> Pass
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                                      <XCircle className="w-3 h-3" /> Fail
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{result.correctAnswers}/{result.totalQuestions} correct</span>
                              <span className="font-semibold text-gray-900">{result.score}%</span>
                              <span>{Math.round(result.timeTaken / 60)}m {result.timeTaken % 60}s</span>
                              <span>{new Date(result.completedAt).toLocaleDateString()}</span>
                            </div>
                            {resultCert && (
                              <div className="mt-2 flex items-center gap-2">
                                <Award className={`w-4 h-4 ${isCertExpired ? 'text-gray-400' : 'text-yellow-500'}`} />
                                <span className={`text-xs font-semibold ${isCertExpired ? 'text-gray-500' : 'text-yellow-600'}`}>
                                  {isCertExpired ? 'Expired' : 'Issued'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sessionStorage.setItem('lastUserBackRoute', location.pathname);
                                    sessionStorage.setItem('lastUserActiveTab', activeTab);
                                    navigate(`/certificate/${resultCert.id}`);
                                  }}
                                  className="text-blue-600 text-xs underline"
                                >
                                  View
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quiz / Video</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Correct</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Result</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Certificate</th>
                            <th className="px-4 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredResults.map((result) => {
                          const resultCert = (() => {
                            const passed = (result.score ?? 0) >= (result.passPercentage ?? 70);
                            if (!passed) return null;
                            // Only show certificate if it's specifically linked to this result
                            const certByResultId = certificates.find(c => c.resultId === result.id);
                            return certByResultId || null;
                          })();
                          const isCertExpired = resultCert?.expiresAt && new Date(resultCert.expiresAt) < new Date();
                          const hasPassed = result.score >= (result.passPercentage || 60);
                          const sourceInfo = sourceLookup(result.quizId);
                          const displayTitle = result.quizTitle || sourceInfo.title || 'Unknown';
                          const displayType = result.trainingType || sourceInfo.type || 'Quiz';

                          return (
                            <tr key={`${result.quizId}-${result.completedAt}`}>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{displayTitle}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  displayType === 'Video' || displayType === 'Video training'
                                    ? 'bg-blue-100 text-blue-800'
                                    : displayType === 'Training'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {displayType}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                {result.correctAnswers}/{result.totalQuestions}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">{result.score}%</span>
                                  <div className="w-12 rounded-full bg-gray-200 h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        result.score >= 70 ? 'bg-green-500' : result.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${result.score}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  {hasPassed ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      <span className="text-sm font-semibold text-green-600">Pass</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4 text-red-500" />
                                      <span className="text-sm font-semibold text-red-600">Fail</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {Math.round(result.timeTaken / 60)}m {result.timeTaken % 60}s
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(result.completedAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                {resultCert ? (
                                  <div className="flex items-center gap-2">
                                    <Award className={`w-5 h-5 ${isCertExpired ? 'text-gray-400' : 'text-yellow-500'}`} />
                                    <span className={`text-xs font-semibold ${isCertExpired ? 'text-gray-500' : 'text-yellow-600'}`}>
                                      {isCertExpired ? 'Expired' : 'Issued'}
                                    </span>
                                    <button
                                      onClick={() => {
                                        sessionStorage.setItem('lastUserBackRoute', location.pathname);
                                        sessionStorage.setItem('lastUserActiveTab', activeTab);
                                        navigate(`/certificate/${resultCert.id}`);
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                                    >
                                      View
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                <button
                                  onClick={() => handleQuizClick(result.quizId, getResultKey(result))}
                                  className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-sm text-gray-500">
                    You have not completed any quizzes or videos yet.
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'quizzes' ? (
            <>
              {/* My Quizzes Tab */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-base md:text-lg font-semibold text-gray-900">My Assigned Training</h2>
                  <p className="text-xs md:text-sm text-gray-500 hidden md:block">View and access your assigned quizzes, videos, and training modules.</p>
                </div>

                {myQuizzies.length > 0 ? (
                  <>
                    {/* Mobile: Card layout */}
                    <div className="md:hidden divide-y divide-gray-200">
                      {myQuizzies.map((item) => {
                        const userResults = results.filter(r => r.quizId === item.id && r.userId === user?.id);
                        const hasCompleted = userResults.some(r => r.status === 'passed' || (r.score >= (item.passPercentage || 70)));
                        const hasFailed = userResults.some(r => r.status === 'failed' || (r.score < (item.passPercentage || 70)));
                        const hasAttempted = userResults.length > 0;
                        const lastResult = userResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
                        const isOneTime = item.accessMode === 'one-time';
                        const isOneTimeLocked = isOneTime && hasAttempted;
                        const reassignEnabled = item.reassignOnFail;
                        const rescheduleDays = item.rescheduleDays || 7;
                        const trainingCompletions = JSON.parse(localStorage.getItem('trainingCompletions') || '[]');
                        const lastTrainingCompletion = trainingCompletions.find(
                          tc => tc.itemId === item.id && tc.userId === user?.id
                        );
                        let isWaitingPeriod = false;
                        let daysRemaining = 0;
                        let needsReTraining = false;

                        if (hasFailed && reassignEnabled && lastResult) {
                          const failDate = new Date(lastResult.completedAt);
                          const rescheduleDate = new Date(failDate);
                          rescheduleDate.setDate(rescheduleDate.getDate() + parseInt(rescheduleDays));
                          const now = new Date();
                          isWaitingPeriod = now < rescheduleDate;
                          daysRemaining = Math.ceil((rescheduleDate - now) / (1000 * 60 * 60 * 24));
                          if (!isWaitingPeriod) {
                            const lastCompletionDate = lastTrainingCompletion ? new Date(lastTrainingCompletion.completedAt) : null;
                            needsReTraining = !lastCompletionDate || lastCompletionDate < failDate;
                          }
                        }

                        const showPendingFail = hasFailed && reassignEnabled;

                        return (
                          <div
                            key={getResultKey(item)}
                            className="p-3 active:bg-gray-50"
                            onClick={() => {
                              if (isOneTimeLocked) {
                                alert('This is a one-time assessment. You have already completed it.');
                                return;
                              }
                              if (isWaitingPeriod) {
                                alert(`Please wait ${daysRemaining} more day(s) before you can retake this assessment.`);
                                return;
                              }
                              if (needsReTraining) {
                                alert('You must complete the training again before retaking the quiz.');
                                if (item.type === 'training') {
                                  const fromRoute = location.pathname;
                                  sessionStorage.setItem('lastUserBackRoute', fromRoute);
                                  navigate(`/training/${item.id}`, { state: { from: fromRoute, requireConfirmation: true } });
                                } else {
                                  const fromRoute = location.pathname;
                                  sessionStorage.setItem('lastUserBackRoute', fromRoute);
                                  navigate(`/quiz/${item.id}`, { state: { from: fromRoute, requireTraining: true } });
                                }
                                return;
                              }
                              const fromRoute = location.pathname;
                              sessionStorage.setItem('lastUserBackRoute', fromRoute);
                              if (item.type === 'training') {
                                navigate(`/training/${item.id}`, { state: { from: fromRoute } });
                              } else {
                                handleQuizClick(item.id);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>}
                              </div>
                              {item.type === 'quiz' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 flex-shrink-0 ml-2">
                                  <BookOpen className="w-3 h-3" /> Quiz
                                </span>
                              ) : item.type === 'video' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex-shrink-0 ml-2">
                                  <Video className="w-3 h-3" /> Video
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 flex-shrink-0 ml-2">
                                  <FileText className="w-3 h-3" /> Training
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isOneTimeLocked ? (
                                  <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Completed</span>
                                ) : showPendingFail ? (
                                  isWaitingPeriod ? (
                                    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">Wait {daysRemaining}d</span>
                                  ) : needsReTraining ? (
                                    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">Re-training</span>
                                  ) : (
                                    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">Ready</span>
                                  )
                                ) : hasCompleted ? (
                                  <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Done</span>
                                ) : (
                                  <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Pending</span>
                                )}
                                <span className="text-xs text-gray-500">{item.timeLimit} min</span>
                                <span className="text-xs text-gray-500">Pass: {item.passPercentage}%</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isOneTimeLocked) {
                                    alert('This is a one-time assessment. You have already completed it.');
                                    return;
                                  }
                                  if (isWaitingPeriod) {
                                    alert(`Please wait ${daysRemaining} more day(s) before you can retake this assessment.`);
                                    return;
                                  }
                                  const fromRoute = location.pathname;
                                  sessionStorage.setItem('lastUserBackRoute', fromRoute);
                                  if (item.type === 'training') {
                                    navigate(`/training/${item.id}`, { state: { from: fromRoute } });
                                  } else {
                                    handleQuizClick(item.id);
                                  }
                                }}
                                disabled={isOneTimeLocked || (showPendingFail && isWaitingPeriod)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-xs transition ${
                                  isOneTimeLocked || (showPendingFail && isWaitingPeriod)
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white active:bg-blue-700'
                                }`}
                              >
                                {isOneTimeLocked || (showPendingFail && isWaitingPeriod) ? (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    {isOneTimeLocked ? 'Done' : `Wait ${daysRemaining}d`}
                                  </>
                                ) : showPendingFail ? (
                                  needsReTraining ? 'Re-train' : 'Retake'
                                ) : hasCompleted ? (
                                  'Retake'
                                ) : (
                                  'Start'
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Pass %</th>
                            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {myQuizzies.map((item) => {
                          const userResults = results.filter(r => r.quizId === item.id && r.userId === user?.id);
                          const hasCompleted = userResults.some(r => r.status === 'passed' || (r.score >= (item.passPercentage || 70)));
                          const hasFailed = userResults.some(r => r.status === 'failed' || (r.score < (item.passPercentage || 70)));
                          const hasAttempted = userResults.length > 0;
                          const lastResult = userResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
                          const isOneTime = item.accessMode === 'one-time';
                          const isOneTimeLocked = isOneTime && hasAttempted;
                          const reassignEnabled = item.reassignOnFail;
                          const rescheduleDays = item.rescheduleDays || 7;
                          const trainingCompletions = JSON.parse(localStorage.getItem('trainingCompletions') || '[]');
                          const lastTrainingCompletion = trainingCompletions.find(
                            tc => tc.itemId === item.id && tc.userId === user?.id
                          );
                          let isWaitingPeriod = false;
                          let daysRemaining = 0;
                          let needsReTraining = false;

                          if (hasFailed && reassignEnabled && lastResult) {
                            const failDate = new Date(lastResult.completedAt);
                            const rescheduleDate = new Date(failDate);
                            rescheduleDate.setDate(rescheduleDate.getDate() + parseInt(rescheduleDays));
                            const now = new Date();
                            isWaitingPeriod = now < rescheduleDate;
                            daysRemaining = Math.ceil((rescheduleDate - now) / (1000 * 60 * 60 * 24));
                            if (!isWaitingPeriod) {
                              const lastCompletionDate = lastTrainingCompletion ? new Date(lastTrainingCompletion.completedAt) : null;
                              needsReTraining = !lastCompletionDate || lastCompletionDate < failDate;
                            }
                          }

                          const showPendingFail = hasFailed && reassignEnabled;

                          return (
                          <tr
                            key={getResultKey(item)}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              if (isOneTimeLocked) {
                                alert('This is a one-time assessment. You have already completed it.');
                                return;
                              }
                              if (isWaitingPeriod) {
                                alert(`Please wait ${daysRemaining} more day(s) before you can retake this assessment.`);
                                return;
                              }
                              if (needsReTraining) {
                                alert('You must complete the training again before retaking the quiz. Please go through the training material and confirm completion.');
                                if (item.type === 'training') {
                                  const fromRoute = location.pathname;
                                  sessionStorage.setItem('lastUserBackRoute', fromRoute);
                                  navigate(`/training/${item.id}`, { state: { from: fromRoute, requireConfirmation: true } });
                                } else {
                                  const fromRoute = location.pathname;
                                  sessionStorage.setItem('lastUserBackRoute', fromRoute);
                                  navigate(`/quiz/${item.id}`, { state: { from: fromRoute, requireTraining: true } });
                                }
                                return;
                              }
                              const fromRoute = location.pathname;
                              sessionStorage.setItem('lastUserBackRoute', fromRoute);
                              if (item.type === 'training') {
                                navigate(`/training/${item.id}`, { state: { from: fromRoute } });
                              } else {
                                handleQuizClick(item.id);
                              }
                            }}
                          >
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{item.title}</div>
                              {item.description && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.type === 'quiz' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                                  <BookOpen className="w-3 h-3" /> Quiz
                                </span>
                              ) : item.type === 'video' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                  <Video className="w-3 h-3" /> Video
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                                  <FileText className="w-3 h-3" /> Training
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isOneTimeLocked ? (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Completed</span>
                              ) : showPendingFail ? (
                                isWaitingPeriod ? (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">Wait {daysRemaining}d</span>
                                ) : needsReTraining ? (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Re-training</span>
                                ) : (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Ready</span>
                                )
                              ) : hasCompleted ? (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">Done</span>
                              ) : (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">Pending</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.timeLimit} min</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.passPercentage}%</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isOneTimeLocked) {
                                    alert('This is a one-time assessment. You have already completed it.');
                                    return;
                                  }
                                  if (isWaitingPeriod) {
                                    alert(`Please wait ${daysRemaining} more day(s) before you can retake this assessment.`);
                                    return;
                                  }
                                  const fromRoute = location.pathname;
                                  sessionStorage.setItem('lastUserBackRoute', fromRoute);
                                  if (item.type === 'training') {
                                    navigate(`/training/${item.id}`, { state: { from: fromRoute } });
                                  } else {
                                    handleQuizClick(item.id);
                                  }
                                }}
                                disabled={isOneTimeLocked || (showPendingFail && isWaitingPeriod)}
                                className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition ${
                                  isOneTimeLocked || (showPendingFail && isWaitingPeriod)
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {isOneTimeLocked || (showPendingFail && isWaitingPeriod) ? (
                                  <>
                                    <Lock className="w-4 h-4" />
                                    {isOneTimeLocked ? 'Completed' : `Wait ${daysRemaining}d`}
                                  </>
                                ) : showPendingFail ? (
                                  needsReTraining ? 'Re-training' : 'Retake'
                                ) : hasCompleted ? (
                                  'Retake'
                                ) : (
                                  'Start'
                                )}
                              </button>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned training</h3>
                    <p className="text-gray-600">You have not been assigned any quizzes or training videos yet.</p>
                    <p className="text-sm text-gray-500 mt-2">Please contact your administrator for assignments.</p>
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'certificates' ? (
            <>
              {/* Certificates Panel */}
              <div className="bg-white rounded-lg shadow p-3 md:p-6 mb-4 md:mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-900">My Certificates</h2>
                    <p className="text-xs md:text-sm text-gray-500 hidden md:block">View and download your earned certificates.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={certSearchTerm}
                      onChange={(e) => setCertSearchTerm(e.target.value)}
                      placeholder="Search by certificate number"
                      className="rounded-lg border border-gray-200 px-3 md:px-4 py-2 text-sm w-full md:w-72 focus:border-blue-500 focus:ring-blue-200 focus:outline-none"
                    />
                  </div>
                </div>

                {certificates.length > 0 ? (
                  <>
                    {/* Mobile: Card layout */}
                    <div className="md:hidden space-y-3">
                      {filteredCertificates.map((cert) => {
                        const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date();
                        const certTitle = (() => {
                          const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
                          let result = results.find(r => r.id === cert.resultId);
                          if (!result) {
                            const matchingResults = results
                              .filter(r => r.quizId === cert.quizId && r.userId === cert.userId && (r.score ?? 0) >= (r.passPercentage ?? 70))
                              .sort((a, b) => Math.abs(new Date(a.completedAt).getTime() - new Date(cert.issuedAt).getTime()) - Math.abs(new Date(b.completedAt).getTime() - new Date(cert.issuedAt).getTime()));
                            result = matchingResults[0];
                          }
                          return result?.quizTitle || cert.quizTitle || 'Unknown Training';
                        })();
                        const certScore = (() => {
                          const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
                          let result = results.find(r => r.id === cert.resultId);
                          if (!result) {
                            const matchingResults = results
                              .filter(r => r.quizId === cert.quizId && r.userId === cert.userId && (r.score ?? 0) >= (r.passPercentage ?? 70))
                              .sort((a, b) => Math.abs(new Date(a.completedAt).getTime() - new Date(cert.issuedAt).getTime()) - Math.abs(new Date(b.completedAt).getTime() - new Date(cert.issuedAt).getTime()));
                            result = matchingResults[0];
                          }
                          return result?.score ?? cert.score ?? 0;
                        })();

                        return (
                          <div key={cert.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-sm font-medium text-blue-900">{cert.certificateNumber || cert.id}</p>
                                <p className="text-xs text-gray-500">{cert.trainingType}</p>
                              </div>
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {isExpired ? 'Expired' : 'Valid'}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-2">{certTitle}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <span>Score: <span className="font-semibold text-green-600">{certScore}%</span></span>
                              <span>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</span>
                              <span>{cert.expiresAt ? `Valid: ${new Date(cert.expiresAt).toLocaleDateString()}` : 'No expiry'}</span>
                            </div>
                            <button
                              onClick={() => handleViewCertificate(cert)}
                              className={`w-full inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition ${isExpired ? 'bg-gray-500 text-white' : 'bg-yellow-600 text-white'}`}
                            >
                              <Eye className="w-4 h-4" />
                              View Certificate
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Certificate No</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Training</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valid Until</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredCertificates.map((cert) => {
                          const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date();
                          return (
                            <tr key={cert.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="font-mono text-sm font-medium text-blue-900">{cert.certificateNumber || cert.id}</div>
                                <div className="text-xs text-gray-500">{cert.trainingType}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  {(() => {
                                    const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
                                    const certIssuedAt = new Date(cert.issuedAt).getTime();
                                    let result = results.find(r => r.id === cert.resultId);
                                    if (!result) {
                                      const matchingResults = results
                                        .filter(r => r.quizId === cert.quizId && r.userId === cert.userId && (r.score ?? 0) >= (r.passPercentage ?? 70))
                                        .sort((a, b) => {
                                          const aDiff = Math.abs(new Date(a.completedAt).getTime() - certIssuedAt);
                                          const bDiff = Math.abs(new Date(b.completedAt).getTime() - certIssuedAt);
                                          return aDiff - bDiff;
                                        });
                                      result = matchingResults[0];
                                    }
                                    return result?.quizTitle || cert.quizTitle || 'Unknown Training';
                                  })()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-semibold text-green-600">
                                  {cert.score ?? 0}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {new Date(cert.issuedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                                  {cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : 'No expiry'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  {isExpired ? 'Expired' : 'Valid'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleViewCertificate(cert)}
                                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition ${isExpired ? 'bg-gray-500 text-white hover:bg-gray-600' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}
                                >
                                  <Eye className="w-4 h-4" />
                                  View Certificate
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h3>
                    <p className="text-gray-600 mb-2">You haven't earned any certificates yet.</p>
                    <p className="text-sm text-gray-500">Complete quizzes and training videos with passing scores to earn certificates.</p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
      </div>

      {/* Certificate View Modal */}
      {showCertificateModal && selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Certificate</h2>
                <p className="text-blue-100 text-sm mt-1">{selectedCertificate.userName}</p>
              </div>
              <button
                onClick={closeCertificateModal}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body - Certificate Iframe */}
            <div className="flex-1 overflow-auto bg-gray-50 min-h-0">
              <iframe
                src={`/certificate/${selectedCertificate.id}?modal=true`}
                className="w-full h-full border-0"
                title="Certificate"
              />
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-100 px-6 py-4 flex justify-end flex-shrink-0">
              <button
                onClick={closeCertificateModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileNav onLogout={handleLogout} />
    </div>
  );
};

export default UserDashboard;
