import React, { useState, useEffect, useRef } from 'react';
import * as apiClient from '../../services/api';
import {
  Check, MessageSquare, Lightbulb, RefreshCw, Sparkles,
  Clock, Trash2, BookOpen, AlertCircle, Brain, ChevronDown, ChevronUp, Upload, FileText, X
} from 'lucide-react';

const PendingCard = ({ item, response, onChange, onSubmit, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
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
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date'}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Dismiss">
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
      {item.trained_at && (
        <p className="text-[10px] text-gray-400 mt-2">
          Trained: {new Date(item.trained_at).toLocaleDateString()}
        </p>
      )}
    </div>
  </div>
);

const DocumentCard = ({ doc, onDelete }) => (
  <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden flex items-center justify-between p-4">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
        <FileText size={20} className="text-blue-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{doc.title}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <span>{doc.filename}</span>
          <span>•</span>
          <span>Chunk {doc.chunk_index + 1}</span>
          <span>•</span>
          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {doc.file_url && (
        <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
          View File
        </a>
      )}
      <button onClick={() => onDelete(doc.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
        <Trash2 size={16} />
      </button>
    </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Training Data & Knowledge Base</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Teach the chatbot directly or upload documents (PDF, DOCX, CSV) for RAG.
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-sm px-4 py-2 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 font-medium transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { key: 'pending', label: `Pending Q&A (${pending.length})`, icon: <MessageSquare size={13} /> },
          { key: 'trained', label: `Trained Q&A (${trained.length})`, icon: <BookOpen size={13} /> },
          { key: 'documents', label: `Documents (${documents.length})`, icon: <FileText size={13} /> },
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
          
          <div className="grid grid-cols-1 gap-3">
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
