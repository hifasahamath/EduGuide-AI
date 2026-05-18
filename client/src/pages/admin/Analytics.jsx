import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../../config/env';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Users, MessageSquare, BookOpen, BrainCircuit,
  RefreshCw, Target, AlertTriangle, CheckCircle2, Lightbulb,
  Clock, BarChart2, Zap, Activity, Info
} from 'lucide-react';

const API = API_BASE;
const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

// ── Shared Components ─────────────────────────────────────────────────────────

const ChartCard = ({ title, icon, children, span = '', badge }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${span}`}>
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-bold text-gray-800 flex items-center gap-2">
        <span className="text-indigo-500">{icon}</span> {title}
      </h3>
      {badge && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
    </div>
    {children}
  </div>
);

const MetricPill = ({ label, value, color, icon }) => (
  <div className={`flex items-center gap-3 p-4 rounded-xl border ${color}`}>
    <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

const GaugeBar = ({ label, value, maxValue, color, note }) => {
  const pct = maxValue > 0 ? Math.min(100, Math.round((value / maxValue) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-bold text-gray-800">{value} <span className="text-gray-400 text-xs font-normal">({pct}%)</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`${color} rounded-full h-2 transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      {note && <p className="text-[10px] text-gray-400 mt-0.5">{note}</p>}
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex items-center justify-center h-48 text-gray-400 text-sm flex-col gap-2">
    <BarChart2 size={32} className="opacity-30" />
    <span>{message}</span>
  </div>
);

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

// ── Analytics Page ────────────────────────────────────────────────────────────
const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/analytics/insights`);
      setData(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <Activity size={13} /> },
    { key: 'ai', label: 'AI Performance', icon: <BrainCircuit size={13} /> },
    { key: 'behavior', label: 'User Behavior', icon: <Users size={13} /> },
    { key: 'training', label: 'Training', icon: <Target size={13} /> },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading analytics...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-red-500">
      Failed to load analytics data.
    </div>
  );

  const {
    totalSessions, totalMessages, avgDepth,
    pendingTraining, trainedCount, trainingCompletion,
    aiAccuracy, fallbackRate, trainedResponseRate,
    intentBreakdown, weeklyTrend, peakHours,
    topFields, topCourses, topPending, smartInsights
  } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Real-time platform insights and AI performance metrics
            {lastRefresh && <span className="ml-2 text-gray-400">· Updated {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-medium transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Smart Insights Banner */}
      {smartInsights?.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} />
            <span className="font-bold text-sm uppercase tracking-wider">Smart Insights</span>
          </div>
          <div className="space-y-2">
            {smartInsights.map((ins, i) => (
              <p key={i} className="text-sm text-white/90 flex items-start gap-2">
                <Info size={13} className="mt-0.5 flex-shrink-0 opacity-70" />
                {ins}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricPill label="Total Sessions" value={totalSessions}
          color="bg-indigo-50 border-indigo-100 text-indigo-700" icon={<MessageSquare size={15} className="text-indigo-600" />} />
        <MetricPill label="Total Messages" value={totalMessages}
          color="bg-emerald-50 border-emerald-100 text-emerald-700" icon={<Activity size={15} className="text-emerald-600" />} />
        <MetricPill label="Avg Chat Depth" value={`${avgDepth} msgs`}
          color="bg-blue-50 border-blue-100 text-blue-700" icon={<BarChart2 size={15} className="text-blue-600" />} />
        <MetricPill label="Trained Answers" value={trainedCount}
          color="bg-violet-50 border-violet-100 text-violet-700" icon={<BrainCircuit size={15} className="text-violet-600" />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Chat Trend */}
            <ChartCard title="Weekly Chat Volume" icon={<TrendingUp size={16} />} span="lg:col-span-2"
              badge="Last 7 days">
              {weeklyTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={weeklyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="chats" stroke="#7c3aed" strokeWidth={2.5}
                      fill="url(#chatGrad)" name="Sessions" dot={{ r: 3, fill: '#7c3aed' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyState message="No chat data yet" />}
            </ChartCard>

            {/* AI Health */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2"><BrainCircuit size={16} /> AI Health</h3>
              <div className="space-y-5">
                {[
                  { label: 'Accuracy', value: aiAccuracy, color: 'bg-emerald-400' },
                  { label: 'Training Done', value: trainingCompletion, color: 'bg-blue-400' },
                  { label: 'Learned Responses', value: trainedResponseRate, color: 'bg-amber-400' },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-indigo-200">{m.label}</span>
                      <span className="font-bold">{m.value}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div className={`${m.color} rounded-full h-1.5 transition-all duration-700`}
                        style={{ width: `${Math.min(m.value, 100)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/20 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-300">{aiAccuracy}%</p>
                    <p className="text-xs text-indigo-300">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-300">{fallbackRate}%</p>
                    <p className="text-xs text-indigo-300">Fallback</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fields + Courses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Most Searched Fields" icon={<BookOpen size={16} />}>
              {topFields?.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topFields} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Searches" radius={[4, 4, 0, 0]}>
                      {topFields.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState message="No field searches recorded yet" />}
            </ChartCard>

            <ChartCard title="Popular Courses Mentioned" icon={<BookOpen size={16} />}>
              {topCourses?.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={topCourses} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                      dataKey="count" nameKey="name"
                      label={({ name, percent }) => `${name.slice(0, 10)} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {topCourses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState message="No course mentions recorded yet" />}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── AI Performance Tab ────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: 'AI Accuracy', value: `${aiAccuracy}%`, icon: <Target size={20} />, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500', val: aiAccuracy },
              { label: 'Fallback Rate', value: `${fallbackRate}%`, icon: <AlertTriangle size={20} />, bg: 'bg-red-50 border-red-200', text: 'text-red-700', bar: 'bg-red-400', val: fallbackRate },
              { label: 'Learned Responses', value: `${trainedResponseRate}%`, icon: <CheckCircle2 size={20} />, bg: 'bg-violet-50 border-violet-200', text: 'text-violet-700', bar: 'bg-violet-500', val: trainedResponseRate },
            ].map((m, i) => (
              <div key={i} className={`rounded-2xl border p-6 ${m.bg}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl bg-white/70 ${m.text}`}>{m.icon}</div>
                  <p className={`font-semibold text-sm ${m.text}`}>{m.label}</p>
                </div>
                <p className={`text-4xl font-bold ${m.text}`}>{m.value}</p>
                <div className="mt-3 w-full bg-white/60 rounded-full h-2">
                  <div className={`${m.bar} rounded-full h-2`} style={{ width: `${Math.min(m.val, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Intent Breakdown */}
          <ChartCard title="Intent Distribution" icon={<Zap size={16} />}
            badge={`${intentBreakdown?.length || 0} intents`}>
            {intentBreakdown?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={intentBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Times triggered" radius={[0, 4, 4, 0]}>
                      {intentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {intentBreakdown.slice(0, 6).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate">{item.name}</span>
                      <span className="font-bold text-gray-800 ml-auto">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <EmptyState message="No intent data recorded yet" />}
          </ChartCard>
        </div>
      )}

      {/* ── User Behavior Tab ─────────────────────────────────── */}
      {activeTab === 'behavior' && (
        <div className="space-y-6">
          {/* Peak Usage Hours */}
          <ChartCard title="Peak Usage Hours (24h)" icon={<Clock size={16} />} badge="Today's pattern">
            {peakHours?.some(h => h.sessions > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={peakHours} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sessions" name="Sessions" radius={[3, 3, 0, 0]}>
                    {peakHours.map((_, i) => (
                      <Cell key={i} fill={`hsl(${250 + i * 3}, 70%, 60%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState message="Not enough data to show usage patterns" />}
          </ChartCard>

          {/* Field & Course Search side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Field Search Popularity" icon={<BookOpen size={16} />}>
              {topFields?.length > 0 ? (
                <div className="space-y-3">
                  {topFields.map((f, i) => (
                    <GaugeBar key={i} label={f.name} value={f.count}
                      maxValue={topFields[0].count}
                      color={`bg-[${COLORS[i % COLORS.length]}]`}
                      note={`${f.count} mentions`} />
                  ))}
                  {/* fallback with inline styles since Tailwind can't do dynamic colors */}
                  {topFields.map((f, i) => (
                    <div key={`bar-${i}`} style={{ display: 'none' }}>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div style={{ width: `${Math.min(100, Math.round((f.count / topFields[0].count) * 100))}%`, backgroundColor: COLORS[i % COLORS.length], height: '8px', borderRadius: '9999px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No field searches yet" />}
            </ChartCard>

            <ChartCard title="Course Mention Frequency" icon={<MessageSquare size={16} />}>
              {topCourses?.length > 0 ? (
                <div className="space-y-3">
                  {topCourses.map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 font-medium truncate">{c.name}</span>
                        <span className="font-bold text-gray-800 ml-2">{c.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div style={{
                          width: `${Math.min(100, Math.round((c.count / topCourses[0].count) * 100))}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                          height: '8px', borderRadius: '9999px', transition: 'all 0.7s'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No course mentions yet" />}
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── Training Tab ──────────────────────────────────────── */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          {/* Training Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: 'Pending Questions', value: pendingTraining, icon: <AlertTriangle size={20} />, bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
              { label: 'Trained Answers', value: trainedCount, icon: <CheckCircle2 size={20} />, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
              { label: 'Completion Rate', value: `${trainingCompletion}%`, icon: <Target size={20} />, bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
            ].map((m, i) => (
              <div key={i} className={`rounded-2xl border p-6 ${m.bg}`}>
                <div className={`p-2 rounded-xl bg-white/70 ${m.text} w-fit mb-3`}>{m.icon}</div>
                <p className={`text-4xl font-bold ${m.text}`}>{m.value}</p>
                <p className={`text-sm mt-1 font-medium ${m.text} opacity-70`}>{m.label}</p>
              </div>
            ))}
          </div>

          {/* Training completion bar */}
          <ChartCard title="Training Progress" icon={<BrainCircuit size={16} />}>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Overall completion</span>
                  <span className="font-bold text-gray-800">{trainingCompletion}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full h-3 transition-all duration-700"
                    style={{ width: `${trainingCompletion}%` }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-emerald-700">{trainedCount}</p>
                <p className="text-xs text-emerald-600 mt-1">Trained & Active</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-orange-700">{pendingTraining}</p>
                <p className="text-xs text-orange-600 mt-1">Awaiting Review</p>
              </div>
            </div>
          </ChartCard>

          {/* Top unanswered questions */}
          {topPending?.length > 0 && (
            <ChartCard title="Most Repeated Unanswered Questions" icon={<AlertTriangle size={16} />}
              badge={`${topPending.length} questions`}>
              <div className="space-y-3">
                {topPending.map((q, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <span className="w-6 h-6 rounded-full bg-orange-200 text-orange-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700 flex-1 truncate">{q.question}</p>
                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                      {q.occurrences}×
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Go to Training page to answer these questions and improve the chatbot.
              </p>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
