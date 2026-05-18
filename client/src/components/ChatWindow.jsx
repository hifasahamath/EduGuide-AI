import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MessageCircle, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import InputBox from './InputBox';
import './ChatWindow.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ChatWindow = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm EduGuide AI. I can help you find courses, compare fees, and answer education-related questions. How can I assist you today?", sender: 'bot', timestamp: new Date().toISOString() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const messagesEndRef = useRef(null);
  
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    setLastQuery(text);

    const newUserMsg = { id: Date.now(), text, sender: 'user', timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: text,
        userId: userId
      });

      const { reply, comparison, recommendation } = response.data;
      
      const newBotMsg = {
        id: Date.now() + 1,
        text: reply,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        comparison,
        recommendation
      };

      setMessages(prev => [...prev, newBotMsg]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting to my server right now.", sender: 'bot', isError: true, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [userId]);

  const handleWhatsAppRedirect = () => {
    const phoneNumber = "947548646888"; // Dummy number
    const encodedMessage = encodeURIComponent(
      lastQuery
        ? `Hi, I need help regarding: "${lastQuery}"`
        : "Hi, I need some education consulting help."
    );
    window.open(`https://wa.me/+94754864688?text=${encodedMessage}`, '_blank');
  };

  const quickSuggestions = [
    "Find IT Courses",
    "Compare IT and Business",
    "What are the fees for Software Engineering?"
  ];

  return (
    <div className="chat-window shadow-2xl rounded-2xl border border-gray-200 flex flex-col bg-white overflow-hidden w-full max-w-4xl mx-auto h-[85vh]">
      <div className="chat-header bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold text-xl shadow-inner">
            E
          </div>
          <div>
            <h3 className="font-semibold text-lg m-0 leading-tight">EduGuide AI Assistant</h3>
            <span className="text-indigo-200 text-xs flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Online
            </span>
          </div>
        </div>
        <button 
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm" 
          onClick={handleWhatsAppRedirect}
        >
          <MessageCircle size={16} />
          Talk to Advisor
        </button>
      </div>

      <div className="chat-messages flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar flex flex-col gap-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex items-center gap-3 text-gray-500 text-sm animate-fade-in self-start">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
              AI
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scrollbar">
          {quickSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(suggestion)}
              disabled={isTyping}
              className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-full text-xs font-medium transition-colors border border-indigo-100 disabled:opacity-50"
            >
              <Sparkles size={12} />
              {suggestion}
            </button>
          ))}
        </div>
        <InputBox onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
};

export default ChatWindow;
