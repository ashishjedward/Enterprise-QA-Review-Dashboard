import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  Calendar,
  Percent,
  Layers,
} from 'lucide-react';
import {
  CommercialContextData,
  PeriodTrendItem,
} from '../../types/api';
import { useFilters } from '../../context/FilterContext';

interface CommercialAndTrendsSectionProps {
  currentCommercial: CommercialContextData;
  periodCommercial: CommercialContextData;
  periodTrends: PeriodTrendItem[];
  timePeriod: string;
}

export const CommercialAndTrendsSection: React.FC<CommercialAndTrendsSectionProps> = ({
  currentCommercial,
  periodCommercial,
  periodTrends,
  timePeriod,
}) => {
  const { navigateToPage } = useFilters();

  const formatUnitless = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '0';
    if (val === 0) return '0';
    const abs = Math.abs(val);
    if (abs >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(2)}M`;
    }
    if (abs >= 1_000) {
      return `${(val / 1_000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };

  const getRagColor = (rag: string | null) => {
    if (rag === 'Red') return 'bg-rose-500 text-white';
    if (rag === 'Amber') return 'bg-amber-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left 1 Col: Commercial Context Summary (Monthly & Cumulative) */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Commercial & Modeled Impact
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
              {timePeriod} Window
            </span>
          </div>

          <div className="space-y-3">
            {/* Monthly Closed Impact */}
            <div className="p-3 rounded bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                <span>{currentCommercial.timePeriodLabel}</span>
                <span
                  className={`font-bold ${
                    currentCommercial.netCommercialImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  Net: {formatUnitless(currentCommercial.netCommercialImpact)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Penalty Paid</span>
                  <span className="font-bold text-rose-700">
                    {formatUnitless(currentCommercial.penaltyPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Reward Earned</span>
                  <span className="font-bold text-emerald-700">
                    {formatUnitless(currentCommercial.rewardEarned)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cumulative Window Impact */}
            <div className="p-3 rounded bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                <span>{periodCommercial.timePeriodLabel}</span>
                <span
                  className={`font-bold ${
                    periodCommercial.netCommercialImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  Net: {formatUnitless(periodCommercial.netCommercialImpact)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Cumulative Penalties</span>
                  <span className="font-bold text-rose-700">
                    {formatUnitless(periodCommercial.penaltyPaid)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Cumulative Rewards</span>
                  <span className="font-bold text-emerald-700">
                    {formatUnitless(periodCommercial.rewardEarned)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Value-Adds & Risk/Penalty Hub</span>
          <button
            type="button"
            onClick={() => navigateToPage('value-adds')}
            className="text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Inspect Value-Adds</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Right 2 Cols: Period Closed KPI Trajectories */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Multi-Period Core Trajectory ({timePeriod} Window)
              </h3>
            </div>
            <span className="text-xs text-slate-500">Official Closed Months Only</span>
          </div>

          {periodTrends.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No historical closed KPI trajectory data available for the selected scope.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {periodTrends.map((trend) => (
                <div
                  key={trend.metricId}
                  className="p-3 rounded border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-bold text-xs text-slate-900">{trend.metricName}</span>
                      <span
                        className={`text-xs font-extrabold px-1.5 py-0.5 rounded ${
                          trend.isFavourable === true
                            ? 'bg-emerald-100 text-emerald-800'
                            : trend.isFavourable === false
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {trend.deltaDisplay}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 my-1">
                      <span>
                        {trend.startMonth}: <strong className="text-slate-800">{trend.startDisplay}</strong>
                      </span>
                      <span>→</span>
                      <span>
                        {trend.endMonth}: <strong className="text-slate-800">{trend.endDisplay}</strong>
                      </span>
                    </div>

                    {/* Monthly dot sparks */}
                    <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-200/60">
                      {trend.points.map((pt, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex flex-col items-center flex-1 text-center"
                          title={`${pt.month}: ${pt.actualDisplay} (${pt.rag})`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full mb-1 ${getRagColor(pt.rag)}`}
                          />
                          <span className="text-[9px] text-slate-500 font-mono scale-90 truncate max-w-full">
                            {pt.month.split('-')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {trend.navigationTarget && (
                    <div className="mt-2.5 pt-1.5 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigateToPage(trend.navigationTarget as any)}
                        className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Detail</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
