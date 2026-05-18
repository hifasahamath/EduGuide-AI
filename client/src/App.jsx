import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Client Imports
import UserProfile from './pages/UserProfile';
import ChatGPTLayout from './components/chatgpt/ChatGPTLayout';
import Settings from './pages/Settings';

// Admin Imports
import Sidebar from './components/admin/Sidebar';
import Dashboard from './pages/admin/Dashboard';
import Courses from './pages/admin/Courses';
import FAQ from './pages/admin/FAQ';
import Training from './pages/admin/Training';
import Users from './pages/admin/Users';
import AdminChatHistory from './pages/admin/ChatHistory';
import Analytics from './pages/admin/Analytics';
import AdminProfile from './pages/admin/Profile';

// Shared
import Login from './pages/Login';
import Register from './pages/Register';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Support both 'client' and 'student' roles for the chat interface
  const isClient = user.role === 'client' || user.role === 'student';
  if (allowedRole === 'client' && !isClient) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/chat'} replace />;
  }
  if (allowedRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/chat" replace />;
  }
  return children;
};

const AdminLayout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div className="flex h-screen bg-[#f4f4f8] font-sans text-left">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-8 py-3.5 flex justify-between items-center border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-gray-500 font-medium">System Online</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.name || 'Administrator'}</p>
              <p className="text-[11px] text-gray-400">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200">
              <span className="text-white text-sm font-bold">{user?.name?.[0]?.toUpperCase() || 'A'}</span>
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
