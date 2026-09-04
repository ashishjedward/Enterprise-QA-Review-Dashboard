import React, { useState } from 'react';
import { Sparkles, Send, Bot, AlertTriangle } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

export const AskGeminiPanel: React.FC<{ isDrawer?: boolean }> = ({ isDrawer = false }) => {
  const { selectAccountAndNavigate, navigateToPage } = useFilters();
  const [query, setQuery] = useState('');

  const sampleQuestions = [
    'Which vertical has the lowest SLA?',
    'Show Red Client Sentiment accounts.',
    'Which QA Leader has the weakest BEST QM?',
    'Why did Travel SLA decline?',
    'Which accounts have penalty risk?',
  ];

  return (
    <div className={`bg-white rounded-xs flex flex-col justify-between ${
      isDrawer ? 'h-full p-3' : 'border border-teal-200/80 p-2.5 sm:p-3 shadow-xs'
    }`}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-xs bg-[#0D9488] flex items-center justify-center text-white shadow-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[#1A2B4B] tracking-tight uppercase">
                  Ask Gemini &bull; QA Executive Assistant
                </h3>
                <span className="text-[8.5px] px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xs font-bold uppercase">
                  Integration Pending
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500">
                Natural language query assistant for root causes, risks, and performance diagnostics.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Sample Question Chips (Disabled) */}
        <div className="mb-2">
          <div className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Suggested Leadership Questions:
          </div>
          <div className="flex flex-wrap gap-1">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                disabled
                className="text-[10.5px] text-slate-400 bg-slate-50 border border-slate-200 rounded-xs px-2 py-0.5 text-left cursor-not-allowed opacity-75"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar (Disabled) */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex items-center gap-1.5 mb-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled
              placeholder="Interactive queries disabled pending live Gemini API integration..."
              className="w-full text-xs bg-slate-100/70 border border-slate-200 rounded-xs pl-2.5 pr-7 py-1.5 text-slate-500 cursor-not-allowed focus:outline-none"
            />
          </div>
          <button
            type="button"
            disabled
            className="px-3 py-1.5 text-xs font-bold text-white bg-slate-400 rounded-xs flex items-center gap-1 cursor-not-allowed opacity-60"
          >
            <Send className="w-3 h-3" />
            <span>Ask</span>
          </button>
        </form>

        {/* Informative Status Notice */}
        <div className="p-2.5 rounded-xs border border-amber-200 bg-amber-50/40 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Interactive Answer Generation Disabled</span>
          </div>
          <p className="text-slate-600 leading-relaxed font-normal text-[11px]">
            To ensure production data integrity and eliminate synthetic data, automated natural language answers are disabled in this pass pending connection to the live Gemini API service backed by the BigQuery dataset.
          </p>
        </div>
      </div>

      <div className="text-[10.5px] text-slate-400 text-center py-1 mt-2">
        Live Gemini natural language reasoning will be enabled in a future controlled phase.
      </div>
    </div>
  );
};
