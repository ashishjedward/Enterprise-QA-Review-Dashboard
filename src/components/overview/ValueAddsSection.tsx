import React from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';

function formatCompactValue(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const abs = Math.abs(val);
  if (abs >= 1000000) {
    return `${(val / 1000000).toFixed(2)}M`;
  }
  if (abs >= 1000) {
    return `${(val / 1000).toFixed(1)}K`;
  }
  return val.toLocaleString();
}

export const ValueAddsSection: React.FC = () => {
  const { navigateToPage } = useFilters();
  const { overview } = useDashboardData();

  const va = overview?.Value_Adds_Snapshot;

  // Panel 1: QaaS Program Value
  const qaasProgramVal = formatCompactValue(va?.QAAS_Program_Value);
  const qaasTargetVal = formatCompactValue(va?.QAAS_Target_Value);
  const qaasAchPct = va?.QAAS_Value_Achievement_Pct !== null && va?.QAAS_Value_Achievement_Pct !== undefined
    ? `${(va.QAAS_Value_Achievement_Pct * 100).toFixed(1)}% achievement`
    : 'Target Tracking';
  const qaasProgress = va?.QAAS_Value_Achievement_Pct !== null && va?.QAAS_Value_Achievement_Pct !== undefined
    ? Math.min(Math.round(va.QAAS_Value_Achievement_Pct * 100), 100)
    : 0;

  // Panel 2: Active TAP Projects
  const tapActive = va?.TAP_Active_Projects ?? 0;
  const tapAtRisk = va?.TAP_Active_At_Risk ?? 0;
  const tapTotal = va?.TAP_Total_Projects ?? 0;
  const tapClosed = va?.TAP_Closed_Projects ?? 0;
  const tapPlanned = va?.TAP_Planned_Projects ?? 0;
  const tapActiveProgress = tapTotal > 0
    ? Math.min(Math.round((tapActive / tapTotal) * 100), 100)
    : 0;

  // Panel 3: TAP Recorded Benefit
  const tapRecBenefit = formatCompactValue(va?.TAP_Recorded_Benefit);
  const tapTgtBenefit = formatCompactValue(va?.TAP_Target_Benefit);
  const tapRealPct = va?.TAP_Portfolio_Realization_Pct !== null && va?.TAP_Portfolio_Realization_Pct !== undefined
    ? `${(va.TAP_Portfolio_Realization_Pct * 100).toFixed(1)}% of target`
    : 'Target Tracking';
  const tapBenefitProgress = va?.TAP_Portfolio_Realization_Pct !== null && va?.TAP_Portfolio_Realization_Pct !== undefined
    ? Math.min(Math.round(va.TAP_Portfolio_Realization_Pct * 100), 100)
    : 0;

  const valueItems = [
    {
      metric: 'QaaS Program Value',
      currentValue: qaasProgramVal,
      subContext: qaasAchPct,
      actualLabel: 'Program Value:',
      actualValue: qaasProgramVal,
      targetLabel: 'Target Value:',
      targetValue: qaasTargetVal,
      progressPercent: qaasProgress,
    },
    {
      metric: 'Active TAP Projects',
      currentValue: `${tapActive}`,
      subContext: `${tapAtRisk} at risk`,
      subContextWarning: tapAtRisk > 0,
      actualLabel: 'Portfolio Total:',
      actualValue: `${tapTotal}`,
      targetLabel: 'Closed / Planned:',
      targetValue: `${tapClosed} / ${tapPlanned}`,
      progressPercent: tapActiveProgress,
    },
    {
      metric: 'TAP Recorded Benefit',
      currentValue: tapRecBenefit,
      subContext: tapRealPct,
      actualLabel: 'Recorded Benefit:',
      actualValue: tapRecBenefit,
      targetLabel: 'Target Benefit:',
      targetValue: tapTgtBenefit,
      progressPercent: tapBenefitProgress,
    },
  ];

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
              <h2 className="text-label text-navy-900 tracking-tight uppercase font-bold">
                Value-adds & Transformation
              </h2>
              <p className="text-caption text-slate-500 hidden sm:block">
                QaaS opportunity value, transformation portfolio and recorded benefit.
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
                  <span className="text-label text-navy-900 line-clamp-2 leading-tight font-semibold">
                    {item.metric}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-metric-sm text-navy-900 tnum font-bold">
                    {item.currentValue}
                  </span>
                  <span
                    className={`text-caption font-semibold flex items-center tnum ${
                      item.subContextWarning ? 'text-amber-700 font-bold' : 'text-slate-500'
                    }`}
                  >
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

      {/* Brief Value Statement / Pipeline Context */}
      <div className="mt-2 pt-2 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between text-caption text-slate-500 gap-1 sm:gap-0">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-caption">
            QaaS Open Pipeline: <strong className="text-navy-900 font-semibold">{va?.QAAS_Open_Opportunities ?? 0}</strong> opportunities
            {va?.QAAS_Open_Opportunity_Value != null && va.QAAS_Open_Opportunity_Value > 0 && (
              <span className="text-slate-500">
                {' '}• <strong className="text-navy-900 font-semibold">{formatCompactValue(va.QAAS_Open_Opportunity_Value)}</strong> opportunity value
              </span>
            )}
          </span>
        </div>
        <span className="text-caption text-slate-400 italic">
          Modeled value; no currency metadata.
        </span>
      </div>
    </div>
  );
};
