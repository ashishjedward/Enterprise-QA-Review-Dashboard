import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Compass,
  Building2,
  MapPin,
  Flame,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { PriorityInsightCard, InsightsActivePageToken } from '../../types/api';
import { useFilters } from '../../context/FilterContext';

interface PriorityInsightsSectionProps {
  cards: PriorityInsightCard[];
}

export const PriorityInsightsSection: React.FC<PriorityInsightsSectionProps> = ({ cards }) => {
  const { selectAccountAndNavigate, navigateToPage } = useFilters();

  if (!cards || cards.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500 shadow-xs">
        <p className="text-xs">No critical account exceptions identified in the current scope.</p>
      </div>
    );
  }

  const getBandBadge = (band: string) => {
    switch (band) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-200">
            CRITICAL ATTENTION
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">
            HIGH ATTENTION
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-yellow-100 text-yellow-800 border border-yellow-200">
            MEDIUM ATTENTION
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">
            WATCH
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Red':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Green':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleEvidenceClick = (e: React.MouseEvent, page?: InsightsActivePageToken, accountId?: string) => {
    e.stopPropagation();
    if (!page) return;
    if (page === 'account-diagnostic' && accountId) {
      selectAccountAndNavigate(accountId);
    } else {
      navigateToPage(page as any);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Priority Governance Interventions (Top Attention Accounts)
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Ranked by Live Reconciled Enterprise Attention Score
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:shadow-md transition-shadow border-l-4 border-l-rose-500"
          >
            {/* Header row with metadata and badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-xs font-mono font-bold">
                  Rank #{card.attentionRank}
                </span>
                <button
                  type="button"
                  onClick={() => selectAccountAndNavigate(card.accountId)}
                  className="text-base font-bold text-slate-900 hover:text-sky-700 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                >
                  {card.accountName}
                  <span className="text-xs font-normal text-slate-500 font-mono">({card.accountId})</span>
                </button>
                {getBandBadge(card.priority)}
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                  Score: {card.attentionScore}
                </span>
              </div>

              {/* Account Dimensions */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {card.vertical}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  {card.qaLeader}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {card.site} / {card.lob}
                </span>
              </div>
            </div>

            {/* Headline and Rationale */}
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold">
                  Driver: {card.primaryDriver}
                </span>
                <h3 className="text-xs font-bold text-slate-900">
                  {card.headline}
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {card.summary}
              </p>
            </div>

            {/* Evidence items grid */}
            {card.evidence.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Live Contractual Evidence & Diagnostic Signals
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {card.evidence.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => handleEvidenceClick(e, item.navigationTarget, card.accountId)}
                      className={`p-2 rounded border text-xs flex flex-col justify-between transition-colors ${
                        item.navigationTarget ? 'cursor-pointer hover:border-slate-400' : ''
                      } ${getStatusBadge(item.status)}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold truncate" title={item.label}>
                          {item.label}
                        </span>
                        {item.navigationTarget && (
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="font-bold text-xs">{item.actual}</span>
                        {item.target && (
                          <span className="text-[10px] opacity-70">
                            / tgt {item.target}
                          </span>
                        )}
                      </div>
                      {item.detail && (
                        <span className="text-[10px] opacity-80 mt-0.5 truncate" title={item.detail}>
                          {item.detail}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Action & CTA */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-2.5 rounded">
              <div className="flex items-start gap-2 text-xs text-slate-700">
                <Compass className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Recommended Executive Action: </span>
                  <span>{card.recommendedAction}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => selectAccountAndNavigate(card.accountId)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                <span>Drilldown 360</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
