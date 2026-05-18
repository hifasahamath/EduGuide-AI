import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Clock, Search, ChevronRight, Pin, PinOff,
  Trash2, Edit3, Check, X, Sparkles, RefreshCw, MessageCircle
} from 'lucide-react';
import axios from 'axios';

const API = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')}/chat`;
const PAGE_SIZE = 10;

const relTime = (ts) => {
  if (!ts) return '';
  const ms = ts._seconds ? ts._seconds * 1000 : new Date(ts).getTime();
  const diff = Date.now() - ms;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(ms).toLocaleDateString();
};

// ── Conversation Modal ─────────────────────────────────────────────────────────
const ConversationModal = ({ chat, onClose, isDark }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/sessions/${chat.chatId}`)
      .then(r => setMessages(r.data.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [chat.chatId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const bg = isDark ? 'bg-[#1a1a1a]' : 'bg-white';
  const overlay = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm';
  const textMain = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${bg} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles size={13} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className={`font-semibold text-sm truncate ${textMain}`}>{chat.title || 'Chat'}</p>
              <p className={`text-[10px] ${textMuted}`}>{chat.messageCount} messages · {relTime(chat.updatedAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} ${textMuted} transition-colors`}>
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto px-5 py-4 space-y-4 ${isDark ? 'bg-[#151515]' : 'bg-gray-50'}`}>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className={`text-center py-12 text-sm ${textMuted}`}>No messages in this conversation.</p>
          ) : (
            messages.map((m, i) => {
              const isUser = m.sender === 'user' || m.role === 'user';
              return (
                <div key={i} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={12} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isUser
                      ? isDark ? 'bg-[#3f3f3f] text-gray-100 rounded-tr-sm' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tr-sm'
                      : isDark ? 'bg-[#2a2a2a] text-gray-100 rounded-tl-sm' : 'bg-violet-50 text-gray-800 border border-violet-100 rounded-tl-sm'
                    }`}>
                    {m.text}
                  </div>
                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-bold">U</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

// ── Chat Row ───────────────────────────────────────────────────────────────────
const ChatRow = ({ chat, isDark, onOpen, onDelete, onPin, onRename }) => {
  const [renamingMode, setRenamingMode] = useState(false);
  const [renameVal, setRenameVal] = useState(chat.title);
  const inputRef = useRef(null);

  useEffect(() => { if (renamingMode) inputRef.current?.focus(); }, [renamingMode]);

  const submitRename = () => {
    if (renameVal.trim() && renameVal !== chat.title) onRename(chat.chatId, renameVal.trim());
    setRenamingMode(false);
  };

  const textMain = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const rowBg = isDark ? 'bg-[#2a2a2a] border-white/8 hover:bg-[#333]' : 'bg-white border-gray-100 hover:bg-gray-50 shadow-sm';

  return (
    <div className={`rounded-xl border transition-all group cursor-pointer ${rowBg} ${chat.pinned ? (isDark ? 'border-violet-500/30' : 'border-violet-200') : ''}`}>
      <div className="flex items-center gap-3 p-4" onClick={() => !renamingMode && onOpen(chat)}>
        {/* Icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
          ${chat.pinned ? 'bg-violet-600/20 text-violet-400' : isDark ? 'bg-white/8 text-gray-400' : 'bg-violet-50 text-violet-500'}`}>
          {chat.pinned ? <Pin size={15} /> : <MessageSquare size={15} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={e => renamingMode && e.stopPropagation()}>
          {renamingMode ? (
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <input ref={inputRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenamingMode(false); }}
                className={`flex-1 text-sm rounded-lg px-2 py-1 border focus:outline-none focus:ring-1 focus:ring-violet-500
                  ${isDark ? 'bg-[#444] border-white/10 text-gray-100' : 'bg-gray-50 border-gray-300'}`} />
              <button onClick={submitRename} className="text-emerald-500 hover:text-emerald-400 p-0.5"><Check size={13} /></button>
              <button onClick={() => setRenamingMode(false)} className={`${textMuted} p-0.5`}><X size={13} /></button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className={`font-semibold text-sm truncate ${textMain}`}>{chat.title || 'New Chat'}</p>
                {chat.pinned && <span className="text-[9px] text-violet-500 font-bold uppercase tracking-wider">Pinned</span>}
              </div>
              <p className={`text-xs truncate mt-0.5 ${textMuted}`}>
                {chat.lastPreview || 'No messages yet'}
              </p>
            </>
          )}
        </div>

        {/* Meta + actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[10px] ${textMuted} mr-1`}>{relTime(chat.updatedAt)}</span>
          {/* Actions — visible on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => { e.stopPropagation(); onPin(chat); }}
              className={`p-1.5 rounded-lg ${textMuted} hover:text-violet-400 ${isDark ? 'hover:bg-white/10' : 'hover:bg-violet-50'} transition-colors`}
              title={chat.pinned ? 'Unpin' : 'Pin'}>
              {chat.pinned ? <PinOff size={12} /> : <Pin size={12} />}
            </button>
            <button onClick={e => { e.stopPropagation(); setRenamingMode(true); }}
              className={`p-1.5 rounded-lg ${textMuted} hover:text-indigo-400 ${isDark ? 'hover:bg-white/10' : 'hover:bg-indigo-50'} transition-colors`}
              title="Rename">
              <Edit3 size={12} />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(chat.chatId); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
          <ChevronRight size={14} className={`${textMuted} opacity-40 group-hover:opacity-100 transition-opacity`} />
        </div>
      </div>
    </div>
  );
};

// ── Main ChatHistory Page ──────────────────────────────────────────────────────
const ChatHistory = ({ isDark }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openChat, setOpenChat] = useState(null);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const fetchChats = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API}/sessions`, { params: { userId: user.id } });
      setChats(r.data || []);
    } catch { setChats([]); }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const handleDelete = async (chatId) => {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await axios.delete(`${API}/sessions/${chatId}`);
      setChats(p => p.filter(c => c.chatId !== chatId));
      showToast('Conversation deleted.');
    } catch { showToast('Failed to delete.'); }
  };

  const handlePin = async (chat) => {
    const newPin = !chat.pinned;
    try {
      await axios.patch(`${API}/sessions/${chat.chatId}/pin`, { pinned: newPin });
      setChats(p => p.map(c => c.chatId === chat.chatId ? { ...c, pinned: newPin } : c)
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          const ta = a.updatedAt?._seconds || 0;
          const tb = b.updatedAt?._seconds || 0;
          return tb - ta;
        }));
      showToast(newPin ? 'Chat pinned.' : 'Chat unpinned.');
    } catch { showToast('Action failed.'); }
  };

  const handleRename = async (chatId, title) => {
    try {
      await axios.patch(`${API}/sessions/${chatId}/rename`, { title });
      setChats(p => p.map(c => c.chatId === chatId ? { ...c, title } : c));
      showToast('Renamed!');
    } catch { showToast('Rename failed.'); }
  };

  // Filter
  const filtered = chats.filter(c => {
    const q = search.toLowerCase();
    return !q || c.title?.toLowerCase().includes(q) || c.lastPreview?.toLowerCase().includes(q) || c.lastBotPreview?.toLowerCase().includes(q);
  });

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const pinned = filtered.filter(c => c.pinned);
  const recent = filtered.filter(c => !c.pinned);

  // Theme
  const textMain = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isDark
    ? 'bg-[#2a2a2a] border-white/10 text-gray-100 placeholder-gray-500'
    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 shadow-sm';

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${textMain}`}>Chat History</h1>
          <p className={`text-xs mt-0.5 ${textMuted}`}>{chats.length} conversation{chats.length !== 1 ? 's' : ''} · sorted by recent</p>
        </div>
        <div className="flex items-center gap-2">
          {toast && <span className="text-xs text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">{toast}</span>}
          <button onClick={fetchChats} className={`p-2 rounded-lg ${textMuted} ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
        <input type="text" placeholder="Search by title or message content..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className={`w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all ${inputBg}`} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-16 ${textMuted}`}>
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No conversations found</p>
          <p className="text-xs mt-1">Start chatting to see your history here</p>
          <button onClick={() => navigate('/chat')}
            className="mt-4 px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors">
            Start a New Chat
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Pinned section */}
          {pinned.length > 0 && (
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${textMuted}`}>
                <Pin size={10} /> Pinned
              </p>
              <div className="space-y-2">
                {pinned.map(chat => (
                  <ChatRow key={chat.chatId} chat={chat} isDark={isDark}
                    onOpen={setOpenChat} onDelete={handleDelete} onPin={handlePin} onRename={handleRename} />
                ))}
              </div>
            </div>
          )}

          {/* Recent section */}
          {recent.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${textMuted}`}>
                  <Clock size={10} /> Recent
                </p>
              )}
              <div className="space-y-2">
                {recent.slice(0, page * PAGE_SIZE).map(chat => (
                  <ChatRow key={chat.chatId} chat={chat} isDark={isDark}
                    onOpen={setOpenChat} onDelete={handleDelete} onPin={handlePin} onRename={handleRename} />
                ))}
              </div>
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <button onClick={() => setPage(p => p + 1)}
              className={`w-full py-2.5 text-sm rounded-xl border font-medium transition-colors
                ${isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              Load more ({filtered.length - page * PAGE_SIZE} remaining)
            </button>
          )}
        </div>
      )}

      {/* Conversation Modal */}
      {openChat && (
        <ConversationModal chat={openChat} isDark={isDark} onClose={() => setOpenChat(null)} />
      )}
    </div>
  );
};

export default ChatHistory;
