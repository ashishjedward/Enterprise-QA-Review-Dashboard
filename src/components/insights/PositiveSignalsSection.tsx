import React from 'react';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { PositiveSignalItem } from '../../types/api';
import { useFilters } from '../../context/FilterContext';

interface PositiveSignalsSectionProps {
  signals: PositiveSignalItem[];
}

export const PositiveSignalsSection: React.FC<PositiveSignalsSectionProps> = ({ signals }) => {
  const { navigateToPage, selectAccountAndNavigate } = useFilters();

  if (!signals || signals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Positive Governance Signals & Operational Highlights
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Verified Performance & Delivery Milestones
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {signals.map((sig) => (
          <div
            key={sig.id}
            className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between border-t-4 border-t-emerald-500 hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {sig.metricLabel}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {sig.achievementValue}
                </span>
              </div>

              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {sig.title}
              </h3>

              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {sig.summary}
              </p>
            </div>

            {sig.navigationTarget && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {sig.accountName ? sig.accountName : 'Enterprise Scope'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (sig.navigationTarget?.page === 'account-diagnostic' && sig.accountId) {
                      selectAccountAndNavigate(sig.accountId);
                    } else if (sig.navigationTarget?.page) {
                      navigateToPage(sig.navigationTarget.page as any);
                    }
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
