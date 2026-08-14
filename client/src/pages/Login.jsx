import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Sparkles, Eye, EyeOff, Loader2, AlertCircle, ArrowRight,
  Shield, BookOpen, TrendingUp, GraduationCap
} from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

const FEATURES = [
  { icon: <BookOpen size={16} />, label: 'Find Courses', desc: 'Search by field, fees, or university' },
  { icon: <TrendingUp size={16} />, label: 'Compare Fees', desc: 'Side-by-side cost analysis' },
  { icon: <GraduationCap size={16} />, label: 'AI Guidance', desc: 'Personalised recommendations' },
  { icon: <Shield size={16} />, label: 'Secure & Private', desc: 'Your data is protected' },
];

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const Login = () => {
  const { user, profile, profileLoaded, login, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleGuestClick = () => {
    continueAsGuest();
    navigate('/chat');
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const getAttemptData = () => {
    try { return JSON.parse(sessionStorage.getItem('_eg_login_attempts') || '{}'); }
    catch { return {}; }
  };
  const saveAttemptData = (d) => sessionStorage.setItem('_eg_login_attempts', JSON.stringify(d));

  const [attemptsLeft, setAttemptsLeft] = useState(() => {
    const d = getAttemptData();
    if (d.lockedUntil && Date.now() < d.lockedUntil) return 0;
    return MAX_ATTEMPTS - (d.count || 0);
  });
  const [lockRemaining, setLockRemaining] = useState(0);

  useEffect(() => {
    const d = getAttemptData();
    if (d.lockedUntil && Date.now() < d.lockedUntil) {
      const tick = setInterval(() => {
        const rem = Math.ceil((d.lockedUntil - Date.now()) / 1000);
        if (rem <= 0) {
          clearInterval(tick);
          setLockRemaining(0);
          setAttemptsLeft(MAX_ATTEMPTS);
          saveAttemptData({});
        } else {
          setLockRemaining(rem);
        }
      }, 1000);
      return () => clearInterval(tick);
    }
  }, []);

  useEffect(() => {
    if (!user || !profileLoaded) return;
    const role = profile?.role || 'user';
    if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/chat', { replace: true });
    }
  }, [user, profile, profileLoaded, navigate]);

  useEffect(() => {
    const saved = localStorage.getItem('_eg_remember_email');
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const d = getAttemptData();
    if (d.lockedUntil && Date.now() < d.lockedUntil) {
      const rem = Math.ceil((d.lockedUntil - Date.now()) / 1000);
      setError(`Too many failed attempts. Try again in ${rem}s.`);
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      saveAttemptData({});
      setAttemptsLeft(MAX_ATTEMPTS);

      if (rememberMe) localStorage.setItem('_eg_remember_email', email);
      else localStorage.removeItem('_eg_remember_email');

      const targetRole = result.role || 'user';
      if (targetRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/chat', { replace: true });
      }
    } else {
      const newCount = (d.count || 0) + 1;
      const locked = newCount >= MAX_ATTEMPTS;
      saveAttemptData({
        count: locked ? 0 : newCount,
        lockedUntil: locked ? Date.now() + LOCKOUT_MS : null
      });
      setAttemptsLeft(locked ? 0 : MAX_ATTEMPTS - newCount);

      if (locked) {
        setError(`Account temporarily locked after ${MAX_ATTEMPTS} failed attempts. Try again in 5 minutes.`);
        setLockRemaining(300);
      } else {
        setError(result.error || 'Invalid email or password.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/chat`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('[Google OAuth Error]', err);
      setError(err.message || 'Google authentication failed. Please ensure Google OAuth provider is enabled in your Supabase project settings.');
      setGoogleLoading(false);
    }
  };

  const isLocked = lockRemaining > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">

        {/* ── Left panel — Clean Highlight Card ──────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-8 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">EduGuide AI</h1>
                <p className="text-indigo-600 text-xs font-bold mt-0.5">Higher Education & Career Advisor</p>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 leading-snug tracking-tight mb-3">
              Find Your Ideal<br />
              <span className="text-indigo-600">Academic & Career Path</span>
            </h2>
            
            <p className="text-slate-600 text-xs leading-relaxed font-medium mb-6">
              Discover accredited degree programs, compare course fees, and receive personalized career guidance.
            </p>

            {/* Clean 4-item feature cards filling vertical space naturally */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 mt-0.5">
                  <BookOpen size={16} />
                </div>
                <div>
                  <p className="text-slate-900 text-xs font-bold">Accredited Degree Explorer</p>
                  <p className="text-slate-500 text-[11px] font-medium leading-snug mt-0.5">Compare top IT, Business, Engineering & Health programs</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 mt-0.5">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <p className="text-slate-900 text-xs font-bold">Tuition & Payment Comparisons</p>
                  <p className="text-slate-500 text-[11px] font-medium leading-snug mt-0.5">Check course fees, installment options & scholarships</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 mt-0.5">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-slate-900 text-xs font-bold">Personalised AI Academic Guidance</p>
                  <p className="text-slate-500 text-[11px] font-medium leading-snug mt-0.5">Instant recommendations tailored to your stream & budget</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 mt-0.5">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <p className="text-slate-900 text-xs font-bold">Direct Pathways from A/Ls & Diplomas</p>
                  <p className="text-slate-500 text-[11px] font-medium leading-snug mt-0.5">Clear university admission routes and career transitions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prominently Highlighted Explore as Guest Button */}
          <div className="pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={handleGuestClick}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-indigo-500/15 hover:from-amber-500/25 hover:to-indigo-500/25 border-2 border-amber-400/70 text-slate-900 font-extrabold text-xs shadow-xs hover:shadow-md transition-all group cursor-pointer touch-manipulation"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles size={14} />
                </div>
                <div className="text-left truncate">
                  <p className="font-extrabold text-slate-900 text-xs">Explore as Guest</p>
                  <p className="text-[10px] text-amber-900/80 font-bold truncate">Try AI chat instantly — no login required</p>
                </div>
              </div>
              <ArrowRight size={15} className="text-amber-700 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-1" />
            </button>
          </div>
        </div>

        {/* ── Right panel — Light Theme Login Form ───────────────────── */}
        <div className="w-full flex flex-col justify-between">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-slate-900 font-extrabold text-lg">EduGuide AI</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-8 shadow-md">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-600 text-xs font-medium mt-1 mb-5 sm:mb-6">Sign in to your EduGuide student account</p>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || isLocked}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-all disabled:opacity-60 mb-5"
            >
              {googleLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <GoogleIcon />}
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 mb-5 text-xs font-bold">
                <AlertCircle size={15} className="flex-shrink-0 text-rose-600" /> {error}
              </div>
            )}

            {/* Attempts warning */}
            {!isLocked && attemptsLeft < MAX_ATTEMPTS && attemptsLeft > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-5 text-xs font-bold">
                <Shield size={13} className="text-amber-600" /> {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before temporary lockout.
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLocked}
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3.5 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLocked}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3.5 pr-10 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all disabled:opacity-50"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                  <span className="text-slate-700 font-semibold text-xs select-none">Remember me</span>
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading || isLocked}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs shadow-indigo-600/20 disabled:opacity-60 disabled:cursor-not-allowed text-xs">
                {isLocked
                  ? `Locked — wait ${lockRemaining}s`
                  : loading
                  ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                  : <>Sign In <ArrowRight size={15} /></>
                }
              </button>
            </form>

            {/* Mobile Guest Mode Button */}
            <div className="mt-4 pt-4 border-t border-slate-100 lg:hidden">
              <button
                type="button"
                onClick={handleGuestClick}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-indigo-500/15 hover:from-amber-500/25 hover:to-indigo-500/25 border-2 border-amber-400/70 text-slate-900 font-extrabold text-xs shadow-xs transition-all cursor-pointer touch-manipulation"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                    <Sparkles size={13} />
                  </div>
                  <div className="text-left truncate">
                    <p className="font-extrabold text-slate-900 text-xs">Explore as Guest</p>
                    <p className="text-[10px] text-amber-900/80 font-bold truncate">Try AI chat instantly — no login required</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-amber-700 flex-shrink-0 ml-1" />
              </button>
            </div>

            {/* Register link */}
            <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">New to EduGuide AI?</span>
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 transition-colors">
                Create account <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          <p className="text-center text-[11px] font-medium text-slate-500 mt-4">
            © 2026 EduGuide AI · Higher Education Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
