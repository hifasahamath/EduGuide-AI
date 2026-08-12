import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Plus, MessageSquare, Search, Settings, LogOut,
  Sparkles, Clock, Sun, Moon, ChevronRight, Trash2,
  PanelLeftClose, Edit3, Check, X, Pin, PinOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';


const ChatSidebar = ({ currentChatId, setCurrentChatId, onNewChat, onChatDeleted, refreshTrigger, closeSidebar, onOpenSettings, isDark }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const loadSessions = useCallback(async () => {
    if (!user?.id) return;
    setLoadingChats(true);
    try {
      const r = await api.get(`/chat/sessions`, { params: { userId: user.id } });
      setChats(r.data || []);
    } catch {
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  }, [user?.id]);

  useEffect(() => { loadSessions(); }, [loadSessions, refreshTrigger]);

  const handleNewChat = () => {
    setCurrentChatId(null);
    onNewChat?.();
    navigate('/chat');
  };

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
    navigate('/chat');
    closeSidebar?.();
  };

  const handleDelete = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    try {
      await api.delete(`/chat/sessions/${chatId}`);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (currentChatId === chatId) { setCurrentChatId(null); onNewChat?.(); }
    } catch { /* silent */ }
  };

  const startRename = (e, chat) => {
    e.stopPropagation();
    setRenamingId(chat.id);
    setRenameVal(chat.title);
  };

  const submitRename = async (chatId) => {
    if (!renameVal.trim()) return;
    try {
      await api.patch(`/chat/sessions/${chatId}/rename`, { title: renameVal.trim() });
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: renameVal.trim() } : c));
    } catch { /* silent */ }
    setRenamingId(null);
  };

  const handlePin = async (e, chat) => {
    e.stopPropagation();
    const newPin = !chat.pinned;
    try {
      await api.patch(`/chat/sessions/${chat.id}/pin`, { pinned: newPin });
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, pinned: newPin } : c)
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          const ta = new Date(a.updated_at || 0).getTime();
          const tb = new Date(b.updated_at || 0).getTime();
          return tb - ta;
        }));
    } catch { /* silent */ }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const bg = isDark ? 'bg-[#0b101d]' : 'bg-[#f1f5f9]';
  const borderColor = isDark ? 'border-slate-800/80' : 'border-slate-200/90';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textMain = isDark ? 'text-slate-100' : 'text-slate-800';
  const hoverBg = isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-200/60';
  const activeBg = isDark ? 'bg-indigo-500/15 border-l-2 border-indigo-500 text-indigo-300' : 'bg-indigo-50 border-l-2 border-indigo-600 text-indigo-900';
  const inputBg = isDark
    ? 'bg-slate-900/90 border-slate-800 placeholder-slate-500 text-slate-200'
    : 'bg-white border-slate-200 placeholder-slate-400 text-slate-700 shadow-xs';

  const filtered = chats.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()));
  // Pinned first, then 5 recent
  const pinnedChats = filtered.filter(c => c.pinned);
  const recentChats = filtered.filter(c => !c.pinned).slice(0, 5);
  const displayChats = [...pinnedChats, ...recentChats];

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className={`w-[260px] h-full ${bg} flex flex-col border-r ${borderColor} transition-colors duration-300 select-none`}>
      {/* Logo + Close */}
      <div className={`px-4 py-3.5 flex items-center justify-between border-b ${borderColor}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className={`font-bold text-sm tracking-tight ${textMain}`}>EduGuide AI</span>
            <span className="text-[10px] text-indigo-500 font-medium tracking-wide uppercase">Workspace</span>
          </div>
        </div>
        <button onClick={closeSidebar} className={`p-1.5 rounded-lg ${hoverBg} ${textMuted} transition-colors`} title="Close sidebar">
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-semibold text-sm shadow-xs shadow-indigo-500/20 group">
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
          <input type="text" placeholder="Search sessions..." value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full rounded-xl py-2 pl-8 pr-3 text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${inputBg}`}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 custom-scrollbar space-y-0.5">
        <p className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 ${textMuted}`}>
          Recents {chats.length > 0 && `(${chats.length})`}
        </p>

        {loadingChats ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : displayChats.length > 0 ? (
          <AnimatePresence>
            {displayChats.map(chat => (
              <motion.div key={chat.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                {renamingId === chat.id ? (
                  /* Rename inline */
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitRename(chat.id); if (e.key === 'Escape') setRenamingId(null); }}
                      className={`flex-1 text-xs rounded-lg px-2 py-1 border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${inputBg}`}
                    />
                    <button onClick={() => submitRename(chat.id)} className="text-emerald-500 hover:text-emerald-400 p-0.5"><Check size={13} /></button>
                    <button onClick={() => setRenamingId(null)} className="text-slate-500 hover:text-slate-400 p-0.5"><X size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => handleSelectChat(chat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-all text-xs group relative ${
                      currentChatId === chat.id ? `${activeBg}` : `${textMuted} ${hoverBg}`
                    }`}>
                    <MessageSquare size={14} className={`flex-shrink-0 opacity-70 ${chat.pinned ? 'text-indigo-400' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="truncate block font-medium">{chat.title || 'New Chat'}</span>
                        {chat.pinned && <span className="text-[8px] text-indigo-400 font-bold uppercase">●</span>}
                      </div>
                      <span className="text-[10px] opacity-50">{formatDate(chat.updated_at)}</span>
                    </div>
                    {/* Action buttons — show on hover */}
                    <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                        <button onClick={(e) => handlePin(e, chat)}
                          className={`p-1 rounded hover:bg-slate-700/40 ${textMuted} hover:text-indigo-400`}
                          title={chat.pinned ? 'Unpin' : 'Pin'}>
                          {chat.pinned ? <PinOff size={11} /> : <Pin size={11} />}
                        </button>
                        <button onClick={(e) => startRename(e, chat)}
                          className={`p-1 rounded hover:bg-slate-700/40 ${textMuted} hover:text-indigo-400`} title="Rename">
                          <Edit3 size={11} />
                        </button>
                        <button onClick={(e) => handleDelete(e, chat.id)}
                          className="p-1 rounded hover:bg-slate-700/40 text-slate-500 hover:text-red-400" title="Delete">
                          <Trash2 size={11} />
                        </button>
                      </div>
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <p className={`text-xs text-center py-8 ${textMuted}`}>
            {search ? 'No chats match your search' : 'No chats yet.\nClick "New Chat" to start!'}
          </p>
        )}
      </div>

      {/* Bottom Actions */}
      <div className={`border-t ${borderColor} p-2 space-y-0.5`}>
        {/* Theme Toggle */}
        <button onClick={toggleTheme}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl ${hoverBg} transition-colors text-xs font-medium ${textMuted}`}>
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? <Moon size={14} className="text-indigo-400" /> : <Sun size={14} className="text-amber-500" />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div className="relative flex items-center" style={{ width: 30, height: 16 }}>
            <div className={`w-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`} style={{ height: 16 }}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </div>
          </div>
        </button>

        <button onClick={() => navigate('/history')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${hoverBg} text-xs font-medium ${textMuted} transition-colors ${location.pathname === '/history' ? activeBg : ''}`}>
          <Clock size={14} /><span>Chat History</span>
        </button>

        <button onClick={() => navigate('/settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${hoverBg} text-xs font-medium ${textMuted} transition-colors ${location.pathname === '/settings' ? activeBg : ''}`}>
          <Settings size={14} /><span>Settings</span>
        </button>

        {/* User */}
        <button onClick={() => navigate('/profile')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl ${hoverBg} transition-colors mt-1 ${location.pathname === '/profile' ? activeBg : ''}`}>
          {user?.profilePic
            ? <img src={user.profilePic} alt="avatar" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            : <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-400 text-xs font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
              </div>}
          <div className="flex-1 text-left overflow-hidden">
            <p className={`text-xs font-semibold truncate ${textMain}`}>{user?.name || 'Student'}</p>
            <p className={`text-[10px] truncate ${textMuted}`}>{user?.email}</p>
          </div>
          <ChevronRight size={13} className={textMuted} />
        </button>

        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/10 text-xs font-medium text-red-400 transition-colors">
          <LogOut size={14} /><span>Log out</span>
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;

