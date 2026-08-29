import React from 'react';
import { Users, Building2 } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import { RAGStatus } from '../../types';

export const QATeamSection: React.FC = () => {
  const { navigateToPage } = useFilters();
  const { overview } = useDashboardData();

  const kpis = overview?.KPI_Cards || [];
  const m011 = kpis.find((k) => k.Metric_ID === 'M011');
  const m012 = kpis.find((k) => k.Metric_ID === 'M012');

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

  const qaAttritionValue = m012?.Actual_Display || (m012?.Actual_Value !== null && m012?.Actual_Value !== undefined ? `${(m012.Actual_Value * 100).toFixed(1)}%` : 'N/A');
  const qaAttritionTarget = m012?.Target_Display ? `< ${m012.Target_Display}` : (m012?.Target_Value !== null && m012?.Target_Value !== undefined ? `< ${(m012.Target_Value * 100).toFixed(1)}%` : 'N/A');
  const qaAttritionRag = (m012?.RAG?.toUpperCase() as RAGStatus) || ('Normal' as any);

  const staffVariance = overview?.Staff_Variance ?? 0;
  const staffRag = (staffVariance >= 0 ? 'GREEN' : 'AMBER') as RAGStatus;

  const topAttention = overview?.Top_Attention_Accounts || [];
  const highRiskSites = topAttention.slice(0, 3).map((acc) => ({
    site: `${acc.Account}${acc.Site ? ` (${acc.Site})` : ''}`,
    issue: acc.Key_Issue || `SLA/Hygiene risk (${acc.Critical_Issues_Count} issues)`,
    rag: (acc.Priority === 'CRITICAL' ? 'RED' : 'AMBER') as RAGStatus,
  }));

  return (
    <div className="bg-surface border border-border-default rounded shadow-elevation-1 p-3 sm:p-4 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-border-subtle gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-label text-navy-900 tracking-tight uppercase">
                QA Team & Resource Health
              </h2>
              <p className="text-caption text-slate-500 hidden sm:block">
                Staffing capacity, billable utilisation, and site-level retention posture.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigateToPage('qa-team')}
            className="text-label font-bold text-teal-600 hover:text-teal-800 self-end sm:self-auto cursor-pointer flex items-center gap-1 transition-colors"
          >
            <span>Team Breakdown &rarr;</span>
          </button>
        </div>

        {/* 3 Metrics Panels with Thin Internal Dividers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle border border-border-default rounded overflow-hidden mb-3">
          {/* Staff Over/Under */}
          <div className="p-3 bg-surface hover:bg-surface-hover transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-eyebrow text-slate-500">Staff Over/Under</span>
                <StatusBadge status={staffRag} size="xs" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-metric-sm text-navy-900 tnum">
                  {staffVariance > 0 ? `+${staffVariance}` : staffVariance} FTEs
                </span>
                <span className="text-caption text-slate-500 font-medium">
                  {staffVariance < 0 ? 'Deficit' : 'Balanced'}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-caption text-slate-500">
              <span>Roster Balance</span>
              <span className="font-semibold text-navy-900 tnum">{staffVariance >= 0 ? 'On Target' : 'Action Required'}</span>
            </div>
          </div>

          {/* QA Utilisation */}
          <div className="p-3 bg-surface hover:bg-surface-hover transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-eyebrow text-slate-500">QA Utilisation</span>
                <StatusBadge status={qaUtilRag} size="xs" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-metric-sm text-navy-900 tnum">
                  {qaUtilValue}
                </span>
                <span className="text-caption text-slate-500 font-medium tnum">
                  Target: {qaUtilTarget}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-caption text-slate-500">
              <span>Variance</span>
              <span className="font-semibold text-navy-900 tnum">
                {m011?.Favourable_Variance != null ? `${m011.Favourable_Variance >= 0 ? '+' : ''}${(m011.Favourable_Variance * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
          </div>

          {/* QA Attrition */}
          <div className="p-3 bg-surface hover:bg-surface-hover transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-eyebrow text-slate-500">QA Attrition Rate</span>
                <StatusBadge status={qaAttritionRag} size="xs" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-metric-sm text-navy-900 tnum">
                  {qaAttritionValue}
                </span>
                <span className="text-caption text-slate-500 font-medium tnum">
                  Limit: {qaAttritionTarget}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-caption text-slate-500">
              <span>Variance</span>
              <span className="font-semibold text-navy-900 tnum">
                {m012?.Favourable_Variance != null ? `${m012.Favourable_Variance >= 0 ? '-' : '+'}${(Math.abs(m012.Favourable_Variance) * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* High Risk Teams or Sites */}
        <div>
          <div className="text-eyebrow text-slate-500 mb-2 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            Attention Accounts & Pods
          </div>
          <div className="divide-y divide-border-subtle border border-border-default rounded overflow-hidden">
            {highRiskSites.length > 0 ? (
              highRiskSites.map((pod, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 bg-surface flex items-center justify-between gap-2 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-label text-navy-900 truncate">{pod.site}</span>
                    <span className="text-caption text-slate-500 truncate hidden sm:inline">&mdash; {pod.issue}</span>
                  </div>
                  <StatusBadge status={pod.rag} size="xs" />
                </div>
              ))
            ) : (
              <div className="px-3 py-3 bg-surface text-caption text-slate-500 text-center">
                No high-risk pods or attention accounts in current filter scope
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
