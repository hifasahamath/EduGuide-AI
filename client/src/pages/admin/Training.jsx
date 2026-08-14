import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as apiClient from '../../services/api';
import {
  Check, MessageSquare, Lightbulb, RefreshCw, Sparkles,
  Clock, Trash2, BookOpen, AlertCircle, Brain, ChevronDown, ChevronUp, Upload, FileText, X
} from 'lucide-react';

const PendingCard = ({ item, response, onChange, onSubmit, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-200 dark:border-amber-800/60 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-200 dark:border-amber-800">
          <MessageSquare size={16} className="text-amber-700 dark:text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Student Asked</p>
            <div className="flex items-center gap-1">
              {item.occurrences > 1 && (
                <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full font-extrabold">
                  Asked {item.occurrences}× 
                </span>
              )}
              <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{item.user_input}</p>
          {item.detected_intent && (
            <span className="inline-block mt-1.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              Intent: {item.detected_intent}
            </span>
          )}
        </div>
      </div>
      {expanded && (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={15} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">Provide the official answer for the AI to learn:</p>
          </div>
          <textarea
            rows={3}
            value={response || ''}
            onChange={e => onChange(item.id, e.target.value)}
            placeholder="Type official answer here... e.g., 'The course registration fee is LKR 5,000 and total fee is LKR 250,000...'"
            className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none"
          />
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onDelete(item.id)}
              className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            >
              <Trash2 size={14} /> Ignore Question
            </button>
            <button
              onClick={() => onSubmit(item.id)}
              disabled={!response?.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Sparkles size={14} /> Save & Train AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TrainedCard = ({ item, onDelete }) => (
  <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-extrabold border border-emerald-200 dark:border-emerald-800">
          Trained Response
        </span>
        <p className="text-sm font-bold text-slate-900 dark:text-white mt-2 leading-snug">{item.user_input}</p>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors flex-shrink-0"
        title="Delete Entry"
      >
        <Trash2 size={16} />
      </button>
    </div>
    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed border border-slate-200/80 dark:border-slate-700">
      {item.response || item.answer}
    </div>
  </div>
);

const FILE_TYPE_THEMES = {
  pdf: { bg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', label: 'PDF' },
  docx: { bg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', label: 'DOCX' },
  doc: { bg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', label: 'DOC' },
  csv: { bg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', label: 'CSV' },
  xlsx: { bg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', label: 'XLSX' },
  txt: { bg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', label: 'TXT' },
  default: { bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', label: 'DOC' }
};

const GroupedDocumentCard = ({ group, onDeleteChunk, onDeleteGroup }) => {
  const [expanded, setExpanded] = useState(false);
  const ext = (group.title.split('.').pop() || '').toLowerCase();
  const theme = FILE_TYPE_THEMES[ext] || FILE_TYPE_THEMES.default;

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
      {/* Top File Meta */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border font-bold shadow-xs ${theme.bg}`}>
              <FileText size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate tracking-tight" title={group.title}>
                {group.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${theme.bg}`}>
                  {theme.label}
                </span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  {group.chunks.length} {group.chunks.length === 1 ? 'Chunk' : 'Chunks'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onDeleteGroup(group)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors flex-shrink-0"
            title="Delete Entire Document"
          >
            <Trash2 size={17} />
          </button>
        </div>

        {/* First Chunk Preview */}
        {group.chunks[0]?.content && (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed line-clamp-3 border border-slate-200/80 dark:border-slate-700/80">
            {group.chunks[0].content}
          </div>
        )}
      </div>

      {/* Expand / Collapse Chunks */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 pt-3 border-t border-slate-100 dark:border-slate-800 transition-colors"
        >
          <span>{expanded ? 'Hide Chunks' : `Inspect Chunks (${group.chunks.length})`}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {group.chunks.map((chk, i) => (
              <div key={chk.id || i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[10px] text-slate-700 dark:text-slate-300 uppercase">Chunk {chk.chunk_index + 1}</span>
                  <button onClick={() => onDeleteChunk(chk.id)} className="text-slate-400 hover:text-rose-600 p-0.5" title="Delete this chunk">
                    <X size={13} />
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-2 font-medium">{chk.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Training = () => {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [trained, setTrained] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes, dRes] = await Promise.all([
        apiClient.getPendingTraining(),
        apiClient.getTrainedData(),
        apiClient.getDocuments()
      ]);
      setPending(pRes.data || []);
      setTrained(tRes.data || []);
      setDocuments(dRes.data || []);
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
      await apiClient.respondToTraining({ id, response: answer });
      const item = pending.find(p => p.id === id);
      setPending(p => p.filter(i => i.id !== id));
      if (item) setTrained(t => [{ ...item, response: answer, status: 'trained', trained_at: new Date().toISOString() }, ...t]);
      setResponses(p => { const n = { ...p }; delete n[id]; return n; });
      setSuccessMsg('✅ Answer saved! The chatbot will now use this response.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      alert('Failed to save response. Please try again.');
    }
  };

  const handleDeleteQnA = async (id) => {
    if (!window.confirm('Remove this training entry?')) return;
    try {
      await apiClient.deleteTraining(id);
      setPending(p => p.filter(i => i.id !== id));
      setTrained(t => t.filter(i => i.id !== id));
    } catch { alert('Failed to delete.'); }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);

      try {
        await apiClient.uploadDocument(formData);
        successCount++;
      } catch (err) {
        console.error('Upload failed for', file.name, err);
        failCount++;
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (successCount > 0 && failCount === 0) {
      setSuccessMsg(`✅ ${successCount} document(s) uploaded and embedded successfully!`);
    } else if (successCount > 0 && failCount > 0) {
      setSuccessMsg(`⚠️ ${successCount} uploaded, ${failCount} failed.`);
    } else {
      alert(`Upload failed for all ${failCount} documents.`);
    }
    
    setTimeout(() => setSuccessMsg(''), 4000);
    await fetchData();
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Remove this document chunk? It will no longer be used for AI context.')) return;
    try {
      await apiClient.deleteDocument(id);
      setDocuments(d => d.filter(i => i.id !== id));
    } catch { alert('Failed to delete.'); }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Delete document "${group.title}" and all its ${group.chunks.length} chunks?`)) return;
    try {
      await Promise.all(group.chunks.map(c => apiClient.deleteDocument(c.id)));
      const deletedIds = new Set(group.chunks.map(c => c.id));
      setDocuments(d => d.filter(i => !deletedIds.has(i.id)));
    } catch {
      alert('Failed to delete some document chunks.');
      fetchData();
    }
  };

  const groupedDocs = useMemo(() => {
    const map = {};
    documents.forEach(doc => {
      const key = doc.title || doc.file_name || 'Knowledge Document';
      if (!map[key]) {
        map[key] = {
          title: key,
          file_type: doc.file_type || (key.split('.').pop() || 'txt').toUpperCase(),
          chunks: [],
        };
      }
      map[key].chunks.push(doc);
    });
    return Object.values(map);
  }, [documents]);

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Training Data & Knowledge Base</h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
            Teach the chatbot directly or upload documents (PDF, DOCX, CSV) for RAG.
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-xs font-bold px-3.5 sm:px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900 font-medium transition-all shadow-xs w-fit">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold">
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl w-full sm:w-fit border border-slate-300/60 dark:border-slate-700">
        {[
          { key: 'pending', label: `Pending Q&A (${pending.length})`, icon: <MessageSquare size={14} /> },
          { key: 'trained', label: `Trained Q&A (${trained.length})`, icon: <BookOpen size={14} /> },
          { key: 'documents', label: `Documents (${groupedDocs.length})`, icon: <FileText size={14} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial whitespace-nowrap ${
              tab === t.key ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}>
            {t.icon} <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Check size={48} className="mx-auto mb-3 text-emerald-500 opacity-60" />
            <p className="font-bold text-slate-900 dark:text-slate-100">No pending questions — all caught up! 🎉</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {pending.map(item => (
              <PendingCard key={item.id} item={item} response={responses[item.id]} onChange={handleResponseChange} onSubmit={handleSubmit} onDelete={handleDeleteQnA} />
            ))}
          </div>
        )
      ) : tab === 'trained' ? (
        trained.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Brain size={48} className="mx-auto mb-3 text-indigo-400 opacity-60" />
            <p className="font-bold text-slate-900 dark:text-slate-100">No trained responses yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {trained.map(item => <TrainedCard key={item.id} item={item} onDelete={handleDeleteQnA} />)}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">Upload Knowledge Document</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">Supported formats: PDF, DOCX, XLSX, CSV, TXT (Max 10MB per file)</p>
            <div className="flex items-center gap-4">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.xlsx,.csv,.txt" className="hidden" multiple />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Processing & Embedding...' : 'Select & Upload Files'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groupedDocs.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-400 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold">
                <FileText size={40} className="mx-auto mb-2 opacity-30 text-indigo-500" />
                <p>No knowledge documents uploaded yet.</p>
              </div>
            ) : (
              groupedDocs.map(group => (
                <GroupedDocumentCard
                  key={group.title}
                  group={group}
                  onDeleteChunk={handleDeleteDocument}
                  onDeleteGroup={handleDeleteGroup}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
