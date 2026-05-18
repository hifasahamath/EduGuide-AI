import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ChatSidebar from './ChatSidebar';
import MainChat from './MainChat';
import SettingsModal from './SettingsModal';
import UserProfilePage from '../../pages/UserProfile';
import ChatHistoryPage from '../../pages/ChatHistory';
import SettingsPage from '../../pages/Settings';

const ChatGPTLayout = ({ page = 'chat' }) => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isDark = theme === 'dark';

  // Called when MainChat creates a new session — refreshes sidebar list
  const handleChatCreated = (chatId) => {
    setCurrentChatId(chatId);
    setRefreshTrigger(n => n + 1);
  };

  // Called when sidebar "New chat" is clicked — clear chat window
  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  return (
    <div className={`flex h-screen w-full font-sans overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#212121] text-gray-100' : 'bg-[#f8f8f8] text-gray-900'
    }`}>
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full w-0 overflow-hidden'}
        md:relative fixed z-30 inset-y-0 left-0 transition-all duration-300 ease-in-out flex-shrink-0
      `}>
        <ChatSidebar
          currentChatId={currentChatId}
          setCurrentChatId={setCurrentChatId}
          onNewChat={handleNewChat}
          refreshTrigger={refreshTrigger}
          closeSidebar={() => setSidebarOpen(false)}
          onOpenSettings={() => setShowSettings(true)}
          isDark={isDark}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
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
          <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-[#212121]' : 'bg-gray-50'}`}>
            <div className="max-w-3xl mx-auto p-6">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`mb-4 p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
              >
                ☰
              </button>
              <UserProfilePage isDark={isDark} />
            </div>
          </div>
        )}
        {page === 'history' && (
          <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-[#212121]' : 'bg-gray-50'}`}>
            <div className="max-w-3xl mx-auto p-6">
              <button onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`mb-4 p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}>☰</button>
              <ChatHistoryPage isDark={isDark} />
            </div>
          </div>
        )}
        {page === 'settings' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <SettingsPage isDark={isDark} />
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} isDark={isDark} />}
    </div>
  );
};

export default ChatGPTLayout;
