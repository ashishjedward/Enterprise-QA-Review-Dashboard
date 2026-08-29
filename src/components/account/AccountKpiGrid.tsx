import React from 'react';
import { Account360Kpi } from '../../types/api';
import { StatusBadge } from '../common/StatusBadge';

interface AccountKpiGridProps {
  kpis: Account360Kpi[];
}

export const AccountKpiGrid: React.FC<AccountKpiGridProps> = ({ kpis }) => {
  // Sort by Display_Order or Metric_ID
  const sortedKpis = [...kpis].sort((a, b) => (a.Display_Order || 0) - (b.Display_Order || 0));

  const formatVarianceDisplay = (kpi: Account360Kpi) => {
    if (kpi.Favourable_Variance === null || kpi.Favourable_Variance === undefined) {
      return null;
    }
    const val = kpi.Favourable_Variance;
    const sign = val > 0 ? '+' : val < 0 ? '\u2212' : '';
    const absVal = Math.abs(val);

    if (kpi.Metric_Scale === 'DECIMAL_PERCENTAGE') {
      return `${sign}${(absVal * 100).toFixed(1)}%`;
    } else if (kpi.Metric_Scale === 'ONE_TO_FIVE') {
      return `${sign}${absVal.toFixed(1)}`;
    } else {
      return `${sign}${absVal.toFixed(1)}`;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 mb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Official Executive KPI Diagnostic Health (12 Core Metrics)
          </h2>
          <p className="text-xs text-slate-500">
            Authoritative snapshot for official closed reporting cycle with contract-level SLA calibration.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>Tracked: {sortedKpis.filter(k => k.Actual_Value !== null).length} / {sortedKpis.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedKpis.map((kpi) => {
          const hasData = kpi.Actual_Value !== null;
          const varianceDisplay = formatVarianceDisplay(kpi);

          return (
            <div
              key={kpi.Metric_ID}
              className="bg-slate-50/70 rounded-md border border-slate-200 p-3 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                {/* Card Top: Category and Metric ID */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 truncate max-w-[130px]">
                    {kpi.Category}
                  </span>
                  <span className="font-mono font-bold text-slate-500 text-[10px] bg-slate-200/70 px-1.5 py-0.5 rounded">
                    {kpi.Metric_ID}
                  </span>
                </div>

                {/* Metric Name */}
                <div className="flex items-start justify-between gap-1 mb-2">
                  <h3 className="text-xs font-bold text-slate-800 leading-snug">
                    {kpi.Metric}
                  </h3>
                  <StatusBadge 
                    status={kpi.RAG} 
                    size="xs" 
                    label={kpi.RAG ? undefined : 'N/A'}
                  />
                </div>

                {/* Big Actual Value & Target */}
                <div className="my-2 flex items-baseline justify-between">
                  <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {hasData ? (kpi.Actual_Display || String(kpi.Actual_Value)) : 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500 font-mono font-medium text-right">
                    Target: <span className="font-bold text-slate-700">{kpi.Target_Display || (kpi.Target_Value !== null ? String(kpi.Target_Value) : 'N/A')}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Variance or Status */}
              <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Variance:</span>
                {hasData && varianceDisplay ? (
                  <span className={`font-bold ${
                    (kpi.Favourable_Variance ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {varianceDisplay}
                  </span>
                ) : (
                  <span className="text-slate-400 font-mono text-[10px]">
                    N/A
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
