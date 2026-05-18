import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('eduguide_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load session:', e);
      localStorage.removeItem('eduguide_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('eduguide_user', JSON.stringify(data.user));
        // Normalize 'student' role to 'client' for routing
        const routeRole = (data.user.role === 'student') ? 'client' : data.user.role;
        return { success: true, role: routeRole };
      } else {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Could not connect to server. Is the backend running?' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eduguide_user');
  };

  const updateSessionProfile = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('eduguide_user', JSON.stringify(newUser));
  };

  // Show a minimal loader instead of null so the DOM is never empty
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f1a'
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid rgba(139,92,246,0.3)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateSessionProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
