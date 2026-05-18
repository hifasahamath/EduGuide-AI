import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_AUTH } from '../config/env';
import { useTheme } from '../contexts/ThemeContext';
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
    fetch(`${API_AUTH}/profile/${user.id}`)
      .then(r => r.json())
      .then(data => setForm({
        name: data.name || '',
        email: data.email || '',
        schoolName: data.schoolName || '',
        address: data.address || '',
        age: data.age || '',
        language: data.language || 'English',
        profilePic: data.profilePic || ''
      }))
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
      const res = await fetch(`${API_AUTH}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, schoolName: form.schoolName, address: form.address, age: form.age, language: form.language, profilePic: form.profilePic })
      });
      if (res.ok) {
        updateSessionProfile({ name: form.name, schoolName: form.schoolName, address: form.address, age: form.age, language: form.language, profilePic: form.profilePic });
        showToast('Profile saved successfully!');
      } else {
        showToast('Failed to save profile.', 'error');
      }
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
      const res = await fetch(`${API_AUTH}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwords.newPass })
      });
      if (res.ok) {
        showToast('Password changed successfully!');
        setPasswords({ current: '', newPass: '', confirm: '' });
      } else {
        showToast('Failed to change password.', 'error');
      }
    } catch {
      showToast('Could not connect to server.', 'error');
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

  const bg = isDark ? 'bg-[#212121]' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-[#2a2a2a] border-white/10' : 'bg-white border-gray-200 shadow-sm';
  const inputBg = isDark ? 'bg-[#333] border-white/10 text-gray-100 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400';
  const labelColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const textMain = isDark ? 'text-gray-100' : 'text-gray-900';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';

  const Field = ({ icon, label, type = 'text', value, onChange, placeholder, readonly }) => (
    <div>
      <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>{label}</label>
      <div className="relative">
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{icon}</div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readonly}
          className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all ${inputBg} ${readonly ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );

  const PassField = ({ label, key_, placeholder }) => (
    <div>
      <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>{label}</label>
      <div className="relative">
        <Lock size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        <input
          type={showPass[key_] ? 'text' : 'password'}
          value={passwords[key_]}
          onChange={e => setPasswords(p => ({ ...p, [key_]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all ${inputBg}`}
        />
        <button type="button" onClick={() => setShowPass(s => ({ ...s, [key_]: !s[key_] }))}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
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
            toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {toast.message}
        </motion.div>
      )}

      {/* Page Header */}
      <div>
        <h1 className={`text-2xl font-bold ${textMain}`}>Your Profile</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage your personal information and account settings</p>
      </div>

      {/* Avatar Card */}
      <div className={`rounded-2xl border p-6 flex items-center gap-6 ${cardBg}`}>
        <div className="relative group flex-shrink-0">
          {form.profilePic ? (
            <img src={form.profilePic} alt="profile" className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl font-bold">{form.name?.[0]?.toUpperCase() || '?'}</span>
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploadingPic ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
        </div>
        <div>
          <p className={`text-xl font-bold ${textMain}`}>{form.name || 'Your Name'}</p>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{form.email}</p>
          <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-500 text-xs font-semibold">
            ✦ Student
          </span>
        </div>
        <div className="ml-auto hidden md:block">
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Click avatar to change photo</p>
        </div>
      </div>

      {/* Info Card */}
      <div className={`rounded-2xl border p-6 ${cardBg}`}>
        <h2 className={`font-bold mb-5 text-base ${textMain}`}>Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field icon={<User size={15} />} label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
          <Field icon={<Mail size={15} />} label="Email Address" value={form.email} readonly placeholder="Email" />
          <Field icon={<School size={15} />} label="School / Institution" value={form.schoolName} onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))} placeholder="e.g. ESOFT Metro Campus" />
          <Field icon={<Calendar size={15} />} label="Age" type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="Your age" />
          <div className="md:col-span-2">
            <Field icon={<MapPin size={15} />} label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Your city / address" />
          </div>
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${labelColor}`}>Language</label>
            <div className="relative">
              <Globe size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <select
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all appearance-none ${inputBg}`}
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
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-violet-500/20 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Password Card */}
      <div className={`rounded-2xl border p-6 ${cardBg}`}>
        <h2 className={`font-bold mb-5 text-base ${textMain}`}>Change Password</h2>
        <div className="space-y-4 max-w-md">
          <PassField label="Current Password" key_="current" placeholder="Enter current password" />
          <PassField label="New Password" key_="newPass" placeholder="Enter new password" />
          <PassField label="Confirm New Password" key_="confirm" placeholder="Confirm new password" />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePasswordChange}
            disabled={savingPass}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-emerald-500/20 disabled:opacity-60"
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
