import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, MicOff, PanelLeft, Sparkles, GraduationCap, BookOpen,
  HelpCircle, RotateCcw, MapPin, DollarSign, Clock, ChevronRight,
  MessageCircle, Copy, ThumbsUp, ThumbsDown, X, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_CHAT } from '../../config/env';
import ReactMarkdown from 'react-markdown';

const API = API_CHAT;
const WHATSAPP_NUMBER = '94754864688';

// ── Starter prompts ────────────────────────────────────────────────────────────
const STARTERS = [
  { icon: <GraduationCap size={18} />, label: 'Course recommendations', prompt: 'Suggest IT courses available' },
  { icon: <BookOpen size={18} />, label: 'Explore programs', prompt: 'What diploma courses are available?' },
  { icon: <HelpCircle size={18} />, label: 'Fees & scholarships', prompt: 'What are the fees for software engineering?' },
  { icon: <RotateCcw size={18} />, label: 'Career guidance', prompt: 'What jobs can I get after BSc IT?' },
];

// Smart follow-up suggestions per intent keyword
const SUGGESTIONS = {
  fee: ['What is the registration fee?', 'Are installments available?', 'Any scholarships?'],
  course: ['What is the duration?', 'Where is the campus?', 'What are the requirements?'],
  it: ['Show IT courses under LKR 300,000', 'What is the duration?', 'Career paths in IT?'],
  business: ['Best business courses?', 'MBA vs BBA?', 'Fee comparison?'],
  default: ['Tell me more', 'Show course fees', 'What are the requirements?', 'Where is the campus?'],
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
  const cardBg = isDark ? 'bg-[#2f2f2f] border-white/10' : 'bg-white border-gray-200 shadow-sm';
  return (
    <div className={`rounded-xl border p-4 mb-2 ${cardBg}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-sm leading-tight">{course.name}</p>
          {course.university && <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{course.university}</p>}
        </div>
        {course.field && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold whitespace-nowrap flex-shrink-0">{course.field}</span>
        )}
      </div>
      <div className={`flex flex-wrap gap-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
        {course.totalFee && <span className="flex items-center gap-1"><DollarSign size={11} className="text-emerald-500" />LKR {Number(course.totalFee).toLocaleString()}</span>}
        {course.duration && <span className="flex items-center gap-1"><Clock size={11} className="text-blue-500" />{course.duration}</span>}
        {course.city && <span className="flex items-center gap-1"><MapPin size={11} className="text-rose-500" />{course.city}</span>}
      </div>
      <div className="flex gap-2 flex-wrap">
        {['Fees', 'Duration', 'Location', 'Eligibility'].map(action => (
          <button key={action} onClick={() => onQuickAction(`Tell me about the ${action.toLowerCase()} for ${course.name}`)}
            className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors
              ${isDark ? 'border-white/15 text-gray-300 hover:bg-violet-600 hover:border-violet-600 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700'}`}>
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
  const textMain = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const userBubble = isDark ? 'bg-[#3f3f3f] text-gray-100' : 'bg-white text-gray-800 shadow-sm border border-gray-100';
  const botBubble = isDark ? 'bg-[#2a2a2a] text-gray-100 border border-white/5' : 'bg-violet-50 text-gray-800 border border-violet-100';

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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'} group`}>
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md mt-1">
          <Sparkles size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[78%] ${isBot ? '' : 'flex flex-col items-end'}`}>
        {/* Course cards if present */}
        {isBot && msg.courses?.length > 0 && (
          <div className="mb-2 w-full">
            {msg.courses.map((c, i) => <CourseCard key={i} course={c} isDark={isDark} onQuickAction={onQuickAction} />)}
          </div>
        )}

        {/* Text bubble */}
        {msg.text && (
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isBot ? `${botBubble} rounded-tl-sm` : `${userBubble} rounded-tr-sm`}
            ${msg.isError ? 'border-red-400/30 text-red-400' : ''}`}>
            {isBot ? (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-0.5 prose-headings:my-1">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ) : msg.text}
          </div>
        )}

        {/* Timestamp + bot actions */}
        <div className={`flex items-center gap-2 mt-1 ${isBot ? 'justify-start' : 'justify-end'}`}>
          <p className={`text-[10px] ${textMuted}`}>{formatTime(msg.timestamp)}</p>
          {isBot && !msg.isError && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={copy} className={`p-1 rounded ${textMuted} hover:text-violet-500`} title="Copy">
                <Copy size={11} />
              </button>
              {copied && <span className="text-[10px] text-emerald-500">Copied!</span>}
              <button className={`p-1 rounded ${textMuted} hover:text-emerald-500`} title="Helpful"><ThumbsUp size={11} /></button>
              <button className={`p-1 rounded ${textMuted} hover:text-red-400`} title="Not helpful"><ThumbsDown size={11} /></button>
            </div>
          )}
        </div>

        {/* Quick action chips (after bot message) */}
        {isBot && !msg.isError && msg.suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.suggestions.map((s, i) => (
              <button key={i} onClick={() => onQuickAction(s)}
                className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full border font-medium transition-all
                  ${isDark ? 'border-white/10 text-gray-300 hover:bg-violet-600 hover:border-violet-600 hover:text-white' : 'border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100'}`}>
                <Zap size={9} />{s}
              </button>
            ))}
          </div>
        )}

        {/* WhatsApp advisor button on fallback */}
        {isBot && msg.showWhatsApp && (
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello, I need help with course guidance.`}
            target="_blank" rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors">
            <MessageCircle size={14} /> Talk to an Advisor on WhatsApp
          </a>
        )}
      </div>

      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md mt-1">
          {user?.profilePic
            ? <img src={user.profilePic} alt="u" className="w-8 h-8 rounded-full object-cover" />
            : <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>}
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
      axios.get(`${API}/sessions/${currentChatId}`)
        .then(r => {
          const msgs = (r.data.messages || []).map((m, i) => ({
            id: `${currentChatId}_${i}`,
            sender: m.sender,
            text: m.text,
            timestamp: m.timestamp?._seconds ? new Date(m.timestamp._seconds * 1000) : new Date(),
            suggestions: [],
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
        const r = await axios.post(`${API}/sessions`, { userId: user?.id });
        activeChatId = r.data.chatId;
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
      const res = await axios.post(API, {
        message: trimmed,
        userId: user?.id,
        chatId: activeChatId,
        preferences: user?.preferences || {},
      });

      const reply = res.data.reply || '';
      const isFallback = reply.toLowerCase().includes("i couldn't find") ||
        reply.toLowerCase().includes("sorry") ||
        reply.toLowerCase().includes("contact");

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply,
        timestamp: new Date(),
        courses: res.data.courses || [],
        suggestions: getSuggestions(trimmed + ' ' + reply),
        showWhatsApp: isFallback,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "I'm unable to connect right now. Please call us at **0754 864 688** or chat with an advisor.",
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
  const bg = isDark ? 'bg-[#212121]' : 'bg-[#f8f8f8]';
  const headerBg = isDark ? 'bg-[#212121]/80' : 'bg-[#f8f8f8]/80';
  const inputBg = isDark ? 'bg-[#2f2f2f] border-white/10' : 'bg-white border-gray-200 shadow-md';
  const textMain = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const starterCard = isDark ? 'bg-[#2f2f2f] hover:bg-[#3a3a3a] border-white/10' : 'bg-white hover:bg-gray-50 border-gray-200 shadow-sm';
  const suggestBg = isDark ? 'bg-[#2a2a2a] border-white/10' : 'bg-white border-gray-200 shadow-lg';

  return (
    <div className={`flex-1 flex flex-col h-full ${bg} transition-colors duration-300 relative`}>

      {/* Top Bar */}
      <div className={`sticky top-0 z-10 ${headerBg} backdrop-blur-sm border-b ${isDark ? 'border-white/10' : 'border-black/5'} px-4 py-3 flex items-center gap-3`}>
        {!sidebarOpen && (
          <button onClick={toggleSidebar} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-500'} transition-colors`}>
            <PanelLeft size={18} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          <span className={`font-semibold text-sm ${textMain}`}>EduGuide AI</span>
        </div>
        <div className={`ml-auto flex items-center gap-2`}>
          {user?.preferences?.field && (
            <span className={`text-[10px] px-2 py-1 rounded-full ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'} font-medium`}>
              📚 {user.preferences.field}
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-violet-900/40 text-violet-300' : 'bg-violet-100 text-violet-700'} font-medium`}>
            Education Advisor
          </span>
          {/* WhatsApp quick access */}
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello, I need help with course guidance.`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors">
            <MessageCircle size={11} /> Advisor
          </a>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isNew ? (
          /* Welcome screen */
          <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
              <Sparkles size={32} className="text-white" />
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${textMain}`}>
              Hello, {user?.name?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className={`text-sm mb-2 ${textMuted}`}>I'm your personal EduGuide AI. Ask me about courses, programs, fees, or career paths.</p>
            {user?.preferences?.field && (
              <p className={`text-xs mb-8 px-3 py-1.5 rounded-full ${isDark ? 'bg-violet-900/30 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>
                Personalised for: <strong>{user.preferences.field}</strong>
                {user.preferences.budget ? ` · Budget: ${user.preferences.budget}` : ''}
              </p>
            )}
            {!user?.preferences?.field && <div className="mb-8" />}
            <div className="grid grid-cols-2 gap-3 w-full">
              {STARTERS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.prompt)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all group ${starterCard}`}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    {s.icon}
                  </div>
                  <span className={`text-sm font-medium ${textMain}`}>{s.label}</span>
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
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${isDark ? 'bg-[#2a2a2a] border border-white/5' : 'bg-violet-50 border border-violet-100'}`}>
                  <div className="flex gap-1 items-center h-4">
                    {[0, 0.18, 0.36].map((delay, i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-violet-500"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
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

      {/* Input Area */}
      <div className={`absolute bottom-0 left-0 right-0 ${isDark ? 'bg-gradient-to-t from-[#212121] via-[#212121]/95 to-transparent' : 'bg-gradient-to-t from-[#f8f8f8] via-[#f8f8f8]/95 to-transparent'} pt-8 pb-5 px-4`}>
        <div className="max-w-3xl mx-auto">
          {/* Input suggestions dropdown */}
          <AnimatePresence>
            {inputSuggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className={`mb-2 rounded-xl border overflow-hidden ${suggestBg}`}>
                {inputSuggestions.map((s, i) => (
                  <button key={i} onClick={() => { setInput(s); setInputSuggestions([]); textareaRef.current?.focus(); }}
                    className={`w-full text-left px-4 py-2.5 text-xs ${textMain} ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors flex items-center gap-2 border-b last:border-0 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                    <ChevronRight size={11} className="text-violet-500 flex-shrink-0" />{s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input box */}
          <div className={`flex items-end gap-2 rounded-2xl border p-3 transition-all ${inputBg} focus-within:ring-2 focus-within:ring-violet-500/30`}>
            <textarea ref={textareaRef} rows={1} value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? '🎙 Listening...' : 'Message EduGuide AI...'}
              className={`flex-1 bg-transparent resize-none focus:outline-none text-sm leading-6 max-h-[180px] ${textMain} ${isListening ? 'italic' : ''}`}
              style={{ minHeight: '24px' }}
            />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Voice button */}
              <button onClick={toggleVoice}
                className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : `${textMuted} hover:text-violet-500`}`}
                title={isListening ? 'Stop listening' : 'Voice input'}>
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
              {/* Send button */}
              <button onClick={() => sendMessage()} disabled={!input.trim() || isTyping}
                className={`p-2 rounded-xl transition-all ${input.trim() && !isTyping
                  ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-500/20'
                  : isDark ? 'bg-white/5 text-gray-600' : 'bg-gray-100 text-gray-400'}`}>
                <Send size={16} />
              </button>
            </div>
          </div>

          <p className={`text-center text-[10px] mt-2 ${textMuted}`}>
            EduGuide AI may make mistakes. Verify important academic information with your institution.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainChat;
