import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import {
  User, Brain, MessageSquare, Bell, Shield, Lock, CreditCard,
  Sun, Moon, Save, Trash2, Download, Eye, EyeOff, CheckCircle,
  AlertTriangle, ChevronRight, Sparkles, Star, Crown, Zap
} from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

// ── Toggle Switch ──────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, disabled }) => (
  <button type="button" onClick={() => !disabled && onChange(!value)} disabled={disabled}
    className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? 'bg-violet-600' : 'bg-gray-300'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);

// ── Section wrapper ────────────────────────────────────────────────────────────
const Section = ({ title, children, isDark }) => (
  <div className={`rounded-xl border p-5 space-y-4 ${isDark ? 'border-white/8 bg-[#2a2a2a]' : 'border-gray-100 bg-white shadow-sm'}`}>
    {title && <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</h3>}
    {children}
  </div>
);

// ── Row ────────────────────────────────────────────────────────────────────────
const Row = ({ label, desc, children, isDark }) => (
  <div className={`flex items-center justify-between gap-4 py-2 ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
    <div className="min-w-0">
      <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{label}</p>
      {desc && <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{desc}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

// ── Plan badge ─────────────────────────────────────────────────────────────────
const PLANS = [
  { id: 'free', label: 'Free', price: 'LKR 0/mo', icon: <Zap size={16}/>, color: 'from-gray-400 to-gray-500', features: ['20 chats/day', 'Basic AI', 'Standard responses'] },
  { id: 'pro', label: 'Pro', price: 'LKR 1,500/mo', icon: <Star size={16}/>, color: 'from-violet-500 to-indigo-600', features: ['Unlimited chats', 'Advanced AI', 'Chat export', 'Priority support'] },
  { id: 'premium', label: 'Premium', price: 'LKR 3,500/mo', icon: <Crown size={16}/>, color: 'from-amber-400 to-orange-500', features: ['Everything in Pro', 'Career guidance', 'Personalized roadmap', 'AI accuracy analytics'] },
];

const FIELDS = ['IT', 'Business', 'Medicine', 'Engineering', 'Law', 'Arts', 'Education', 'Hospitality'];
const LEVELS = ['O/L', 'A/L', 'Diploma', 'Undergraduate', 'Postgraduate'];
const LANGUAGES = ['English', 'Sinhala', 'Tamil'];
const STYLES = ['Concise', 'Detailed', 'Friendly', 'Formal'];

// ── Main Settings Page ─────────────────────────────────────────────────────────
const SettingsPage = ({ isDark }) => {
  const { user, updateSessionProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState('account');
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [nameEdit, setNameEdit] = useState(user?.name || '');

  const showToast = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(''), 2500); };

  // Load settings
  useEffect(() => {
    if (!user?.id) return;
    axios.get(`${API}/settings/${user.id}`).then(r => setSettings(r.data || {})).catch(() => {});
  }, [user?.id]);

  const save = useCallback(async (patch) => {
    const merged = { ...settings, ...patch };
    setSettings(merged);
    setSaving(true);
    try {
      await axios.put(`${API}/settings/${user.id}`, merged);
      showToast('Saved!');
    } catch { showToast('Save failed', true); }
    setSaving(false);
  }, [settings, user?.id]);

  const set = (key, val) => save({ [key]: val });

  const clearChats = async () => {
    if (!window.confirm('Delete ALL chat history permanently?')) return;
    try {
      const r = await axios.delete(`${API}/settings/${user.id}/chats`);
      showToast(`Cleared ${r.data.deleted} chats.`);
    } catch { showToast('Failed to clear chats', true); }
  };

  const changePassword = async () => {
    if (pwForm.next !== pwForm.confirm) return showToast('Passwords do not match', true);
    if (pwForm.next.length < 6) return showToast('Password must be at least 6 characters', true);
    try {
      await axios.post(`${API}/auth/change-password`, { userId: user.id, currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current: '', next: '', confirm: '' });
      showToast('Password changed!');
    } catch { showToast('Failed. Check current password.', true); }
  };

  // Theme helpers
  const bg = isDark ? 'bg-[#1a1a1a]' : 'bg-[#f4f4f8]';
  const sidebarBg = isDark ? 'bg-[#171717]' : 'bg-white';
  const textMain = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderC = isDark ? 'border-white/8' : 'border-gray-200';
  const inputCls = `w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all ${isDark ? 'bg-[#2f2f2f] border-white/10 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900'}`;

  const TABS = [
    { id: 'account',       label: 'My Account',     icon: <User size={15}/> },
    { id: 'ai',            label: 'AI Preferences',  icon: <Brain size={15}/> },
    { id: 'chat',          label: 'Chat Settings',   icon: <MessageSquare size={15}/> },
    { id: 'notifications', label: 'Notifications',   icon: <Bell size={15}/> },
    { id: 'privacy',       label: 'Privacy & Data',  icon: <Shield size={15}/> },
    { id: 'security',      label: 'Security',        icon: <Lock size={15}/> },
    { id: 'subscription',  label: 'Subscription',    icon: <CreditCard size={15}/> },
  ];

  const currentPlan = settings.plan || 'free';

  return (
    <div className={`flex h-full ${bg}`}>
      {/* Sidebar */}
      <div className={`w-52 flex-shrink-0 border-r ${borderC} ${sidebarBg} flex flex-col`}>
        <div className="p-4 border-b border-inherit">
          <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Settings</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                ${tab === t.id
                  ? isDark ? 'bg-violet-600/20 text-violet-300' : 'bg-violet-50 text-violet-700'
                  : isDark ? 'text-gray-400 hover:bg-white/5 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>
        <div className={`p-3 border-t ${borderC}`}>
          <button onClick={toggleTheme} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors
            ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}>
            {isDark ? <><Sun size={13}/> Light Mode</> : <><Moon size={13}/> Dark Mode</>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto p-6 space-y-4">
          {/* Toast */}
          {toast && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
              ${toast.err ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {toast.err ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
              {toast.msg}
            </div>
          )}

          {/* ── MY ACCOUNT ─────────────────────────────────────────────────── */}
          {tab === 'account' && (
            <>
              <Section title="Profile" isDark={isDark}>
                <div className="flex items-center gap-4 pb-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
                    {user?.profilePic
                      ? <img src={user.profilePic} className="w-16 h-16 rounded-2xl object-cover" alt="avatar"/>
                      : <span className="text-white text-2xl font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>}
                  </div>
                  <div>
                    <p className={`font-bold text-lg ${textMain}`}>{user?.name}</p>
                    <p className={`text-sm ${textMuted}`}>{user?.email}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block
                      ${user?.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="space-y-3 pt-2 border-t border-inherit">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>Display Name</label>
                    <input className={inputCls} value={nameEdit} onChange={e => setNameEdit(e.target.value)} placeholder="Your name"/>
                  </div>
                  <button onClick={() => updateSessionProfile?.({ name: nameEdit })}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors">
                    <Save size={13}/> Save Changes
                  </button>
                </div>
              </Section>
              <Section title="Account Info" isDark={isDark}>
                <Row label="Email" desc={user?.email} isDark={isDark}><span className={`text-xs ${textMuted}`}>Cannot change</span></Row>
                <Row label="Joined" isDark={isDark}><span className={`text-xs ${textMuted}`}>{user?.createdAt ? new Date(user.createdAt._seconds ? user.createdAt._seconds*1000 : user.createdAt).toLocaleDateString() : 'N/A'}</span></Row>
                <Row label="Plan" isDark={isDark}>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${currentPlan === 'premium' ? 'bg-amber-100 text-amber-700' : currentPlan === 'pro' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
                    {currentPlan.toUpperCase()}
                  </span>
                </Row>
              </Section>
              <Section isDark={isDark}>
                <button className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium" onClick={() => window.confirm('Delete account permanently?') && showToast('Contact support to delete your account')}>
                  <Trash2 size={14}/> Delete Account
                </button>
              </Section>
            </>
          )}

          {/* ── AI PREFERENCES ─────────────────────────────────────────────── */}
          {tab === 'ai' && (
            <>
              <Section title="Learning Profile" isDark={isDark}>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>Preferred Field</label>
                    <div className="flex flex-wrap gap-1.5">
                      {FIELDS.map(f => (
                        <button key={f} onClick={() => set('preferredField', f)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                            ${settings.preferredField === f
                              ? 'bg-violet-600 text-white border-violet-600'
                              : isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>Education Level</label>
                    <div className="flex flex-wrap gap-1.5">
                      {LEVELS.map(l => (
                        <button key={l} onClick={() => set('educationLevel', l)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                            ${settings.educationLevel === l
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
              <Section title="Response Style" isDark={isDark}>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map(s => (
                    <button key={s} onClick={() => set('responseStyle', s)}
                      className={`p-3 rounded-xl border text-sm font-medium text-left transition-all
                        ${settings.responseStyle === s
                          ? isDark ? 'border-violet-500 bg-violet-600/20 text-violet-300' : 'border-violet-500 bg-violet-50 text-violet-700'
                          : isDark ? 'border-white/8 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Language" isDark={isDark}>
                <div className="space-y-1.5">
                  {LANGUAGES.map(l => (
                    <button key={l} onClick={() => set('language', l)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all
                        ${settings.language === l || (!settings.language && l === 'English')
                          ? isDark ? 'border-violet-500 bg-violet-600/15 text-violet-300' : 'border-violet-300 bg-violet-50 text-violet-700'
                          : isDark ? 'border-white/8 text-gray-300 hover:bg-white/5' : 'border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
                      {l}
                      {(settings.language === l || (!settings.language && l === 'English')) && <CheckCircle size={14} className="text-violet-500"/>}
                    </button>
                  ))}
                </div>
              </Section>
              <Section isDark={isDark}>
                <div className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-violet-600/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-100'}`}>
                  <Sparkles size={15} className="text-violet-500 flex-shrink-0 mt-0.5"/>
                  <p className={`text-xs ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                    Your preferences are used to personalise course recommendations and AI responses. Changes apply immediately.
                  </p>
                </div>
              </Section>
            </>
          )}

          {/* ── CHAT SETTINGS ──────────────────────────────────────────────── */}
          {tab === 'chat' && (
            <>
              <Section title="Chat Behaviour" isDark={isDark}>
                <Row label="Save chat history" desc="Store conversations in your account" isDark={isDark}>
                  <Toggle value={settings.saveHistory !== false} onChange={v => set('saveHistory', v)}/>
                </Row>
                <Row label="Auto-generate titles" desc="Name chats from the first message" isDark={isDark}>
                  <Toggle value={settings.autoTitle !== false} onChange={v => set('autoTitle', v)}/>
                </Row>
                <Row label="Show quick action buttons" desc="Fees, Duration, Location chips after responses" isDark={isDark}>
                  <Toggle value={settings.showQuickActions !== false} onChange={v => set('showQuickActions', v)}/>
                </Row>
                <Row label="Show course cards" desc="Rich cards instead of plain text" isDark={isDark}>
                  <Toggle value={settings.showCourseCards !== false} onChange={v => set('showCourseCards', v)}/>
                </Row>
              </Section>
              <Section title="Data" isDark={isDark}>
                <Row label="Export all chats" desc="Download as JSON file" isDark={isDark}>
                  <button onClick={() => showToast('Export coming soon')}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors
                      ${isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    <Download size={12}/> Export
                  </button>
                </Row>
                <Row label="Clear all chats" desc="Permanently delete all conversations" isDark={isDark}>
                  <button onClick={clearChats} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-200 transition-colors">
                    <Trash2 size={12}/> Clear
                  </button>
                </Row>
              </Section>
            </>
          )}

          {/* ── NOTIFICATIONS ──────────────────────────────────────────────── */}
          {tab === 'notifications' && (
            <Section title="Notification Preferences" isDark={isDark}>
              {[
                { key: 'notifMessages',  label: 'New message alerts',    desc: 'Get notified when AI responds' },
                { key: 'notifCourses',   label: 'New course alerts',     desc: 'When new courses are added' },
                { key: 'notifWeekly',    label: 'Weekly progress report', desc: 'Summary of your activity' },
                { key: 'notifUpdates',   label: 'System updates',         desc: 'EduGuide AI feature updates' },
              ].map(n => (
                <Row key={n.key} label={n.label} desc={n.desc} isDark={isDark}>
                  <Toggle value={!!settings[n.key]} onChange={v => set(n.key, v)}/>
                </Row>
              ))}
            </Section>
          )}

          {/* ── PRIVACY & DATA ─────────────────────────────────────────────── */}
          {tab === 'privacy' && (
            <>
              <Section title="Data Usage" isDark={isDark}>
                <Row label="Allow data analytics" desc="Help improve AI responses" isDark={isDark}>
                  <Toggle value={settings.allowAnalytics !== false} onChange={v => set('allowAnalytics', v)}/>
                </Row>
                <Row label="Personalised recommendations" desc="Use chat history for course suggestions" isDark={isDark}>
                  <Toggle value={settings.personalised !== false} onChange={v => set('personalised', v)}/>
                </Row>
              </Section>
              <Section title="Your Data" isDark={isDark}>
                <Row label="Download my data" desc="Get a copy of all your data" isDark={isDark}>
                  <button onClick={() => showToast('Data export coming soon')}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors
                      ${isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    <Download size={12}/> Download
                  </button>
                </Row>
                <Row label="Clear chat history" desc="Permanently deletes all conversations" isDark={isDark}>
                  <button onClick={clearChats} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-200 transition-colors">
                    <Trash2 size={12}/> Clear
                  </button>
                </Row>
              </Section>
            </>
          )}

          {/* ── SECURITY ───────────────────────────────────────────────────── */}
          {tab === 'security' && (
            <>
              <Section title="Change Password" isDark={isDark}>
                <div className="space-y-3">
                  {[{ key:'current', label:'Current Password' }, { key:'next', label:'New Password' }, { key:'confirm', label:'Confirm New Password' }].map(f => (
                    <div key={f.key}>
                      <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>{f.label}</label>
                      <div className="relative">
                        <input type={showPw ? 'text' : 'password'} className={inputCls} value={pwForm[f.key]}
                          onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder="••••••••"/>
                        {f.key === 'next' && (
                          <button type="button" onClick={() => setShowPw(!showPw)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted}`}>
                            {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button onClick={changePassword}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors">
                    <Lock size={13}/> Update Password
                  </button>
                </div>
              </Section>
              <Section title="Login Activity" isDark={isDark}>
                <div className={`text-xs ${textMuted} text-center py-6`}>
                  Login history tracking coming soon.
                </div>
              </Section>
            </>
          )}

          {/* ── SUBSCRIPTION ───────────────────────────────────────────────── */}
          {tab === 'subscription' && (
            <>
              <div className="grid grid-cols-1 gap-3">
                {PLANS.map(plan => (
                  <div key={plan.id} className={`rounded-xl border-2 p-5 transition-all
                    ${currentPlan === plan.id
                      ? isDark ? 'border-violet-500 bg-violet-600/10' : 'border-violet-500 bg-violet-50'
                      : isDark ? 'border-white/8 bg-[#2a2a2a]' : 'border-gray-100 bg-white shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center text-white`}>
                          {plan.icon}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${textMain}`}>{plan.label}</p>
                          <p className={`text-xs ${textMuted}`}>{plan.price}</p>
                        </div>
                      </div>
                      {currentPlan === plan.id
                        ? <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-600 text-white rounded-full">CURRENT</span>
                        : <button onClick={() => { set('plan', plan.id); showToast(`Upgraded to ${plan.label}!`); }}
                            className="text-xs font-bold px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">
                            {plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                          </button>}
                    </div>
                    <ul className="space-y-1">
                      {plan.features.map(f => (
                        <li key={f} className={`flex items-center gap-2 text-xs ${textMuted}`}>
                          <CheckCircle size={11} className="text-emerald-500 flex-shrink-0"/>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <Section isDark={isDark}>
                <p className={`text-xs text-center ${textMuted}`}>
                  Payments are processed securely. Cancel anytime. Contact support for billing issues.
                </p>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
