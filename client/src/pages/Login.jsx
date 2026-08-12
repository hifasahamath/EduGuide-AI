import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles, Eye, EyeOff, Loader2, AlertCircle, ArrowRight,
  Shield, BookOpen, TrendingUp, GraduationCap
} from 'lucide-react';

// Rate-limit constants
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

// Promo features shown on the left panel
const FEATURES = [
  { icon: <BookOpen size={14} />, label: 'Find Courses', desc: 'Search by field, fees, or university' },
  { icon: <TrendingUp size={14} />, label: 'Compare Fees', desc: 'Side-by-side cost analysis' },
  { icon: <GraduationCap size={14} />, label: 'AI Guidance', desc: 'Personalised recommendations' },
  { icon: <Shield size={14} />, label: 'Secure & Private', desc: 'Your data is protected' },
];

const Login = () => {
  const { user, profile, profileLoaded, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Rate limiting (persisted in sessionStorage) ──────────
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

  // Countdown timer while locked out
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

  // If the user is already logged in (or just logged in), redirect them once profile is loaded.
  useEffect(() => {
    if (!user || !profileLoaded) return;
    const role = profile?.role || 'user';
    if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/chat', { replace: true });
    }
  }, [user, profile, profileLoaded, navigate]);

  // Restore saved email from "remember me"
  useEffect(() => {
    const saved = localStorage.getItem('_eg_remember_email');
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  // ── Handle login form submit ─────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Check if currently locked out
    const d = getAttemptData();
    if (d.lockedUntil && Date.now() < d.lockedUntil) {
      const rem = Math.ceil((d.lockedUntil - Date.now()) / 1000);
      setError(`Too many failed attempts. Try again in ${rem}s.`);
      return;
    }

    // Basic validation
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
      // Reset attempt counter
      saveAttemptData({});
      setAttemptsLeft(MAX_ATTEMPTS);

      // Remember me
      if (rememberMe) localStorage.setItem('_eg_remember_email', email);
      else localStorage.removeItem('_eg_remember_email');

      // Navigate based on user role
      const targetRole = result.role || 'user';
      if (targetRole === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/chat', { replace: true });
      }
    } else {
      // Track failed attempt
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

  const isLocked = lockRemaining > 0;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-slate-800/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center relative z-10">

        {/* ── Left panel — Promo ──────────────────────────── */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight leading-none">EduGuide AI</h1>
              <p className="text-indigo-400 text-xs font-semibold mt-0.5">Higher Education & Career Advisor</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Discover accredited pathways<br />
            <span className="text-indigo-400">
              with intelligent guidance
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
            Search accredited degree programs, compare institutional course fees, and receive personalized academic advice.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 mb-2">{f.icon}</div>
                <p className="text-white text-xs font-bold">{f.label}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/chat')}
            className="mt-8 group flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium">
            <span className="w-6 h-6 rounded-md bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:bg-indigo-600/20 transition-colors">
              <ArrowRight size={12} />
            </span>
            Explore as Guest — no login required
          </button>
        </div>

        {/* ── Right panel — Login form ───────────────────── */}
        <div>
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-base">EduGuide AI</span>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Welcome back</h2>
            <p className="text-slate-400 text-xs mb-6">Sign in to your EduGuide student account</p>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-5 text-xs font-medium">
                <AlertCircle size={15} className="flex-shrink-0" /> {error}
              </div>
            )}

            {/* Attempts warning */}
            {!isLocked && attemptsLeft < MAX_ATTEMPTS && attemptsLeft > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-4 py-3 mb-5 text-xs font-medium">
                <Shield size={13} /> {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before temporary lockout.
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLocked}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLocked}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-3.5 pr-10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all disabled:opacity-50"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer flex-shrink-0
                      ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-transparent border-slate-700 hover:border-indigo-500'}`}>
                    {rememberMe && <div className="w-2 h-2 rounded-xs bg-white" />}
                  </div>
                  <span className="text-slate-400 text-xs select-none">Remember me</span>
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading || isLocked}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed text-xs">
                {isLocked
                  ? `Locked — wait ${lockRemaining}s`
                  : loading
                  ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
                  : <>Sign In <ArrowRight size={15} /></>
                }
              </button>
            </form>

            {/* Register link */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">New to EduGuide AI?</span>
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors">
                Create account <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-500 mt-4">
            © 2026 EduGuide AI · Higher Education Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
