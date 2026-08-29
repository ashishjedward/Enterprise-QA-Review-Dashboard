import React, { useState } from 'react';
import { X, HeartPulse, AlertCircle, HelpCircle, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';
import { useFilters, DrawerType } from '../../context/FilterContext';
import { StatusBadge } from '../common/StatusBadge';
import { AccountData, RAGStatus } from '../../types';

export const SentimentDrawer: React.FC = () => {
  const { activeDrawer, closeDrawer, filteredAccounts, selectAccountAndNavigate, filters } = useFilters();

  // Determine active filter based on activeDrawer
  const [filterRag, setFilterRag] = useState<'ALL' | RAGStatus>('ALL');

  React.useEffect(() => {
    if (activeDrawer === 'sentiment-red') setFilterRag('RED');
    else if (activeDrawer === 'sentiment-amber') setFilterRag('AMBER');
    else if (activeDrawer === 'sentiment-green') setFilterRag('GREEN');
    else if (activeDrawer === 'sentiment-all') setFilterRag('ALL');
  }, [activeDrawer]);

  if (!activeDrawer || !activeDrawer.startsWith('sentiment')) return null;

  const accounts = filteredAccounts.filter((a) => {
    if (filterRag === 'ALL') return true;
    return a.clientSentiment === filterRag;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1A2B4B] uppercase tracking-tight">
                  Client Sentiment Diagnostic Register
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-800 font-mono font-bold rounded-xs">
                  {accounts.length} Accounts
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detailed reason codes, score variance, and executive remediation plans.
              </p>
            </div>
          </div>

          <button
            onClick={closeDrawer}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pill Tabs */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterRag('ALL')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xs transition-colors cursor-pointer ${
                filterRag === 'ALL' ? 'bg-[#1A2B4B] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({filteredAccounts.length})
            </button>
            <button
              onClick={() => setFilterRag('RED')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                filterRag === 'RED' ? 'bg-rose-700 text-white' : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Red ({filteredAccounts.filter((a) => a.clientSentiment === 'RED').length})
            </button>
            <button
              onClick={() => setFilterRag('AMBER')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                filterRag === 'AMBER' ? 'bg-amber-600 text-white' : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <HelpCircle className="w-3 h-3" />
              Amber ({filteredAccounts.filter((a) => a.clientSentiment === 'AMBER').length})
            </button>
            <button
              onClick={() => setFilterRag('GREEN')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                filterRag === 'GREEN' ? 'bg-emerald-700 text-white' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Green ({filteredAccounts.filter((a) => a.clientSentiment === 'GREEN').length})
            </button>
          </div>

          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            Click any account to open full diagnostic view
          </span>
        </div>

        {/* Account Cards List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 divide-y divide-slate-100">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              onClick={() => selectAccountAndNavigate(acc.id)}
              className="pt-2.5 first:pt-0 p-3 rounded-xs border border-slate-200 bg-slate-50/30 hover:bg-white hover:border-[#0D9488] hover:shadow-xs transition-all cursor-pointer group"
            >
              {/* Row 1: Account, Score & RAG */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#1A2B4B] group-hover:text-[#0D9488] transition-colors">
                      {acc.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium font-mono">({acc.vertical})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    QA Leader: <strong className="text-slate-800 font-medium">{acc.qaLeader}</strong> &bull; Sr Director: <strong className="text-slate-800 font-medium">{acc.srDirector}</strong> &bull; Site: <strong className="text-slate-800 font-medium">{acc.site}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#1A2B4B] font-mono">
                      Score: {acc.sentimentScore}/100
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      Prev: {acc.previousSentiment}
                    </div>
                  </div>
                  <StatusBadge status={acc.clientSentiment} size="sm" />
                </div>
              </div>

              {/* Row 2: Sentiment Reason */}
              <div className="p-2 rounded-xs bg-white border border-slate-200 text-xs mb-2">
                <div className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-0.5">
                  Comment / Primary Driver:
                </div>
                <p className="text-slate-800 font-normal leading-relaxed text-[11px]">
                  {acc.sentimentReason}
                </p>
              </div>

              {/* Row 3: Action Required */}
              <div className="flex items-start justify-between gap-2 p-2 rounded-xs bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950">
                <div>
                  <span className="font-bold text-amber-900 text-[9px] uppercase tracking-widest block">
                    Action Required / Intervention:
                  </span>
                  <p className="mt-0.5 leading-snug text-[11px] font-normal">{acc.actionRequired}</p>
                </div>
                <div className="flex items-center gap-1 text-[#0D9488] font-bold shrink-0 group-hover:translate-x-0.5 transition-transform text-xs">
                  <span>Diagnostic</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}

          {accounts.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs font-mono">
              No accounts match the selected sentiment filter criteria.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[10px]">
            Persisting global filters: Vertical: {filters.vertical} &bull; Period: {filters.timePeriod}
          </span>
          <button
            onClick={closeDrawer}
            className="px-3.5 py-1.5 bg-[#1A2B4B] text-white font-bold rounded-xs hover:bg-slate-800 transition-colors cursor-pointer text-xs"
          >
            Close Register
          </button>
        </div>
      </div>
    </div>
  );
};
