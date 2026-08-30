import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { getInsightsDiagnostic } from '../services/api';
import {
  InsightsDiagnosticData,
  InsightsTimePeriod,
} from '../types/api';
import { DiagnosticPageHeader } from '../components/common/DiagnosticPageHeader';
import { ExecutiveSynthesisHeader } from '../components/insights/ExecutiveSynthesisHeader';
import { PriorityInsightsSection } from '../components/insights/PriorityInsightsSection';
import { CrossPortfolioThemesSection } from '../components/insights/CrossPortfolioThemesSection';
import { PositiveSignalsSection } from '../components/insights/PositiveSignalsSection';
import { RiskRadarTable } from '../components/insights/RiskRadarTable';
import { CommercialAndTrendsSection } from '../components/insights/CommercialAndTrendsSection';

export const InsightsPage: React.FC = () => {
  const { navigateToPage, filters, setFilter } = useFilters();
  const [data, setData] = useState<InsightsDiagnosticData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const timePeriod = (filters.timePeriod || '12M') as InsightsTimePeriod;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getInsightsDiagnostic({
        timePeriod: (filters.timePeriod || '12M') as InsightsTimePeriod,
        vertical: filters.vertical !== 'ALL' ? filters.vertical : undefined,
        qaLeader: filters.qaLeader !== 'ALL' ? filters.qaLeader : undefined,
        srDirector: filters.srDirector !== 'ALL' ? filters.srDirector : undefined,
        accountId: filters.account !== 'ALL' ? filters.account : undefined,
        site: filters.site !== 'ALL' ? filters.site : undefined,
        lob: filters.lob !== 'ALL' ? filters.lob : undefined,
      });

      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load Insights diagnostic:', err);
      setError(err?.message || 'Failed to load executive leadership insights');
    } finally {
      setLoading(false);
    }
  }, [
    filters.timePeriod,
    filters.vertical,
    filters.qaLeader,
    filters.srDirector,
    filters.account,
    filters.site,
    filters.lob,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 max-w-[1600px] mx-auto">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-700">
          Synthesizing live executive radar and diagnostic metrics...
        </p>
        <span className="text-xs text-slate-400">
          Reconciling live action points, attention ranks, and KPI signals
        </span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-[1600px] mx-auto p-6 space-y-4">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-rose-900">
            Failed to Load Leadership Insights
          </h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Shared Diagnostic Page Header */}
      <DiagnosticPageHeader
        title="Leadership Insights & Executive Radar"
        breadcrumbLabel="Leadership Insights & Executive Radar"
        description="Evidence-backed leadership priorities, cross-portfolio risk and period trajectories."
        contextBadges={
          data?.reportingContext?.reportingMonth ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
              <Calendar className="w-3 h-3 text-slate-500" />
              Official: {data.reportingContext.reportingMonth}
            </span>
          ) : undefined
        }
        secondaryActions={
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh live data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* 1. Executive Synthesis & Governance Radar Header */}
      <ExecutiveSynthesisHeader
        data={data}
        timePeriod={timePeriod}
        onTimePeriodChange={(tp) => setFilter('timePeriod', tp)}
      />

      {/* 2. Priority Insights Section (Top Attention Accounts) */}
      <PriorityInsightsSection cards={data.priorityInsights} />

      {/* 3. Systemic Portfolio Themes (Cross-Account Defect Concentrations) */}
      <CrossPortfolioThemesSection themes={data.crossPortfolioThemes} />

      {/* 4. Positive Signals & Achievements */}
      <PositiveSignalsSection signals={data.positiveSignals} />

      {/* 5. Enterprise Risk Radar Register (Searchable, filterable, paginated) */}
      <RiskRadarTable rows={data.riskRadarRows} />

      {/* 6. Multi-Period Core Trajectories & Commercial Context */}
      <CommercialAndTrendsSection
        currentCommercial={data.currentCommercialContext}
        periodCommercial={data.selectedPeriodCommercialContext}
        periodTrends={data.periodTrends}
        timePeriod={timePeriod}
      />
    </div>
  );
};
