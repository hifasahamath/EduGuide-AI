import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, MicOff, PanelLeft, Sparkles, GraduationCap, BookOpen,
  HelpCircle, RotateCcw, MapPin, DollarSign, Clock, ChevronRight,
  MessageCircle, Copy, ThumbsUp, ThumbsDown, X, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ReactMarkdown from 'react-markdown';

const WHATSAPP_NUMBER = '94775605161';

// ── Starter prompts ────────────────────────────────────────────────────────────
const STARTERS = [
  { icon: <GraduationCap size={16} />, label: 'Course Recommendations', prompt: 'Suggest top IT courses available' },
  { icon: <BookOpen size={16} />, label: 'Explore Higher Diplomas', prompt: 'What diploma programs are available?' },
  { icon: <HelpCircle size={16} />, label: 'Tuition & Payment Plans', prompt: 'What are the fees for software engineering degrees?' },
  { icon: <RotateCcw size={16} />, label: 'Career Pathways', prompt: 'What career opportunities exist after a BSc in IT?' },
];

// Smart follow-up suggestions per intent keyword
const SUGGESTIONS = {
  fee: ['What is the registration fee?', 'Are payment installments available?', 'Any scholarships?'],
  course: ['What is the program duration?', 'Where is the campus located?', 'What are entry requirements?'],
  it: ['Show IT degrees under LKR 500,000', 'What is the course duration?', 'Career opportunities in Software Engineering?'],
  business: ['Best business management courses?', 'MBA vs BBA comparison?', 'Fee breakdown?'],
  default: ['Tell me more', 'Show course fees', 'What are entry requirements?', 'Where is the campus?'],
};

const getSuggestions = (text = '') => {
  const t = text.toLowerCase();
  if (t.includes('fee') || t.includes('cost')) return SUGGESTIONS.fee;
  if (t.includes('it') || t.includes('software') || t.includes('tech')) return SUGGESTIONS.it;
  if (t.includes('business') || t.includes('mba') || t.includes('bba')) return SUGGESTIONS.business;
  if (t.includes('course') || t.includes('program')) return SUGGESTIONS.course;
  return SUGGESTIONS.default;
};

// ── Course Card component ──────────────────────────────────────────────────────
const CourseCard = ({ course, isDark, onQuickAction }) => {
  const cardBg = isDark ? 'bg-slate-900/90 border-slate-800/90' : 'bg-white border-slate-200 shadow-xs';
  return (
    <div className={`rounded-xl border p-4 mb-2.5 transition-all ${cardBg}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-snug">{course.name}</p>
          {course.university && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{course.university}</p>
          )}
        </div>
        {course.field && (
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50 dark:border-indigo-800/40 whitespace-nowrap flex-shrink-0">
            {course.field}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-3.5 text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
        {course.totalFee && (
          <span className="flex items-center gap-1">
            <DollarSign size={13} className="text-emerald-500" />
            LKR {Number(course.totalFee).toLocaleString()}
          </span>
        )}
        {course.duration && (
          <span className="flex items-center gap-1">
            <Clock size={13} className="text-indigo-500" />
            {course.duration}
          </span>
        )}
        {course.city && (
          <span className="flex items-center gap-1">
            <MapPin size={13} className="text-rose-500" />
            {course.city}
          </span>
        )}
      </div>
      <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800/60">
        {['Fees', 'Duration', 'Location', 'Eligibility'].map(action => (
          <button key={action} onClick={() => onQuickAction(`Tell me about the ${action.toLowerCase()} for ${course.name}`)}
            className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
              isDark
                ? 'border-slate-800 text-slate-300 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white'
                : 'border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600'
            }`}>
            {action}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Message bubble ─────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isDark, user, onQuickAction }) => {
  const [copied, setCopied] = useState(false);
  const isBot = msg.sender === 'bot';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const userBubble = isDark ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white shadow-xs';
  const botBubble = isDark ? 'bg-slate-900/90 text-slate-100 border border-slate-800/80' : 'bg-white text-slate-900 border border-slate-200/90 shadow-xs';

  const copy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts instanceof Date ? ts : new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'} group`}>
      {isBot && (
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs mt-0.5">
          <Sparkles size={13} className="text-white" />
        </div>
      )}
      <div className={`max-w-[80%] ${isBot ? '' : 'flex flex-col items-end'}`}>
        {/* Course cards if present */}
        {isBot && msg.courses?.length > 0 && (
          <div className="mb-2.5 w-full">
            {msg.courses.map((c, i) => <CourseCard key={i} course={c} isDark={isDark} onQuickAction={onQuickAction} />)}
          </div>
        )}

        {/* Text bubble */}
        {msg.text && (
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isBot ? `${botBubble} rounded-tl-xs` : `${userBubble} rounded-tr-xs`
          } ${msg.isError ? 'border-red-500/40 text-red-400' : ''}`}>
            {isBot ? (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-0.5 prose-headings:my-1 prose-chat">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ) : msg.text}
          </div>
        )}

        {/* Timestamp + bot actions */}
        <div className={`flex items-center gap-2 mt-1.5 ${isBot ? 'justify-start' : 'justify-end'}`}>
          <p className={`text-[10px] font-medium ${textMuted}`}>{formatTime(msg.timestamp)}</p>
          {isBot && !msg.isError && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={copy} className={`p-1 rounded-md ${textMuted} hover:text-indigo-500 transition-colors`} title="Copy response">
                <Copy size={11} />
              </button>
              {copied && <span className="text-[10px] text-emerald-500 font-medium">Copied!</span>}
              <button className={`p-1 rounded-md ${textMuted} hover:text-emerald-500 transition-colors`} title="Helpful"><ThumbsUp size={11} /></button>
              <button className={`p-1 rounded-md ${textMuted} hover:text-red-400 transition-colors`} title="Not helpful"><ThumbsDown size={11} /></button>
            </div>
          )}
        </div>

        {/* Quick action chips (after bot message) */}
        {isBot && !msg.isError && msg.suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.suggestions.map((s, i) => (
              <button key={i} onClick={() => onQuickAction(s)}
                className={`flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  isDark
                    ? 'border-slate-800 text-slate-300 bg-slate-900/60 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white'
                    : 'border-indigo-100 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 hover:border-indigo-200'
                }`}>
                <Zap size={10} className="text-indigo-500" />{s}
              </button>
            ))}
          </div>
        )}

        {/* WhatsApp advisor button on fallback */}
        {isBot && msg.showWhatsApp && (
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello, I need help with course guidance.`}
            target="_blank" rel="noopener noreferrer"
            className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors">
            <MessageCircle size={14} /> Talk to an Academic Advisor
          </a>
        )}
      </div>

      {!isBot && (
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shadow-xs mt-0.5">
          {user?.profilePic
            ? <img src={user.profilePic} alt="u" className="w-7 h-7 rounded-lg object-cover" />
            : <span className="text-indigo-400 text-xs font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>}
        </div>
      )}
    </motion.div>
  );
};

// ── Main Chat ──────────────────────────────────────────────────────────────────
const MainChat = ({ currentChatId, setCurrentChatId, onChatCreated, toggleSidebar, sidebarOpen, isDark }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputSuggestions, setInputSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const isNew = !currentChatId && messages.length === 0;

  // Load existing chat
  useEffect(() => {
    setMessages([]);
    if (currentChatId) {
      api.get(`/chat/sessions/${currentChatId}`)
        .then(r => {
          const msgs = (r.data.messages || []).map((m, i) => ({
            id: `${currentChatId}_${i}`,
            sender: m.role === 'assistant' ? 'bot' : 'user',
            text: m.content,
            timestamp: m.created_at ? new Date(m.created_at) : new Date(),
            suggestions: m.metadata?.followUps || [],
          }));
          setMessages(msgs);
        })
        .catch(() => setMessages([]));
    }
  }, [currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  const autoResize = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'; }
  };

  // Smart input suggestions
  const handleInputChange = (val) => {
    setInput(val);
    autoResize();
    if (val.length > 2) {
      const t = val.toLowerCase();
      const pool = [
        'What courses are available in IT?',
        'What is the fee for BSc Software Engineering?',
        'Show business courses under LKR 500,000',
        'What is the duration of a nursing degree?',
        'Career paths after BBA?',
        'Compare IT and Business degrees',
        'What are the eligibility requirements for medicine?',
        'Which universities offer aviation courses?',
      ];
      setInputSuggestions(pool.filter(p => p.toLowerCase().includes(t)).slice(0, 3));
    } else {
      setInputSuggestions([]);
    }
  };

  // Voice input
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser.'); return; }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isTyping) return;

    let activeChatId = currentChatId;
    if (!activeChatId) {
      try {
        const r = await api.post(`/chat/sessions`, { userId: user?.id });
        activeChatId = r.data.id;
        setCurrentChatId(activeChatId);
        onChatCreated?.(activeChatId);
      } catch { /* stateless fallback */ }
    }

    const userMsg = { id: Date.now().toString(), sender: 'user', text: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setInputSuggestions([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);

    try {
      const res = await api.post('/chat', {
        message: trimmed,
        userId: user?.id,
        sessionId: activeChatId,
        preferences: user?.preferences || {},
      });

      const reply = res.data.reply || '';
      const isFallback = reply.toLowerCase().includes("i couldn't find") ||
        reply.toLowerCase().includes("sorry") ||
        reply.toLowerCase().includes("contact");

      const dynamicFollowups = res.data.followUps && res.data.followUps.length > 0
        ? res.data.followUps
        : getSuggestions(trimmed + ' ' + reply);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply,
        timestamp: new Date(),
        courses: res.data.courses || [],
        suggestions: dynamicFollowups,
        showWhatsApp: isFallback,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "I'm unable to connect right now. Please call us at **+94 77 560 5161** or chat with an advisor.",
        timestamp: new Date(),
        isError: false,
        suggestions: [],
        showWhatsApp: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, currentChatId, user, setCurrentChatId, onChatCreated]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Theme helpers
  const bg = isDark ? 'bg-[#080c16]' : 'bg-slate-50';
  const headerBg = isDark ? 'bg-[#080c16]/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-xs';
  const inputBg = isDark
    ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-xl'
    : 'bg-white border-slate-300 text-slate-900 shadow-md shadow-slate-200/50';
  const textMain = isDark ? 'text-slate-100' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-300' : 'text-slate-700';
  const textSubtle = isDark ? 'text-slate-400' : 'text-slate-500';
  const starterCard = isDark
    ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-700/80 text-slate-100 shadow-xs'
    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-900 shadow-sm';
  const suggestBg = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-lg';

  // Render Input Box component to avoid duplication
  const renderInputBox = (isCentered = false) => (
    <div className={`w-full ${isCentered ? 'max-w-2xl mx-auto' : 'max-w-3xl mx-auto'}`}>
      {/* Input suggestions dropdown */}
      <AnimatePresence>
        {inputSuggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className={`mb-2 rounded-xl border overflow-hidden ${suggestBg}`}>
            {inputSuggestions.map((s, i) => (
              <button key={i} onClick={() => { setInput(s); setInputSuggestions([]); textareaRef.current?.focus(); }}
                className={`w-full text-left px-4 py-2.5 text-xs font-semibold ${textMain} ${
                  isDark ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-slate-100 border-slate-200'
                } transition-colors flex items-center gap-2 border-b last:border-0`}>
                <ChevronRight size={12} className="text-indigo-500 flex-shrink-0" />{s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input box */}
      <div className={`flex items-end gap-2 rounded-2xl border p-3 transition-all ${inputBg} focus-within:ring-2 focus-within:ring-indigo-500/40`}>
        <textarea ref={textareaRef} rows={1} value={input}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? '🎙 Listening...' : 'Ask EduGuide AI about courses, fees, or requirements...'}
          className={`flex-1 bg-transparent resize-none focus:outline-none text-xs sm:text-sm font-medium leading-6 max-h-[180px] ${textMain} ${
            isDark ? 'placeholder-slate-400' : 'placeholder-slate-500'
          } ${isListening ? 'italic text-red-400' : ''}`}
          style={{ minHeight: '24px' }}
        />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Voice button */}
          <button onClick={toggleVoice}
            className={`p-2 rounded-xl transition-all ${
              isListening ? 'bg-red-500 text-white animate-pulse' : `${textMuted} hover:text-indigo-500 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}>
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          {/* Send button */}
          <button onClick={() => sendMessage()} disabled={!input.trim() || isTyping}
            className={`p-2 rounded-xl transition-all ${
              input.trim() && !isTyping
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs shadow-indigo-500/20'
                : isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400'
            }`}>
            <Send size={15} />
          </button>
        </div>
      </div>

      <p className={`text-center text-[11px] font-medium mt-2.5 ${textMuted}`}>
        EduGuide AI provides academic guidance. Please verify fee structures and entry requirements with your target institution.
      </p>
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col h-full ${bg} transition-colors duration-300 relative`}>

      {/* Top Bar */}
      <div className={`sticky top-0 z-10 ${headerBg} backdrop-blur-md border-b px-4 py-3 flex items-center gap-3`}>
        {!sidebarOpen && (
          <button onClick={toggleSidebar} className={`p-2 rounded-xl border ${
            isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
          } transition-colors`} title="Toggle sidebar">
            <PanelLeft size={16} />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
            <Sparkles size={13} className="text-white" />
          </div>
          <span className={`font-bold text-sm tracking-tight ${textMain}`}>EduGuide AI</span>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          {user?.preferences?.field && (
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full ${
              isDark ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'bg-slate-200 text-slate-800 border border-slate-300'
            } font-semibold hidden sm:inline-block`}>
              Field: {user.preferences.field}
            </span>
          )}
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
            isDark ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/60' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
          }`}>
            Education Advisor
          </span>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello, I need help with course guidance.`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs transition-colors">
            <MessageCircle size={13} /> Advisor
          </a>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isNew ? (
          /* Welcome screen - ChatGPT & Gemini style centered layout */
          <div className="min-h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto py-12">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-md shadow-indigo-600/20 text-white">
              <Sparkles size={24} />
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight ${textMain}`}>
              Welcome, {user?.name?.split(' ')[0] || 'Student'}
            </h1>
            <p className={`text-xs sm:text-sm mb-6 font-medium ${textMuted} max-w-md`}>
              Explore higher education courses, compare tuition fees, and receive personalised career guidance.
            </p>

            {user?.preferences?.field && (
              <p className={`text-xs mb-6 px-3 py-1.5 rounded-full font-semibold ${
                isDark ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/60' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
              }`}>
                Personalised target: <strong>{user.preferences.field}</strong>
                {user.preferences.budget ? ` · Budget: ${user.preferences.budget}` : ''}
              </p>
            )}

            {/* Centered Text Input Box (ChatGPT / Gemini style) */}
            <div className="w-full mb-8">
              {renderInputBox(true)}
            </div>

            {/* Prompt Starter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {STARTERS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.prompt)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all group ${starterCard}`}>
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold mb-0.5 ${textMain}`}>{s.label}</p>
                    <p className={`text-[11px] font-medium truncate ${textMuted}`}>{s.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-5 pb-36">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} isDark={isDark} user={user} onQuickAction={sendMessage} />
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs flex-shrink-0 mt-0.5">
                  <Sparkles size={13} className="text-white" />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-xs ${
                  isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-300 shadow-xs'
                }`}>
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 0.18, 0.36].map((delay, i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-indigo-500"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Input Area (Only when messages exist) */}
      {!isNew && (
        <div className={`absolute bottom-0 left-0 right-0 ${
          isDark
            ? 'bg-gradient-to-t from-[#080c16] via-[#080c16]/95 to-transparent'
            : 'bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent'
        } pt-8 pb-5 px-4 z-10`}>
          {renderInputBox(false)}
        </div>
      )}
    </div>
  );
};

export default MainChat;


