import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../config/env';
import {
  Users, BookOpen, MessageSquare, BrainCircuit, TrendingUp,
  ArrowRight, Zap, Clock, Activity, ChevronRight, RefreshCw,
  Target, Flame, CheckCircle2, AlertTriangle, MessageCircle
} from 'lucide-react';

const API = API_BASE;

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, gradient, sub }) => (
  <div className="relative overflow-hidden rounded-2xl p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
    <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-[0.08] ${gradient}`} />
    <div className="flex items-start justify-between relative">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900">{value ?? <span className="text-gray-300">—</span>}</h3>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl ${gradient} bg-opacity-10 text-white`}>{icon}</div>
    </div>
  </div>
);

// ── MetricBar ─────────────────────────────────────────────────────────────────
const MetricBar = ({ label, value, color, note }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm text-indigo-200">{label}</span>
      <span className="text-sm font-bold text-white">{value}%</span>
    </div>
    <div className="w-full bg-white/20 rounded-full h-1.5">
      <div className={`${color} rounded-full h-1.5 transition-all duration-700`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
    {note && <p className="text-xs text-indigo-300 mt-0.5">{note}</p>}
  </div>
);

// ── Recent Session Row ────────────────────────────────────────────────────────
const SessionRow = ({ session }) => {
  const ts = session.updatedAt?._seconds
    ? new Date(session.updatedAt._seconds * 1000)
    : session.createdAt?._seconds
    ? new Date(session.createdAt._seconds * 1000)
    : new Date();

  const relTime = (() => {
    const diff = Date.now() - ts.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return ts.toLocaleDateString();
  })();

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-xl transition-colors">
      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <MessageCircle size={15} className="text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{session.title || 'Untitled Chat'}</p>
        {session.lastMessage && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{session.lastMessage}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[10px] text-gray-400">{relTime}</p>
        <p className="text-[10px] text-indigo-400 mt-0.5">{session.messageCount || 0} msgs</p>
      </div>
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/analytics/dashboard`);
      setData(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 30 seconds (lightweight)
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const quickActions = [
    { label: 'Add New Course', to: '/admin/courses', icon: <BookOpen size={15} />, color: 'bg-violet-600 hover:bg-violet-700' },
    { label: 'Train Chatbot', to: '/admin/training', icon: <BrainCircuit size={15} />, color: 'bg-orange-500 hover:bg-orange-600' },
    { label: 'Deep Analytics', to: '/admin/analytics', icon: <TrendingUp size={15} />, color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Manage Users', to: '/admin/users', icon: <Users size={15} />, color: 'bg-blue-600 hover:bg-blue-700' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, Admin. Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-400">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchDashboard}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors">
            <RefreshCw size={12} /> Refresh
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
            <Activity size={11} className="animate-pulse" /> Live
          </div>
        </div>
      </div>

      {/* Primary Stat Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard title="Total Students" value={data.totalUsers} icon={<Users size={20} />}
            gradient="bg-blue-500" sub="Registered users" />
          <StatCard title="Total Courses" value={data.totalCourses} icon={<BookOpen size={20} />}
            gradient="bg-violet-500" sub="In database" />
          <StatCard title="Total Chats" value={data.totalChats} icon={<MessageSquare size={20} />}
            gradient="bg-emerald-500" sub={`${data.chatsToday} today`} />
          <StatCard title="Pending Training" value={data.pendingTraining} icon={<BrainCircuit size={20} />}
            gradient="bg-orange-500" sub="Needs admin review" />
        </div>
      )}

      {/* Secondary Stats Row */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'AI Accuracy', value: `${data.aiAccuracy}%`, icon: <Target size={14} />, good: data.aiAccuracy >= 70, tip: `${data.fallbackRate}% fallback rate` },
            { label: 'Training Done', value: `${data.trainingCompletion}%`, icon: <CheckCircle2 size={14} />, good: data.trainingCompletion >= 70, tip: `${data.trainedCount} answers trained` },
            { label: 'Chats Today', value: data.chatsToday, icon: <Flame size={14} />, good: true, tip: 'active sessions' },
            { label: 'Needs Training', value: data.pendingTraining, icon: <AlertTriangle size={14} />, good: data.pendingTraining === 0, tip: 'unanswered questions' },
          ].map((m, i) => (
            <div key={i} className={`rounded-xl p-4 border flex items-center gap-3 ${m.good ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
              <div className={`p-2 rounded-lg ${m.good ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                {m.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{m.label}</p>
                <p className="font-bold text-gray-900">{m.value}</p>
                <p className="text-[10px] text-gray-400">{m.tip}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock size={16} className="text-indigo-500" /> Recent Conversations
            </h2>
            <Link to="/admin/history" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {!data?.recentSessions?.length ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No conversations yet.</p>
            </div>
          ) : (
            <div>
              {data.recentSessions.map(s => <SessionRow key={s.id} session={s} />)}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Zap size={16} className="text-yellow-500" /> Quick Actions
            </h2>
            <div className="space-y-2">
              {quickActions.map((a, i) => (
                <Link key={i} to={a.to}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all ${a.color}`}>
                  <span className="flex items-center gap-2">{a.icon}{a.label}</span>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>

          {/* AI Summary Card */}
          {data && (
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <BrainCircuit size={16} /> AI Health Summary
              </h3>
              <div className="space-y-4">
                <MetricBar label="AI Accuracy" value={data.aiAccuracy} color="bg-emerald-400"
                  note={`${data.totalChats} total sessions`} />
                <MetricBar label="Training Complete" value={data.trainingCompletion} color="bg-blue-400"
                  note={`${data.trainedCount} trained answers`} />
                <MetricBar label="Success Rate" value={Math.max(0, 100 - data.fallbackRate)} color="bg-amber-400"
                  note={`${data.fallbackRate}% fallback rate`} />
              </div>
              {data.pendingTraining > 0 && (
                <Link to="/admin/training"
                  className="mt-4 flex items-center justify-between w-full text-xs bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2 transition-colors">
                  <span className="text-white/90">{data.pendingTraining} questions need training</span>
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
