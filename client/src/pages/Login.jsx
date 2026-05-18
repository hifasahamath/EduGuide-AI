import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles, Eye, EyeOff, Loader2, AlertCircle, ArrowRight,
  Shield, BookOpen, TrendingUp, GraduationCap
} from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

const FEATURES = [
  { icon: <BookOpen size={14} />, label: 'Find Courses', desc: 'Search by field, fees, or university' },
  { icon: <TrendingUp size={14} />, label: 'Compare Fees', desc: 'Side-by-side cost analysis' },
  { icon: <GraduationCap size={14} />, label: 'AI Guidance', desc: 'Personalised recommendations' },
  { icon: <Shield size={14} />, label: 'Secure & Private', desc: 'Your data is protected' },
];

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Rate-limiting state (persisted in sessionStorage)
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

  // Countdown timer for lockout
  useEffect(() => {
    const d = getAttemptData();
    if (d.lockedUntil && Date.now() < d.lockedUntil) {
      const tick = setInterval(() => {
        const rem = Math.ceil((d.lockedUntil - Date.now()) / 1000);
        if (rem <= 0) { clearInterval(tick); setLockRemaining(0); setAttemptsLeft(MAX_ATTEMPTS); saveAttemptData({}); }
        else setLockRemaining(rem);
      }, 1000);
      return () => clearInterval(tick);
    }
  }, []);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin', { replace: true });
    if (user?.role === 'client' || user?.role === 'student') navigate('/chat', { replace: true });
  }, [user, navigate]);

  // Restore email from remember-me
  useEffect(() => {
    const saved = localStorage.getItem('_eg_remember_email');
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Check lockout
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
      // Reset attempt counter
      saveAttemptData({});
      setAttemptsLeft(MAX_ATTEMPTS);
      // Handle remember me
      if (rememberMe) localStorage.setItem('_eg_remember_email', email);
      else localStorage.removeItem('_eg_remember_email');
      // Role-based redirect
      if (result.role === 'admin') navigate('/admin');
      else navigate('/chat');
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

  const isLocked = lockRemaining > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#12121f] to-[#0a0a15] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center relative z-10">

        {/* ── LEFT — Promo ─────────────────────────────────── */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-none">EduGuide AI</h1>
              <p className="text-violet-400 text-xs font-medium mt-0.5">Your Smart Education Companion</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Discover your path<br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              with AI guidance
            </span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">
            Ask anything about courses, fees, universities, and career paths. Get instant, accurate answers powered by AI.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 mb-2">{f.icon}</div>
                <p className="text-white text-sm font-semibold">{f.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/chat')}
            className="mt-7 group flex items-center gap-2 text-sm text-gray-500 hover:text-violet-400 transition-colors font-medium">
            <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center group-hover:bg-violet-500/10 transition-colors">
              <ArrowRight size={13} />
            </span>
            Continue as Guest — no login needed
          </button>
        </div>

        {/* ── RIGHT — Form ─────────────────────────────────── */}
        <div>
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">EduGuide AI</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-gray-400 text-sm mb-6">Sign in to continue your learning journey</p>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" /> {error}
              </div>
            )}

            {/* Attempts warning */}
            {!isLocked && attemptsLeft < MAX_ATTEMPTS && attemptsLeft > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-4 py-3 mb-5 text-xs">
                <Shield size={13} /> {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before temporary lockout.
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLocked}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLocked}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 pr-11 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all disabled:opacity-50"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0
                      ${rememberMe ? 'bg-violet-600 border-violet-600' : 'bg-transparent border-white/20 hover:border-violet-500/50'}`}>
                    {rememberMe && <div className="w-2 h-2 rounded-sm bg-white" />}
                  </div>
                  <span className="text-gray-400 text-xs select-none">Remember me</span>
                </label>
                <span className="text-violet-400 hover:text-violet-300 text-xs font-medium cursor-pointer transition-colors">
                  Forgot password?
                </span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading || isLocked}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1">
                {isLocked
                  ? `Locked — wait ${lockRemaining}s`
                  : loading
                  ? <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                  : <>Sign In <ArrowRight size={16} /></>
                }
              </button>
            </form>

            {/* Register link */}
            <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-sm">
              <span className="text-gray-500 text-xs">New to EduGuide AI?</span>
              <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 text-xs transition-colors">
                Create account <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          <p className="text-center text-[11px] text-gray-600 mt-4">
            © 2024 EduGuide AI · Powered by Gemini AI
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
