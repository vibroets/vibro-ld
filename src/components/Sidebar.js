import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  LogOut, 
  Home, 
  UserCircle,
  X,
  Save,
  Calendar,
  Calendar as CalendarIcon,
  User as UserIcon,
  MapPin,
  CheckCircle,
  Bell,
  UserCheck,
  Link as LinkIcon
} from 'lucide-react';

const Sidebar = ({ currentUser, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin') || 'null');
  const sidebarRef = useRef(null);

  // Preserve scroll position across navigations
  useEffect(() => {
    const savedScrollPosition = localStorage.getItem('sidebarScrollPosition');
    if (savedScrollPosition && sidebarRef.current) {
      sidebarRef.current.scrollTop = parseInt(savedScrollPosition);
    }
  }, [location.pathname]);

  const handleNavigation = (path) => {
    // Save scroll position before navigation
    if (sidebarRef.current) {
      localStorage.setItem('sidebarScrollPosition', sidebarRef.current.scrollTop);
    }
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentAdmin');
    navigate('/login');
    if (onCloseMobile) onCloseMobile();
  };

  
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Determine if user is admin (super admin or regular admin)
  const isAdmin = currentAdmin && (currentAdmin.isAdmin || currentAdmin.isSuperAdmin);

  const adminMenuItems = [
    {
      title: 'Dashboard',
      description: 'Main dashboard',
      icon: Home,
      path: '/dashboard',
      color: 'text-gray-600',
      moduleKey: 'dashboard'
    },
    {
      title: 'User Module',
      description: 'Create and manage users',
      icon: Users,
      path: '/users',
      color: 'text-blue-600',
      moduleKey: 'userModule'
    },
    {
      title: 'L&T Module',
      description: 'Upload questions and videos',
      icon: BookOpen,
      path: '/lt-module',
      color: 'text-green-600',
      moduleKey: 'ltModule'
    },
    {
      title: 'Training Calendar',
      description: 'Schedule and manage trainings',
      icon: CalendarIcon,
      path: '/training-calendar',
      color: 'text-orange-600',
      moduleKey: 'trainingCalendar'
    },
    {
      title: 'Trainer Management',
      description: 'Manage trainers and availability',
      icon: UserIcon,
      path: '/trainer-management',
      color: 'text-teal-600',
      moduleKey: 'trainerManagement'
    },
    {
      title: 'Venue Management',
      description: 'Manage training venues',
      icon: MapPin,
      path: '/venue-management',
      color: 'text-rose-600',
      moduleKey: 'venueManagement'
    },
    {
      title: 'Participant Enrollment',
      description: 'Manage training enrollments',
      icon: Users,
      path: '/participant-enrollment',
      color: 'text-indigo-600',
      moduleKey: 'participantEnrollment'
    },
    {
      title: 'Approval Workflow',
      description: 'Manage approval requests',
      icon: CheckCircle,
      path: '/approval-workflow',
      color: 'text-emerald-600',
      moduleKey: 'approvalWorkflow'
    },
    {
      title: 'Training Analytics',
      description: 'View training analytics',
      icon: BarChart3,
      path: '/analytics',
      color: 'text-pink-600',
      moduleKey: 'analytics'
    },
    {
      title: 'Notifications',
      description: 'Configure notifications',
      icon: Bell,
      path: '/notification-system',
      color: 'text-cyan-600',
      moduleKey: 'notifications'
    },
    {
      title: 'Attendance',
      description: 'Manage attendance records',
      icon: UserCheck,
      path: '/attendance-management',
      color: 'text-violet-600',
      moduleKey: 'attendanceManagement'
    },
    {
      title: 'Calendar Integrations',
      description: 'Manage calendar sync',
      icon: LinkIcon,
      path: '/calendar-integrations',
      color: 'text-sky-600',
      moduleKey: 'calendarIntegrations'
    },
    {
      title: 'Drafts',
      description: 'Saved quiz, video and training drafts',
      icon: Save,
      path: '/drafts',
      color: 'text-amber-600',
      moduleKey: 'drafts'
    },
    {
      title: 'Admin Dashboard',
      description: 'View results and analytics',
      icon: BarChart3,
      path: '/admin-dashboard',
      color: 'text-purple-600',
      moduleKey: 'reports'
    }
  ];

  // Filter menu items based on module access
  // Only filter if moduleAccess has been explicitly configured (at least one key explicitly set to true)
  const hasModuleAccessConfig = currentAdmin && currentAdmin.moduleAccess &&
    Object.values(currentAdmin.moduleAccess).some(v => v === true);
  const filteredAdminMenuItems = currentAdmin && currentAdmin.isAdmin && !currentAdmin.isSuperAdmin && hasModuleAccessConfig
    ? adminMenuItems.filter(item => !item.moduleKey || currentAdmin.moduleAccess[item.moduleKey] === true || item.moduleKey === 'dashboard' || item.isHeader)
    : adminMenuItems;

  const userMenuItems = [
    {
      title: 'User Dashboard',
      description: 'Your personal dashboard',
      icon: UserCircle,
      path: '/user-dashboard',
      color: 'text-blue-600'
    },
    {
      title: 'My Quizzes',
      description: 'View assigned quizzes and training videos',
      icon: BookOpen,
      path: '/user-dashboard/quizzes',
      color: 'text-green-600'
    },
    {
      title: 'Training Calendar',
      description: 'View scheduled trainings and check in',
      icon: Calendar,
      path: '/user-training-calendar',
      color: 'text-purple-600'
    }
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <div ref={sidebarRef} className="hidden md:flex bg-white h-screen fixed left-0 top-0 overflow-y-auto z-30 w-64 shadow-xl border-r border-gray-200">
        <div className="p-6 w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-blue-600 tracking-tight">VIBRO</h1>
              <p className="text-xs text-gray-500 mt-1">Learning & Training</p>
            </div>
          </div>

          <div className="space-y-1">
            {isAdmin ? (
              <div>
                {filteredAdminMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleNavigation(item.path)}
                      className={`relative group w-full flex items-center p-3 rounded-xl transition-all duration-300 ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-600 hover:shadow-md'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive(item.path) ? 'text-white' : item.color}`} />
                      <div className="text-left ml-3">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className={`text-xs ${isActive(item.path) ? 'text-blue-100' : 'text-gray-500'}`}>{item.description}</p>
                      </div>
                      {isActive(item.path) && (
                        <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">User Menu</h3>
                {userMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleNavigation(item.path)}
                      className={`relative group w-full flex items-center p-3 rounded-xl transition-all duration-300 ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-600 hover:shadow-md'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive(item.path) ? 'text-white' : item.color}`} />
                      <div className="text-left ml-3">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className={`text-xs ${isActive(item.path) ? 'text-blue-100' : 'text-gray-500'}`}>{item.description}</p>
                      </div>
                      {isActive(item.path) && (
                        <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`relative group w-full flex items-center p-3 rounded-xl transition-all duration-300 text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-600 hover:shadow-md`}
            >
              <LogOut className="w-5 h-5" />
              <div className="text-left ml-3">
                <p className="text-sm font-semibold">Logout</p>
                <p className="text-xs text-gray-500">Sign out of system</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {onCloseMobile && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCloseMobile} />
          <div ref={sidebarRef} className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl overflow-y-auto border-r border-gray-200">
            <div className="p-6 w-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-blue-600 tracking-tight">VIBRO</h1>
                  <p className="text-xs text-gray-500 mt-1">Learning & Training</p>
                </div>
                <button
                  onClick={onCloseMobile}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {isAdmin ? (
                  <div>
                    {filteredAdminMenuItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => handleNavigation(item.path)}
                          className={`relative group w-full flex items-center p-3 rounded-xl transition-all duration-300 ${
                            isActive(item.path)
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                              : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-600 hover:shadow-md'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive(item.path) ? 'text-white' : item.color}`} />
                          <div className="text-left ml-3">
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className={`text-xs ${isActive(item.path) ? 'text-blue-100' : 'text-gray-500'}`}>{item.description}</p>
                          </div>
                          {isActive(item.path) && (
                            <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">User Menu</h3>
                    {userMenuItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => handleNavigation(item.path)}
                          className={`relative group w-full flex items-center p-3 rounded-xl transition-all duration-300 ${
                            isActive(item.path)
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                              : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-600 hover:shadow-md'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive(item.path) ? 'text-white' : item.color}`} />
                          <div className="text-left ml-3">
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className={`text-xs ${isActive(item.path) ? 'text-blue-100' : 'text-gray-500'}`}>{item.description}</p>
                          </div>
                          {isActive(item.path) && (
                            <div className="absolute right-3 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className={`relative group w-full flex items-center p-3 rounded-xl transition-all duration-300 text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-600 hover:shadow-md`}
                >
                  <LogOut className="w-5 h-5" />
                  <div className="text-left ml-3">
                    <p className="text-sm font-semibold">Logout</p>
                    <p className="text-xs text-gray-500">Sign out of system</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
