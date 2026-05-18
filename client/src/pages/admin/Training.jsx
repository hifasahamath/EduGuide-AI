import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import axios from 'axios';
import API_BASE from '../../config/env';
import {
  Check, MessageSquare, Lightbulb, RefreshCw, Sparkles,
  Clock, Trash2, BookOpen, AlertCircle, Brain, ChevronDown, ChevronUp
} from 'lucide-react';

const API = API_BASE;

const PendingCard = ({ item, response, onChange, onSubmit, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquare size={15} className="text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Student Asked</p>
            <div className="flex items-center gap-1">
              {item.occurrences > 1 && (
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                  Asked {item.occurrences}× 
                </span>
              )}
              <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-800">{item.user_input}</p>
          {item.detected_intent && (
            <span className="inline-block mt-1 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              Intent: {item.detected_intent}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <>
          {/* Admin Answer Input */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb size={13} className="text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Your Official Answer</p>
            </div>
            <textarea
              rows={3}
              placeholder="Type the correct, official answer to teach the chatbot..."
              value={response || ''}
              onChange={e => onChange(item.id, e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none placeholder-gray-300 transition-all"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock size={11} />
                {item.createdAt?._seconds
                  ? new Date(item.createdAt._seconds * 1000).toLocaleDateString()
                  : 'Unknown date'}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onDelete(item.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Dismiss">
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => onSubmit(item.id)}
                  disabled={!response?.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-200"
                >
                  <Brain size={14} /> Save & Train
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const TrainedCard = ({ item, onDelete }) => (
  <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <Check size={14} className="text-emerald-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Question</p>
        <p className="text-sm font-semibold text-gray-800">{item.user_input}</p>
      </div>
      <button onClick={() => onDelete(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
        <Trash2 size={14} />
      </button>
    </div>
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={13} className="text-violet-500" />
        <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Trained Response</p>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.response}</p>
      {item.trainedAt?._seconds && (
        <p className="text-[10px] text-gray-400 mt-2">
          Trained: {new Date(item.trainedAt._seconds * 1000).toLocaleDateString()}
        </p>
      )}
    </div>
  </div>
);

const Training = () => {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [trained, setTrained] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        api.getPendingTraining(),
        axios.get(`${API}/training/trained`)
      ]);
      setPending(pRes.data || []);
      setTrained(tRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleResponseChange = (id, val) => setResponses(p => ({ ...p, [id]: val }));

  const handleSubmit = async (id) => {
    const answer = responses[id];
    if (!answer?.trim()) return;
    try {
      await api.respondToTraining(id, answer);
      const item = pending.find(p => p.id === id);
      setPending(p => p.filter(i => i.id !== id));
      if (item) setTrained(t => [{ ...item, response: answer, status: 'trained', trainedAt: { _seconds: Date.now() / 1000 } }, ...t]);
      setResponses(p => { const n = { ...p }; delete n[id]; return n; });
      setSuccessMsg('✅ Answer saved! The chatbot will now use this response.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      alert('Failed to save response. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this training entry?')) return;
    try {
      await axios.delete(`${API}/training/${id}`);
      setPending(p => p.filter(i => i.id !== id));
      setTrained(t => t.filter(i => i.id !== id));
    } catch { alert('Failed to delete.'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Train Chatbot</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Review unanswered questions and teach the chatbot correct responses.
          </p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 font-medium transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-2xl p-5 flex items-center gap-4 ${pending.length > 0 ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'} text-white shadow-lg`}>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            {pending.length > 0 ? <AlertCircle size={24} /> : <Check size={24} />}
          </div>
          <div>
            <p className="font-bold text-2xl">{pending.length}</p>
            <p className="text-white/80 text-sm">Pending Questions</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 flex items-center gap-4 bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Brain size={24} />
          </div>
          <div>
            <p className="font-bold text-2xl">{trained.length}</p>
            <p className="text-white/80 text-sm">Learned Responses</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { key: 'pending', label: `Pending (${pending.length})`, icon: <MessageSquare size={13} /> },
          { key: 'trained', label: `Trained (${trained.length})`, icon: <BookOpen size={13} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Check size={48} className="mx-auto mb-3 text-emerald-400 opacity-60" />
            <p className="font-medium">No pending questions — all caught up! 🎉</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {pending.map(item => (
              <PendingCard
                key={item.id} item={item}
                response={responses[item.id]}
                onChange={handleResponseChange}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )
      ) : (
        trained.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Brain size={48} className="mx-auto mb-3 text-violet-400 opacity-60" />
            <p className="font-medium">No trained responses yet. Answer pending questions to start training.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {trained.map(item => (
              <TrainedCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Training;
