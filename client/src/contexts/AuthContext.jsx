import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // true during the initial session check on page load
  const [loading, setLoading] = useState(true);
  // true once the profile row from database has finished loading
  const [profileLoaded, setProfileLoaded] = useState(false);

  /**
   * Fetches the user's profile row from the profiles table.
   * Uses direct Supabase query first, with fallback to Express server API (service_role)
   * if client RLS fails or is blocked.
   */
  const fetchProfile = useCallback(async (userId) => {
    try {
      // 1. Try direct Supabase query first
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        setProfileLoaded(true);
        return data;
      }

      if (error) {
        console.warn('[Auth] Direct Supabase profile fetch failed, using Express API fallback:', error.message);
      }

      // 2. Fallback to Express backend server API (which uses service_role key to bypass RLS)
      const res = await api.get(`/auth/profile/${userId}`);
      if (res.data) {
        setProfile(res.data);
        setProfileLoaded(true);
        return res.data;
      }

      setProfile(null);
      setProfileLoaded(true);
      return null;
    } catch (err) {
      console.error('[Auth] Profile fetch failed:', err.message);
      setProfile(null);
      setProfileLoaded(true);
      return null;
    }
  }, []);

  // Listen for Supabase auth events (login, logout, token refresh)
  useEffect(() => {
    let isMounted = true;

    // Check if there's already an active session (e.g. page refresh)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setProfileLoaded(true);
      }

      if (isMounted) setLoading(false);
    });

    // This fires on login, logout, and token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setProfileLoaded(true);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * Login with email + password.
   * Supabase handles JWT creation. We fetch profile directly from DB,
   * update state, and return role for instant redirection.
   */
  const login = async (email, password) => {
    try {
      setProfileLoaded(false);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setProfileLoaded(true);
        return { success: false, error: error.message };
      }

      setUser(data.user);
      
      // Fetch authoritative profile row from database
      const prof = await fetchProfile(data.user.id);

      const userRole = prof?.role || data.user.user_metadata?.role || 'user';
      return { success: true, role: userRole, user: data.user, profile: prof };
    } catch (err) {
      setProfileLoaded(true);
      return { success: false, error: err.message };
    }
  };

  /**
   * Register a new user account.
   * Email confirmation is turned off, so the user can login right away.
   * The DB trigger (handle_new_user) auto-creates the profile row.
   * As a safety net, we also try to insert the profile ourselves.
   */
  const register = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name, role: 'user' }
        }
      });
      if (error) return { success: false, error: error.message };

      // Safety net: if the DB trigger didn't fire (or was slow),
      // try to insert the profile row ourselves. If it already exists,
      // the unique constraint on id will make this a no-op.
      if (data.user) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email,
            display_name: name,
            role: 'user'
          }, { onConflict: 'id' });

        if (profileErr) {
          console.warn('[Auth] Profile upsert after register:', profileErr.message);
          // Not fatal — the trigger probably handled it
        }
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Sign out and clear all local state.
   */
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  /**
   * Update the profile object in memory without re-fetching from DB.
   * Useful after the user edits their name, avatar, etc.
   */
  const updateSessionProfile = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  // Show a loading spinner during the initial session check.
  // After that the app renders normally and ProtectedRoute handles gating.
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f1a' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoaded, login, register, logout, updateSessionProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
