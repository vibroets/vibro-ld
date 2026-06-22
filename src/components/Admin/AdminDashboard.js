import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Users, TrendingUp, Clock, CheckCircle, XCircle, Filter, Download, Search, Eye, X, Award, Share2 } from 'lucide-react';
import { setAdminDataUpdateCallback } from '../../services/dataSync';
import {
  checkAnswerCorrect,
  formatAnswerText,
  formatCorrectAnswerText,
  QUESTION_TYPES
} from '../../services/quizHelpers';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [filters, setFilters] = useState({
    user: '',
    quiz: '',
    department: '',
    trainingType: '',
    dateFrom: '',
    dateTo: '',
    minScore: '',
    maxScore: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [certSearchTerm, setCertSearchTerm] = useState('');
  const [showCertificatesView, setShowCertificatesView] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSearchTerm, setShareSearchTerm] = useState('');

  const applyFilters = useCallback(() => {
    let filtered = [...results];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(result => 
        result.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.quizTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.user) {
      filtered = filtered.filter(result => result.userId === filters.user);
    }

    if (filters.quiz) {
      filtered = filtered.filter(result => result.quizId === filters.quiz);
    }

    if (filters.department) {
      filtered = filtered.filter(result => result.userDepartment === filters.department);
    }

    if (filters.trainingType) {
      filtered = filtered.filter(result => result.trainingType === filters.trainingType);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(result => 
        new Date(result.completedAt) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(result => 
        new Date(result.completedAt) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    if (filters.minScore) {
      filtered = filtered.filter(result => result.score >= parseInt(filters.minScore));
    }

    if (filters.maxScore) {
      filtered = filtered.filter(result => result.score <= parseInt(filters.maxScore));
    }

    // Sort by completion date (newest first)
    filtered.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    setFilteredResults(filtered);
  }, [results, filters, searchTerm]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      navigate('/login');
    }
    loadData();

    // Register callback for auto-refresh when new data arrives from cloud
    setAdminDataUpdateCallback(() => {
      loadData();
    });

    // Listen for storage changes to auto-refresh when quiz results or certificates are updated
    const handleStorageChange = (e) => {
      if (e.key === 'quizResults' || e.key === 'certificates') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      setAdminDataUpdateCallback(null);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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

  const loadData = () => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const storedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const storedVideos = JSON.parse(localStorage.getItem('videos') || '[]');
    const storedResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const storedCertificates = JSON.parse(localStorage.getItem('certificates') || '[]');
    
    // Sort certificates by issue date (newest first)
    storedCertificates.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
    setCertificates(storedCertificates);
    setFilteredCertificates(storedCertificates);

    // Load training items for source lookup
    const trainingItems = JSON.parse(localStorage.getItem('trainingItems') || '[]');

    // Helper function to get correct source info
    const getSourceInfo = (quizId) => {
      // First check if it's a follow-up quiz (quizId matches followUpId) - use parent title
      const parentTraining = trainingItems.find(t => t.followUpType === 'quiz' && String(t.followUpId) === String(quizId));
      if (parentTraining) return { title: parentTraining.title, type: 'Training' };
      
      const parentVideo = storedVideos.find(v => v.followUpType === 'quiz' && String(v.followUpId) === String(quizId));
      if (parentVideo) return { title: parentVideo.title, type: 'Video' };
      
      // Then check if it's a direct quiz match
      const quiz = storedQuizzes.find(q => q.id === quizId);
      if (quiz) return { title: quiz.title, type: 'Quiz' };
      
      // Then check if it's a direct video match
      const video = storedVideos.find(v => v.id === quizId);
      if (video) return { title: video.title, type: 'Video' };
      
      // Then check if it's a direct training match
      const training = trainingItems.find(t => t.id === quizId);
      if (training) return { title: training.title, type: 'Training' };
      
      return { title: null, type: null };
    };

    // MIGRATION: Fix quizTitle in existing results by looking up the correct title
    let needsMigration = false;
    const migratedResults = storedResults.map(r => {
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
        localStorage.setItem('quizResults', JSON.stringify(migratedResults));
      } catch (e) {
        // ignore storage errors
      }
    }

    // Enrich results with user department, trainingType, and correct title
    const enrichedResults = migratedResults.map(r => {
      const user = storedUsers.find(u => u.id === r.userId);
      const hasDept = !!r.userDepartment;
      const hasType = !!r.trainingType;

      // Get correct source info
      const sourceInfo = getSourceInfo(r.quizId);
      
      // Determine training type - use source info if available, fallback to stored type
      let inferredType = sourceInfo.type || r.trainingType;
      if (!inferredType && !hasType) {
        const isVideo = storedVideos.some(v => v.id === r.quizId);
        inferredType = isVideo ? 'Video training' : 'Quiz';
      }

      return {
        ...r,
        quizTitle: r.quizTitle || sourceInfo.title || 'Unknown',
        userDepartment: hasDept ? r.userDepartment : (user?.department || 'N/A'),
        trainingType: inferredType
      };
    });

    // Persist migration so subsequent loads show correct department
    try {
      localStorage.setItem('quizResults', JSON.stringify(enrichedResults));
    } catch (e) {
      // ignore storage errors
    }

    setUsers(storedUsers);
    setQuizzes(storedQuizzes);
    setVideos(storedVideos);
    setResults(enrichedResults);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      user: '',
      quiz: '',
      department: '',
      trainingType: '',
      dateFrom: '',
      dateTo: '',
      minScore: '',
      maxScore: ''
    });
    setSearchTerm('');
  };

  const handleViewDetails = (result) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedResult(null);
  };

  const handleViewCertificate = (cert) => {
    setSelectedCertificate(cert);
  };

  const handleIssueCertificate = (result) => {
    if (!result) return;
    
    const existingCertificates = JSON.parse(localStorage.getItem('certificates') || '[]');
    
    // Check if certificate already exists for this result
    const existingCertForResult = existingCertificates.find(c => c.resultId === result.id);
    if (existingCertForResult) {
      alert('Certificate already issued for this result.');
      return;
    }
    
    // Generate unique certificate number
    const generateRandom = (length = 8) => {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
    };
    
    const userHash = result.userId.substring(0, 4).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = generateRandom(8);
    const certNumber = `VIBLTD-${timestamp}-${randomPart}-${userHash}`;
    
    // Calculate expiry date (default 1 year)
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    // Get quiz details for certificate validity settings
    const quiz = quizzes.find(q => q.id === result.quizId);
    const validityValue = quiz?.certificateValidityValue || 1;
    const validityUnit = quiz?.certificateValidityUnit || 'year';
    
    // Recalculate expiry based on quiz settings
    const calculatedExpiresAt = new Date(issuedAt);
    switch (validityUnit) {
      case 'days':
        calculatedExpiresAt.setDate(calculatedExpiresAt.getDate() + validityValue);
        break;
      case 'months':
        calculatedExpiresAt.setMonth(calculatedExpiresAt.getMonth() + validityValue);
        break;
      case 'years':
        calculatedExpiresAt.setFullYear(calculatedExpiresAt.getFullYear() + validityValue);
        break;
      default:
        calculatedExpiresAt.setFullYear(calculatedExpiresAt.getFullYear() + 1);
    }
    
    const certificate = {
      id: `cert-${Date.now()}-${generateRandom(4)}`,
      certificateNumber: certNumber,
      resultId: result.id,
      quizId: result.quizId,
      quizTitle: result.quizTitle,
      trainingType: result.trainingType,
      userId: result.userId,
      userName: result.userName,
      userDepartment: result.userDepartment,
      score: result.score,
      passPercentage: result.passPercentage,
      issuedAt: issuedAt.toISOString(),
      expiresAt: calculatedExpiresAt.toISOString(),
      validityValue: validityValue,
      validityUnit: validityUnit,
      status: 'active',
      organizationName: 'VIBRO Learning, Training & Development',
      issuedByAdmin: true
    };
    
    existingCertificates.push(certificate);
    localStorage.setItem('certificates', JSON.stringify(existingCertificates));
    
    // Refresh data to show the new certificate
    loadData();
    
    alert(`Certificate issued successfully to ${result.userName}!`);
  };

  const closeCertificateView = () => {
    setSelectedCertificate(null);
    setShowShareModal(false);
  };

  const handleShareCertificate = (cert) => {
    setSelectedCertificate(cert);
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setShareSearchTerm('');
  };

  const shareCertificateWithUser = (userId) => {
    if (!selectedCertificate) return;
    
    // In a real app, this would send the certificate to the user
    // For now, we'll just show a confirmation
    const user = users.find(u => u.id === userId);
    alert(`Certificate shared with ${user?.name || 'user'} successfully!`);
    closeShareModal();
  };

  const activeFilters = [
    filters.user && `User: ${users.find(u => u.id === filters.user)?.name || 'Selected'}`,
    filters.quiz && `Quiz: ${[...quizzes, ...videos].find(item => item.id === filters.quiz)?.title || 'Selected'}`,
    filters.trainingType && `Type: ${filters.trainingType}`,
    filters.department && `Department: ${filters.department}`,
    filters.minScore && `Min ${filters.minScore}%`,
    filters.maxScore && `Max ${filters.maxScore}%`,
    filters.dateFrom && `From ${filters.dateFrom}`,
    filters.dateTo && `To ${filters.dateTo}`
  ].filter(Boolean);

  const filterSummary = activeFilters.length > 0 ? activeFilters.join(' • ') : 'All results are shown. Expand filters to narrow down data.';

  const exportResults = () => {
    const csvContent = [
      ['User Name', 'Department', 'Quiz Title', 'Training Type', 'Score', 'Correct Answers', 'Total Questions', 'Time Taken (min)', 'Completed At'],
      ...filteredResults.map(result => [
        result.userName,
        result.userDepartment || 'N/A',
        result.quizTitle,
        result.trainingType || 'Quiz',
        result.score + '%',
        result.correctAnswers,
        result.totalQuestions,
        Math.round(result.timeTaken / 60),
        new Date(result.completedAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStats = () => {
    if (filteredResults.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        totalTime: 0
      };
    }

    const totalAttempts = filteredResults.length;
    const averageScore = Math.round(
      filteredResults.reduce((sum, result) => sum + result.score, 0) / totalAttempts
    );
    const passRate = Math.round(
      (filteredResults.filter(result => result.score >= (result.passPercentage || 60)).length / totalAttempts) * 100
    );
    const avgTimeSeconds = Math.round(
      filteredResults.reduce((sum, result) => sum + result.timeTaken, 0) / totalAttempts
    );
    const totalTime = {
      minutes: Math.floor(avgTimeSeconds / 60),
      seconds: avgTimeSeconds % 60
    };

    return { totalAttempts, averageScore, passRate, totalTime };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <BarChart3 className="w-6 h-6 text-gray-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <button
              onClick={exportResults}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.passRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Time</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTime.minutes}m {stats.totalTime.seconds}s</p>
              </div>
            </div>
          </div>

          {/* Certificates Card - Click to view all certificates */}
          <div 
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-yellow-400"
            onClick={() => setShowCertificatesView(true)}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Certificates</p>
                <p className="text-2xl font-semibold text-gray-900">{certificates.length}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Click to view & share</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                <p className="text-sm text-slate-500">Compact filter layout with quick access to search and advanced options.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFiltersOpen(prev => !prev)}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
              >
                {filtersOpen ? 'Collapse filters' : 'Expand filters'}
              </button>
              <button
                onClick={clearFilters}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.5fr_auto] items-end mb-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users or quizzes"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-600">
              {filterSummary}
            </div>
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">User</label>
                <select
                  value={filters.user}
                  onChange={(e) => handleFilterChange('user', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">All Users</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Quiz / Video</label>
                <select
                  value={filters.quiz}
                  onChange={(e) => handleFilterChange('quiz', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">All Quizzes</option>
                  {quizzes.map(quiz => (
                    <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                  ))}
                  {videos.map(video => (
                    <option key={video.id} value={video.id}>{video.title} (Video)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Type</label>
                <select
                  value={filters.trainingType}
                  onChange={(e) => handleFilterChange('trainingType', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">All Types</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Video training">Video training</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">All Departments</option>
                  {[...new Set(results.map(r => r.userDepartment).filter(Boolean))].sort().map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 xl:col-span-1">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Score</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minScore}
                    onChange={(e) => handleFilterChange('minScore', e.target.value)}
                    placeholder="Min"
                    className="w-1/2 px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.maxScore}
                    onChange={(e) => handleFilterChange('maxScore', e.target.value)}
                    placeholder="Max"
                    className="w-1/2 px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="md:col-span-2 xl:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Completed</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Quiz Results ({filteredResults.length})
            </h2>
          </div>

          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No quiz results found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or wait for users to complete quizzes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-700">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.06em]">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.06em]">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.06em]">
                      Quiz/Video
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.06em]">
                      Training Type
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.06em]">
                      Correct
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.06em]">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.06em]">
                      Result
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.06em]">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.06em]">
                      Completed
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.06em]">
                      Certificate
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-[0.06em]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredResults.map((result, index) => {
                    // Find certificate for this result - only if the result actually passed
                    const resultCert = (() => {
                      const passed = (result.score ?? 0) >= (result.passPercentage ?? 70);
                      if (!passed) return null;
                      const certByResultId = certificates.find(c => c.resultId === result.id);
                      if (certByResultId) return certByResultId;
                      const matchingCerts = certificates.filter(c =>
                        c.quizId === result.quizId && c.userId === result.userId
                      ).map(c => ({
                        ...c,
                        _diff: Math.abs(new Date(c.issuedAt).getTime() - new Date(result.completedAt).getTime())
                      })).sort((a, b) => a._diff - b._diff);
                      return matchingCerts[0] || null;
                    })();
                    const isCertExpired = resultCert?.expiresAt && new Date(resultCert.expiresAt) < new Date();
                    return (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                            {result.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm font-medium text-slate-900">{result.userName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                        {result.userDepartment || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                        {result.quizTitle}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-full ${
                          result.trainingType === 'Video training'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {result.trainingType || 'Quiz'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                        {result.correctAnswers}/{result.totalQuestions}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{result.score}%</span>
                          <div className="w-16 rounded-full bg-slate-200 h-2">
                            <div
                              className={`h-2 rounded-full ${
                                result.score >= 70 ? 'bg-emerald-500' : result.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${result.score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {result.score >= (result.passPercentage || 60) ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                          <span className={`text-sm font-semibold ${
                            result.score >= (result.passPercentage || 60) ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {result.score >= (result.passPercentage || 60) ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                        {Math.round(result.timeTaken / 60)}m {result.timeTaken % 60}s
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        {new Date(result.completedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {resultCert ? (
                          <div className="flex items-center gap-2">
                            <Award className={`w-5 h-5 ${isCertExpired ? 'text-gray-400' : 'text-yellow-500'}`} />
                            <span className={`text-xs font-semibold ${isCertExpired ? 'text-gray-500' : 'text-yellow-600'}`}>
                              {isCertExpired ? 'Expired' : 'Issued'}
                            </span>
                            <button
                              onClick={() => handleViewCertificate(resultCert)}
                              className="ml-1 text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              View
                            </button>
                          </div>
                        ) : result.score >= (result.passPercentage || 70) ? (
                          <button
                            onClick={() => handleIssueCertificate(result)}
                            className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-green-700 text-xs font-semibold transition hover:bg-green-100"
                          >
                            <Award className="w-3 h-3" />
                            Issue
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(result)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Quiz Result Details</h2>
                <p className="text-blue-100 text-sm mt-1">{selectedResult.userName} - {selectedResult.quizTitle}</p>
              </div>
              <button
                onClick={closeDetailModal}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Score</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedResult.score}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Correct</p>
                  <p className="text-2xl font-bold text-green-600">{selectedResult.correctAnswers}/{selectedResult.totalQuestions}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Time Taken</p>
                  <p className="text-2xl font-bold text-purple-600">{Math.round(selectedResult.timeTaken / 60)}m {selectedResult.timeTaken % 60}s</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-lg font-bold text-gray-700">{new Date(selectedResult.completedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Questions Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Question-by-Question Breakdown</h3>
                {selectedResult.questions && selectedResult.questions.map((question, index) => {
                  const userAnswer = selectedResult.answers[index];
                  const isCorrect = checkAnswerCorrect(question, userAnswer);
                  const qType = question.type || QUESTION_TYPES.MULTIPLE_CHOICE;
                  const isOptionType = qType === QUESTION_TYPES.MULTIPLE_CHOICE || qType === QUESTION_TYPES.TRUE_FALSE;
                  const options = question.displayOptions || question.options || [];

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                            isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{question.question}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Type: {qType === QUESTION_TYPES.TRUE_FALSE ? 'True/False' : qType === QUESTION_TYPES.FILL_IN_BLANK ? 'Fill in the Blank' : qType === QUESTION_TYPES.NPS_SCALE ? 'NPS Scale' : 'Multiple Choice'}
                            </p>
                          </div>
                        </div>
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                        )}
                      </div>

                      <div className="ml-11 space-y-2">
                        {isOptionType ? (
                          options.map((option, optIndex) => {
                            const isUserAnswer = userAnswer === optIndex;
                            const isCorrectAnswer = question.correctAnswer === optIndex;

                            let optionClass = 'border-gray-200 bg-white';
                            let statusIcon = null;

                            if (isUserAnswer && isCorrectAnswer) {
                              optionClass = 'border-green-500 bg-green-100';
                              statusIcon = <CheckCircle className="w-4 h-4 text-green-600 ml-2" />;
                            } else if (isUserAnswer && !isCorrectAnswer) {
                              optionClass = 'border-red-500 bg-red-100';
                              statusIcon = <XCircle className="w-4 h-4 text-red-600 ml-2" />;
                            } else if (isCorrectAnswer && !isUserAnswer) {
                              optionClass = 'border-green-300 bg-green-50';
                              statusIcon = <CheckCircle className="w-4 h-4 text-green-400 ml-2" />;
                            }

                            return (
                              <div
                                key={optIndex}
                                className={`flex items-center p-3 border rounded-lg ${optionClass}`}
                              >
                                <span className="text-sm text-gray-700">{option}</span>
                                {statusIcon}
                              </div>
                            );
                          })
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center p-3 border border-gray-200 bg-white rounded-lg">
                              <span className="text-sm text-gray-600 mr-2">User answer:</span>
                              <span className="text-sm font-medium text-gray-900">{formatAnswerText(question, userAnswer)}</span>
                            </div>
                            <div className="flex items-center p-3 border border-green-200 bg-green-50 rounded-lg">
                              <span className="text-sm text-gray-600 mr-2">Correct answer:</span>
                              <span className="text-sm font-medium text-gray-900">{formatCorrectAnswerText(question)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificates View Modal */}
      {showCertificatesView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Award className="w-6 h-6 text-yellow-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">All Certificates</h2>
                <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {filteredCertificates.length} issued
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={certSearchTerm}
                  onChange={(e) => setCertSearchTerm(e.target.value)}
                  placeholder="Search by certificate number, name, or training"
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm w-72 focus:border-blue-500 focus:ring-blue-200 focus:outline-none"
                />
                <button
                  onClick={() => setShowCertificatesView(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {filteredCertificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCertificates.map((cert) => {
                    const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date();
                    return (
                      <div
                        key={cert.id}
                        className={`bg-gradient-to-br rounded-lg shadow-md overflow-hidden ${isExpired ? 'from-gray-100 to-gray-200' : 'from-yellow-50 to-amber-100 border-2 border-yellow-400'}`}
                      >
                        <div className="p-5">
                          <div className="mb-2">
                            <p className="font-mono text-sm font-semibold text-blue-900 bg-blue-50 px-2 py-1 rounded">
                              {cert.certificateNumber || cert.id}
                            </p>
                          </div>
                          <div className="flex items-center mb-3">
                            <Award className={`w-8 h-8 mr-2 ${isExpired ? 'text-gray-500' : 'text-yellow-600'}`} />
                            <div>
                              <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
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
                              </h3>
                              <p className="text-xs text-gray-500">{cert.trainingType}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-sm mb-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Recipient:</span>
                              <span className="font-medium">{cert.userName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Department:</span>
                              <span className="font-medium">{cert.userDepartment || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Score:</span>
                              <span className="font-semibold text-green-600">
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
                                  return result?.score ?? cert.score ?? 0;
                                })()}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Issued:</span>
                              <span className="font-medium">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className={`font-semibold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                                {isExpired ? 'Expired' : 'Valid'}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewCertificate(cert)}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => handleShareCertificate(cert)}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                            >
                              <Share2 className="w-4 h-4 mr-1" />
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {certSearchTerm ? 'No Certificates Found' : 'No Certificates Issued'}
                  </h3>
                  <p className="text-gray-600">
                    {certSearchTerm ? 'Try adjusting your search criteria.' : 'No certificates have been issued yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Detail Modal */}
      {selectedCertificate && !showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:bg-white print:static print:p-0 print:z-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden print:shadow-none print:max-w-none print:max-h-none print:h-auto print:w-full print:rounded-none">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 print:hidden">
              <h2 className="text-xl font-semibold text-gray-900">Certificate Details</h2>
              <button
                onClick={closeCertificateView}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-400 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <Award className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {(() => {
                      const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
                      const certIssuedAt = new Date(selectedCertificate.issuedAt).getTime();
                      let result = results.find(r => r.id === selectedCertificate.resultId);
                      if (!result) {
                        const matchingResults = results
                          .filter(r => r.quizId === selectedCertificate.quizId && r.userId === selectedCertificate.userId && (r.score ?? 0) >= (r.passPercentage ?? 70))
                          .sort((a, b) => {
                            const aDiff = Math.abs(new Date(a.completedAt).getTime() - certIssuedAt);
                            const bDiff = Math.abs(new Date(b.completedAt).getTime() - certIssuedAt);
                            return aDiff - bDiff;
                          });
                        result = matchingResults[0];
                      }
                      return result?.quizTitle || selectedCertificate.quizTitle || 'Unknown Training';
                    })()}
                  </h3>
                  <p className="text-gray-600">{selectedCertificate.trainingType}</p>
                  <p className="font-mono text-sm font-semibold text-blue-900 bg-blue-50 px-3 py-1 rounded mt-3 inline-block">
                    Cert No: {selectedCertificate.certificateNumber || selectedCertificate.id}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Recipient</p>
                    <p className="font-semibold text-gray-900">{selectedCertificate.userName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-semibold text-gray-900">{selectedCertificate.userDepartment || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Score Achieved</p>
                    {(() => {
                      // Look up result to get actual score - match by resultId or by completion time close to certificate issue time
                      const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
                      const certIssuedAt = new Date(selectedCertificate.issuedAt).getTime();
                      let result = results.find(r => r.id === selectedCertificate.resultId);
                      if (!result) {
                        const matchingResults = results
                          .filter(r => r.quizId === selectedCertificate.quizId && r.userId === selectedCertificate.userId && (r.score ?? 0) >= (r.passPercentage ?? 70))
                          .sort((a, b) => {
                            // Prefer result completed closest to certificate issue time
                            const aTime = new Date(a.completedAt).getTime();
                            const bTime = new Date(b.completedAt).getTime();
                            const aDiff = Math.abs(aTime - certIssuedAt);
                            const bDiff = Math.abs(bTime - certIssuedAt);
                            return aDiff - bDiff;
                          });
                        result = matchingResults[0];
                      }
                      const displayScore = result?.score ?? selectedCertificate.score ?? 0;
                      return (
                        <>
                          <p className="font-semibold text-green-600 text-xl">{displayScore}%</p>
                          <p className="text-xs text-gray-500">Pass: {selectedCertificate.passPercentage}%</p>
                        </>
                      );
                    })()}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`font-semibold ${selectedCertificate.expiresAt && new Date(selectedCertificate.expiresAt) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedCertificate.expiresAt && new Date(selectedCertificate.expiresAt) < new Date() ? 'Expired' : 'Valid'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Issued On</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedCertificate.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Valid Until</p>
                    <p className="font-semibold text-gray-900">
                      {selectedCertificate.expiresAt 
                        ? new Date(selectedCertificate.expiresAt).toLocaleDateString()
                        : 'No Expiry'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Certificate ID</p>
                  <p className="font-mono text-sm text-gray-900">{selectedCertificate.id}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Organization</p>
                  <p className="font-semibold text-gray-900">{selectedCertificate.organizationName}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => navigate(`/certificate/${selectedCertificate.id}`)}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  View Full Certificate
                </button>
                <button
                  onClick={() => handleShareCertificate(selectedCertificate)}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition print:hidden"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Certificate Modal */}
      {showShareModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Share2 className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Share Certificate</h2>
              </div>
              <button
                onClick={closeShareModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  Sharing: <strong>
                    {(() => {
                      const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
                      const certIssuedAt = new Date(selectedCertificate.issuedAt).getTime();
                      let result = results.find(r => r.id === selectedCertificate.resultId);
                      if (!result) {
                        const matchingResults = results
                          .filter(r => r.quizId === selectedCertificate.quizId && r.userId === selectedCertificate.userId && (r.score ?? 0) >= (r.passPercentage ?? 70))
                          .sort((a, b) => {
                            const aDiff = Math.abs(new Date(a.completedAt).getTime() - certIssuedAt);
                            const bDiff = Math.abs(new Date(b.completedAt).getTime() - certIssuedAt);
                            return aDiff - bDiff;
                          });
                        result = matchingResults[0];
                      }
                      return result?.quizTitle || selectedCertificate.quizTitle || 'Unknown Training';
                    })()}
                  </strong>
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Issued to: {selectedCertificate.userName} ({selectedCertificate.score}%)
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={shareSearchTerm}
                    onChange={(e) => setShareSearchTerm(e.target.value)}
                    placeholder="Search by name or department..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-64 border rounded-lg">
                {users
                  .filter(u => 
                    u.name.toLowerCase().includes(shareSearchTerm.toLowerCase()) ||
                    (u.department && u.department.toLowerCase().includes(shareSearchTerm.toLowerCase()))
                  )
                  .map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600 mr-3">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.department || 'No department'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => shareCertificateWithUser(user.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                      >
                        Share
                      </button>
                    </div>
                  ))}
              </div>

              {users.filter(u => 
                u.name.toLowerCase().includes(shareSearchTerm.toLowerCase()) ||
                (u.department && u.department.toLowerCase().includes(shareSearchTerm.toLowerCase()))
              ).length === 0 && (
                <p className="text-center text-gray-500 py-4">No users found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
