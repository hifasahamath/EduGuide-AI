import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users, BookOpen, MessageSquare, BrainCircuit, TrendingUp,
  ArrowRight, Zap, Clock, Activity, ChevronRight, RefreshCw,
  Target, Flame, CheckCircle2, AlertTriangle, MessageCircle
} from 'lucide-react';

const StatCard = ({ title, value, icon, gradient, sub }) => (
  <div className="relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs transition-all group">
    <div className="flex items-start justify-between relative">
      <div>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value ?? <span className="text-slate-300 dark:text-slate-600">—</span>}</h3>
        {sub && <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl ${gradient} text-white shadow-xs`}>{icon}</div>
    </div>
  </div>
);

const MetricBar = ({ label, value, color, note }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs font-bold text-indigo-100">{label}</span>
      <span className="text-xs font-extrabold text-white">{value}%</span>
    </div>
    <div className="w-full bg-white/20 rounded-full h-2">
      <div className={`${color} rounded-full h-2 transition-all duration-700`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
    {note && <p className="text-[11px] font-medium text-indigo-200 mt-1">{note}</p>}
  </div>
);

const SessionRow = ({ session }) => {
  const ts = session.updated_at
    ? new Date(session.updated_at)
    : session.created_at
    ? new Date(session.created_at)
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
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors">
      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center flex-shrink-0">
        <MessageCircle size={16} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{session.title || 'Untitled Chat'}</p>
        {session.lastMessage && (
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5 font-medium">{session.lastMessage}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{relTime}</p>
        <p className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{session.messageCount || 0} msgs</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get(`/analytics/dashboard`);
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
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const quickActions = [
    { label: 'Add New Course', to: '/admin/courses', icon: <BookOpen size={16} />, color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'Train Chatbot', to: '/admin/training', icon: <BrainCircuit size={16} />, color: 'bg-amber-600 hover:bg-amber-700' },
    { label: 'Deep Analytics', to: '/admin/analytics', icon: <TrendingUp size={16} />, color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Manage Users', to: '/admin/users', icon: <Users size={16} />, color: 'bg-blue-600 hover:bg-blue-700' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">Real-time higher education management & AI intelligence analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={fetchDashboard}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-all shadow-xs">
            <RefreshCw size={13} /> Refresh
          </button>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl">
            <Activity size={12} className="animate-pulse" /> Live System
          </div>
        </div>
      </div>

      {/* Primary Stat Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard title="Total Students" value={data.totalUsers} icon={<Users size={20} />}
            gradient="bg-blue-600" sub="Registered accounts" />
          <StatCard title="Total Courses" value={data.totalCourses} icon={<BookOpen size={20} />}
            gradient="bg-indigo-600" sub="Accredited degree programs" />
          <StatCard title="Total Chats" value={data.totalChats} icon={<MessageSquare size={20} />}
            gradient="bg-emerald-600" sub={`${data.chatsToday} chats today`} />
          <StatCard title="Pending Training" value={data.pendingTraining} icon={<BrainCircuit size={20} />}
            gradient="bg-amber-600" sub="Questions needing review" />
        </div>
      )}

      {/* Secondary Stats Row */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'AI Accuracy', value: `${data.aiAccuracy}%`, icon: <Target size={15} />, good: data.aiAccuracy >= 70, tip: `${data.fallbackRate}% fallback rate` },
            { label: 'Training Done', value: `${data.trainingCompletion}%`, icon: <CheckCircle2 size={15} />, good: data.trainingCompletion >= 70, tip: `${data.trainedCount || 0} answers trained` },
            { label: 'Chats Today', value: data.chatsToday, icon: <Flame size={15} />, good: true, tip: 'active student sessions' },
            { label: 'Needs Training', value: data.pendingTraining, icon: <AlertTriangle size={15} />, good: data.pendingTraining === 0, tip: 'unanswered queries' },
          ].map((m, i) => (
            <div key={i} className={`rounded-2xl p-4 border flex items-center gap-3 shadow-xs ${
              m.good 
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80' 
                : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80'
            }`}>
              <div className={`p-2.5 rounded-xl ${
                m.good 
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' 
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
              }`}>
                {m.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{m.label}</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">{m.value}</p>
                <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{m.tip}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 text-base">
              <Clock size={18} className="text-indigo-600" /> Recent Student Conversations
            </h2>
            <Link to="/admin/history" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {!data?.recentSessions?.length ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold">No active conversations recorded.</p>
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
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
            <h2 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4 text-base">
              <Zap size={18} className="text-amber-500" /> Quick Actions
            </h2>
            <div className="space-y-2.5">
              {quickActions.map((a, i) => (
                <Link key={i} to={a.to}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs ${a.color}`}>
                  <span className="flex items-center gap-2">{a.icon}{a.label}</span>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>

          {/* AI Summary Card */}
          {data && (
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-md">
              <h3 className="font-extrabold text-base mb-4 flex items-center gap-2">
                <BrainCircuit size={18} /> AI System Health
              </h3>
              <div className="space-y-4">
                <MetricBar label="AI Accuracy" value={data.aiAccuracy} color="bg-emerald-400"
                  note={`${data.totalChats} total sessions`} />
                <MetricBar label="Training Complete" value={data.trainingCompletion} color="bg-blue-300"
                  note={`${data.trainedCount || 0} trained answers`} />
                <MetricBar label="Success Rate" value={Math.max(0, 100 - data.fallbackRate)} color="bg-amber-300"
                  note={`${data.fallbackRate}% fallback rate`} />
              </div>
              {data.pendingTraining > 0 && (
                <Link to="/admin/training"
                  className="mt-5 flex items-center justify-between w-full text-xs font-bold bg-white/20 hover:bg-white/30 rounded-xl px-3.5 py-2.5 transition-colors">
                  <span className="text-white">{data.pendingTraining} questions need training</span>
                  <ArrowRight size={14} />
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
