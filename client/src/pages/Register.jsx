import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Sparkles, Eye, EyeOff, Loader2, AlertCircle, ArrowRight,
  CheckCircle2, BookOpen, TrendingUp, MapPin, GraduationCap,
  User, Mail, Lock, Phone, ChevronRight
} from 'lucide-react';

const FEATURES = [
  { icon: <BookOpen size={16} />, text: 'Find courses instantly by field or budget' },
  { icon: <TrendingUp size={16} />, text: 'Compare fees and duration side by side' },
  { icon: <GraduationCap size={16} />, text: 'Get personalised AI recommendations' },
  { icon: <MapPin size={16} />, text: 'Explore career paths and job prospects' },
];

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const AuthInput = ({ label, icon, error, ...props }) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</div>
      <input
        {...props}
        className={`w-full bg-white border rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 transition-all
          ${error ? 'border-rose-500 focus:ring-rose-500/30' : 'border-slate-300 focus:ring-indigo-500/40 focus:border-indigo-500/40'}`}
      />
    </div>
    {error && <p className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
  </div>
);

const Register = () => {
  const { profile, register, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleGuestClick = () => {
    continueAsGuest();
    navigate('/chat');
  };

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (!profile) return;
    if (profile.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/chat', { replace: true });
    }
  }, [profile, navigate]);

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
    const result = await register(form.email.trim().toLowerCase(), form.password, form.name.trim());
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setApiError(result.error || 'Registration failed. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    setApiError('');
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
      setApiError(err.message || 'Google authentication failed. Please ensure Google OAuth provider is enabled in your Supabase project settings.');
      setGoogleLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-6 select-none font-sans">
      <div className="text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-lg max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Account Created Successfully</h2>
        <p className="text-slate-600 text-xs font-medium">Welcome to EduGuide AI. Redirecting to sign in...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* ── Left panel — Light Theme Promo ─────────────────────────── */}
        <div className="hidden lg:block bg-white border border-slate-200/90 rounded-2xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-slate-900 font-extrabold text-lg tracking-tight">EduGuide AI</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-3.5 py-1">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-indigo-800 text-xs font-bold">Smart Education Advisor</span>
          </div>
          
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Find Your<br />
            <span className="text-indigo-600">Ideal Academic Path</span><br />
            with AI
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
            Discover accredited degree programs, compare course fees, and receive personalized career guidance.
          </p>

          <div className="space-y-3 pt-2">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                  {f.icon}
                </div>
                <p className="text-slate-800 text-xs font-bold">{f.text}</p>
              </div>
            ))}
          </div>

          <button onClick={handleGuestClick}
            className="group flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 transition-colors font-bold pt-2 cursor-pointer">
            <span className="w-6 h-6 rounded-md bg-slate-100 border border-slate-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <ChevronRight size={13} />
            </span>
            Explore as Guest — no account needed
          </button>
        </div>

        {/* ── Right panel — Light Theme Registration Form ────────────────── */}
        <div className="w-full">
          <div className="flex lg:hidden items-center gap-2 justify-center mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-slate-900 font-extrabold text-lg">EduGuide AI</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-md">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-slate-600 text-xs font-medium mt-1 mb-6">Start your smart education journey today</p>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-all disabled:opacity-60 mb-5"
            >
              {googleLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <GoogleIcon />}
              <span>Sign up with Google</span>
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {apiError && (
              <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 mb-5 text-xs font-bold">
                <AlertCircle size={15} className="flex-shrink-0 text-rose-600" /> {apiError}
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Lock size={15} /></div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Min 6 chars"
                      autoComplete="new-password"
                      className={`w-full bg-white border rounded-xl py-2.5 pl-10 pr-8 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 transition-all ${
                        errors.password ? 'border-rose-500 focus:ring-rose-500/30' : 'border-slate-300 focus:ring-indigo-500/40'
                      }`}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-600 font-bold mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Confirm</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Lock size={15} /></div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={set('confirm')}
                      placeholder="Repeat"
                      autoComplete="new-password"
                      className={`w-full bg-white border rounded-xl py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 transition-all ${
                        errors.confirm ? 'border-rose-500 focus:ring-rose-500/30' : 'border-slate-300 focus:ring-indigo-500/40'
                      }`}
                    />
                  </div>
                  {errors.confirm && <p className="text-xs text-rose-600 font-bold mt-1">{errors.confirm}</p>}
                </div>
              </div>

              <AuthInput label="Phone (Optional)" icon={<Phone size={15} />} type="tel"
                value={form.phone} onChange={set('phone')} placeholder="+94 77 000 0000" />

              {/* Terms checkbox */}
              <div>
                <div
                  className={`flex items-start gap-2.5 cursor-pointer select-none ${errors.agreed ? 'text-rose-600 font-bold' : 'text-slate-700 font-semibold'}`}
                  onClick={() => setAgreed(a => !a)}
                >
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer mt-0.5"
                  />
                  <span className="text-xs leading-snug">
                    I agree to the{' '}
                    <span className="text-indigo-600 underline font-bold" onClick={e => e.stopPropagation()}>Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-indigo-600 underline font-bold" onClick={e => e.stopPropagation()}>Privacy Policy</span>
                  </span>
                </div>
                {errors.agreed && <p className="text-xs text-rose-600 font-bold mt-1 ml-6">{errors.agreed}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs shadow-indigo-600/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1 text-xs">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <>Create Account <ArrowRight size={15} /></>}
              </button>
            </form>

            {/* Mobile Guest Mode Button */}
            <div className="mt-4 pt-4 border-t border-slate-100 lg:hidden">
              <button
                type="button"
                onClick={handleGuestClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs shadow-xs transition-all"
              >
                <Sparkles size={14} className="text-amber-600" />
                <span>Explore as Guest — no account needed</span>
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Already have an account?</span>
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 transition-colors">
                Sign In <ArrowRight size={12} />
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

export default Register;
