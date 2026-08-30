import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Globe,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  FileCheck2,
  DollarSign,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  InsightsDiagnosticData,
  InsightsTimePeriod,
} from '../../types/api';
import { useFilters } from '../../context/FilterContext';

interface ExecutiveSynthesisHeaderProps {
  data: InsightsDiagnosticData;
  timePeriod: InsightsTimePeriod;
  onTimePeriodChange: (tp: InsightsTimePeriod) => void;
}

export const ExecutiveSynthesisHeader: React.FC<ExecutiveSynthesisHeaderProps> = ({
  data,
  timePeriod,
  onTimePeriodChange,
}) => {
  const { navigateToPage, filters } = useFilters();
  const { reportingContext, scopeSummary, executiveSynthesis, currentCommercialContext } = data;

  const getGovernanceBadge = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            CRITICAL GOVERNANCE ATTENTION REQUIRED
          </span>
        );
      case 'ATTENTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            ELEVATED MONITORING ACTIVE
          </span>
        );
      case 'STABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            PORTFOLIO GOVERNANCE STABLE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            HEALTHY OPERATIONAL PERFORMANCE
          </span>
        );
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Top Context & Time Period Selector Bar */}
      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span className="text-slate-400">Official Reporting Cycle:</span>
              <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono">
                {reportingContext.reportingMonth}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Live Snapshot As Of:</span>
              <span className="font-semibold text-slate-200 font-mono">
                {reportingContext.dataAsOfDate} ({reportingContext.businessTimezone})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400">Scoped Population:</span>
              <span className="font-bold text-white">
                {scopeSummary.totalAccountsInScope} Account{scopeSummary.totalAccountsInScope !== 1 ? 's' : ''}
              </span>
            </div>

            {filters.account !== 'ALL' && (
              <span className="px-2 py-0.5 bg-sky-900 text-sky-200 rounded text-xs font-semibold border border-sky-700">
                Filtered to {filters.account}
              </span>
            )}
          </div>

          {/* Time Period Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Trajectory Window:</span>
            <div className="inline-flex rounded-md shadow-xs bg-slate-800 p-0.5 border border-slate-700">
              {(['3M', '6M', 'YTD', '12M'] as InsightsTimePeriod[]).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => onTimePeriodChange(tp)}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    timePeriod === tp
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {tp}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Synthesis Callout */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Executive QA Synthesis & Strategic Risk Radar
                </h1>
                {getGovernanceBadge(executiveSynthesis.governanceStatus)}
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-4xl">
                {executiveSynthesis.leadSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Observations bullet list */}
        {executiveSynthesis.keyObservations.length > 0 && (
          <div className="mt-4 pt-2">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Key Strategic Findings & Governance Drivers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {executiveSynthesis.keyObservations.map((obs, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded border border-slate-200/80"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{obs}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI & Incident Governance Radar Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Attention Population */}
        <div
          onClick={() => navigateToPage('overview')}
          className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Attention Tiers
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-extrabold text-slate-900">
              {scopeSummary.criticalAttentionCount}
            </span>
            <span className="text-[11px] font-bold text-rose-600">Critical</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
            <span>{scopeSummary.highAttentionCount} High</span>
            <span>•</span>
            <span>{scopeSummary.mediumAttentionCount} Med</span>
          </div>
        </div>

        {/* Card 2: Red Sentiment */}
        <div
          onClick={() => navigateToPage('overview')}
          className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Client Sentiment
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-extrabold text-slate-900">
              {scopeSummary.redSentimentCount}
            </span>
            <span className="text-[11px] font-bold text-rose-600">Red</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
            <span>{scopeSummary.amberSentimentCount} Amber</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">{scopeSummary.greenSentimentCount} Green</span>
          </div>
        </div>

        {/* Card 3: Zero Tolerance */}
        <div
          onClick={() => navigateToPage('overview')}
          className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Zero Tolerance
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-extrabold text-slate-900">
              {scopeSummary.openZtCount}
            </span>
            <span className="text-[11px] font-bold text-slate-600">Open</span>
          </div>
          <div className="mt-2 text-[10px] text-rose-600 font-medium">
            {scopeSummary.hrActionOpenZtCount === 1
              ? '1 requires HR action'
              : `${scopeSummary.hrActionOpenZtCount || 0} require HR action`}
          </div>
        </div>

        {/* Card 4: Escalations */}
        <div
          onClick={() => navigateToPage('overview')}
          className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Escalations
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-extrabold text-slate-900">
              {scopeSummary.openEscalationCount}
            </span>
            <span className="text-[11px] font-bold text-slate-600">Open</span>
          </div>
          <div className="mt-2 text-[10px] text-rose-600 font-semibold">
            {scopeSummary.highCriticalEscalationCount} High / Critical
          </div>
        </div>

        {/* Card 5: Action Closure Discipline */}
        <div
          onClick={() => navigateToPage('actions')}
          className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Action Closure
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-extrabold text-slate-900">
              {scopeSummary.actionClosureRateDisplay}
            </span>
            <FileCheck2 className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="mt-2 text-[10px] text-rose-600 font-medium">
            {scopeSummary.overdueActionCount} Overdue backlog
          </div>
        </div>

        {/* Card 6: Net Commercial Impact */}
        <div
          onClick={() => navigateToPage('value-adds')}
          className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Net Commercial ({reportingContext.reportingMonth || 'Jul-26'})
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-xl font-extrabold ${
                currentCommercialContext.netCommercialImpact >= 0
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {formatUnitless(currentCommercialContext.netCommercialImpact)}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            Penalty Paid: {formatUnitless(currentCommercialContext.penaltyPaid)}
          </div>
        </div>
      </div>
    </div>
  );
};
