import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_CHAT } from '../../config/env';
import {
  MessageSquare, Search, User, Clock, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, XCircle, Filter, Download, BrainCircuit,
  Trash2, BookOpen, Tag, MessageCircle, Activity, Users, Flame, Eye
} from 'lucide-react';

const API = API_CHAT;

// ── Helpers ───────────────────────────────────────────────────────────────────
const relTime = (ts) => {
  if (!ts) return '';
  const ms = ts._seconds ? ts._seconds * 1000 : new Date(ts).getTime();
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ms).toLocaleDateString();
};

const fullDate = (ts) => {
  if (!ts) return '—';
  const ms = ts._seconds ? ts._seconds * 1000 : new Date(ts).getTime();
  return new Date(ms).toLocaleString();
};

const StatusBadge = ({ status, isSpam }) => {
  if (isSpam) return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
      <AlertTriangle size={9} /> SPAM
    </span>
  );
  const cfg = {
    resolved: { cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={9} />, label: 'Resolved' },
    failed: { cls: 'bg-red-100 text-red-700', icon: <XCircle size={9} />, label: 'Failed' },
    pending: { cls: 'bg-amber-100 text-amber-700', icon: <Clock size={9} />, label: 'Pending' },
  };
  const s = cfg[status] || cfg.pending;
  return (
    <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3`}>
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value ?? '—'}</p>
    </div>
  </div>
);

// ── Message Bubble ────────────────────────────────────────────────────────────
const Bubble = ({ msg }) => {
  const isUser = msg.sender === 'user' || msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
          <BrainCircuit size={11} className="text-indigo-600" />
        </div>
      )}
      <div className="max-w-[75%]">
        <div className={`rounded-2xl px-3 py-2 text-sm ${isUser
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
          {msg.text}
        </div>
        <div className="flex items-center gap-2 mt-0.5 px-1">
          {msg.intent && msg.intent !== 'unknown' && (
            <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{msg.intent}</span>
          )}
          {msg.intent === 'fallback' && (
            <span className="text-[9px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-semibold">FALLBACK</span>
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
          <User size={11} className="text-gray-500" />
        </div>
      )}
    </div>
  );
};

// ── Chat Detail Panel ─────────────────────────────────────────────────────────
const ChatDetail = ({ session, onClose, onResolve, onDelete, onTraining }) => {
  const [toast, setToast] = useState('');
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <MessageCircle size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800">{session.title || 'Chat Detail'}</p>
              <p className="text-xs text-gray-400">{fullDate(session.createdAt)} · {session.messageCount} messages</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><XCircle size={18} /></button>
        </div>

        {/* Metadata */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1"><User size={11} /> {session.userId?.slice(0, 12)}...</span>
          {session.detectedField && <span className="flex items-center gap-1"><Tag size={11} /> Field: <strong>{session.detectedField}</strong></span>}
          {session.detectedCourse && <span className="flex items-center gap-1"><BookOpen size={11} /> Course: <strong>{session.detectedCourse}</strong></span>}
          <StatusBadge status={session.status} isSpam={session.isSpam} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {session.messages?.length > 0 ? (
            session.messages.map((m, i) => <Bubble key={i} msg={m} />)
          ) : (
            <p className="text-center text-gray-400 text-sm py-8">No messages in this session.</p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
          {toast && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium">{toast}</span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => { onTraining(session); showToast('Sent to training queue!'); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors">
              <BrainCircuit size={13} /> Send to Training
            </button>
            {session.status !== 'resolved' && (
              <button onClick={() => { onResolve(session.chatId); showToast('Marked as resolved!'); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                <CheckCircle2 size={13} /> Mark Resolved
              </button>
            )}
            <button onClick={() => { if (window.confirm('Delete this chat?')) { onDelete(session.chatId); onClose(); } }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main ChatHistory ──────────────────────────────────────────────────────────
const FIELDS = ['All Fields', 'IT', 'Business', 'Health', 'Engineering', 'Law', 'Arts', 'Aviation'];

const ChatHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('All Fields');
  const [selected, setSelected] = useState(null);
  const [actionToast, setActionToast] = useState('');
  const refreshRef = useRef(null);

  const toast = (msg) => { setActionToast(msg); setTimeout(() => setActionToast(''), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter !== 'all') params.set('dateFilter', dateFilter);
      if (statusFilter !== 'all') params.set('statusFilter', statusFilter);
      const res = await axios.get(`${API}/admin/sessions?${params.toString()}`);
      setSessions(res.data.sessions || []);
      setStats(res.data.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30s
    refreshRef.current = setInterval(fetchData, 30000);
    return () => clearInterval(refreshRef.current);
  }, [fetchData]);

  // Client-side search + field filter
  const filtered = sessions.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || s.title?.toLowerCase().includes(q)
      || s.userId?.toLowerCase().includes(q)
      || s.lastMessage?.toLowerCase().includes(q)
      || s.detectedCourse?.toLowerCase().includes(q)
      || s.detectedField?.toLowerCase().includes(q)
      || s.messages?.some(m => m.text?.toLowerCase().includes(q));
    const matchField = fieldFilter === 'All Fields' || s.detectedField === fieldFilter;
    return matchSearch && matchField;
  });

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['Session ID', 'User ID', 'Title', 'Status', 'Field', 'Course', 'Messages', 'Last Message', 'Created At'],
      ...filtered.map(s => [
        s.chatId, s.userId, s.title, s.status,
        s.detectedField || '', s.detectedCourse || '',
        s.messageCount, `"${(s.lastMessage || '').replace(/"/g, "''")}"`,
        fullDate(s.createdAt)
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `chat-history-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast('Exported successfully!');
  };

  const handleResolve = async (chatId) => {
    try {
      await axios.patch(`${API}/admin/sessions/${chatId}/resolve`);
      setSessions(prev => prev.map(s => s.chatId === chatId ? { ...s, status: 'resolved' } : s));
      if (selected?.chatId === chatId) setSelected(s => ({ ...s, status: 'resolved' }));
      toast('Marked as resolved!');
    } catch { toast('Failed to resolve.'); }
  };

  const handleDelete = async (chatId) => {
    if (!window.confirm('Delete this chat session?')) return;
    try {
      await axios.delete(`${API}/sessions/${chatId}`);
      setSessions(prev => prev.filter(s => s.chatId !== chatId));
      if (selected?.chatId === chatId) setSelected(null);
      toast('Chat deleted.');
    } catch { toast('Failed to delete.'); }
  };

  const handleTraining = async (session) => {
    const userMsgs = session.messages?.filter(m => m.sender === 'user' || m.role === 'user') || [];
    const question = userMsgs[userMsgs.length - 1]?.text || session.title;
    if (!question) return;
    try {
      await axios.post(`${API}/admin/train`, { question, intent: null });
      toast('Sent to training queue!');
    } catch { toast('Failed to send.'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat History</h1>
          <p className="text-gray-500 text-sm mt-0.5">Monitor, filter, and manage all student conversations</p>
        </div>
        <div className="flex items-center gap-2">
          {actionToast && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium">{actionToast}</span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
            <Activity size={11} className="animate-pulse" /> Live
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={fetchData}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-medium transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sessions" value={stats?.total} icon={<MessageSquare size={16} className="text-indigo-600" />} color="bg-indigo-50" />
        <StatCard label="Chats Today" value={stats?.chatsToday} icon={<Flame size={16} className="text-orange-500" />} color="bg-orange-50" />
        <StatCard label="Avg Msgs / Chat" value={stats?.avgMsgsPerChat} icon={<Activity size={16} className="text-emerald-600" />} color="bg-emerald-50" />
        <StatCard label="Spam Detected" value={stats?.spamCount} icon={<AlertTriangle size={16} className="text-red-500" />} color="bg-red-50" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, message, course, keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {[['all', 'All Time'], ['today', 'Today'], ['week', 'Week'], ['month', 'Month']].map(([val, label]) => (
              <button key={val} onClick={() => setDateFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${dateFilter === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            <option value="all">All Status</option>
            <option value="resolved">Resolved</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          {/* Field Filter */}
          <select value={fieldFilter} onChange={e => setFieldFilter(e.target.value)}
            className="border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No conversations found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table Head */}
          <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="col-span-4">Conversation</div>
            <div className="col-span-2">User</div>
            <div className="col-span-2">Field / Course</div>
            <div className="col-span-1 text-center">Msgs</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Time</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {filtered.map(session => (
              <div key={session.chatId}
                className={`grid grid-cols-12 items-center px-4 py-3.5 hover:bg-gray-50 transition-colors ${session.isSpam ? 'bg-red-50/40' : ''}`}>
                {/* Title + last message */}
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={12} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{session.title}</p>
                      <p className="text-xs text-gray-400 truncate">{session.lastMessage || 'No messages'}</p>
                    </div>
                  </div>
                </div>

                {/* User */}
                <div className="col-span-2">
                  <p className="text-xs text-gray-600 font-mono truncate">{session.userId?.slice(0, 10)}...</p>
                </div>

                {/* Field / Course */}
                <div className="col-span-2">
                  {session.detectedField ? (
                    <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">{session.detectedField}</span>
                  ) : <span className="text-xs text-gray-300">—</span>}
                  {session.detectedCourse && (
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{session.detectedCourse}</p>
                  )}
                </div>

                {/* Message count */}
                <div className="col-span-1 text-center">
                  <span className="text-sm font-semibold text-gray-700">{session.messageCount}</span>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <StatusBadge status={session.status} isSpam={session.isSpam} />
                </div>

                {/* Time */}
                <div className="col-span-1">
                  <p className="text-xs text-gray-400">{relTime(session.updatedAt || session.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button onClick={() => setSelected(session)} title="View details"
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                    <Eye size={13} />
                  </button>
                  {session.status !== 'resolved' && (
                    <button onClick={() => handleResolve(session.chatId)} title="Mark resolved"
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors">
                      <CheckCircle2 size={13} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(session.chatId)} title="Delete"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>Showing {filtered.length} of {sessions.length} sessions</span>
            <span>Auto-refreshes every 30s</span>
          </div>
        </div>
      )}

      {/* Chat Detail Modal */}
      {selected && (
        <ChatDetail
          session={selected}
          onClose={() => setSelected(null)}
          onResolve={handleResolve}
          onDelete={handleDelete}
          onTraining={handleTraining}
        />
      )}
    </div>
  );
};

export default ChatHistory;
