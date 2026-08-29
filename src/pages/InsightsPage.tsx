import React from 'react';
import { Lightbulb, TrendingUp, AlertTriangle, ShieldCheck, ArrowLeft, Target, Award, ArrowRight } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { KEY_INSIGHTS_DATA, ACCOUNTS_DATA } from '../data/dummyData';
import { StatusBadge } from '../components/common/StatusBadge';

export const InsightsPage: React.FC = () => {
  const { navigateToPage, selectAccountAndNavigate, sentimentBreakdown, overallSla, overallBestQm } = useFilters();

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigateToPage('overview')}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Enterprise
          </button>
          <span>&gt;</span>
          <span className="font-bold text-slate-900">Leadership Insights & Executive Radar</span>
        </div>

        <button
          onClick={() => navigateToPage('overview')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>
      </div>

      {/* Strategic Summary Header */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded bg-amber-500 flex items-center justify-center text-white shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Executive QA Review & Strategic Synthesis
            </h1>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Consolidated findings from the August 2026 Governance Cycle. Quality performance is fundamentally robust across FinTech, Retail, and Technology verticals, while Travel and Healthcare display concentrated operational volatility requiring targeted director interventions.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {KEY_INSIGHTS_DATA.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">{item.title}</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded font-mono">
                  {item.tag}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Impact: High Priority Strategic Focus</span>
              <button
                onClick={() => navigateToPage('overview')}
                className="text-sky-700 font-semibold hover:underline flex items-center gap-0.5"
              >
                Inspect Data <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3 Pillar Strategic Action Plan */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Recommended Executive Action Plan (Q3/Q4 2026)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-slate-900">
              <div className="w-5 h-5 rounded bg-sky-100 text-sky-700 flex items-center justify-center text-[10px]">1</div>
              Travel Pod Hypercare
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Deploy 4 senior float quality coaches to Manila Voice, institute daily 15-min baggage calibration scrums, and enforce automated transcript QA scoring.
            </p>
          </div>

          <div className="p-3 rounded border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-slate-900">
              <div className="w-5 h-5 rounded bg-sky-100 text-sky-700 flex items-center justify-center text-[10px]">2</div>
              Healthcare HIPAA Gate
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Enforce 100% pre-call verification gates for high-risk member claim transactions on MediCare Direct to eliminate penalty exposure before month-end audit.
            </p>
          </div>

          <div className="p-3 rounded border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-slate-900">
              <div className="w-5 h-5 rounded bg-sky-100 text-sky-700 flex items-center justify-center text-[10px]">3</div>
              QAAS Automation Rollout
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Scale the 14 active TAP automation pipelines across all Retail and FinTech accounts to expand billable QA margins toward the $1.8M full-year target.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
