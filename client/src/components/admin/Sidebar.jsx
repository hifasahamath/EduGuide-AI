import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard, BookOpen, HelpCircle, BrainCircuit,
  Users, MessageSquare, BarChart3, UserCircle, LogOut, Sparkles, Shield,
  Sun, Moon, CreditCard
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const links = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} />, exact: true },
    { name: 'Manage Courses', path: '/admin/courses', icon: <BookOpen size={18} /> },
    { name: 'Manage FAQ', path: '/admin/faq', icon: <HelpCircle size={18} /> },
    { name: 'Train Chatbot', path: '/admin/training', icon: <BrainCircuit size={18} />, badge: 'AI' },
    { name: 'Users', path: '/admin/users', icon: <Users size={18} /> },
    { name: 'Chat History', path: '/admin/history', icon: <MessageSquare size={18} /> },
    { name: 'Subscription Plans', path: '/admin/subscriptions', icon: <CreditCard size={18} /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={18} /> },
    { name: 'Profile', path: '/admin/profile', icon: <UserCircle size={18} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (link) => link.exact
    ? location.pathname === link.path
    : location.pathname.startsWith(link.path);

  const bg = isDark ? 'bg-[#070b14] text-slate-100 border-slate-800' : 'bg-slate-200/90 text-slate-900 border-slate-300';
  const borderColor = isDark ? 'border-slate-800' : 'border-slate-300';
  const textMuted = isDark ? 'text-slate-300' : 'text-slate-700';

  return (
    <div className={`w-64 min-h-screen ${bg} flex flex-col border-r flex-shrink-0 transition-colors duration-300 select-none font-sans`}>
      {/* Logo */}
      <div className={`p-5 border-b ${borderColor}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className={`text-sm font-extrabold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>EduGuide AI</h2>
            <p className="text-[10px] text-indigo-500 font-bold tracking-wide uppercase mt-1 flex items-center gap-1">
              <Shield size={10} /> Admin Workspace
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Navigation</p>
        {links.map((link) => {
          const active = isActive(link);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-bold ${
                active
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  : 'text-slate-700 hover:bg-slate-300/80 hover:text-slate-900'
              }`}
            >
              <span className={`flex-shrink-0 ${active ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {link.icon}
              </span>
              <span className="flex-1 truncate">{link.name}</span>
              {link.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                  active ? 'bg-indigo-700 text-white' : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Strip */}
      <div className={`p-3 border-t ${borderColor} space-y-2`}>
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-bold ${
            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-300 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
            <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
          </div>
        </button>

        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${borderColor} ${
          isDark ? 'bg-slate-900/60' : 'bg-white/80 shadow-xs'
        }`}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-extrabold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{user?.name || 'Admin'}</p>
            <p className={`text-[10px] font-semibold truncate ${textMuted}`}>{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors text-xs font-bold border border-rose-500/20`}
        >
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
