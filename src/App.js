import React, { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminLogin from './components/Admin/AdminLogin';
import Dashboard from './components/Dashboard';
import UserModule from './components/Users/UserModule';
import LTModule from './components/LTModule';
import UserQuiz from './components/Users/UserQuiz';
import TrainingViewer from './components/TrainingViewer';
import AdminDashboard from './components/Admin/AdminDashboard';
import UserLogin from './components/Users/UserLogin';
import UserDashboard from './components/Users/UserDashboard';
import Certificate from './components/Certificate';
import DraftsModule from './components/Admin/DraftsModule';
import PasswordReset from './components/Users/PasswordReset';
import TrainingCalendar from './components/Admin/TrainingCalendar';
import TrainerManagement from './components/Admin/TrainerManagement';
import VenueManagement from './components/Admin/VenueManagement';
import ParticipantEnrollment from './components/Admin/ParticipantEnrollment';
import ApprovalWorkflow from './components/Admin/ApprovalWorkflow';
import NotificationSystem from './components/Admin/NotificationSystem';
import AttendanceManagement from './components/Admin/AttendanceManagement';
import Analytics from './components/Admin/Analytics';
import CalendarIntegrations from './components/Admin/CalendarIntegrations';
import UserTrainingCalendar from './components/Users/UserTrainingCalendar';
import { setupAutoSync, setupUserAutoSync, setSyncStatusCallback, pullAndMergeKeyFromCloud, isFirebaseConfigured } from './services/dataSync';

function App() {
  const isUserMode = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('appMode') === 'user';
  const Router = isUserMode ? HashRouter : BrowserRouter;
  const [synced, setSynced] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    if (isUserMode && isFirebaseConfigured) {
      // Set up sync status callback for UI indicator
      setSyncStatusCallback((status) => {
        setSyncStatus(status);
        if (status === 'synced' || status === 'offline') {
          setSynced(true);
        }
        if (status === 'error') {
          setSynced(true);
        }
      });

      // Mobile app: set up offline-first auto-sync
      // This handles initial pull, periodic sync, online/offline detection,
      // and debounced push when user generates data (quiz results, certificates)
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser) {
        setupUserAutoSync(currentUser.id);
        // Mark as synced after a short delay so app loads even if initial sync is slow
        setTimeout(() => setSynced(true), 3000);
      } else {
        // No user logged in yet - still need to pull admin data (users, quizzes, etc.)
        // so the login page can find users from cloud
        const pullInitialData = async () => {
          try {
            // Pull admin-only keys (users, quizzes, videos, trainingItems)
            await pullAndMergeKeyFromCloud('users', null);
            await pullAndMergeKeyFromCloud('quizzes', null);
            await pullAndMergeKeyFromCloud('videos', null);
            await pullAndMergeKeyFromCloud('trainingItems', null);
            setSynced(true);
          } catch (err) {
            setSynced(true); // Still show login page with whatever data is available
          }
        };
        pullInitialData();
        // Fallback timeout to ensure login page loads even if sync hangs
        setTimeout(() => setSynced(true), 5000);
      }
    } else if (!isUserMode && isFirebaseConfigured) {
      // Web admin: auto-sync on localStorage changes + periodic pull of mobile submissions
      setupAutoSync();
    } else {
      setSynced(true);
    }
  }, [isUserMode]);

  if (isUserMode && isFirebaseConfigured && !synced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600 mb-2">Vibro User</div>
          <div className="text-gray-500">Syncing data...</div>
        </div>
      </div>
    );
  }

  // Floating sync indicator - fixed position, no layout shift
  const syncIndicator = isUserMode ? (
    <div className="fixed top-3 right-3 z-[60] pointer-events-none">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium shadow-md transition-all duration-300 ${
          syncStatus === 'syncing'
            ? 'bg-blue-500 text-white'
            : syncStatus === 'offline'
            ? 'bg-amber-500 text-white'
            : syncStatus === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-white opacity-70'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            syncStatus === 'syncing'
              ? 'bg-white animate-ping'
              : syncStatus === 'offline'
              ? 'bg-white'
              : syncStatus === 'error'
              ? 'bg-white'
              : 'bg-white'
          }`}
        ></span>
        <span>
          {syncStatus === 'syncing'
            ? 'Syncing'
            : syncStatus === 'offline'
            ? 'Offline'
            : syncStatus === 'error'
            ? 'Sync Error'
            : 'Synced'}
        </span>
      </div>
    </div>
  ) : null;

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {syncIndicator}
        <Routes>
          {isUserMode ? (
            <>
              <Route path="/user-login" element={<UserLogin />} />
              <Route path="/password-reset" element={<PasswordReset />} />
              <Route path="/user-dashboard" element={<UserDashboard />} />
              <Route path="/user-dashboard/quizzes" element={<UserDashboard />} />
              <Route path="/user-training-calendar" element={<UserTrainingCalendar />} />
              <Route path="/training/:trainingId" element={<TrainingViewer />} />
              <Route path="/quiz/:quizId" element={<UserQuiz />} />
              <Route path="/certificate/:certificateId" element={<Certificate />} />
              <Route path="/" element={<Navigate to="/user-dashboard" replace />} />
              <Route path="*" element={<Navigate to="/user-dashboard" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/user-login" element={<UserLogin />} />
              <Route path="/password-reset" element={<PasswordReset />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/user-dashboard" element={<UserDashboard />} />
              <Route path="/user-dashboard/quizzes" element={<UserDashboard />} />
              <Route path="/user-training-calendar" element={<UserTrainingCalendar />} />
              <Route path="/users" element={<UserModule />} />
              <Route path="/lt-module" element={<LTModule />} />
              <Route path="/training-calendar" element={<TrainingCalendar />} />
              <Route path="/trainer-management" element={<TrainerManagement />} />
              <Route path="/venue-management" element={<VenueManagement />} />
              <Route path="/participant-enrollment" element={<ParticipantEnrollment />} />
              <Route path="/approval-workflow" element={<ApprovalWorkflow />} />
              <Route path="/notification-system" element={<NotificationSystem />} />
              <Route path="/attendance-management" element={<AttendanceManagement />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/calendar-integrations" element={<CalendarIntegrations />} />
              <Route path="/drafts" element={<DraftsModule />} />
              <Route path="/training/:trainingId" element={<TrainingViewer />} />
              <Route path="/quiz/:quizId" element={<UserQuiz />} />
              <Route path="/certificate/:certificateId" element={<Certificate />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
