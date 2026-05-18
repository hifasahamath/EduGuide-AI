import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_AUTH } from '../../config/env';
import {
  User, Mail, Phone, Shield, Key, BrainCircuit, Bell, MessageSquare,
  Save, CheckCircle2, AlertTriangle, Clock, Activity, Settings,
  Eye, EyeOff, Download, Database, Zap, RefreshCw, Lock
} from 'lucide-react';

const API = API_AUTH;

// ── Reusable components ────────────────────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
      <span className="text-indigo-500">{icon}</span>
      <h3 className="font-bold text-gray-800">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
);

const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <button onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const Toast = ({ msg, type = 'success' }) => msg ? (
  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
    {type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {msg}
  </div>
) : null;

const TABS = [
  { key: 'profile', label: 'Profile', icon: <User size={15} /> },
  { key: 'security', label: 'Security', icon: <Lock size={15} /> },
  { key: 'ai', label: 'AI Settings', icon: <BrainCircuit size={15} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { key: 'activity', label: 'Activity Log', icon: <Activity size={15} /> },
  { key: 'system', label: 'System', icon: <Settings size={15} /> },
];

// ── Activity type config ───────────────────────────────────────────────────────
const activityIcon = (type) => {
  const cfg = {
    login: { icon: <Shield size={13} />, color: 'bg-blue-100 text-blue-600' },
    profile_update: { icon: <User size={13} />, color: 'bg-violet-100 text-violet-600' },
    password_change: { icon: <Key size={13} />, color: 'bg-orange-100 text-orange-600' },
    ai_settings: { icon: <BrainCircuit size={13} />, color: 'bg-indigo-100 text-indigo-600' },
    course_add: { icon: <Database size={13} />, color: 'bg-emerald-100 text-emerald-600' },
    training: { icon: <Zap size={13} />, color: 'bg-amber-100 text-amber-600' },
  };
  return cfg[type] || { icon: <Activity size={13} />, color: 'bg-gray-100 text-gray-500' };
};

const relTime = (ts) => {
  if (!ts) return '';
  const ms = ts._seconds ? ts._seconds * 1000 : new Date(ts).getTime();
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ms).toLocaleDateString();
};

// ── Main Component ─────────────────────────────────────────────────────────────
const Profile = () => {
  const { user, updateSessionProfile } = useAuth();
  const [tab, setTab] = useState('profile');
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [saving, setSaving] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  // 2FA
  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled || false);

  // AI settings
  const [aiMode, setAiMode] = useState(user?.aiSettings?.mode || 'Smart');
  const [fallbackEnabled, setFallbackEnabled] = useState(user?.aiSettings?.fallbackEnabled ?? true);
  const [fallbackMsg, setFallbackMsg] = useState(
    user?.aiSettings?.fallbackMessage ||
    "Sorry, I couldn't clearly understand your question. Please contact our customer care agent at 0754864688 for further assistance."
  );

  // Notifications
  const [notifFailed, setNotifFailed] = useState(user?.notifications?.failedQueries ?? true);
  const [notifNewUsers, setNotifNewUsers] = useState(user?.notifications?.newUsers ?? true);

  // Contact
  const [whatsapp, setWhatsapp] = useState(user?.contact?.whatsapp || '');
  const [supportEmail, setSupportEmail] = useState(user?.contact?.supportEmail || '');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const fetchActivity = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API}/profile/${user.id}/activity`);
      setActivityLogs(res.data || []);
    } catch { setActivityLogs([]); }
  }, [user?.id]);

  useEffect(() => {
    if (tab === 'activity') fetchActivity();
  }, [tab, fetchActivity]);

  // ── Saves ────────────────────────────────────────────────────────────────────

  const saveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/profile/${user.id}`, { name, email, phone });
      updateSessionProfile({ name, email, phone });
      showToast('Profile updated successfully!');
    } catch { showToast('Failed to update profile.', 'error'); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!currentPw || !newPw) return showToast('Fill in all fields.', 'error');
    if (newPw !== confirmPw) return showToast('New passwords do not match.', 'error');
    if (newPw.length < 6) return showToast('Password must be at least 6 characters.', 'error');
    setSaving(true);
    try {
      await axios.put(`${API}/profile/${user.id}/password`, { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      showToast('Password changed successfully!');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to change password.', 'error');
    }
    setSaving(false);
  };

  const saveAiSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/profile/${user.id}/ai-settings`, { mode: aiMode, fallbackEnabled, fallbackMessage: fallbackMsg });
      updateSessionProfile({ aiSettings: { mode: aiMode, fallbackEnabled, fallbackMessage: fallbackMsg } });
      showToast('AI settings saved!');
    } catch { showToast('Failed to save AI settings.', 'error'); }
    setSaving(false);
  };

  const saveNotifications = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/profile/${user.id}/notifications`, { failedQueries: notifFailed, newUsers: notifNewUsers });
      showToast('Notification preferences saved!');
    } catch { showToast('Failed to save.', 'error'); }
    setSaving(false);
  };

  const saveContact = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/profile/${user.id}/contact`, { whatsapp, supportEmail });
      updateSessionProfile({ contact: { whatsapp, supportEmail } });
      showToast('Contact settings saved!');
    } catch { showToast('Failed to save.', 'error'); }
    setSaving(false);
  };

  const exportData = () => {
    const data = {
      profile: { name, email, phone, role: user?.role },
      aiSettings: { aiMode, fallbackEnabled, fallbackMsg },
      notifications: { notifFailed, notifNewUsers },
      contact: { whatsapp, supportEmail },
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'eduguide-admin-config.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported!');
  };

  const apiKeyStatus = { status: 'Active', key: 'AIza••••••••••••••••••••••••••••••••••••' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />
        <div className="px-8 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="bg-white p-1.5 rounded-full border-4 border-white shadow-lg">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <User size={34} className="text-indigo-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Toast msg={toast.msg} type={toast.type} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'Admin'}</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-sm text-indigo-600 font-medium">
              <Shield size={14} /> {user?.role || 'Administrator'}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ──────────────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <Section title="Profile Information" icon={<User size={16} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full Name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" /></Field>
            <Field label="Email Address"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" /></Field>
            <Field label="Phone Number"><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+94 77 000 0000" /></Field>
            <Field label="Role">
              <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500">{user?.role || 'Administrator'}</div>
            </Field>
          </div>
          <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col gap-4">
            {/* Contact settings inline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="WhatsApp Number">
                <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="0754864688" />
              </Field>
              <Field label="Support Email">
                <Input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} placeholder="support@eduguide.lk" />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={saveContact} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium">
                <MessageSquare size={14} /> Save Contact
              </button>
              <button onClick={saveProfile} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* ── SECURITY TAB ─────────────────────────────────────────────────────── */}
      {tab === 'security' && (
        <div className="space-y-5">
          <Section title="Change Password" icon={<Key size={16} />}>
            <div className="space-y-4 max-w-md">
              <Field label="Current Password">
                <div className="relative">
                  <Input type={showPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
              <Field label="New Password"><Input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 6 characters" /></Field>
              <Field label="Confirm New Password"><Input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" /></Field>
              <button onClick={changePassword} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
                <Key size={14} /> {saving ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </Section>

          <Section title="Two-Factor Authentication" icon={<Shield size={16} />}>
            <Toggle
              checked={twoFactor}
              onChange={setTwoFactor}
              label="Enable 2FA"
              description="Add an extra layer of security to your admin account. (Simulated — no OTP sent)"
            />
            {twoFactor && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-700">
                🔐 2FA is active. In production, an OTP would be sent to <strong>{email}</strong> on each login.
              </div>
            )}
          </Section>

          <Section title="API Key" icon={<Zap size={16} />}>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-sm font-semibold text-gray-800">Gemini API Key</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{apiKeyStatus.key}</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                <CheckCircle2 size={11} /> {apiKeyStatus.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">API key is stored in server .env file. Update it there to change.</p>
          </Section>
        </div>
      )}

      {/* ── AI SETTINGS TAB ──────────────────────────────────────────────────── */}
      {tab === 'ai' && (
        <Section title="AI Control Settings" icon={<BrainCircuit size={16} />}>
          <div className="space-y-6">
            {/* Mode selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Response Mode</label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {['Smart', 'Strict'].map(mode => (
                  <button key={mode} onClick={() => setAiMode(mode)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${aiMode === mode ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className={`font-bold text-sm ${aiMode === mode ? 'text-indigo-700' : 'text-gray-700'}`}>{mode}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {mode === 'Smart' ? 'Context-aware, flexible NLP. Recommended.' : 'Exact keyword matching only. Fewer hallucinations.'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <Toggle
                checked={fallbackEnabled}
                onChange={setFallbackEnabled}
                label="Enable Fallback Responses"
                description="When disabled, bot returns nothing if intent is unknown."
              />
            </div>

            {/* Fallback message */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Fallback Message
              </label>
              <textarea rows={3} value={fallbackMsg} onChange={e => setFallbackMsg(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
              <p className="text-xs text-gray-400 mt-1">This message is shown when the chatbot cannot understand the user's query.</p>
            </div>

            <button onClick={saveAiSettings} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
              <Save size={14} /> {saving ? 'Saving…' : 'Save AI Settings'}
            </button>
          </div>
        </Section>
      )}

      {/* ── NOTIFICATIONS TAB ────────────────────────────────────────────────── */}
      {tab === 'notifications' && (
        <Section title="Notification Preferences" icon={<Bell size={16} />}>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <Toggle
              checked={notifFailed}
              onChange={setNotifFailed}
              label="Failed Query Alerts"
              description="Get notified when the chatbot falls back due to unknown questions."
            />
            <Toggle
              checked={notifNewUsers}
              onChange={setNotifNewUsers}
              label="New User Alerts"
              description="Get notified when a new student registers."
            />
          </div>
          <button onClick={saveNotifications} disabled={saving}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
            <Save size={14} /> {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </Section>
      )}

      {/* ── ACTIVITY LOG TAB ─────────────────────────────────────────────────── */}
      {tab === 'activity' && (
        <Section title="Admin Activity Log" icon={<Activity size={16} />}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Recent actions by this admin account</p>
            <button onClick={fetchActivity} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          {activityLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No activity logged yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityLogs.map((log, i) => {
                const cfg = activityIcon(log.type);
                return (
                  <div key={log.id || i} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{log.description}</p>
                      {log.device && <p className="text-xs text-gray-400 truncate">{log.device}</p>}
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">{relTime(log.timestamp)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* ── SYSTEM TAB ───────────────────────────────────────────────────────── */}
      {tab === 'system' && (
        <div className="space-y-5">
          <Section title="System Tools" icon={<Settings size={16} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={exportData}
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200">
                  <Download size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">Export Config</p>
                  <p className="text-xs text-gray-400">Download admin settings as JSON</p>
                </div>
              </button>

              <div className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Database size={18} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-700">Backup Database</p>
                  <p className="text-xs text-gray-400">Available in Firebase Console</p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="System Status" icon={<Activity size={16} />}>
            <div className="space-y-3">
              {[
                { label: 'Firebase Firestore', status: 'Connected', color: 'bg-emerald-100 text-emerald-700' },
                { label: 'Gemini AI API', status: 'Active', color: 'bg-emerald-100 text-emerald-700' },
                { label: 'NLP Service', status: 'Running', color: 'bg-emerald-100 text-emerald-700' },
                { label: 'Training System', status: 'Ready', color: 'bg-blue-100 text-blue-700' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">{s.label}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.color}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
};

export default Profile;
