import React, { useState } from 'react';
import { Sparkles, Send, ArrowRight } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

export const CompactAskGeminiEntry: React.FC = () => {
  const { openDrawer } = useFilters();
  const [inputVal, setInputVal] = useState('');

  const quickPrompts = [
    'Why did Travel SLA decline?',
    'Show Red Client Sentiment',
    'Which accounts have penalty risk?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openDrawer('ask-gemini');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xs p-2 sm:p-2.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Left: Title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 rounded-xs bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Sparkles className="w-3 h-3 text-[#0D9488]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-semibold text-[#1A2B4B] tracking-tight uppercase">
                Ask About This Review
              </h2>
              <span className="text-[8.5px] px-1 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xs font-semibold uppercase tracking-wider">
                Assistant
              </span>
            </div>
          </div>
        </div>

        {/* Center: Quick prompt chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => openDrawer('ask-gemini')}
              className="text-[10px] bg-slate-50 border border-slate-200 hover:border-slate-300 active:bg-slate-100 text-slate-600 hover:text-slate-900 px-2 py-1 rounded-xs transition-colors text-left cursor-pointer flex items-center gap-1 group"
            >
              <span>{prompt}</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>

        {/* Right: Quick input & button */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 w-full md:w-auto md:min-w-[240px]">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask a question about this review..."
            className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded-xs px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#0D9488] focus:bg-white transition-colors"
          />
          <button
            type="submit"
            onClick={() => openDrawer('ask-gemini')}
            className="px-2.5 py-1 bg-[#1A2B4B] text-white text-[11px] font-semibold rounded-xs hover:bg-[#23385e] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Ask</span>
            <Send className="w-2.5 h-2.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
