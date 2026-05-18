import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Sun, Moon, Bell, Lock, Globe, Shield, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const SettingsModal = ({ onClose, isDark }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, updateSessionProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('appearance');

  const bg = isDark ? 'bg-[#2a2a2a]' : 'bg-white';
  const overlayBg = isDark ? 'bg-black/60' : 'bg-black/30';
  const borderColor = isDark ? 'border-white/10' : 'border-gray-200';
  const textMain = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const sidebarBg = isDark ? 'bg-[#222]' : 'bg-gray-50';
  const activeTab_ = isDark ? 'bg-white/10 text-gray-100' : 'bg-violet-50 text-violet-700';
  const inactiveTab = isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100';

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: <Sun size={15} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
    { id: 'privacy', label: 'Privacy & Data', icon: <Shield size={15} /> },
    { id: 'language', label: 'Language', icon: <Globe size={15} /> },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlayBg} backdrop-blur-sm`} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
        className={`${bg} rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border ${borderColor}`}
        style={{ minHeight: 400 }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${borderColor}`}>
          <h2 className={`font-bold text-lg ${textMain}`}>Settings</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} ${textMuted} transition-colors`}>
            <X size={18} />
          </button>
        </div>

        <div className="flex h-[420px]">
          {/* Sidebar */}
          <div className={`w-48 border-r ${borderColor} ${sidebarBg} p-2 flex flex-col gap-1`}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? activeTab_ : inactiveTab}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <div>
                  <h3 className={`font-semibold mb-4 ${textMain}`}>Theme</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => theme === 'dark' ? null : toggleTheme()}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        theme === 'dark' ? 'border-violet-500 bg-violet-500/10' : `border-transparent ${isDark ? 'bg-white/5' : 'bg-gray-100'}`
                      }`}
                    >
                      <div className="w-12 h-8 rounded-lg bg-[#212121] flex items-center justify-center">
                        <Moon size={16} className="text-violet-400" />
                      </div>
                      <span className={`text-sm font-medium ${textMain}`}>Dark</span>
                    </button>
                    <button
                      onClick={() => theme === 'light' ? null : toggleTheme()}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        theme === 'light' ? 'border-violet-500 bg-violet-500/10' : `border-transparent ${isDark ? 'bg-white/5' : 'bg-gray-100'}`
                      }`}
                    >
                      <div className="w-12 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <Sun size={16} className="text-amber-500" />
                      </div>
                      <span className={`text-sm font-medium ${textMain}`}>Light</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className={`font-semibold mb-4 ${textMain}`}>Notifications</h3>
                {['New message alerts', 'Weekly progress summary', 'Course updates'].map(item => (
                  <div key={item} className={`flex items-center justify-between py-3 border-b ${borderColor}`}>
                    <span className={`text-sm ${textMain}`}>{item}</span>
                    <div className="w-10 h-5 bg-violet-600 rounded-full relative cursor-pointer">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <h3 className={`font-semibold mb-4 ${textMain}`}>Privacy & Data</h3>
                <div className={`p-4 rounded-xl border ${borderColor} space-y-3`}>
                  <p className={`text-sm ${textMuted}`}>Your conversations are saved to improve the AI. You can clear your history at any time.</p>
                  <button className="flex items-center gap-2 text-red-400 text-sm font-medium hover:text-red-300 transition-colors">
                    <Trash2 size={15} /> Clear all chat history
                  </button>
                </div>
                <div className={`flex items-center justify-between py-3 border-b ${borderColor}`}>
                  <div>
                    <p className={`text-sm font-medium ${textMain}`}>Save chat history</p>
                    <p className={`text-xs ${textMuted}`}>Store your conversations in the cloud</p>
                  </div>
                  <div className="w-10 h-5 bg-violet-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-4">
                <h3 className={`font-semibold mb-4 ${textMain}`}>Language</h3>
                {['English', 'Sinhala', 'Tamil', 'French', 'German'].map(lang => (
                  <button
                    key={lang}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${borderColor} ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <span className={`text-sm font-medium ${textMain}`}>{lang}</span>
                    {lang === 'English' && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsModal;
