import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles, Eye, EyeOff, Loader2, AlertCircle, ArrowRight,
  CheckCircle2, BookOpen, TrendingUp, MapPin, GraduationCap,
  User, Mail, Lock, Phone, ChevronRight
} from 'lucide-react';

// Promo features shown on the left panel
const FEATURES = [
  { icon: <BookOpen size={16} />, text: 'Find courses instantly by field or budget' },
  { icon: <TrendingUp size={16} />, text: 'Compare fees and duration side by side' },
  { icon: <GraduationCap size={16} />, text: 'Get personalised AI recommendations' },
  { icon: <MapPin size={16} />, text: 'Explore career paths and job prospects' },
];

// Reusable input component with icon and error display
const AuthInput = ({ label, icon, error, ...props }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">{icon}</div>
      <input
        {...props}
        className={`w-full bg-slate-950/80 border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 transition-all
          ${error ? 'border-red-500/50 focus:ring-red-500/30' : 'border-slate-800 focus:ring-indigo-500/40 focus:border-indigo-500/40'}`}
      />
    </div>
    {error && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
  </div>
);

const Register = () => {
  const { user, profile, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  // If already logged in, send them to the right place
  useEffect(() => {
    if (!profile) return;
    if (profile.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/chat', { replace: true });
    }
  }, [profile, navigate]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // Client-side validation
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
    const result = await register(form.email.trim().toLowerCase(), form.password, form.name.trim());
    setLoading(false);

    if (result.success) {
      // Email confirmation is OFF, so the account is ready immediately.
      // Show success message, then redirect to login.
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setApiError(result.error || 'Registration failed. Please try again.');
    }
  };

  // ── Success screen ───────────────────────────────────────
  if (success) return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center select-none">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Account Created Successfully</h2>
        <p className="text-slate-400 text-xs">Welcome to EduGuide AI. Redirecting to sign in...</p>
      </div>
    </div>
  );

  // ── Registration form ────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex overflow-hidden select-none">
      {/* Ambient lighting */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[350px] h-[350px] rounded-full bg-slate-800/20 blur-3xl pointer-events-none" />

      {/* ── Left panel — Promo ─────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-lg tracking-tight">EduGuide AI</span>
        </div>

        {/* Hero text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3.5 py-1 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-300 text-xs font-semibold">Smart Education Advisor</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Find Your<br />
            <span className="text-indigo-400">
              Ideal Academic Path
            </span><br />
            with AI
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
            Discover accredited degree programs, compare course fees, and receive personalized career guidance.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-10">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  {f.icon}
                </div>
                <p className="text-slate-300 text-xs font-medium">{f.text}</p>
              </div>
            ))}
          </div>

          {/* Guest link */}
          <button
            onClick={() => navigate('/chat')}
            className="group flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium"
          >
            <span className="w-6 h-6 rounded-md bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:bg-indigo-600/20 transition-colors">
              <ChevronRight size={13} />
            </span>
            Explore as Guest — no account needed
          </button>
        </div>

        {/* Testimonial */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 max-w-sm">
          <p className="text-slate-300 text-xs italic leading-relaxed">
            "EduGuide AI helped me compare higher diploma options and choose the exact degree track for my software engineering career."
          </p>
          <p className="text-indigo-400 text-xs font-semibold mt-3">— Asel, BSc Software Engineering student</p>
        </div>
      </div>

      {/* ── Right panel — Form ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-base">EduGuide AI</span>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Create your account</h2>
            <p className="text-slate-400 text-xs mb-6">Start your smart education journey today</p>

            {apiError && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 mb-5 text-xs font-medium">
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
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><Lock size={15} /></div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Min 6 chars"
                      autoComplete="new-password"
                      className={`w-full bg-slate-950/80 border rounded-xl py-2.5 pl-10 pr-8 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 transition-all ${
                        errors.password ? 'border-red-500/50 focus:ring-red-500/30' : 'border-slate-800 focus:ring-indigo-500/40'
                      }`}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><Lock size={15} /></div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={set('confirm')}
                      placeholder="Repeat"
                      autoComplete="new-password"
                      className={`w-full bg-slate-950/80 border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 transition-all ${
                        errors.confirm ? 'border-red-500/50 focus:ring-red-500/30' : 'border-slate-800 focus:ring-indigo-500/40'
                      }`}
                    />
                  </div>
                  {errors.confirm && <p className="text-xs text-red-400 mt-1">{errors.confirm}</p>}
                </div>
              </div>

              <AuthInput label="Phone (Optional)" icon={<Phone size={15} />} type="tel"
                value={form.phone} onChange={set('phone')} placeholder="+94 77 000 0000" />

              {/* Terms checkbox */}
              <div>
                <div
                  className={`flex items-start gap-3 cursor-pointer select-none ${errors.agreed ? 'text-red-400' : 'text-slate-400'}`}
                  onClick={() => setAgreed(a => !a)}
                >
                  <div className="relative mt-0.5 flex-shrink-0">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                        ${agreed ? 'bg-indigo-600 border-indigo-600' : 'bg-transparent border-slate-700 hover:border-indigo-500'}`}
                    >
                      {agreed && <CheckCircle2 size={11} className="text-white" />}
                    </div>
                  </div>
                  <span className="text-xs leading-snug">
                    I agree to the{' '}
                    <span className="text-indigo-400 underline" onClick={e => e.stopPropagation()}>Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-indigo-400 underline" onClick={e => e.stopPropagation()}>Privacy Policy</span>
                  </span>
                </div>
                {errors.agreed && <p className="text-xs text-red-400 mt-1 ml-7">{errors.agreed}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1 text-xs">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <>Create Account <ArrowRight size={15} /></>}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Already have an account?</span>
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors">
                Sign In <ArrowRight size={12} />
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

export default Register;

