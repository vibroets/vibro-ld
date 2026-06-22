import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Award, LogOut, Calendar } from 'lucide-react';

const MobileNav = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/user-dashboard') {
      return location.pathname === '/user-dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const items = [
    { icon: Home, label: 'Home', path: '/user-dashboard' },
    { icon: BookOpen, label: 'Training', path: '/user-dashboard/quizzes' },
    { icon: Calendar, label: 'Calendar', path: '/user-training-calendar' },
    { icon: Award, label: 'Certificates', action: 'certificates' },
  ];

  const handleClick = (item) => {
    if (item.action === 'certificates') {
      // Dispatch a custom event to switch to certificates tab
      window.dispatchEvent(new CustomEvent('switchTab', { detail: 'certificates' }));
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
        <div className="flex items-center justify-around h-16 safe-area-bottom">
          {items.map((item, index) => {
            const Icon = item.icon;
            const active = item.path ? isActive(item.path) : false;
            return (
              <button
                key={index}
                onClick={() => handleClick(item)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center flex-1 h-full text-red-500"
          >
            <LogOut className="w-5 h-5 mb-0.5" />
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
