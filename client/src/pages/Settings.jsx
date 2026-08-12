import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import {
  User, Brain, MessageSquare, Bell, Shield, Lock, CreditCard,
  Sun, Moon, Save, Trash2, Download, Eye, EyeOff, CheckCircle,
  AlertTriangle, ChevronRight, Sparkles, Star, Crown, Zap, PanelLeft
} from 'lucide-react';

// ── Toggle Switch ──────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, disabled }) => (
  <button type="button" onClick={() => !disabled && onChange(!value)} disabled={disabled}
    className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-xs transition-transform duration-200 ${value ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
  </button>
);

// ── Section wrapper ────────────────────────────────────────────────────────────
const Section = ({ title, children, isDark }) => (
  <div className={`rounded-2xl border p-5 space-y-4 ${isDark ? 'border-slate-800/90 bg-slate-900/90' : 'border-slate-200/90 bg-white shadow-xs'}`}>
    {title && <h3 className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</h3>}
    {children}
  </div>
);

// ── Row ────────────────────────────────────────────────────────────────────────
const Row = ({ label, desc, children, isDark }) => (
  <div className={`flex items-center justify-between gap-4 py-2 ${isDark ? 'border-slate-800/40' : 'border-slate-100'}`}>
    <div className="min-w-0">
      <p className={`text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{label}</p>
      {desc && <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

// ── Plan badge ─────────────────────────────────────────────────────────────────
const PLANS = [
  { id: 'free', label: 'Free Tier', price: 'LKR 0/mo', icon: <Zap size={16}/>, color: 'bg-slate-700 text-slate-200', features: ['20 chats/day', 'Standard AI model', 'Basic course search'] },
  { id: 'pro', label: 'Pro Student', price: 'LKR 1,500/mo', icon: <Star size={16}/>, color: 'bg-indigo-600 text-white', features: ['Unlimited chats', 'Advanced AI recommendations', 'Export chat transcripts', 'Priority academic advisor link'] },
  { id: 'premium', label: 'Premium Plus', price: 'LKR 3,500/mo', icon: <Crown size={16}/>, color: 'bg-amber-500 text-white', features: ['Everything in Pro', 'Personalized career roadmap', 'Institutional fee comparison matrix', 'Direct phone consultation'] },
];

const FIELDS = ['IT', 'Business', 'Medicine', 'Engineering', 'Law', 'Arts', 'Education', 'Hospitality'];
const LEVELS = ['O/L', 'A/L', 'Diploma', 'Undergraduate', 'Postgraduate'];
const LANGUAGES = ['English', 'Sinhala', 'Tamil'];
const STYLES = ['Concise', 'Detailed', 'Friendly', 'Formal'];

// ── Main Settings Page ─────────────────────────────────────────────────────────
const SettingsPage = ({ isDark, sidebarOpen, toggleSidebar }) => {
  const { user, updateSessionProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState('account');
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [nameEdit, setNameEdit] = useState(user?.name || '');
  const [activityLog, setActivityLog] = useState([]);

  const showToast = (msg, err) => { setToast({ msg, err }); setTimeout(() => setToast(''), 2500); };

  // Load settings
  useEffect(() => {
    if (!user?.id) return;
    api.get(`/settings/${user.id}`).then(r => setSettings(r.data || {})).catch(() => {});
    api.get(`/auth/${user.id}/activity`).then(r => setActivityLog(r.data || [])).catch(() => {});
  }, [user?.id]);

  const save = useCallback(async (patch) => {
    const merged = { ...settings, ...patch };
    setSettings(merged);
    setSaving(true);
    try {
      await api.put(`/settings/${user.id}`, merged);
      showToast('Saved!');
    } catch { showToast('Save failed', true); }
    setSaving(false);
  }, [settings, user?.id]);

  const set = (key, val) => save({ [key]: val });

  const clearChats = async () => {
    if (!window.confirm('Delete ALL chat history permanently?')) return;
    try {
      const r = await api.delete(`/settings/${user.id}/chats`);
      showToast(`Cleared ${r.data.deleted} chats.`);
    } catch { showToast('Failed to clear chats', true); }
  };

  const changePassword = async () => {
    if (pwForm.next !== pwForm.confirm) return showToast('Passwords do not match', true);
    if (pwForm.next.length < 6) return showToast('Password must be at least 6 characters', true);
    try {
      await api.post('/auth/change-password', { userId: user.id, currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current: '', next: '', confirm: '' });
      showToast('Password changed!');
    } catch { showToast('Failed. Check current password.', true); }
  };

  const exportData = async () => {
    try {
      showToast('Preparing your data export...');
      const response = await api.get(`/settings/${user.id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `eduguide_export_${user.id}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast('Export successful!');
    } catch {
      showToast('Failed to export data', true);
    }
  };

  // Theme helpers
  const bg = isDark ? 'bg-[#090d16]' : 'bg-[#f8fafc]';
  const sidebarBg = isDark ? 'bg-[#0b101d]' : 'bg-[#f1f5f9]';
  const textMain = isDark ? 'text-slate-100' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderC = isDark ? 'border-slate-800/80' : 'border-slate-200/90';
  const inputCls = `w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${isDark ? 'bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'}`;

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
        <div className="p-4 border-b border-inherit flex items-center justify-between">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Settings</p>
          {!sidebarOpen && (
            <button onClick={toggleSidebar} className={`p-1 rounded-lg ${textMuted} hover:text-indigo-400`} title="Toggle sidebar">
              <PanelLeft size={15} />
            </button>
          )}
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left
                ${tab === t.id
                  ? isDark ? 'bg-indigo-500/15 text-indigo-300 border-l-2 border-indigo-500' : 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600'
                  : isDark ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-200/60'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>
        <div className={`p-3 border-t ${borderC}`}>
          <button onClick={toggleTheme} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors
            ${isDark ? 'text-slate-400 hover:bg-slate-800/60' : 'text-slate-600 hover:bg-slate-200/60'}`}>
            {isDark ? <><Sun size={14} className="text-amber-400"/> Light Mode</> : <><Moon size={14} className="text-indigo-600"/> Dark Mode</>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-4">
          {/* Toast */}
          {toast && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold ${
              toast.err ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {toast.err ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
              {toast.msg}
            </div>
          )}

          {/* ── MY ACCOUNT ─────────────────────────────────────────────────── */}
          {tab === 'account' && (
            <>
              <Section title="Profile Overview" isDark={isDark}>
                <div className="flex items-center gap-4 pb-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xs flex-shrink-0">
                    {user?.profilePic
                      ? <img src={user.profilePic} className="w-14 h-14 rounded-2xl object-cover" alt="avatar"/>
                      : <span className="text-white text-xl font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>}
                  </div>
                  <div>
                    <p className={`font-bold text-base ${textMain}`}>{user?.name}</p>
                    <p className={`text-xs ${textMuted}`}>{user?.email}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 mt-1 inline-block">
                      {(user?.role || 'student').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="space-y-3 pt-3 border-t border-inherit">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${textMuted}`}>Display Name</label>
                    <input className={inputCls} value={nameEdit} onChange={e => setNameEdit(e.target.value)} placeholder="Your name"/>
                  </div>
                  <button onClick={() => updateSessionProfile?.({ name: nameEdit })}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors shadow-xs">
                    <Save size={13}/> Save Changes
                  </button>
                </div>
              </Section>
              <Section title="Account Metadata" isDark={isDark}>
                <Row label="Email" desc={user?.email} isDark={isDark}><span className={`text-xs ${textMuted}`}>Primary identity</span></Row>
                <Row label="Joined" isDark={isDark}><span className={`text-xs ${textMuted}`}>{user?.createdAt ? new Date(user.createdAt._seconds ? user.createdAt._seconds*1000 : user.createdAt).toLocaleDateString() : 'Active Member'}</span></Row>
                <Row label="Active Plan" isDark={isDark}>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                    {currentPlan.toUpperCase()}
                  </span>
                </Row>
              </Section>
              <Section isDark={isDark}>
                <button className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 font-semibold" onClick={() => window.confirm('Delete account permanently?') && showToast('Contact support to delete your account')}>
                  <Trash2 size={14}/> Delete Account
                </button>
              </Section>
            </>
          )}

          {/* ── AI PREFERENCES ─────────────────────────────────────────────── */}
          {tab === 'ai' && (
            <>
              <Section title="Target Field & Education Level" isDark={isDark}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-2 ${textMuted}`}>Preferred Field of Study</label>
                    <div className="flex flex-wrap gap-1.5">
                      {FIELDS.map(f => (
                        <button key={f} onClick={() => set('preferredField', f)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            settings.preferredField === f
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-2 ${textMuted}`}>Current Qualification Level</label>
                    <div className="flex flex-wrap gap-1.5">
                      {LEVELS.map(l => (
                        <button key={l} onClick={() => set('educationLevel', l)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            settings.educationLevel === l
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
              <Section title="AI Response Tone" isDark={isDark}>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map(s => (
                    <button key={s} onClick={() => set('responseStyle', s)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        settings.responseStyle === s
                          ? isDark ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Language Context" isDark={isDark}>
                <div className="space-y-1.5">
                  {LANGUAGES.map(l => (
                    <button key={l} onClick={() => set('language', l)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        settings.language === l || (!settings.language && l === 'English')
                          ? isDark ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-indigo-300 bg-indigo-50 text-indigo-700'
                          : isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}>
                      {l}
                      {(settings.language === l || (!settings.language && l === 'English')) && <CheckCircle size={14} className="text-indigo-500"/>}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* ── CHAT SETTINGS ──────────────────────────────────────────────── */}
          {tab === 'chat' && (
            <>
              <Section title="Session Behaviour" isDark={isDark}>
                <Row label="Save conversation history" desc="Store chats securely in your cloud account" isDark={isDark}>
                  <Toggle value={settings.saveHistory !== false} onChange={v => set('saveHistory', v)}/>
                </Row>
                <Row label="Auto-title sessions" desc="Automatically name chat sessions from first user input" isDark={isDark}>
                  <Toggle value={settings.autoTitle !== false} onChange={v => set('autoTitle', v)}/>
                </Row>
                <Row label="Show quick action chips" desc="Display contextual followup suggestions below AI responses" isDark={isDark}>
                  <Toggle value={settings.showQuickActions !== false} onChange={v => set('showQuickActions', v)}/>
                </Row>
                <Row label="Structured course cards" desc="Format degree options as visual cards" isDark={isDark}>
                  <Toggle value={settings.showCourseCards !== false} onChange={v => set('showCourseCards', v)}/>
                </Row>
              </Section>
              <Section title="Data Management" isDark={isDark}>
                <Row label="Export all conversations" desc="Download complete history as JSON" isDark={isDark}>
                  <button onClick={exportData}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}>
                    <Download size={12}/> Export JSON
                  </button>
                </Row>
                <Row label="Clear chat records" desc="Permanently remove all previous sessions" isDark={isDark}>
                  <button onClick={clearChats} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors">
                    <Trash2 size={12}/> Clear History
                  </button>
                </Row>
              </Section>
            </>
          )}

          {/* ── NOTIFICATIONS ──────────────────────────────────────────────── */}
          {tab === 'notifications' && (
            <Section title="Notification Controls" isDark={isDark}>
              {[
                { key: 'notifMessages',  label: 'Advisor responses',     desc: 'Alert when assistant finishes generating long responses' },
                { key: 'notifCourses',   label: 'New degree additions',  desc: 'Notifies when new accredited programs are indexed' },
                { key: 'notifWeekly',    label: 'Weekly summary',        desc: 'Digest of saved recommendations and fee updates' },
                { key: 'notifUpdates',   label: 'Platform updates',       desc: 'Feature and model improvements' },
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
              <Section title="Privacy & Analytics" isDark={isDark}>
                <Row label="Improve recommendations" desc="Use anonymized conversation patterns to improve guidance" isDark={isDark}>
                  <Toggle value={settings.allowAnalytics !== false} onChange={v => set('allowAnalytics', v)}/>
                </Row>
                <Row label="Personalised recommendations" desc="Tailor suggestions to your saved education preferences" isDark={isDark}>
                  <Toggle value={settings.personalised !== false} onChange={v => set('personalised', v)}/>
                </Row>
              </Section>
            </>
          )}

          {/* ── SECURITY ───────────────────────────────────────────────────── */}
          {tab === 'security' && (
            <>
              <Section title="Change Security Password" isDark={isDark}>
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
                    className="flex items-center gap-1.5 px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors shadow-xs">
                    <Lock size={13}/> Update Password
                  </button>
                </div>
              </Section>
              <Section title="Recent Login Audit Log" isDark={isDark}>
                {activityLog.length === 0 ? (
                  <div className={`text-xs ${textMuted} text-center py-6`}>
                    No recent activity recorded.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activityLog.map((log, i) => (
                      <div key={i} className={`flex items-center justify-between gap-4 py-2 ${isDark ? 'border-slate-800/40 border-b last:border-0' : 'border-slate-100 border-b last:border-0'}`}>
                        <div>
                          <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{log.description || log.type}</p>
                          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {log.device || 'Web Browser'} • {log.ip || 'Local Session'}
                          </p>
                        </div>
                        <div className={`text-[10px] ${textMuted}`}>
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </>
          )}

          {/* ── SUBSCRIPTION ───────────────────────────────────────────────── */}
          {tab === 'subscription' && (
            <>
              <div className="grid grid-cols-1 gap-3">
                {PLANS.map(plan => (
                  <div key={plan.id} className={`rounded-2xl border-2 p-5 transition-all ${
                    currentPlan === plan.id
                      ? isDark ? 'border-indigo-500 bg-indigo-950/30' : 'border-indigo-600 bg-indigo-50/50'
                      : isDark ? 'border-slate-800/80 bg-slate-900/90' : 'border-slate-200/90 bg-white shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl ${plan.color} flex items-center justify-center`}>
                          {plan.icon}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${textMain}`}>{plan.label}</p>
                          <p className={`text-xs font-semibold ${textMuted}`}>{plan.price}</p>
                        </div>
                      </div>
                      {currentPlan === plan.id
                        ? <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-600 text-white rounded-full">ACTIVE</span>
                        : <button onClick={() => { set('plan', plan.id); showToast(`Upgraded to ${plan.label}!`); }}
                            className="text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-xs">
                            {plan.id === 'free' ? 'Select Plan' : 'Upgrade'}
                          </button>}
                    </div>
                    <ul className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      {plan.features.map(f => (
                        <li key={f} className={`flex items-center gap-2 text-xs ${textMuted}`}>
                          <CheckCircle size={12} className="text-emerald-500 flex-shrink-0"/>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

