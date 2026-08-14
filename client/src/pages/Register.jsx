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

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-6 font-sans">
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        
        {/* ── Left panel — Clean Highlight Card ─────────────────────────── */}
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

            {/* Clean feature badges */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                  <BookOpen size={16} />
                </div>
                <p className="text-slate-800 text-xs font-bold">Compare Degrees & Fee Structures</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                  <Sparkles size={16} />
                </div>
                <p className="text-slate-800 text-xs font-bold">Personalised AI Academic Guidance</p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                  <GraduationCap size={16} />
                </div>
                <p className="text-slate-800 text-xs font-bold">Direct Pathways from A/Ls & Diplomas</p>
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
                  <p className="text-[10px] text-amber-900/80 font-bold truncate">Try AI chat instantly — no account needed</p>
                </div>
              </div>
              <ArrowRight size={15} className="text-amber-700 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-1" />
            </button>
          </div>
        </div>

        {/* ── Right panel — Light Theme Registration Form ────────────────── */}
        <div className="w-full flex flex-col justify-between">
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
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-all disabled:opacity-60 mb-5 cursor-pointer touch-manipulation"
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

              {/* Password - Full Width */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Lock size={15} /></div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    className={`w-full bg-white border rounded-xl py-2.5 pl-10 pr-10 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 transition-all ${
                      errors.password ? 'border-rose-500 focus:ring-rose-500/30' : 'border-slate-300 focus:ring-indigo-500/40 focus:border-indigo-500/40'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer touch-manipulation">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.password}</p>}
              </div>

              {/* Confirm Password - Full Width (Replaced Phone) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Lock size={15} /></div>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={set('confirm')}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={`w-full bg-white border rounded-xl py-2.5 pl-10 pr-10 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 transition-all ${
                      errors.confirm ? 'border-rose-500 focus:ring-rose-500/30' : 'border-slate-300 focus:ring-indigo-500/40 focus:border-indigo-500/40'
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer touch-manipulation">
                    {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirm && <p className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.confirm}</p>}
              </div>

              {/* Terms checkbox */}
              <div>
                <div
                  className={`flex items-start gap-2.5 cursor-pointer touch-manipulation select-none ${errors.agreed ? 'text-rose-600 font-bold' : 'text-slate-700 font-semibold'}`}
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
                {errors.agreed && <p className="text-xs text-rose-600 font-bold mt-1 ml-6 flex items-center gap-1"><AlertCircle size={11} />{errors.agreed}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs shadow-indigo-600/20 disabled:opacity-60 disabled:cursor-not-allowed mt-1 text-xs cursor-pointer touch-manipulation">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <>Create Account <ArrowRight size={15} /></>}
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
                    <p className="text-[10px] text-amber-900/80 font-bold truncate">Try AI chat instantly — no account needed</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-amber-700 flex-shrink-0 ml-1" />
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
