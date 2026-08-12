import React, { useState, useEffect, useRef } from 'react';
import * as apiClient from '../../services/api';
import {
  Check, MessageSquare, Lightbulb, RefreshCw, Sparkles,
  Clock, Trash2, BookOpen, AlertCircle, Brain, ChevronDown, ChevronUp, Upload, FileText, X
} from 'lucide-react';

const PendingCard = ({ item, response, onChange, onSubmit, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all overflow-hidden">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border-b border-orange-100 dark:border-orange-500/20 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquare size={15} className="text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Student Asked</p>
            <div className="flex items-center gap-1">
              {item.occurrences > 1 && (
                <span className="text-[10px] bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-semibold">
                  Asked {item.occurrences}× 
                </span>
              )}
              <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">{item.user_input}</p>
          {item.detected_intent && (
            <span className="inline-block mt-1 text-[10px] bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              Intent: {item.detected_intent}
            </span>
          )}
        </div>
      </div>
      {expanded && (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Provide the official answer for the AI to learn:</p>
          </div>
          <textarea
            rows={3}
            value={response || ''}
            onChange={e => onChange(item.id, e.target.value)}
            placeholder="Type answer here... e.g., 'The course registration fee is LKR 5,000 and total fee is LKR 250,000...'"
            className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white dark:bg-[#151525] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onDelete(item.id)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-colors"
            >
              <Trash2 size={13} /> Ignore Question
            </button>
            <button
              onClick={() => onSubmit(item.id)}
              disabled={!response?.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-200 dark:shadow-none transition-all"
            >
              <Sparkles size={13} /> Save & Train AI
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
        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
          Trained Entry
        </span>
        <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1.5">{item.user_input}</p>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="text-gray-300 dark:text-gray-600 hover:text-red-500 p-1.5 rounded-lg transition-colors flex-shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
      {item.response || item.answer}
    </div>
  </div>
);

const DocumentCard = ({ doc, onDelete }) => (
  <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3">
    <div className="flex items-start justify-between gap-2.5">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center flex-shrink-0">
          <FileText size={17} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{doc.title || doc.file_name || 'Knowledge Doc'}</p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            {doc.file_type ? doc.file_type.toUpperCase() : 'TXT'} · Chunk {doc.chunk_index + 1}
          </p>
        </div>
      </div>
      <button
        onClick={() => onDelete(doc.id)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors flex-shrink-0"
        title="Delete Document"
      >
        <Trash2 size={16} />
      </button>
    </div>
    {doc.content && (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed line-clamp-3 border border-slate-200/60 dark:border-slate-800">
        {doc.content}
      </div>
    )}
  </div>
);

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
    await fetchData(); // Refresh documents
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Remove this document chunk? It will no longer be used for AI context.')) return;
    try {
      await apiClient.deleteDocument(id);
      setDocuments(d => d.filter(i => i.id !== id));
    } catch { alert('Failed to delete.'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training Data & Knowledge Base</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Teach the chatbot directly or upload documents (PDF, DOCX, CSV) for RAG.
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm px-4 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-500/20 font-medium transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm font-medium">
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {[
          { key: 'pending', label: `Pending Q&A (${pending.length})`, icon: <MessageSquare size={13} /> },
          { key: 'trained', label: `Trained Q&A (${trained.length})`, icon: <BookOpen size={13} /> },
          { key: 'documents', label: `Documents (${documents.length})`, icon: <FileText size={13} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white dark:bg-[#1a1a2c] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
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
              <PendingCard key={item.id} item={item} response={responses[item.id]} onChange={handleResponseChange} onSubmit={handleSubmit} onDelete={handleDeleteQnA} />
            ))}
          </div>
        )
      ) : tab === 'trained' ? (
        trained.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Brain size={48} className="mx-auto mb-3 text-violet-400 opacity-60" />
            <p className="font-medium">No trained responses yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {trained.map(item => <TrainedCard key={item.id} item={item} onDelete={handleDeleteQnA} />)}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Upload Knowledge Document</h3>
            <p className="text-sm text-gray-500 mb-4">Supported formats: PDF, DOCX, XLSX, CSV, TXT (Max 10MB)</p>
            <div className="flex items-center gap-4">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.xlsx,.csv,.txt" className="hidden" multiple />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-md"
              >
                {uploading ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
                {uploading ? 'Processing & Embedding...' : 'Select & Upload Files'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.length === 0 ? (
              <p className="text-center py-8 text-gray-400 font-medium">No documents uploaded yet.</p>
            ) : (
              documents.map(doc => <DocumentCard key={doc.id} doc={doc} onDelete={handleDeleteDocument} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
