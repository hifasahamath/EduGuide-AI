import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Clock, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-xl text-indigo-900 tracking-tight">EduGuide AI</span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                location.pathname === '/' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <MessageCircle size={18} /> <span className="hidden sm:inline">Chat</span>
            </Link>
            
            <Link 
              to="/history" 
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                location.pathname === '/history' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Clock size={18} /> <span className="hidden sm:inline">History</span>
            </Link>

            <Link 
              to="/profile" 
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                location.pathname === '/profile' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <User size={18} /> <span className="hidden sm:inline">Profile</span>
            </Link>

            <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

            <button 
              onClick={logout}
              className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              title="Logout"
            >
              <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
