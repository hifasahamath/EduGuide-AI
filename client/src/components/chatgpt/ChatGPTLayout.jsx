import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PanelLeft } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import MainChat from './MainChat';
import SettingsModal from './SettingsModal';
import UserProfilePage from '../../pages/UserProfile';
import ChatHistoryPage from '../../pages/ChatHistory';
import SettingsPage from '../../pages/Settings';

const ChatGPTLayout = ({ page = 'chat' }) => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isDark = theme === 'dark';

  const closeSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Called when MainChat creates a new session — refreshes sidebar list
  const handleChatCreated = (chatId) => {
    setCurrentChatId(chatId);
    setRefreshTrigger(n => n + 1);
  };

  // Called when sidebar "New chat" is clicked — clear chat window
  const handleNewChat = () => {
    setCurrentChatId(null);
    closeSidebarOnMobile();
  };

  return (
    <div className={`flex h-screen w-full font-sans overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#090d16] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      {/* Sidebar Drawer */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0 w-[280px] max-w-[85vw] pointer-events-auto' : '-translate-x-full w-0 overflow-hidden pointer-events-none md:pointer-events-auto'}
        md:relative fixed z-50 inset-y-0 left-0 transition-all duration-300 ease-in-out flex-shrink-0
      `}>
        <ChatSidebar
          currentChatId={currentChatId}
          setCurrentChatId={(id) => { setCurrentChatId(id); closeSidebarOnMobile(); }}
          onNewChat={handleNewChat}
          refreshTrigger={refreshTrigger}
          closeSidebar={() => setSidebarOpen(false)}
          onOpenSettings={() => { setShowSettings(true); closeSidebarOnMobile(); }}
          isDark={isDark}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden min-w-0">
        {page === 'chat' && (
          <MainChat
            currentChatId={currentChatId}
            setCurrentChatId={setCurrentChatId}
            onChatCreated={handleChatCreated}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
            isDark={isDark}
          />
        )}

        {page === 'profile' && (
          <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-[#0b101d]' : 'bg-slate-50/50'}`}>
            <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 ${
                      isDark ? 'bg-slate-900/60 hover:bg-slate-800 text-slate-300' : 'bg-white hover:bg-slate-100 text-slate-700 shadow-xs'
                    } transition-all cursor-pointer touch-manipulation`}
                    title="Expand sidebar"
                  >
                    <PanelLeft size={18} />
                  </button>
                )}
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider md:hidden">My Profile</span>
              </div>
              <UserProfilePage isDark={isDark} />
            </div>
          </div>
        )}

        {page === 'history' && (
          <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-[#0b101d]' : 'bg-slate-50/50'}`}>
            <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 ${
                      isDark ? 'bg-slate-900/60 hover:bg-slate-800 text-slate-300' : 'bg-white hover:bg-slate-100 text-slate-700 shadow-xs'
                    } transition-all cursor-pointer touch-manipulation`}
                    title="Expand sidebar"
                  >
                    <PanelLeft size={18} />
                  </button>
                )}
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider md:hidden">Chat History</span>
              </div>
              <ChatHistoryPage isDark={isDark} />
            </div>
          </div>
        )}

        {page === 'settings' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <SettingsPage isDark={isDark} sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} isDark={isDark} />}
    </div>
  );
};

export default ChatGPTLayout;

