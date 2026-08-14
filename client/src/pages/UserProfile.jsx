import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  User, Mail, School, MapPin, Calendar, Globe, Lock,
  Camera, Save, CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Sparkles
} from 'lucide-react';

const UserProfile = ({ isDark }) => {
  const { user, isGuest, updateSessionProfile } = useAuth();
  const [form, setForm] = useState({
    name: isGuest ? 'Guest Explorer' : '',
    email: isGuest ? 'guest@eduguide.ai' : '',
    schoolName: '',
    address: '',
    age: '',
    language: 'English',
    profilePic: ''
  });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [toast, setToast] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (isGuest || !user?.id) return;
    api.get(`/auth/profile/${user.id}`)
      .then(res => {
        const data = res.data;
        setForm({
          name: data.display_name || data.name || '',
          email: data.email || '',
          schoolName: data.school_name || data.schoolName || '',
          address: data.address || '',
          age: data.age || '',
          language: data.preferred_language || data.language || 'English',
          profilePic: data.profile_pic || data.profilePic || ''
        });
      })
      .catch(() => setForm(f => ({ ...f, name: user.name || '', email: user.email || '' })));
  }, [user, isGuest]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (isGuest) {
      showToast('Please create an account to save profile settings.', 'error');
      return;
    }
    if (!user?.id) return;
    setSaving(true);
    try {
      await api.put(`/auth/profile/${user.id}`, {
        display_name: form.name,
        name: form.name,
        school_name: form.schoolName,
        schoolName: form.schoolName,
        preferred_language: form.language,
        language: form.language,
        profile_pic: form.profilePic,
        profilePic: form.profilePic
      });
      updateSessionProfile({ name: form.name, schoolName: form.schoolName, address: form.address, age: form.age, language: form.language, profilePic: form.profilePic });
      showToast('Profile saved successfully!');
    } catch {
      showToast('Could not connect to server.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (isGuest) {
      showToast('Password management is not available in Guest mode.', 'error');
      return;
    }
    if (!passwords.newPass || passwords.newPass !== passwords.confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setSavingPass(true);
    try {
      await api.put(`/auth/profile/${user.id}/password`, { newPassword: passwords.newPass });
      showToast('Password changed successfully!');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not connect to server.', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(f => ({ ...f, profilePic: reader.result }));
      setUploadingPic(false);
    };
    reader.readAsDataURL(file);
  };

  const bg = isDark ? 'bg-[#080c16]' : 'bg-slate-50';
  const cardBg = isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-slate-300 shadow-sm';
  const inputBg = isDark ? 'bg-slate-950/90 border-slate-700 text-slate-100 placeholder-slate-400 font-medium' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 font-medium';
  const labelColor = isDark ? 'text-slate-300' : 'text-slate-700';
  const textMain = isDark ? 'text-slate-100' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-300' : 'text-slate-700';

  const Field = ({ icon, label, type = 'text', value, onChange, placeholder, readonly }) => (
    <div>
      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelColor}`}>{label}</label>
      <div className="relative">
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{icon}</div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readonly}
          className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${inputBg} ${readonly ? 'opacity-70 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );

  const PassField = ({ label, key_, placeholder }) => (
    <div>
      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelColor}`}>{label}</label>
      <div className="relative">
        <Lock size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
        <input
          type={showPass[key_] ? 'text' : 'password'}
          value={passwords[key_]}
          onChange={e => setPasswords(p => ({ ...p, [key_]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${inputBg}`}
        />
        <button type="button" onClick={() => setShowPass(s => ({ ...s, [key_]: !s[key_] }))}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'} transition-colors`}>
          {showPass[key_] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${
            toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.message}
        </motion.div>
      )}

      {/* Page Header */}
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${textMain}`}>Account Profile</h1>
        <p className={`text-xs sm:text-sm mt-1 font-medium ${textMuted}`}>
          {isGuest ? 'Guest explorer profile (Session only)' : 'Manage your personal information, institution context, and security credentials'}
        </p>
      </div>

      {isGuest && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Guest Mode Profile</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              You are using a temporary guest profile. Changes won't be saved to the database unless you create a registered account.
            </p>
          </div>
        </div>
      )}

      {/* Avatar Card */}
      <div className={`rounded-2xl border p-6 flex items-center gap-6 ${cardBg}`}>
        <div className="relative group flex-shrink-0">
          {form.profilePic ? (
            <img src={form.profilePic} alt="profile" className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-slate-700/50" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xs">
              <span className="text-white text-2xl font-bold">{form.name?.[0]?.toUpperCase() || 'G'}</span>
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-2xl bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploadingPic ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
        </div>
        <div>
          <p className={`text-lg font-extrabold ${textMain}`}>{form.name || (isGuest ? 'Guest Explorer' : 'Student Account')}</p>
          <p className={`text-xs mt-0.5 font-medium ${textMuted}`}>{form.email}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800/60 text-xs font-bold">
            {isGuest ? 'Guest Mode' : 'Student Profile'}
          </span>
        </div>
        <div className="ml-auto hidden md:block">
          <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Click photo to change avatar</p>
        </div>
      </div>

      {/* Info Card */}
      <div className={`rounded-2xl border p-6 ${cardBg}`}>
        <h2 className={`font-bold mb-5 text-xs uppercase tracking-wider ${textMain}`}>Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field icon={<User size={15} />} label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
          <Field icon={<Mail size={15} />} label="Email Address" value={form.email} readonly placeholder="Email" />
          <Field icon={<School size={15} />} label="School / Institution" value={form.schoolName} onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))} placeholder="e.g. ESOFT Metro Campus" />
          <Field icon={<Calendar size={15} />} label="Age" type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="Your age" />

          {/* Language dropdown */}
          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelColor}`}>Preferred Language</label>
            <div className="relative">
              <Globe size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <select
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${inputBg}`}
              >
                <option value="English">English</option>
                <option value="Sinhala">Sinhala</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-xs shadow-indigo-500/20 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {/* Security Card */}
      <div className={`rounded-2xl border p-6 ${cardBg}`}>
        <h2 className={`font-bold mb-5 text-xs uppercase tracking-wider ${textMain}`}>Security Credentials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PassField label="Current Password" key_="current" placeholder="••••••••" />
          <PassField label="New Password" key_="newPass" placeholder="Min 6 characters" />
          <PassField label="Confirm Password" key_="confirm" placeholder="Repeat new password" />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePasswordChange}
            disabled={savingPass}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-60"
          >
            {savingPass ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            <span>Update Password</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
