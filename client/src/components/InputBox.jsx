import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Mic, MicOff } from 'lucide-react';

const InputBox = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput('');
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setInput(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      startVoiceRecognition();
    }
  };

  return (
    <form 
      className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full p-1.5 pl-3 transition-shadow focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200"
      onSubmit={handleSubmit}
    >
      <button 
        type="button" 
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shrink-0 ${
          isListening 
            ? 'text-red-500 bg-red-50 animate-pulse ring-4 ring-red-100' 
            : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
        }`}
        onClick={toggleListening}
        disabled={disabled}
        title="Voice Input"
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      </button>
      
      <input
        ref={inputRef}
        type="text"
        className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-sm py-2"
        placeholder={isListening ? "Listening..." : "Type your message..."}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
      />
      
      <button 
        type="submit" 
        className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shrink-0 shadow-sm"
        disabled={!input.trim() || disabled}
      >
        <SendHorizontal size={18} className={input.trim() && !disabled ? "ml-0.5" : ""} />
      </button>
    </form>
  );
};

export default InputBox;
