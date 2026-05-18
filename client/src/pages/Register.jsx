import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_AUTH } from '../config/env';
import {
  Sparkles, Eye, EyeOff, Loader2, AlertCircle, ArrowRight,
  CheckCircle2, BookOpen, TrendingUp, MapPin, GraduationCap,
  User, Mail, Lock, Phone, Shield, ChevronRight
} from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 min

// ── Promo feature list ─────────────────────────────────────────────────────────
const FEATURES = [
  { icon: <BookOpen size={16} />, text: 'Find courses instantly by field or budget' },
  { icon: <TrendingUp size={16} />, text: 'Compare fees and duration side by side' },
  { icon: <GraduationCap size={16} />, text: 'Get personalised AI recommendations' },
  { icon: <MapPin size={16} />, text: 'Explore career paths and job prospects' },
];

// ── Shared input component ─────────────────────────────────────────────────────
const AuthInput = ({ label, icon, error, ...props }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">{icon}</div>
      <input
        {...props}
        className={`w-full bg-white/5 border rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 transition-all
          ${error ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-violet-500/50 focus:border-violet-500/50'}`}
      />
    </div>
    {error && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
  </div>
);

// ── Register page ──────────────────────────────────────────────────────────────
const Register = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin', { replace: true });
    if (user?.role === 'client' || user?.role === 'student') navigate('/chat', { replace: true });
  }, [user, navigate]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Enter a valid email address';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    if (!agreed) errs.agreed = 'You must agree to the terms';
    return errs;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone,
          role: 'student'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setApiError(data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setApiError('Could not connect to server. Is the backend running?');
    }
    setLoading(false);
  };

  if (success) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#12121f] to-[#0a0a15] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
        <p className="text-gray-400 text-sm">Welcome to EduGuide AI. Redirecting to login...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#12121f] to-[#0a0a15] flex overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-3xl pointer-events-none" />

      {/* ── LEFT — Promo ─────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">EduGuide AI</span>
        </div>

        {/* Hero */}
        <div>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300 text-xs font-medium">AI-Powered Education Guide</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Find Your<br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Perfect Course
            </span><br />
            with AI
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-sm">
            Your smart education companion that guides you to the right degree, the right university, and the right career path.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-10">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 flex-shrink-0">
                  {f.icon}
                </div>
                <p className="text-gray-300 text-sm">{f.text}</p>
              </div>
            ))}
          </div>

          {/* Guest CTA */}
          <button
            onClick={() => navigate('/chat')}
            className="group flex items-center gap-2 text-sm text-gray-400 hover:text-violet-400 transition-colors font-medium"
          >
            <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-violet-500/10 transition-colors">
              <ChevronRight size={14} />
            </span>
            Explore as Guest — no account needed
          </button>
        </div>

        {/* Bottom testimonial */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 max-w-sm">
          <p className="text-gray-300 text-sm italic leading-relaxed">
            "EduGuide AI helped me compare 12 courses and pick the one that matched my budget and career goals in minutes."
          </p>
          <p className="text-violet-400 text-xs font-semibold mt-3">— Asel, BSc Software Engineering student</p>
        </div>
      </div>

      {/* ── RIGHT — Form ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">EduGuide AI</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
            <p className="text-gray-400 text-sm mb-6">Start your smart education journey today</p>

            {apiError && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
                <AlertCircle size={15} /> {apiError}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <AuthInput label="Full Name" icon={<User size={15} />} type="text"
                value={form.name} onChange={set('name')} placeholder="e.g. Hasitha Perera"
                error={errors.name} autoComplete="name" />

              <AuthInput label="Email Address" icon={<Mail size={15} />} type="email"
                value={form.email} onChange={set('email')} placeholder="you@example.com"
                error={errors.email} autoComplete="email" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><Lock size={15} /></div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Min 6 chars"
                      autoComplete="new-password"
                      className={`w-full bg-white/5 border rounded-xl py-3 pl-10 pr-9 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 transition-all ${errors.password ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-violet-500/50'}`}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Confirm</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><Lock size={15} /></div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={set('confirm')}
                      placeholder="Repeat"
                      autoComplete="new-password"
                      className={`w-full bg-white/5 border rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 transition-all ${errors.confirm ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-violet-500/50'}`}
                    />
                  </div>
                  {errors.confirm && <p className="text-xs text-red-400 mt-1">{errors.confirm}</p>}
                </div>
              </div>

              <AuthInput label="Phone (Optional)" icon={<Phone size={15} />} type="tel"
                value={form.phone} onChange={set('phone')} placeholder="+94 77 000 0000" />

              {/* Terms */}
              <div>
                <div
                  className={`flex items-start gap-3 cursor-pointer select-none ${errors.agreed ? 'text-red-400' : 'text-gray-400'}`}
                  onClick={() => setAgreed(a => !a)}
                >
                  <div className="relative mt-0.5 flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                        ${agreed ? 'bg-violet-600 border-violet-600' : 'bg-transparent border-white/20 hover:border-violet-500/50'}`}
                    >
                      {agreed && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                  </div>
                  <span className="text-sm leading-snug">
                    I agree to the{' '}
                    <span className="text-violet-400 underline" onClick={e => e.stopPropagation()}>Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-violet-400 underline" onClick={e => e.stopPropagation()}>Privacy Policy</span>
                  </span>
                </div>
                {errors.agreed && <p className="text-xs text-red-400 mt-1 ml-8">{errors.agreed}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : <>Create Account <ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-sm">
              <span className="text-gray-500">Already have an account?</span>
              <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 transition-colors">
                Sign In <ArrowRight size={13} />
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

export default Register;
