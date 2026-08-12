import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  User, Mail, School, MapPin, Calendar, Globe, Lock,
  Camera, Save, CheckCircle, AlertCircle, Loader2, Eye, EyeOff
} from 'lucide-react';

const UserProfile = ({ isDark }) => {
  const { user, updateSessionProfile } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', schoolName: '', address: '', age: '', language: 'English', profilePic: ''
  });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [toast, setToast] = useState(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
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
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
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

  const bg = isDark ? 'bg-[#090d16]' : 'bg-[#f8fafc]';
  const cardBg = isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white border-slate-200/90 shadow-xs';
  const inputBg = isDark ? 'bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-slate-50/80 border-slate-200 text-slate-800 placeholder-slate-400';
  const labelColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const textMain = isDark ? 'text-slate-100' : 'text-slate-900';

  const Field = ({ icon, label, type = 'text', value, onChange, placeholder, readonly }) => (
    <div>
      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelColor}`}>{label}</label>
      <div className="relative">
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{icon}</div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readonly}
          className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${inputBg} ${readonly ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );

  const PassField = ({ label, key_, placeholder }) => (
    <div>
      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelColor}`}>{label}</label>
      <div className="relative">
        <Lock size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
        <input
          type={showPass[key_] ? 'text' : 'password'}
          value={passwords[key_]}
          onChange={e => setPasswords(p => ({ ...p, [key_]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${inputBg}`}
        />
        <button type="button" onClick={() => setShowPass(s => ({ ...s, [key_]: !s[key_] }))}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'} transition-colors`}>
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
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.message}
        </motion.div>
      )}

      {/* Page Header */}
      <div>
        <h1 className={`text-2xl font-bold tracking-tight ${textMain}`}>Account Profile</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage your personal information, institution context, and security credentials</p>
      </div>

      {/* Avatar Card */}
      <div className={`rounded-2xl border p-6 flex items-center gap-6 ${cardBg}`}>
        <div className="relative group flex-shrink-0">
          {form.profilePic ? (
            <img src={form.profilePic} alt="profile" className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-slate-700/50" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xs">
              <span className="text-white text-2xl font-bold">{form.name?.[0]?.toUpperCase() || '?'}</span>
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
          <p className={`text-lg font-bold ${textMain}`}>{form.name || 'Student Account'}</p>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{form.email}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40 text-xs font-semibold">
            Student Profile
          </span>
        </div>
        <div className="ml-auto hidden md:block">
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Click photo to change avatar</p>
        </div>
      </div>

      {/* Info Card */}
      <div className={`rounded-2xl border p-6 ${cardBg}`}>
        <h2 className={`font-bold mb-5 text-sm uppercase tracking-wider ${textMain}`}>Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field icon={<User size={15} />} label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
          <Field icon={<Mail size={15} />} label="Email Address" value={form.email} readonly placeholder="Email" />
          <Field icon={<School size={15} />} label="School / Institution" value={form.schoolName} onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))} placeholder="e.g. ESOFT Metro Campus" />
          <Field icon={<Calendar size={15} />} label="Age" type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="Your age" />
          <div className="md:col-span-2">
            <Field icon={<MapPin size={15} />} label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Your city / address" />
          </div>
          <div>
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelColor}`}>Language</label>
            <div className="relative">
              <Globe size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <select
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all appearance-none ${inputBg}`}
              >
                {['English', 'Sinhala', 'Tamil', 'French', 'German', 'Japanese'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-xs disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Password Card */}
      <div className={`rounded-2xl border p-6 ${cardBg}`}>
        <h2 className={`font-bold mb-5 text-sm uppercase tracking-wider ${textMain}`}>Security & Password</h2>
        <div className="space-y-4 max-w-md">
          <PassField label="Current Password" key_="current" placeholder="Enter current password" />
          <PassField label="New Password" key_="newPass" placeholder="Enter new password" />
          <PassField label="Confirm New Password" key_="confirm" placeholder="Confirm new password" />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePasswordChange}
            disabled={savingPass}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-all shadow-xs disabled:opacity-60"
          >
            {savingPass ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            {savingPass ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;


