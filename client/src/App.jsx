import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

// User pages
import UserProfile from './pages/UserProfile';
import ChatGPTLayout from './components/chatgpt/ChatGPTLayout';
import Settings from './pages/Settings';

// Admin pages
import Sidebar from './components/admin/Sidebar';
import Dashboard from './pages/admin/Dashboard';
import Courses from './pages/admin/Courses';
import FAQ from './pages/admin/FAQ';
import Training from './pages/admin/Training';
import Users from './pages/admin/Users';
import AdminChatHistory from './pages/admin/ChatHistory';
import Analytics from './pages/admin/Analytics';
import AdminProfile from './pages/admin/Profile';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

/**
 * ProtectedRoute guards pages by authentication and role.
 * 
 * Key design decisions:
 * - Uses profile.role from the database as the authoritative source
 * - Falls back to user_metadata.role (set during registration) if profile hasn't loaded
 * - Final fallback is 'user' which matches the DB CHECK constraint ('user' | 'admin')
 * - If user has no profile yet (e.g., profile fetch failed), they are treated as 'user'
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, profile, loading, profileLoaded } = useAuth();
  
  // Not authenticated — redirect to login
  if (!user) return <Navigate to="/login" replace />;
  
  // Session or profile is still loading from database — show spinner to prevent premature redirect
  if (loading || !profileLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f4f4f8' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  
  // DB profile is authoritative; fallback to user_metadata only if profile doesn't exist
  const role = profile?.role || user.user_metadata?.role || 'user';
  const isClient = role === 'user' || role === 'client' || role === 'student';
  
  // Role mismatch — redirect to correct area
  if (allowedRole === 'client' && !isClient) {
    return <Navigate to="/admin" replace />;
  }
  if (allowedRole === 'admin' && role !== 'admin') {
    return <Navigate to="/chat" replace />;
  }
  
  return children;
};

const AdminLayout = ({ children }) => {
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const name = profile?.display_name || user?.user_metadata?.display_name || 'Administrator';
  
  return (
    <div className={`flex h-screen font-sans text-left transition-colors duration-300 ${
      isDark ? 'bg-[#12121e] text-gray-100' : 'bg-[#f4f4f8] text-gray-900'
    }`}>
      <Sidebar />
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <header className={`sticky top-0 z-10 px-8 py-3.5 flex justify-between items-center border-b backdrop-blur-sm transition-colors duration-300 ${
          isDark 
            ? 'bg-[#1a1a2c]/90 border-white/10 text-gray-100 shadow-md' 
            : 'bg-white/80 border-gray-100 text-gray-800 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>System Online</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                isDark 
                  ? 'bg-white/10 border-white/15 text-gray-200 hover:bg-white/20' 
                  : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
              }`}
              title="Toggle theme"
            >
              {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-600" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <div className="text-right">
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{name}</p>
              <p className="text-[11px] text-gray-400">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200">
              <span className="text-white text-sm font-bold">{name[0]?.toUpperCase()}</span>
            </div>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Client/Student Routes — all inside ChatGPTLayout which has sidebar/nav */}
            <Route path="/chat" element={<ProtectedRoute allowedRole="client"><ChatGPTLayout page="chat" /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRole="client"><ChatGPTLayout page="profile" /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute allowedRole="client"><ChatGPTLayout page="history" /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRole="client"><ChatGPTLayout page="settings" /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Courses /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/faq" element={<ProtectedRoute allowedRole="admin"><AdminLayout><FAQ /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/training" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Training /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Users /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/history" element={<ProtectedRoute allowedRole="admin"><AdminLayout><AdminChatHistory /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRole="admin"><AdminLayout><Analytics /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute allowedRole="admin"><AdminLayout><AdminProfile /></AdminLayout></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
