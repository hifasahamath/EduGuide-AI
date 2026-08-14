import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isGuest, setIsGuest] = useState(() => {
    return sessionStorage.getItem('eduguide_guest') === 'true';
  });

  // true during the initial session check on page load
  const [loading, setLoading] = useState(true);
  // true once the profile row from database has finished loading
  const [profileLoaded, setProfileLoaded] = useState(false);

  /**
   * Fetches the user's profile row from the profiles table.
   * Uses direct Supabase query first, with fallback to Express server API (service_role)
   * if client RLS fails or is blocked.
   */
  const fetchProfile = useCallback(async (userId, currentUser = null) => {
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
        console.warn('[Auth] Direct Supabase profile fetch failed, trying API:', error.message);
      }

      // 2. Fallback to Express backend server API
      try {
        const res = await api.get(`/auth/profile/${userId}`);
        if (res.data) {
          setProfile(res.data);
          setProfileLoaded(true);
          return res.data;
        }
      } catch (e) {
        // Express profile fallback empty, proceed to auto-provision
      }

      // 3. Auto-provision profile for Google OAuth / Social Login users
      const userMeta = currentUser?.user_metadata || {};
      const fallbackName = userMeta.full_name || userMeta.name || currentUser?.email?.split('@')[0] || 'User';
      
      const newProfile = {
        id: userId,
        email: currentUser?.email || '',
        display_name: fallbackName,
        role: 'user',
        created_at: new Date().toISOString()
      };

      const { data: createdData } = await supabase
        .from('profiles')
        .upsert([newProfile])
        .select()
        .maybeSingle();

      const finalProfile = createdData || newProfile;
      setProfile(finalProfile);
      setProfileLoaded(true);
      return finalProfile;
    } catch (err) {
      console.error('[Auth] Profile fetch failed:', err.message);
      setProfile({ id: userId, role: 'user' });
      setProfileLoaded(true);
      return null;
    }
  }, []);

  // Listen for Supabase auth events (login, logout, token refresh)
  useEffect(() => {
    let isMounted = true;

    // Check if there's already an active session (e.g. page refresh or OAuth redirect)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      if (session?.user) {
        setIsGuest(false);
        sessionStorage.removeItem('eduguide_guest');
        setUser(session.user);
        await fetchProfile(session.user.id, session.user);
      } else if (sessionStorage.getItem('eduguide_guest') === 'true') {
        setIsGuest(true);
        setUser({
          id: 'guest',
          email: 'guest@eduguide.ai',
          name: 'Guest Explorer',
          user_metadata: { display_name: 'Guest Explorer', role: 'user' },
          isGuest: true
        });
        setProfile({
          id: 'guest',
          role: 'user',
          display_name: 'Guest Explorer',
          isGuest: true
        });
        setProfileLoaded(true);
      } else {
        setProfileLoaded(true);
      }

      if (isMounted) setLoading(false);
    });

    // This fires on login, logout, OAuth callback, and token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        if (!sessionStorage.getItem('eduguide_guest')) {
          setUser(null);
          setProfile(null);
          setIsGuest(false);
        }
        setProfileLoaded(true);
        return;
      }

      if (session?.user) {
        setIsGuest(false);
        sessionStorage.removeItem('eduguide_guest');
        setUser(session.user);
        await fetchProfile(session.user.id, session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * Enter Guest mode.
   * Sets temporary virtual user/profile objects in state and sessionStorage.
   * Absolutely NO rows are created in Supabase DB.
   */
  const continueAsGuest = () => {
    setIsGuest(true);
    sessionStorage.setItem('eduguide_guest', 'true');
    const guestUser = {
      id: 'guest',
      email: 'guest@eduguide.ai',
      name: 'Guest Explorer',
      user_metadata: { display_name: 'Guest Explorer', role: 'user' },
      isGuest: true
    };
    const guestProfile = {
      id: 'guest',
      role: 'user',
      display_name: 'Guest Explorer',
      isGuest: true
    };
    setUser(guestUser);
    setProfile(guestProfile);
    setProfileLoaded(true);
    setLoading(false);
  };

  /**
   * Login with email + password.
   * Supabase handles JWT creation. We fetch profile directly from DB,
   * update state, and return role for instant redirection.
   */
  const login = async (email, password) => {
    try {
      setIsGuest(false);
      sessionStorage.removeItem('eduguide_guest');
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
      setIsGuest(false);
      sessionStorage.removeItem('eduguide_guest');
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
    sessionStorage.removeItem('eduguide_guest');
    setIsGuest(false);
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
    <AuthContext.Provider value={{ user, profile, isGuest, loading, profileLoaded, continueAsGuest, login, register, logout, updateSessionProfile }}>
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
