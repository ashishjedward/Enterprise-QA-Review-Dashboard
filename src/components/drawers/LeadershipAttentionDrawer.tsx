import React from 'react';
import { X, AlertTriangle, ShieldAlert, ChevronRight, DollarSign } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { StatusBadge } from '../common/StatusBadge';

export const LeadershipAttentionDrawer: React.FC = () => {
  const { activeDrawer, closeDrawer, filteredAccounts, selectAccountAndNavigate } = useFilters();

  if (activeDrawer !== 'attention') return null;

  const highRisk = filteredAccounts.filter((a) => a.clientSentiment === 'RED' || a.slaRag === 'RED' || a.penaltyRisk);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1A2B4B] uppercase tracking-tight">
                Leadership Attention & Risk Exposure Register
              </h2>
              <p className="text-xs text-slate-500">
                Accounts with active SLA penalty exposure, sentiment distress, or audit disputes.
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

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xs text-xs text-rose-950 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[11px] block">Estimated Monthly Risk Exposure: ~$128,000</span>
              <p className="text-rose-900 text-[11px] mt-0.5 font-normal">
                4 accounts are currently within contractual penalty breach triggers for current billing cycle.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {highRisk.map((acc) => (
              <div
                key={acc.id}
                onClick={() => selectAccountAndNavigate(acc.id)}
                className="p-3 rounded-xs border border-slate-200 bg-white hover:border-[#0D9488] hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[#1A2B4B] group-hover:text-[#0D9488]">
                        {acc.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">({acc.vertical})</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      QA Leader: <strong className="text-slate-700 font-medium">{acc.qaLeader}</strong> &bull; Director: <strong className="text-slate-700 font-medium">{acc.srDirector}</strong> &bull; Site: <strong className="text-slate-700 font-medium">{acc.site}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {acc.penaltyRisk && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-rose-100 text-rose-900 border border-rose-200 rounded-xs font-bold flex items-center gap-0.5 uppercase tracking-wider">
                        <DollarSign className="w-2.5 h-2.5" /> Penalty Risk
                      </span>
                    )}
                    <StatusBadge status={acc.clientSentiment} size="xs" label={`Sentiment: ${acc.clientSentiment}`} />
                  </div>
                </div>

                {acc.penaltyAmount && (
                  <div className="mb-2 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-1 rounded-xs border border-rose-200 font-mono">
                    Contractual Exposure: {acc.penaltyAmount}
                  </div>
                )}

                <div className="text-[11px] text-slate-700 mb-2 leading-relaxed">
                  <strong>Risk Driver:</strong> {acc.sentimentReason}
                </div>

                <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-xs border border-slate-100 flex items-center justify-between">
                  <span><strong>Intervention:</strong> {acc.actionRequired}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D9488] shrink-0 ml-2" />
                </div>
              </div>
            ))}

            {highRisk.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                No high risk accounts in selected filter scope.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={closeDrawer}
            className="px-3.5 py-1.5 bg-[#1A2B4B] text-white text-xs font-bold rounded-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Register
          </button>
        </div>
      </div>
    </div>
  );
};
