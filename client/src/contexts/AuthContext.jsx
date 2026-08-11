import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // true only during the very first session check on page load
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the user's profile row from the profiles table.
   * Called after login and on auth state changes.
   */
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // PGRST116 = "no rows found" — not a real error, just means profile doesn't exist yet
      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Profile fetch error:', error.message);
      }

      setProfile(data || null);
      return data || null;
    } catch (err) {
      console.error('[Auth] Profile fetch failed:', err.message);
      setProfile(null);
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
      }

      if (isMounted) setLoading(false);
    });

    // This fires on login, logout, and token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
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
   * Supabase handles JWT creation. onAuthStateChange picks up the session
   * and calls fetchProfile, which sets the profile state.
   * We also fetch the role here so the caller can redirect immediately.
   */
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };

      // Grab the role so Login.jsx can decide where to redirect
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      return { success: true, role: prof?.role || 'user', user: data.user };
    } catch (err) {
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
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, updateSessionProfile }}>
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
