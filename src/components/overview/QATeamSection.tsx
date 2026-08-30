import React from 'react';
import { Users, Building2 } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import { RAGStatus } from '../../types';

export const QATeamSection: React.FC = () => {
  const { navigateToPage, selectAccountAndNavigate } = useFilters();
  const { overview } = useDashboardData();

  const kpis = overview?.KPI_Cards || [];
  const m011 = kpis.find((k) => k.Metric_ID === 'M011');
  const m012 = kpis.find((k) => k.Metric_ID === 'M012');

  const getTargetDisplay = (kpi?: { Target_Display?: string | null; Target_Value?: number | null }, isPct = true, fallback = 'N/A') => {
    if (kpi?.Target_Display) return kpi.Target_Display;
    if (kpi?.Target_Value !== null && kpi?.Target_Value !== undefined) {
      return isPct ? `${(kpi.Target_Value * 100).toFixed(1)}%` : kpi.Target_Value.toFixed(1);
    }
    return fallback;
  };

  const qaUtilValue = m011?.Actual_Display || (m011?.Actual_Value !== null && m011?.Actual_Value !== undefined ? `${(m011.Actual_Value * 100).toFixed(1)}%` : 'N/A');
  const qaUtilTarget = getTargetDisplay(m011, true, '90%');
  const qaUtilRag = (m011?.RAG ? (m011.RAG.toUpperCase() as RAGStatus) : undefined);

  const qaAttritionValue = m012?.Actual_Display || (m012?.Actual_Value !== null && m012?.Actual_Value !== undefined ? `${(m012.Actual_Value * 100).toFixed(1)}%` : 'N/A');
  const qaAttritionTarget = getTargetDisplay(m012, true, '10%');
  const qaAttritionRag = (m012?.RAG ? (m012.RAG.toUpperCase() as RAGStatus) : undefined);

  const netStaffOverUnder = overview?.Net_Staff_Over_Under ?? 0;
  const staffVariance = Number(netStaffOverUnder) || 0;
  const staffVarianceDisplay = staffVariance > 0 
    ? `+${staffVariance} FTEs` 
    : staffVariance < 0 
      ? `−${Math.abs(staffVariance)} FTEs` 
      : '0 FTEs';

  const staffContext = staffVariance > 0 
    ? 'Over Requirement' 
    : staffVariance < 0 
      ? 'Under Requirement' 
      : 'Exactly Staffed';

  const topAttention = overview?.Top_Attention_Accounts || [];
  const attentionAccounts = topAttention.slice(0, 3).map((acc) => {
    const band = (acc.Attention_Band || '').toUpperCase();
    const rag: RAGStatus = (band === 'CRITICAL' || band === 'HIGH') ? 'RED' : 'AMBER';
    return {
      accountId: acc.Account_ID,
      accountName: acc.Account_Name || 'Unknown Account',
      driver: acc.Primary_Attention_Driver?.trim() || 'Governance priority',
      band: acc.Attention_Band || 'Watch',
      rag,
    };
  });

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
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-metric-sm text-navy-900 tnum">
                  {staffVarianceDisplay}
                </span>
                <span className="text-caption text-slate-500 font-medium">
                  {staffContext}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-caption text-slate-500">
              <span>Posture</span>
              <span className="font-semibold text-navy-900 tnum">{staffContext}</span>
            </div>
          </div>

          {/* QA Utilisation */}
          <div className="p-3 bg-surface hover:bg-surface-hover transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-eyebrow text-slate-500">QA Utilisation</span>
                {qaUtilRag && <StatusBadge status={qaUtilRag} size="xs" />}
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
                {qaAttritionRag && <StatusBadge status={qaAttritionRag} size="xs" />}
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-metric-sm text-navy-900 tnum">
                  {qaAttritionValue}
                </span>
                <span className="text-caption text-slate-500 font-medium tnum">
                  Target: {qaAttritionTarget}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-caption text-slate-500">
              <span>Variance</span>
              <span className="font-semibold text-navy-900 tnum">
                {m012?.Favourable_Variance != null ? `${m012.Favourable_Variance >= 0 ? '+' : ''}${(m012.Favourable_Variance * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Attention Accounts */}
        <div>
          <div className="text-eyebrow text-slate-500 mb-2 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            Attention Accounts
          </div>
          <div className="divide-y divide-border-subtle border border-border-default rounded overflow-hidden">
            {attentionAccounts.length > 0 ? (
              attentionAccounts.map((acc, idx) => (
                <div
                  key={acc.accountId || idx}
                  onClick={() => acc.accountId && selectAccountAndNavigate ? selectAccountAndNavigate(acc.accountId) : navigateToPage('qa-team')}
                  className="px-3 py-2 bg-surface flex items-center justify-between gap-2 hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-label font-medium text-navy-900 truncate">{acc.accountName}</span>
                    <span className="text-caption text-slate-500 truncate hidden sm:inline">&mdash; {acc.driver}</span>
                  </div>
                  <StatusBadge status={acc.rag} label={acc.band} size="xs" />
                </div>
              ))
            ) : (
              <div className="px-3 py-3 bg-surface text-caption text-slate-500 text-center">
                No attention accounts in current filter scope
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
