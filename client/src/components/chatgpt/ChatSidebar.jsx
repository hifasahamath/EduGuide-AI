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
import axios from 'axios';
import { API_CHAT } from '../../config/env';

const API = API_CHAT;

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
      const r = await axios.get(`${API}/sessions`, { params: { userId: user.id } });
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
      await axios.delete(`${API}/sessions/${chatId}`);
      setChats(prev => prev.filter(c => c.chatId !== chatId));
      if (currentChatId === chatId) { setCurrentChatId(null); onNewChat?.(); }
    } catch { /* silent */ }
  };

  const startRename = (e, chat) => {
    e.stopPropagation();
    setRenamingId(chat.chatId);
    setRenameVal(chat.title);
  };

  const submitRename = async (chatId) => {
    if (!renameVal.trim()) return;
    try {
      await axios.patch(`${API}/sessions/${chatId}/rename`, { title: renameVal.trim() });
      setChats(prev => prev.map(c => c.chatId === chatId ? { ...c, title: renameVal.trim() } : c));
    } catch { /* silent */ }
    setRenamingId(null);
  };

  const handlePin = async (e, chat) => {
    e.stopPropagation();
    const newPin = !chat.pinned;
    try {
      await axios.patch(`${API}/sessions/${chat.chatId}/pin`, { pinned: newPin });
      setChats(prev => prev.map(c => c.chatId === chat.chatId ? { ...c, pinned: newPin } : c)
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          const ta = a.updatedAt?._seconds || 0;
          const tb = b.updatedAt?._seconds || 0;
          return tb - ta;
        }));
    } catch { /* silent */ }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const bg = isDark ? 'bg-[#171717]' : 'bg-[#f0f0f0]';
  const borderColor = isDark ? 'border-white/10' : 'border-black/10';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const textMain = isDark ? 'text-gray-100' : 'text-gray-800';
  const hoverBg = isDark ? 'hover:bg-white/8' : 'hover:bg-black/8';
  const activeBg = isDark ? 'bg-white/15' : 'bg-black/10';
  const inputBg = isDark
    ? 'bg-[#2a2a2a] border-white/10 placeholder-gray-500 text-gray-200'
    : 'bg-white border-black/10 placeholder-gray-400 text-gray-700';

  const filtered = chats.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()));
  // Pinned first, then 5 recent
  const pinnedChats = filtered.filter(c => c.pinned);
  const recentChats = filtered.filter(c => !c.pinned).slice(0, 5);
  const displayChats = [...pinnedChats, ...recentChats];

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className={`w-[260px] h-full ${bg} flex flex-col border-r ${borderColor} transition-colors duration-300`}>
      {/* Logo + Close */}
      <div className={`p-3 flex items-center justify-between border-b ${borderColor}`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className={`font-bold text-sm ${textMain}`}>EduGuide AI</span>
        </div>
        <button onClick={closeSidebar} className={`p-1.5 rounded-lg ${hoverBg} ${textMuted} transition-colors`} title="Close sidebar">
          <PanelLeftClose size={17} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button onClick={handleNewChat}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border ${borderColor} ${textMain} ${hoverBg} transition-all font-medium text-sm group`}>
          <Plus size={16} className="text-violet-500 group-hover:rotate-90 transition-transform duration-200" />
          New chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
          <input type="text" placeholder="Search chats..." value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full rounded-lg py-2 pl-8 pr-3 text-xs border focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all ${inputBg}`}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 custom-scrollbar space-y-0.5">
        <p className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-2 ${textMuted}`}>
          Chats {chats.length > 0 && `(${chats.length})`}
        </p>

        {loadingChats ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : displayChats.length > 0 ? (
          <AnimatePresence>
            {displayChats.map(chat => (
              <motion.div key={chat.chatId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                {renamingId === chat.chatId ? (
                  /* Rename inline */
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitRename(chat.chatId); if (e.key === 'Escape') setRenamingId(null); }}
                      className={`flex-1 text-xs rounded-lg px-2 py-1 border focus:outline-none focus:ring-1 focus:ring-violet-500 ${inputBg}`}
                    />
                    <button onClick={() => submitRename(chat.chatId)} className="text-emerald-500 hover:text-emerald-400 p-0.5"><Check size={13} /></button>
                    <button onClick={() => setRenamingId(null)} className="text-gray-500 hover:text-gray-400 p-0.5"><X size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => handleSelectChat(chat.chatId)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all text-sm group relative ${
                      currentChatId === chat.chatId ? `${activeBg} ${textMain}` : `${textMuted} ${hoverBg}`
                    }`}>
                    <MessageSquare size={14} className={`flex-shrink-0 opacity-60 ${chat.pinned ? 'text-violet-400' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="truncate block text-xs font-medium">{chat.title || 'New Chat'}</span>
                        {chat.pinned && <span className="text-[8px] text-violet-400 font-bold uppercase">●</span>}
                      </div>
                      <span className="text-[10px] opacity-50">{formatDate(chat.updatedAt)}</span>
                    </div>
                    {/* Action buttons — show on hover */}
                    <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                        <button onClick={(e) => handlePin(e, chat)}
                          className={`p-1 rounded hover:bg-white/10 ${textMuted} hover:text-violet-400`}
                          title={chat.pinned ? 'Unpin' : 'Pin'}>
                          {chat.pinned ? <PinOff size={11} /> : <Pin size={11} />}
                        </button>
                        <button onClick={(e) => startRename(e, chat)}
                          className={`p-1 rounded hover:bg-white/10 ${textMuted} hover:text-violet-400`} title="Rename">
                          <Edit3 size={11} />
                        </button>
                        <button onClick={(e) => handleDelete(e, chat.chatId)}
                          className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400" title="Delete">
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
            {search ? 'No chats match your search' : 'No chats yet.\nClick "New chat" to start!'}
          </p>
        )}
      </div>

      {/* Bottom Actions */}
      <div className={`border-t ${borderColor} p-2 space-y-0.5`}>
        {/* Theme Toggle */}
        <button onClick={toggleTheme}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg ${hoverBg} transition-colors text-sm ${textMuted}`}>
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? <Moon size={15} className="text-violet-400" /> : <Sun size={15} className="text-amber-500" />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div className="relative flex items-center" style={{ width: 32, height: 18 }}>
            <div className={`w-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-violet-600' : 'bg-gray-300'}`} style={{ height: 18 }}>
              <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </div>
        </button>

        <button onClick={() => navigate('/history')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${hoverBg} text-sm ${textMuted} transition-colors ${location.pathname === '/history' ? activeBg + ' ' + textMain : ''}`}>
          <Clock size={15} /><span>Chat History</span>
        </button>

        <button onClick={() => navigate('/settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${hoverBg} text-sm ${textMuted} transition-colors ${location.pathname === '/settings' ? activeBg + ' ' + textMain : ''}`}>
          <Settings size={15} /><span>Settings</span>
        </button>

        {/* User */}
        <button onClick={() => navigate('/profile')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${hoverBg} transition-colors mt-1 ${location.pathname === '/profile' ? activeBg : ''}`}>
          {user?.profilePic
            ? <img src={user.profilePic} alt="avatar" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
              </div>}
          <div className="flex-1 text-left overflow-hidden">
            <p className={`text-xs font-semibold truncate ${textMain}`}>{user?.name || 'Student'}</p>
            <p className={`text-[10px] truncate ${textMuted}`}>{user?.email}</p>
          </div>
          <ChevronRight size={13} className={textMuted} />
        </button>

        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-sm text-red-400 transition-colors">
          <LogOut size={15} /><span>Log out</span>
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
