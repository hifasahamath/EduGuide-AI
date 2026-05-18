import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_FAQ } from '../../config/env';
import {
  Plus, Edit2, Trash2, Search, BrainCircuit, Tag, Zap, BarChart2,
  CheckCircle2, AlertTriangle, X, Save, RefreshCw, ChevronDown, ChevronUp,
  MessageSquare, TrendingUp, HelpCircle, BookOpen
} from 'lucide-react';

const API = API_FAQ;

// ── Intents list ───────────────────────────────────────────────────────────────
const INTENTS = [
  'course_search','course_details','fee_inquiry','duration_inquiry',
  'career_path','eligibility','comparison','greeting','fallback','general'
];

const INTENT_COLORS = {
  course_search:'bg-blue-100 text-blue-700', course_details:'bg-indigo-100 text-indigo-700',
  fee_inquiry:'bg-emerald-100 text-emerald-700', duration_inquiry:'bg-teal-100 text-teal-700',
  career_path:'bg-violet-100 text-violet-700', eligibility:'bg-amber-100 text-amber-700',
  comparison:'bg-orange-100 text-orange-700', greeting:'bg-pink-100 text-pink-700',
  fallback:'bg-red-100 text-red-700', general:'bg-gray-100 text-gray-600',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const IntentBadge = ({ intent }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${INTENT_COLORS[intent] || 'bg-gray-100 text-gray-500'}`}>
    <Zap size={8}/>{intent || 'general'}
  </span>
);

const StatCard = ({ label, value, icon, color }) => (
  <div className={`rounded-xl p-4 flex items-center gap-3 ${color}`}>
    <div className="opacity-80">{icon}</div>
    <div><p className="text-2xl font-bold leading-none">{value}</p><p className="text-xs font-medium opacity-70 mt-0.5">{label}</p></div>
  </div>
);

// ── Keyword Tag Input ──────────────────────────────────────────────────────────
const KeywordInput = ({ value, onChange }) => {
  const [input, setInput] = useState('');
  const tags = Array.isArray(value) ? value : (value || '').split(',').map(k => k.trim()).filter(Boolean);

  const add = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  };

  const remove = (tag) => onChange(tags.filter(t => t !== tag));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
            {t}<button type="button" onClick={() => remove(t)} className="text-indigo-400 hover:text-red-500 ml-0.5"><X size={10}/></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }}}
          placeholder="Type keyword + Enter"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        <button type="button" onClick={add} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100">Add</button>
      </div>
    </div>
  );
};

// ── FAQ Form Modal ─────────────────────────────────────────────────────────────
const FAQModal = ({ editingFaq, onClose, onSaved }) => {
  const [form, setForm] = useState(
    editingFaq
      ? { question: editingFaq.question, answer: editingFaq.answer, intent: editingFaq.intent || 'general', keywords: editingFaq.keywords || [] }
      : { question: '', answer: '', intent: 'general', keywords: [] }
  );
  const [saving, setSaving] = useState(false);
  const [dupeWarning, setDupeWarning] = useState('');
  const [suggests, setSuggests] = useState([]);
  const suggestTimer = useRef(null);
  const set = f => v => setForm(p => ({ ...p, [f]: v }));
  const setField = f => e => set(f)(e.target.value);

  // Live duplicate suggestion while typing question
  useEffect(() => {
    if (editingFaq) return;
    clearTimeout(suggestTimer.current);
    if (form.question.length < 4) { setSuggests([]); return; }
    suggestTimer.current = setTimeout(async () => {
      try {
        const r = await axios.get(`${API}/suggest`, { params: { q: form.question } });
        setSuggests(r.data || []);
      } catch { setSuggests([]); }
    }, 350);
  }, [form.question, editingFaq]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true); setDupeWarning('');
    try {
      if (editingFaq) {
        await axios.put(`${API}/${editingFaq.id}`, form);
      } else {
        await axios.post(API, form);
      }
      onSaved();
    } catch (err) {
      if (err.response?.status === 409) setDupeWarning(err.response.data?.error || 'Duplicate question detected.');
      else setDupeWarning('Failed to save. Try again.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <BrainCircuit size={16} className="text-indigo-600"/>
            <h3 className="font-bold text-gray-800">{editingFaq ? 'Edit FAQ' : 'Add FAQ to Knowledge Base'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg"><X size={15}/></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {dupeWarning && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle size={14}/> {dupeWarning}
            </div>
          )}

          {/* Question with live suggestions */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Question</label>
            <input type="text" required value={form.question} onChange={setField('question')}
              placeholder="e.g. What is the fee for BSc IT?"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
            {suggests.length > 0 && (
              <div className="mt-1.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1"><AlertTriangle size={11}/>Similar questions exist:</p>
                <div className="space-y-1">
                  {suggests.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-xs">
                      <IntentBadge intent={s.intent}/>
                      <span className="text-gray-700">{s.question}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Answer */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Answer</label>
            <textarea required rows={4} value={form.answer} onChange={setField('answer')}
              placeholder="Provide a clear, helpful answer..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"/>
          </div>

          {/* Intent */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Intent</label>
            <select value={form.intent} onChange={setField('intent')}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none bg-white">
              {INTENTS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">Helps the AI match user questions to the correct FAQ entry.</p>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Keywords</label>
            <KeywordInput value={form.keywords} onChange={set('keywords')}/>
            <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add. Used for synonym & keyword matching.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center gap-1.5 disabled:opacity-60">
              <Save size={13}/>{saving ? 'Saving…' : 'Save FAQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── FAQ Row ────────────────────────────────────────────────────────────────────
const FAQRow = ({ faq, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const missingIntent = !faq.intent || faq.intent === 'general';
  const missingKeywords = !faq.keywords?.length;

  return (
    <div className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${missingIntent || missingKeywords ? 'border-l-2 border-l-amber-300' : ''}`}>
      <div className="flex items-start gap-3 px-5 py-4">
        {/* Ask count */}
        <div className="flex-shrink-0 text-center min-w-[36px]">
          <p className="text-sm font-bold text-gray-700">{faq.askCount || 0}</p>
          <p className="text-[9px] text-gray-400 uppercase">asks</p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="font-semibold text-gray-800 text-sm flex-1 min-w-0">{faq.question}</p>
            {(missingIntent || missingKeywords) && (
              <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full flex-shrink-0">
                <AlertTriangle size={9}/> Incomplete
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <IntentBadge intent={faq.intent}/>
            {faq.keywords?.slice(0,4).map(k => (
              <span key={k} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{k}</span>
            ))}
            {faq.keywords?.length > 4 && <span className="text-[10px] text-gray-400">+{faq.keywords.length - 4}</span>}
          </div>

          <button onClick={() => setExpanded(!expanded)}
            className="mt-1.5 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium">
            {expanded ? <><ChevronUp size={12}/>Hide answer</> : <><ChevronDown size={12}/>Show answer</>}
          </button>

          {expanded && (
            <div className="mt-2 text-sm text-gray-600 bg-indigo-50 rounded-xl p-3 border border-indigo-100 whitespace-pre-wrap leading-relaxed">
              {faq.answer}
            </div>
          )}
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => onEdit(faq)} className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors"><Edit2 size={14}/></button>
          <button onClick={() => onDelete(faq.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 size={14}/></button>
        </div>
      </div>
    </div>
  );
};

// ── Main FAQ Page ──────────────────────────────────────────────────────────────
const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterIntent, setFilterIntent] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [faqRes, analyticsRes] = await Promise.all([
        axios.get(API),
        axios.get(`${API}/analytics`)
      ]);
      setFaqs(faqRes.data || []);
      setAnalytics(analyticsRes.data || null);
    } catch { console.error('Fetch failed'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try { await axios.delete(`${API}/${id}`); setFaqs(f => f.filter(x => x.id !== id)); showToast('FAQ deleted.'); }
    catch { showToast('Delete failed.'); }
  };

  const handleSaved = () => {
    setShowModal(false); setEditingFaq(null);
    fetchData(); showToast('FAQ saved!');
  };

  // Filter
  const filtered = faqs.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q)
      || f.keywords?.some(k => k.toLowerCase().includes(q));
    const matchIntent = filterIntent === 'all' || f.intent === filterIntent;
    return matchSearch && matchIntent;
  });

  const incomplete = faqs.filter(f => !f.intent || f.intent === 'general' || !f.keywords?.length).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Knowledge Base</h1>
          <p className="text-gray-500 text-sm mt-0.5">{faqs.length} FAQ entries · intent-mapped · keyword-indexed</p>
        </div>
        <div className="flex items-center gap-2">
          {toast && <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"><CheckCircle2 size={12}/>{toast}</span>}
          <button onClick={fetchData} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium">
            <RefreshCw size={13}/>Refresh
          </button>
          <button onClick={() => { setEditingFaq(null); setShowModal(true); }}
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm shadow-indigo-200">
            <Plus size={15}/>Add FAQ
          </button>
        </div>
      </div>

      {/* Analytics Strip */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total FAQs" value={analytics.total} icon={<BookOpen size={18}/>} color="bg-indigo-50 text-indigo-700"/>
          <StatCard label="Unanswered" value={analytics.unanswered || 0} icon={<HelpCircle size={18}/>} color="bg-red-50 text-red-600"/>
          <StatCard label="Trained" value={analytics.answered || 0} icon={<BrainCircuit size={18}/>} color="bg-emerald-50 text-emerald-700"/>
          <StatCard label="Incomplete" value={incomplete} icon={<AlertTriangle size={18}/>} color={incomplete > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400'}/>
        </div>
      )}

      {/* Incomplete warning */}
      {incomplete > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          <AlertTriangle size={15}/>
          <strong>{incomplete} FAQ{incomplete !== 1 ? 's' : ''}</strong> are missing intent or keywords — they won't be matched efficiently by the AI.
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Search questions, answers, keywords..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
        </div>
        <select value={filterIntent} onChange={e => setFilterIntent(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none bg-white">
          <option value="all">All Intents</option>
          {INTENTS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} shown</span>
      </div>

      {/* FAQ Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium">No FAQs found</p>
          <p className="text-sm mt-1">Try a different search or add new FAQs.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table head */}
          <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1">Asks</div>
            <div className="col-span-11">Question · Intent · Keywords</div>
          </div>
          <div>
            {filtered.map(faq => (
              <FAQRow key={faq.id} faq={faq} onEdit={f => { setEditingFaq(f); setShowModal(true); }} onDelete={handleDelete}/>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
            <span>FAQ entries sorted by most asked</span>
            <span className="text-amber-600 flex items-center gap-1">
              <AlertTriangle size={11}/> Amber border = incomplete metadata
            </span>
          </div>
        </div>
      )}

      {/* Most asked */}
      {analytics?.topAsked?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-indigo-500"/>
            <h3 className="font-bold text-gray-800 text-sm">Most Asked Questions</h3>
          </div>
          <div className="space-y-2">
            {analytics.topAsked.map((f, i) => (
              <div key={f.id} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-center text-xs font-bold text-gray-400">#{i+1}</span>
                <IntentBadge intent={f.intent}/>
                <span className="text-gray-700 flex-1 truncate">{f.question}</span>
                <span className="text-xs font-bold text-indigo-600">{f.askCount || 0}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <FAQModal editingFaq={editingFaq} onClose={() => { setShowModal(false); setEditingFaq(null); }} onSaved={handleSaved}/>
      )}
    </div>
  );
};

export default FAQ;
