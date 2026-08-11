import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard, BookOpen, HelpCircle, BrainCircuit,
  Users, MessageSquare, BarChart3, UserCircle, LogOut, Sparkles, Shield,
  Sun, Moon
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const links = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={17} />, exact: true },
    { name: 'Manage Courses', path: '/admin/courses', icon: <BookOpen size={17} /> },
    { name: 'Manage FAQ', path: '/admin/faq', icon: <HelpCircle size={17} /> },
    { name: 'Train Chatbot', path: '/admin/training', icon: <BrainCircuit size={17} />, badge: 'AI' },
    { name: 'Users', path: '/admin/users', icon: <Users size={17} /> },
    { name: 'Chat History', path: '/admin/history', icon: <MessageSquare size={17} /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={17} /> },
    { name: 'Profile', path: '/admin/profile', icon: <UserCircle size={17} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (link) => link.exact
    ? location.pathname === link.path
    : location.pathname.startsWith(link.path);

  return (
    <div className="w-64 min-h-screen bg-[#0f0f1a] text-white flex flex-col border-r border-white/5 flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none">EduGuide AI</h2>
            <p className="text-[10px] text-violet-400 font-medium mt-0.5 flex items-center gap-1">
              <Shield size={9} /> Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] text-gray-600 font-semibold uppercase tracking-widest px-3 py-2">Menu</p>
        {links.map((link) => {
          const active = isActive(link);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group ${
                active
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20 shadow-sm'
                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <span className={`flex-shrink-0 ${active ? 'text-violet-400' : 'text-gray-600 group-hover:text-gray-300'}`}>
                {link.icon}
              </span>
              <span className={`font-medium ${active ? 'text-white' : ''}`}>{link.name}</span>
              {link.badge && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-bold">
                  {link.badge}
                </span>
              )}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User Strip */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon size={14} className="text-violet-400" /> : <Sun size={14} className="text-amber-400" />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div className={`w-7 h-4 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-violet-600' : 'bg-gray-600'}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </div>
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-200 truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
        >
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
