import React from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import { RAGStatus } from '../../types';

export const ValueAddsSection: React.FC = () => {
  const { navigateToPage } = useFilters();
  const { overview } = useDashboardData();

  const kpis = overview?.KPI_Cards || [];
  const m011 = kpis.find((k) => k.Metric_ID === 'M011');
  const m012 = kpis.find((k) => k.Metric_ID === 'M012');

  const billedRevenue = overview?.Billed_Revenue !== null && overview?.Billed_Revenue !== undefined
    ? `${(Number(overview.Billed_Revenue) / 1000000).toFixed(2)}M`
    : 'N/A';
  const planRevenue = overview?.Plan_Revenue !== null && overview?.Plan_Revenue !== undefined
    ? `${(Number(overview.Plan_Revenue) / 1000000).toFixed(2)}M`
    : 'N/A';
  const revPct = overview?.Revenue_Achievement_Pct !== null && overview?.Revenue_Achievement_Pct !== undefined
    ? Math.round(Number(overview.Revenue_Achievement_Pct) * 100)
    : 0;
  const revRag = (revPct >= 100 ? 'GREEN' : revPct >= 90 ? 'AMBER' : 'RED') as RAGStatus;

  const getTargetDisplay = (kpi?: { Target_Display?: string | null; Target_Value?: number | null }, isPct = true) => {
    if (kpi?.Target_Display) return kpi.Target_Display;
    if (kpi?.Target_Value !== null && kpi?.Target_Value !== undefined) {
      return isPct ? `${(kpi.Target_Value * 100).toFixed(1)}%` : kpi.Target_Value.toFixed(1);
    }
    return 'N/A';
  };

  const qaUtilValue = m011?.Actual_Display || (m011?.Actual_Value !== null && m011?.Actual_Value !== undefined ? `${(m011.Actual_Value * 100).toFixed(1)}%` : 'N/A');
  const qaUtilTarget = getTargetDisplay(m011, true);
  const qaUtilRag = (m011?.RAG?.toUpperCase() as RAGStatus) || ('Normal' as any);
  const qaUtilProgress = m011?.Actual_Value && m011?.Target_Value ? Math.min(Math.round((m011.Actual_Value / m011.Target_Value) * 100), 100) : 0;

  const attritionValue = m012?.Actual_Display || (m012?.Actual_Value !== null && m012?.Actual_Value !== undefined ? `${(m012.Actual_Value * 100).toFixed(1)}%` : 'N/A');
  const attritionTarget = m012?.Target_Display ? `< ${m012.Target_Display}` : (m012?.Target_Value !== null && m012?.Target_Value !== undefined ? `< ${(m012.Target_Value * 100).toFixed(1)}%` : 'N/A');
  const attritionRag = (m012?.RAG?.toUpperCase() as RAGStatus) || ('Normal' as any);

  const valueItems = [
    {
      metric: 'QA Monetization & Revenue',
      currentValue: billedRevenue,
      subContext: `${revPct}% Achieved`,
      rag: revRag,
      actualLabel: 'Billed Revenue:',
      actualValue: billedRevenue,
      targetLabel: 'Plan Target:',
      targetValue: planRevenue,
      progressPercent: revPct,
    },
    {
      metric: 'Billed QA Resource Utilization',
      currentValue: qaUtilValue,
      subContext: m011?.Favourable_Variance != null ? `${m011.Favourable_Variance >= 0 ? '+' : ''}${(m011.Favourable_Variance * 100).toFixed(1)}% vs Tgt` : 'Target Tracking',
      rag: qaUtilRag,
      actualLabel: 'Actual Util:',
      actualValue: qaUtilValue,
      targetLabel: 'Target:',
      targetValue: qaUtilTarget,
      progressPercent: qaUtilProgress,
    },
    {
      metric: 'QA Talent Retention / Attrition',
      currentValue: attritionValue,
      subContext: m012?.Favourable_Variance != null ? `${m012.Favourable_Variance >= 0 ? '-' : '+'}${(Math.abs(m012.Favourable_Variance) * 100).toFixed(1)}% vs Tgt` : 'Target Tracking',
      rag: attritionRag,
      actualLabel: 'Actual Attrition:',
      actualValue: attritionValue,
      targetLabel: 'Target Ceiling:',
      targetValue: attritionTarget,
      progressPercent: m012?.Actual_Value !== null && m012?.Actual_Value !== undefined ? Math.min(Math.round(m012.Actual_Value * 100), 100) : 0,
    },
  ];

  const tapActive = Number(overview?.TAP_Active_Projects ?? 0);
  const tapBenefit = overview?.TAP_Realized_Benefit !== null && overview?.TAP_Realized_Benefit !== undefined 
    ? `$${(Number(overview.TAP_Realized_Benefit) / 1000).toFixed(0)}K` 
    : null;

  return (
    <div className="bg-surface border border-border-default rounded shadow-elevation-1 p-3 sm:p-4 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-border-subtle gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-label text-navy-900 tracking-tight uppercase">
                Value-adds & Transformation
              </h2>
              <p className="text-caption text-slate-500 hidden sm:block">
                QAAS revenue monetization, billed QA utilization & automation delivery.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigateToPage('value-adds')}
            className="text-label font-bold text-teal-600 hover:text-teal-800 self-end sm:self-auto cursor-pointer flex items-center gap-1 transition-colors"
          >
            <span>View Details &rarr;</span>
          </button>
        </div>

        {/* 3 Value Panels with Thin Internal Dividers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle border border-border-default rounded overflow-hidden">
          {valueItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-surface hover:bg-surface-hover transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1 min-h-[22px]">
                  <span className="text-label text-navy-900 line-clamp-2 leading-tight">
                    {item.metric}
                  </span>
                  <div className="shrink-0">
                    <StatusBadge status={item.rag} size="xs" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-metric-sm text-navy-900 tnum">
                    {item.currentValue}
                  </span>
                  <span className="text-caption font-semibold text-slate-500 flex items-center tnum">
                    {item.subContext}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-border-subtle text-caption text-slate-600 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{item.actualLabel}</span>
                  <span className="font-semibold text-navy-900 tnum">{item.actualValue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{item.targetLabel}</span>
                  <span className="font-semibold text-navy-900 tnum">{item.targetValue}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden mt-1">
                  <div
                    className="bg-teal-600 h-full rounded"
                    style={{ width: `${Math.min(item.progressPercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brief Value Statement */}
      <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-caption text-slate-500">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-caption">
            {tapActive} Active Transformation & Automation projects{tapBenefit ? ` (${tapBenefit} realized)` : ''}
          </span>
        </div>
        <span className="text-caption text-status-green-text font-bold tnum">{revPct}% Achieved</span>
      </div>
    </div>
  );
};
