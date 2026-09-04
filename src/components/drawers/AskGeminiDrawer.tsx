import React, { useState } from 'react';
import { X, Sparkles, Send, AlertTriangle } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

export const AskGeminiDrawer: React.FC = () => {
  const { activeDrawer, closeDrawer } = useFilters();
  const [query, setQuery] = useState('');

  if (activeDrawer !== 'ask-gemini') return null;

  const sampleQuestions = [
    'Which vertical has the lowest SLA?',
    'Show Red Client Sentiment accounts.',
    'Which QA Leader has the weakest BEST QM?',
    'Why did Travel SLA decline?',
    'Which accounts have penalty risk?',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-[#1A2B4B] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-[#0D9488] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Ask Gemini &bull; QA Executive Assistant
                </h3>
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-xs font-mono font-bold uppercase">
                  Integration Pending
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Natural language query assistant for root causes, risks, and performance diagnostics.
              </p>
            </div>
          </div>

          <button
            onClick={closeDrawer}
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Sample Questions (Disabled) */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Suggested Leadership Questions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  disabled
                  className="text-xs text-slate-400 bg-slate-100 border border-slate-200 rounded-xs px-2.5 py-1 text-left cursor-not-allowed opacity-75"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Status Notice */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xs space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Interactive Answer Generation Disabled</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-normal text-[11.5px]">
              To maintain strict production data integrity and eliminate synthetic data, automated natural language responses have been disabled in this pass.
            </p>
            <p className="text-slate-600 leading-relaxed font-normal text-[11.5px]">
              The interactive assistant will be connected to the live Gemini API service backed directly by the BigQuery prototype dataset in a future phase.
            </p>
          </div>
        </div>

        {/* Input Bar (Disabled) */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled
              placeholder="Interactive queries disabled pending live Gemini API integration..."
              className="flex-1 text-xs bg-slate-100 border border-slate-200 rounded-xs px-3 py-2 text-slate-400 cursor-not-allowed focus:outline-none"
            />
            <button
              type="button"
              disabled
              className="px-3.5 py-2 bg-slate-400 text-white text-xs font-bold rounded-xs cursor-not-allowed opacity-60 flex items-center gap-1.5 shrink-0"
            >
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
          <span className="text-[9px] text-slate-400 mt-1 block text-center">
            Production integrity pass &bull; Grounded BigQuery integration pending
          </span>
        </div>
      </div>
    </div>
  );
};
