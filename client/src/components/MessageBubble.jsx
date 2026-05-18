import React, { memo } from 'react';
import { ArrowRight, Lightbulb } from 'lucide-react';
import './MessageBubble.css';

const MessageBubble = memo(({ message }) => {
  const isBot = message.sender === 'bot';

  const formatText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.trim().startsWith('- ')) {
        const content = line.substring(2);
        return <li key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: renderBold(content) }} />;
      }
      return (
        <span key={i} className="block mb-1 last:mb-0">
          <span dangerouslySetInnerHTML={{ __html: renderBold(line) }} />
        </span>
      );
    });
  };

  const renderBold = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
  };

  const hasList = message.text && message.text.includes('- ');
  
  const timeString = message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}>
      <div className={`flex gap-3 max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-sm ${isBot ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {isBot ? 'AI' : 'U'}
        </div>

        {/* Message Content Area */}
        <div className={`flex flex-col gap-2 ${isBot ? 'items-start' : 'items-end'}`}>
          
          <div className={`px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
            isBot 
              ? 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm' 
              : 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
          } ${message.isError ? 'bg-red-50 border-red-200 text-red-700' : ''}`}>
            
            {hasList ? (
              <ul className="list-disc pl-4 m-0 space-y-1">
                {formatText(message.text)}
              </ul>
            ) : (
              <div>
                {formatText(message.text)}
              </div>
            )}
            
            <div className={`text-[10px] mt-2 text-right ${isBot ? 'text-gray-400' : 'text-indigo-200'}`}>
              {timeString}
            </div>
          </div>

          {/* COMPARISON CARD */}
          {isBot && message.comparison && message.comparison.c1 && message.comparison.c2 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 w-full mt-1 shadow-sm">
              <h4 className="text-center font-bold text-slate-700 text-sm mb-3">Course Comparison</h4>
              <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                  <h5 className="font-bold text-indigo-600 mb-2 text-sm">{message.comparison.c1.name}</h5>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p><span className="font-medium text-slate-400">Fee:</span> {message.comparison.c1.fee}</p>
                    <p><span className="font-medium text-slate-400">Duration:</span> {message.comparison.c1.duration}</p>
                    <p><span className="font-medium text-slate-400">Uni:</span> {message.comparison.c1.university}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center -mx-2 z-10">
                  <span className="bg-slate-200 text-slate-500 text-xs font-bold px-2 py-1 rounded-full shadow-sm">VS</span>
                </div>
                <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                  <h5 className="font-bold text-indigo-600 mb-2 text-sm">{message.comparison.c2.name}</h5>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p><span className="font-medium text-slate-400">Fee:</span> {message.comparison.c2.fee}</p>
                    <p><span className="font-medium text-slate-400">Duration:</span> {message.comparison.c2.duration}</p>
                    <p><span className="font-medium text-slate-400">Uni:</span> {message.comparison.c2.university}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RECOMMENDATION CARD */}
          {isBot && message.recommendation && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 w-full mt-1 shadow-sm">
              <div className="flex items-center gap-2 text-amber-600 text-xs font-bold mb-2 uppercase tracking-wide">
                <Lightbulb size={14} className="text-amber-500" />
                Recommended for you
              </div>
              <p className="text-xs text-amber-800 mb-2">Based on your interest in <span className="font-bold">{message.recommendation.field.toUpperCase()}</span>:</p>
              <div className="space-y-2">
                {message.recommendation.courses.map((c, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-white/60 p-2 rounded border border-amber-100">
                    <ArrowRight size={14} className="text-amber-500 mt-0.5 shrink-0" /> 
                    <div>
                      <div className="text-sm font-semibold text-amber-900">{c.name}</div>
                      <div className="text-xs text-amber-700">{c.university}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default MessageBubble;
