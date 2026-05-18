import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_USERS } from '../../config/env';
import {
  Users as UsersIcon, Search, Shield, GraduationCap, RefreshCw,
  Mail, Phone, Calendar, MapPin, Activity, MessageSquare, BrainCircuit,
  Pencil, Trash2, Ban, ChevronRight, X, CheckCircle2, AlertTriangle,
  Clock, Zap, BookOpen, Save, XCircle
} from 'lucide-react';

const API = API_USERS;

// ── Shared helpers ─────────────────────────────────────────────────────────────
const relTime = (ts) => {
  if (!ts) return 'Never';
  const ms = ts._seconds ? ts._seconds * 1000 : new Date(ts).getTime();
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const fmtDate = (ts) => {
  if (!ts) return '—';
  const ms = ts._seconds ? ts._seconds * 1000 : new Date(ts).getTime();
  return new Date(ms).toLocaleDateString();
};

const ROLE_CFG = {
  admin:   { cls: 'bg-red-100 text-red-700',    icon: <Shield size={10} />,      label: 'ADMIN' },
  student: { cls: 'bg-violet-100 text-violet-700', icon: <GraduationCap size={10} />, label: 'STUDENT' },
  client:  { cls: 'bg-violet-100 text-violet-700', icon: <GraduationCap size={10} />, label: 'STUDENT' },
};

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CFG[role] || { cls: 'bg-gray-100 text-gray-600', icon: null, label: (role || 'USER').toUpperCase() };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
};

const EngagementBar = ({ score }) => {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} rounded-full h-1.5 transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-7 text-right">{score}</span>
    </div>
  );
};

const AvatarBox = ({ user, size = 'md' }) => {
  const sz = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-10 h-10 text-base';
  const initials = (user.name || user.email || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const palette = ['from-violet-500 to-indigo-500','from-blue-500 to-cyan-500','from-emerald-500 to-teal-500','from-orange-500 to-amber-500','from-pink-500 to-rose-500'];
  const grad = palette[(user.name || '').charCodeAt(0) % palette.length];
  if (user.profilePic) return <img src={user.profilePic} alt="" className={`${sz} rounded-xl object-cover`} />;
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
};

// ── Edit Modal ─────────────────────────────────────────────────────────────────
const EditModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({ name: user.name || '', email: user.email || '', phone: user.phone || '', role: user.role || 'student' });
  const [saving, setSaving] = useState(false);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try { await axios.put(`${API}/${user.id}`, form); onSave({ ...user, ...form }); onClose(); }
    catch { alert('Failed to save changes.'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-gray-800">Edit User</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {[['name','Full Name','text'],['email','Email','email'],['phone','Phone','tel']].map(([f,l,t]) => (
            <div key={f}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{l}</label>
              <input type={t} value={form[f]} onChange={set(f)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Role</label>
            <select value={form.role} onChange={set('role')}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center gap-1.5 disabled:opacity-60">
            <Save size={13} />{saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Detail Panel ───────────────────────────────────────────────────────────────
const UserPanel = ({ user, onClose, onEdit, onDelete, onBlock }) => {
  const score = user.engagementScore || 0;
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white`}>
          <div className="flex items-start justify-between mb-4">
            <AvatarBox user={user} size="lg" />
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>
          <h2 className="text-xl font-bold">{user.name || 'Anonymous'}</h2>
          <p className="text-indigo-200 text-sm">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <RoleBadge role={user.role} />
            {user.blocked && <span className="text-[11px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">BLOCKED</span>}
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${user.isActive ? 'bg-emerald-400/30 text-emerald-200' : 'bg-white/10 text-white/60'}`}>
              {user.isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Contact */}
          <Section title="Contact & Identity">
            <Row icon={<Mail size={13}/>} label="Email" value={user.email} />
            <Row icon={<Phone size={13}/>} label="Phone" value={user.phone || '—'} />
            <Row icon={<Calendar size={13}/>} label="Joined" value={fmtDate(user.createdAt)} />
            <Row icon={<Clock size={13}/>} label="Last Active" value={relTime(user.lastActive)} />
            <Row icon={<Shield size={13}/>} label="User ID" value={<span className="font-mono text-xs">{user.id?.slice(0,16)}…</span>} />
          </Section>

          {/* Engagement */}
          <Section title="Engagement Score">
            <div className="mt-1"><EngagementBar score={score} /></div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: 'Chats', value: user.totalChats || 0, icon: <MessageSquare size={14}/>, color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Messages', value: user.totalMessages || 0, icon: <Activity size={14}/>, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Score', value: `${score}/100`, icon: <Zap size={14}/>, color: 'text-amber-600 bg-amber-50' },
              ].map((s,i) => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center mx-auto mb-1`}>{s.icon}</div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="font-bold text-gray-800 text-sm">{s.value}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Activity */}
          <Section title="Activity Tracking">
            <Row icon={<MessageSquare size={13}/>} label="Last Query" value={user.lastQuery ? `"${user.lastQuery.slice(0,40)}…"` : '—'} />
            <Row icon={<BrainCircuit size={13}/>} label="Most Searched" value={user.mostSearchedTopic || '—'} />
            <Row icon={<Clock size={13}/>} label="Last Login" value={relTime(user.lastLogin)} />
            {user.lastDevice && <Row icon={<Shield size={13}/>} label="Device" value={user.lastDevice.slice(0,50)} />}
          </Section>

          {/* Preferences */}
          {user.preferences && (
            <Section title="User Preferences">
              <Row icon={<BookOpen size={13}/>} label="Field" value={user.preferences.field || '—'} />
              <Row icon={<MapPin size={13}/>} label="Location" value={user.preferences.location || '—'} />
              <Row icon={<Activity size={13}/>} label="Study Mode" value={user.preferences.studyMode || '—'} />
              <Row icon={<Zap size={13}/>} label="Budget" value={user.preferences.budget || '—'} />
            </Section>
          )}

          {/* AI Suggestions */}
          {user.suggestedCourses?.length > 0 && (
            <Section title="AI Course Suggestions">
              <div className="space-y-2 mt-1">
                {user.suggestedCourses.map((c,i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-indigo-50 rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={12} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{c.name}</p>
                      <p className="text-[10px] text-gray-500">{c.field} · {c.type || 'Course'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Based on user's most searched field: <strong>{user.mostSearchedTopic}</strong></p>
            </Section>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 grid grid-cols-2 gap-2">
          <button onClick={() => onEdit(user)}
            className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
            <Pencil size={13}/> Edit
          </button>
          <button onClick={() => onBlock(user)}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl transition-colors ${
              user.blocked ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}>
            {user.blocked ? <><CheckCircle2 size={13}/> Unblock</> : <><Ban size={13}/> Block</>}
          </button>
          <button onClick={() => onDelete(user)}
            className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl bg-red-50 text-red-600 hover:bg-red-100">
            <Trash2 size={13}/> Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</p>
    <div className="space-y-2">{children}</div>
  </div>
);

const Row = ({ icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
    <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
    <span className="text-xs font-medium text-gray-800 flex-1 break-words">{value}</span>
  </div>
);

// ── User Card (grid) ───────────────────────────────────────────────────────────
const UserCard = ({ user, onClick }) => (
  <div onClick={() => onClick(user)}
    className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer group
      ${user.blocked ? 'border-red-200 opacity-70' : 'border-gray-100'}`}>
    <div className="p-5 flex items-center gap-3">
      <AvatarBox user={user} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-800 truncate text-sm">{user.name || 'Anonymous'}</p>
          {user.blocked && <XCircle size={12} className="text-red-500 flex-shrink-0" />}
        </div>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
      </div>
      <ChevronRight size={15} className="text-gray-300 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
    </div>
    <div className="px-5 pb-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <RoleBadge role={user.role} />
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${user.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-gray-500">
        <span className="flex items-center gap-1"><MessageSquare size={10}/>{user.totalChats || 0} chats</span>
        {user.mostSearchedTopic && <span className="flex items-center gap-1 truncate"><BrainCircuit size={10}/>{user.mostSearchedTopic}</span>}
      </div>
      <EngagementBar score={user.engagementScore || 0} />
    </div>
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────────
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actFilter, setActFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try { const r = await axios.get(API); setUsers(r.data || []); }
    catch { console.error('Failed to fetch users'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      || u.mostSearchedTopic?.toLowerCase().includes(q) || u.phone?.includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter || (roleFilter === 'student' && u.role === 'client');
    const matchAct = actFilter === 'all' || (actFilter === 'active' && u.isActive) || (actFilter === 'inactive' && !u.isActive);
    return matchSearch && matchRole && matchAct;
  });

  const handleBlock = async (user) => {
    const newBlocked = !user.blocked;
    try {
      await axios.patch(`${API}/${user.id}/block`, { blocked: newBlocked });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, blocked: newBlocked } : u));
      if (selected?.id === user.id) setSelected(s => ({ ...s, blocked: newBlocked }));
      showToast(newBlocked ? 'User blocked.' : 'User unblocked.');
    } catch { showToast('Action failed.'); }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/${user.id}`);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setSelected(null);
      showToast('User deleted.');
    } catch { showToast('Delete failed.'); }
  };

  const handleSave = (updated) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
    if (selected?.id === updated.id) setSelected(s => ({ ...s, ...updated }));
    showToast('User updated!');
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    students: users.filter(u => u.role === 'student' || u.role === 'client').length,
    blocked: users.filter(u => u.blocked).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} registered users · {stats.active} active</p>
        </div>
        <div className="flex items-center gap-2">
          {toast && <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"><CheckCircle2 size={12}/>{toast}</span>}
          <button onClick={fetchUsers} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-medium">
            <RefreshCw size={14}/> Refresh
          </button>
        </div>
      </div>

      {/* Stat Strips */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'Total Users', value: stats.total, color:'bg-indigo-50 text-indigo-700' },
          { label:'Active', value: stats.active, color:'bg-emerald-50 text-emerald-700' },
          { label:'Students', value: stats.students, color:'bg-violet-50 text-violet-700' },
          { label:'Blocked', value: stats.blocked, color:'bg-red-50 text-red-600' },
        ].map((s,i) => (
          <div key={i} className={`rounded-xl p-4 text-center ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Search name, email, topic, phone..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"/>
        </div>

        {/* Role tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {[['all','All'],['student','Students'],['admin','Admins']].map(([v,l]) => (
            <button key={v} onClick={() => setRoleFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${roleFilter===v ? 'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Activity tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {[['all','All Activity'],['active','Active'],['inactive','Inactive']].map(([v,l]) => (
            <button key={v} onClick={() => setActFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${actFilter===v ? 'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <UsersIcon size={40} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium">No users found</p>
          <p className="text-sm mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(u => <UserCard key={u.id} user={u} onClick={setSelected}/>)}
        </div>
      )}

      {/* Side Panel */}
      {selected && (
        <UserPanel
          user={selected}
          onClose={() => setSelected(null)}
          onEdit={u => { setEditing(u); setSelected(null); }}
          onDelete={u => { handleDelete(u); }}
          onBlock={u => { handleBlock(u); }}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <EditModal user={editing} onClose={() => setEditing(null)} onSave={handleSave}/>
      )}
    </div>
  );
};

export default Users;
