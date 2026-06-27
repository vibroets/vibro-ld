import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, BarChart3, LogOut, Home, Cloud, Upload } from 'lucide-react';
import Sidebar from './Sidebar';
import { pushLocalDataToCloud, isFirebaseConfigured } from '../services/dataSync';
import DataManager from '../services/dataManager';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    totalVideos: 0,
    activeAssessments: 0
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      navigate('/login');
    }
    
    // Load initial stats from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const videos = JSON.parse(localStorage.getItem('videos') || '[]');
    
    setStats({
      totalUsers: users.length,
      totalQuizzes: quizzes.length,
      totalVideos: videos.length,
      activeAssessments: quizzes.filter(q => q.isActive).length
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentAdmin');
    navigate('/login');
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('Syncing...');
    const success = await pushLocalDataToCloud();
    setSyncing(false);
    setSyncStatus(success ? 'Synced successfully!' : 'Sync failed');
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const handleSupabaseSync = async () => {
    setSyncing(true);
    setSyncStatus('Syncing to Supabase...');
    let errors = 0;
    let pushed = 0;
    try {
      const { supabase } = await import('../supabaseConfig');

      // Helper: upsert with data JSONB, fallback to id-only if column missing
      const upsertRow = async (table, row) => {
        const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
        return !error;
      };

      // Sync training schedules
      const trainings = JSON.parse(localStorage.getItem('trainingSchedules') || '[]');
      const trainingsArr = Array.isArray(trainings) ? trainings : [];
      for (const t of trainingsArr) {
        const ok = await upsertRow('training_schedules', {
          id: t.id, title: t.title, status: t.status,
          created_at: t.createdAt || new Date().toISOString(),
          updated_at: t.updatedAt || new Date().toISOString()
        });
        ok ? pushed++ : errors++;
      }

      // Sync users — only columns that exist in Supabase users table
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const allUsersArr = Array.isArray(allUsers) ? allUsers : [];
      for (const u of allUsersArr) {
        const ok = await upsertRow('users', {
          id: u.id, name: u.name, email: u.email, phone: u.phone
        });
        ok ? pushed++ : errors++;
      }

      // Sync quizzes
      const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      const quizzesArr = Array.isArray(quizzes) ? quizzes : [];
      for (const q of quizzesArr) {
        const ok = await upsertRow('quizzes', {
          id: q.id, title: q.title,
          created_at: q.createdAt || new Date().toISOString()
        });
        ok ? pushed++ : errors++;
      }

      // Sync videos
      const videos = JSON.parse(localStorage.getItem('videos') || '[]');
      const videosArr = Array.isArray(videos) ? videos : [];
      for (const v of videosArr) {
        const ok = await upsertRow('videos', {
          id: v.id, title: v.title,
          created_at: v.createdAt || new Date().toISOString()
        });
        ok ? pushed++ : errors++;
      }

      setSyncStatus(errors > 0 ? `Done with ${errors} errors (${pushed} synced)` : `✅ Synced ${pushed} records to Supabase!`);
    } catch (e) {
      setSyncStatus('Supabase sync failed: ' + e.message);
    }
    setSyncing(false);
    setTimeout(() => setSyncStatus(''), 6000);
  };

  
  const currentUser = JSON.parse(localStorage.getItem('currentAdmin') || 'null');
  
  // Get the user from users array to get the most up-to-date info
  const usersRaw = JSON.parse(localStorage.getItem('users') || '[]');
  const users = Array.isArray(usersRaw) ? usersRaw : [];
  const fullUser = users.find(u => u.id === currentUser?.id);
  const displayUser = fullUser || currentUser;

  const menuItems = [
    {
      title: 'User Module',
      description: 'Create and manage users',
      icon: Users,
      color: 'bg-blue-500',
      path: '/users'
    },
    {
      title: 'L&T Module',
      description: 'Upload questions and videos',
      icon: BookOpen,
      color: 'bg-green-500',
      path: '/lt-module'
    },
    {
      title: 'Admin Dashboard',
      description: 'View results and analytics',
      icon: BarChart3,
      color: 'bg-purple-500',
      path: '/admin-dashboard'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
          <Sidebar currentUser={currentUser} onCloseMobile={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar - always rendered but conditionally visible */}
      <div className="hidden lg:block">
        <Sidebar currentUser={displayUser} />
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Home className="w-6 h-6 text-gray-600 hidden sm:block" />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                {displayUser ? (
                  <>
                    <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                      Welcome, {displayUser.name} ({displayUser.isSuperAdmin ? 'Super Admin' : displayUser.designation ? displayUser.designation.charAt(0).toUpperCase() + displayUser.designation.slice(1) : 'Admin'})
                    </span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
                    >
                      <LogOut className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">Welcome, Admin</span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
                    >
                      <LogOut className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2 sm:p-3">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-2 sm:p-3">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Quizzes</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.totalQuizzes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-2 sm:p-3">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Videos</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.totalVideos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-lg p-2 sm:p-3">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Assessments</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.activeAssessments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-4 sm:p-6 text-left group"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${item.color} rounded-lg flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{item.description}</p>
                <div className="mt-3 sm:mt-4 text-blue-600 text-xs sm:text-sm font-medium group-hover:text-blue-700">
                  Access Module →
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/users')}
              className="px-3 sm:px-4 py-2 sm:py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition duration-200 text-xs sm:text-sm font-medium"
            >
              Add New User
            </button>
            <button
              onClick={() => navigate('/lt-module')}
              className="px-3 sm:px-4 py-2 sm:py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition duration-200 text-xs sm:text-sm font-medium"
            >
              Create Quiz
            </button>
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="px-3 sm:px-4 py-2 sm:py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition duration-200 text-xs sm:text-sm font-medium"
            >
              View Results
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSupabaseSync}
              disabled={syncing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium disabled:opacity-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              {syncing ? 'Syncing...' : 'Sync All to Supabase'}
            </button>
            {isFirebaseConfigured && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition duration-200 text-sm font-medium disabled:opacity-50"
              >
                <Cloud className="w-4 h-4 mr-2" />
                {syncing ? 'Syncing...' : 'Sync to Cloud'}
              </button>
            )}
            {syncStatus && (
              <span className={`text-sm font-medium ${syncStatus.includes('failed') || syncStatus.includes('errors') ? 'text-red-600' : 'text-green-600'}`}>
                {syncStatus}
              </span>
            )}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
};

export default Dashboard;
