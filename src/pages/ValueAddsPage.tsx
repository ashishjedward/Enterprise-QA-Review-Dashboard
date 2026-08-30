import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Layers,
  Zap,
  DollarSign,
  ChevronRight,
  Filter,
  Info,
  Calendar,
  Briefcase,
  SlidersHorizontal,
  ChevronDown,
  ExternalLink,
  ShieldAlert,
  BarChart3,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { getValueAddsDiagnostic } from '../services/api';
import {
  ValueAddsDiagnosticData,
  QaasRegisterRow,
  TapRegisterRow,
} from '../types/api';

/**
 * Format numbers with unitless suffixes (M, K) or standard integers.
 */
function formatNumber(num: number | null | undefined, digits = 2): string {
  if (num === null || num === undefined) return '—';
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    return (num / 1_000_000).toFixed(digits) + 'M';
  }
  if (abs >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

/**
 * Format percentages.
 */
function formatPct(pct: number | null | undefined, digits = 1): string {
  if (pct === null || pct === undefined) return '—';
  return (pct * 100).toFixed(digits) + '%';
}

export const ValueAddsPage: React.FC = () => {
  const { filters, setFilter, selectAccountAndNavigate, navigateToPage } = useFilters();

  const [data, setData] = useState<ValueAddsDiagnosticData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'qaas' | 'tap' | 'commercial'>('qaas');

  // QaaS Register Local Controls
  const [qaasSearch, setQaasSearch] = useState<string>('');
  const [qaasStatusFilter, setQaasStatusFilter] = useState<string>('ALL');
  const [qaasStageFilter, setQaasStageFilter] = useState<string>('ALL');

  // TAP Register Local Controls
  const [tapSearch, setTapSearch] = useState<string>('');
  const [tapStatusFilter, setTapStatusFilter] = useState<string>('ALL');
  const [tapLeverFilter, setTapLeverFilter] = useState<string>('ALL');

  // Request counter to avoid stale responses
  const requestCounter = useRef(0);

  const fetchData = async () => {
    const reqId = ++requestCounter.current;
    setLoading(true);
    setError(null);
    try {
      const resp = await getValueAddsDiagnostic({
        timePeriod: filters.timePeriod,
        vertical: filters.vertical,
        qaLeader: filters.qaLeader,
        srDirector: filters.srDirector,
        accountId: filters.account,
        site: filters.site,
        lob: filters.lob,
      });

      if (reqId === requestCounter.current) {
        setData(resp.data);
      }
    } catch (err: unknown) {
      if (reqId === requestCounter.current) {
        const errMsg = (err as Error)?.message || 'Failed to load Value-adds Diagnostic data';
        setError(errMsg);
      }
    } finally {
      if (reqId === requestCounter.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    filters.timePeriod,
    filters.vertical,
    filters.qaLeader,
    filters.srDirector,
    filters.account,
    filters.site,
    filters.lob,
  ]);

  // Filtered QaaS Register
  const filteredQaasRegister = useMemo(() => {
    if (!data?.qaasRegister) return [];
    const searchLower = qaasSearch.trim().toLowerCase();

    return data.qaasRegister.filter((row: QaasRegisterRow) => {
      // Local Status filter
      if (qaasStatusFilter !== 'ALL' && row.status !== qaasStatusFilter) {
        return false;
      }
      // Local Stage filter
      if (qaasStageFilter !== 'ALL' && row.currentStage !== qaasStageFilter) {
        return false;
      }
      // Search
      if (searchLower) {
        const matchId = row.opportunityId.toLowerCase().includes(searchLower);
        const matchAcc = row.accountName.toLowerCase().includes(searchLower);
        const matchAccId = row.accountId.toLowerCase().includes(searchLower);
        const matchMetric = row.metricType ? row.metricType.toLowerCase().includes(searchLower) : false;
        const matchStatus = row.status.toLowerCase().includes(searchLower);
        const matchStage = row.currentStage.toLowerCase().includes(searchLower);
        if (!matchId && !matchAcc && !matchAccId && !matchMetric && !matchStatus && !matchStage) {
          return false;
        }
      }
      return true;
    });
  }, [data?.qaasRegister, qaasSearch, qaasStatusFilter, qaasStageFilter]);

  // Filtered TAP Register
  const filteredTapRegister = useMemo(() => {
    if (!data?.tapRegister) return [];
    const searchLower = tapSearch.trim().toLowerCase();

    return data.tapRegister.filter((row: TapRegisterRow) => {
      // Local Status filter
      if (tapStatusFilter === 'ACTIVE' && row.asOfTodayStatus !== 'ACTIVE') return false;
      if (tapStatusFilter === 'ACTIVE_AT_RISK' && !(row.asOfTodayStatus === 'ACTIVE' && row.isAtRisk)) return false;
      if (tapStatusFilter === 'CLOSED' && row.asOfTodayStatus !== 'CLOSED') return false;
      if (tapStatusFilter === 'PLANNED' && row.asOfTodayStatus !== 'PLANNED') return false;

      // Local Lever filter
      if (tapLeverFilter !== 'ALL' && (row.tapLever || 'Other') !== tapLeverFilter) {
        return false;
      }

      // Search
      if (searchLower) {
        const matchId = row.projectId.toLowerCase().includes(searchLower);
        const matchName = row.projectName.toLowerCase().includes(searchLower);
        const matchAcc = row.accountName.toLowerCase().includes(searchLower);
        const matchAccId = row.accountId.toLowerCase().includes(searchLower);
        const matchProc = row.processName ? row.processName.toLowerCase().includes(searchLower) : false;
        const matchLever = row.tapLever ? row.tapLever.toLowerCase().includes(searchLower) : false;
        const matchCat = row.category ? row.category.toLowerCase().includes(searchLower) : false;
        const matchBen = row.benefitType ? row.benefitType.toLowerCase().includes(searchLower) : false;
        if (!matchId && !matchName && !matchAcc && !matchAccId && !matchProc && !matchLever && !matchCat && !matchBen) {
          return false;
        }
      }
      return true;
    });
  }, [data?.tapRegister, tapSearch, tapStatusFilter, tapLeverFilter]);

  // Unique levers for dropdown
  const uniqueLevers = useMemo(() => {
    if (!data?.tapRegister) return [];
    const set = new Set<string>();
    data.tapRegister.forEach((r) => {
      if (r.tapLever) set.add(r.tapLever);
    });
    return Array.from(set).sort();
  }, [data?.tapRegister]);

  // Empty scope check
  const isScopeEmpty = data?.scope.accountCount === 0;

  return (
    <div className="pt-4 space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button
              onClick={() => navigateToPage('overview')}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Enterprise
            </button>
            <span>&gt;</span>
            <span className="font-medium text-slate-600">Diagnostics</span>
            <span>&gt;</span>
            <span className="font-semibold text-slate-800">Value-adds &amp; Transformation Program</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Value-adds &amp; Transformation Program
            </h1>
            {data?.reportingContext?.officialReportingMonth && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                <Calendar className="w-3 h-3 text-slate-500" />
                Official: {data.reportingContext.officialReportingMonth}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigateToPage('overview')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center gap-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <span className="font-semibold">Error loading diagnostic: </span>
            {error}
          </div>
          <button
            onClick={fetchData}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded text-xs font-bold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty scope notification */}
      {!loading && !error && isScopeEmpty && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center text-amber-900">
          <ShieldAlert className="w-8 h-8 mx-auto text-amber-600 mb-2" />
          <h3 className="text-sm font-bold">No accounts match the current filter scope</h3>
          <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
            Please adjust your dimensional filters (Vertical, QA Leader, Sr. Director, Site, or Account) to view
            Value-adds & Transformation Program metrics.
          </p>
        </div>
      )}

      {/* 2. Primary Headline Cards (5 Factual Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total QaaS Program Value */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Total QaaS Program Value
              </span>
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-1">
              {formatNumber(data?.qaasSummary.totalOpportunityValue)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Target:</span>
            <span className="font-mono font-semibold text-slate-700">
              {formatNumber(data?.qaasSummary.totalTargetValue)}
            </span>
          </div>
        </div>

        {/* Card 2: QaaS Value Achievement */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                QaaS Value Achievement
              </span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-1">
              {formatPct(data?.qaasSummary.valueAchievementPct)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Realized Stage:</span>
            <span className="font-mono font-semibold text-slate-700">
              {formatPct(data?.qaasSummary.realizedAchievementPct)}
            </span>
          </div>
        </div>

        {/* Card 3: Active TAP Projects */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Active TAP Projects
              </span>
              <Zap className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-1">
              {data?.currentPortfolio.tapActiveProjects ?? '—'}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Portfolio Total:</span>
            <span className="font-mono font-semibold text-slate-700">
              {data?.currentPortfolio.tapTotalProjects ?? '—'} ({data?.currentPortfolio.tapClosedProjects ?? 0} Closed)
            </span>
          </div>
        </div>

        {/* Card 4: Active TAP At Risk */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Active TAP At Risk
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-rose-600 font-mono tracking-tight mt-1">
              {data?.currentPortfolio.tapActiveAtRiskProjects ?? '—'}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Risk Ratio on Active:</span>
            <span className="font-mono font-semibold text-slate-700">
              {data?.currentPortfolio.tapActiveProjects
                ? formatPct(data.currentPortfolio.tapActiveAtRiskProjects / data.currentPortfolio.tapActiveProjects)
                : '—'}
            </span>
          </div>
        </div>

        {/* Card 5: TAP Recorded Benefit */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                TAP Recorded Benefit
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-1">
              {formatNumber(data?.tapSummary.recordedRealizedBenefit)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Portfolio Realization:</span>
            <span className="font-mono font-semibold text-emerald-700">
              {formatPct(data?.tapSummary.portfolioRealizationPct)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Structural Separation: Current Portfolio Banner & Informational Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="p-1 bg-slate-200 rounded text-slate-700 font-bold text-[10px] tracking-wider uppercase">
            Current Portfolio
          </div>
          <span>
            <strong className="text-slate-900">QaaS Open Pipeline:</strong>{' '}
            <span className="font-mono font-bold text-slate-900">{data?.currentPortfolio.qaasOpenOpportunities ?? 0} Deals</span>{' '}
            ({formatNumber(data?.currentPortfolio.qaasOpenOpportunityValue)} value) |{' '}
            <strong className="text-slate-900">Active TAP:</strong>{' '}
            <span className="font-mono font-bold text-slate-900">{data?.currentPortfolio.tapActiveProjects ?? 0}</span> in flight
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Modeled value; source contains no currency metadata.</span>
        </div>
      </div>

      {/* 4. Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-1">
        <button
          onClick={() => setActiveTab('qaas')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'qaas'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>QaaS Opportunities</span>
          {data?.qaasSummary.totalRecords !== undefined && (
            <span className="px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 text-[10px] font-mono">
              {data.qaasSummary.totalRecords}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tap')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'tap'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>TAP Portfolio</span>
          {data?.tapSummary.totalProjects !== undefined && (
            <span className="px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 text-[10px] font-mono">
              {data.tapSummary.totalProjects}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('commercial')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'commercial'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Commercial Context</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: QAAS OPPORTUNITIES                            */}
      {/* ==================================================== */}
      {activeTab === 'qaas' && (
        <div className="space-y-5">
          {/* Status & Stage Distribution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Breakdown */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  QaaS Lifecycle Status Distribution
                </h3>
                <span className="text-[11px] text-slate-500">Source: Status</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {data?.qaasStatusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 w-32">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.status === 'Won'
                            ? 'bg-emerald-500'
                            : item.status === 'Delivered'
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-semibold text-slate-800">{item.status}</span>
                    </div>
                    <span className="font-mono text-slate-600 font-semibold">{item.count} deals</span>
                    <div className="text-right w-36">
                      <span className="font-mono font-bold text-slate-900">
                        {formatNumber(item.opportunityValue)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Target: {formatNumber(item.targetValue)}
                      </span>
                    </div>
                  </div>
                ))}
                {(!data?.qaasStatusDistribution || data.qaasStatusDistribution.length === 0) && (
                  <div className="text-center py-4 text-xs text-slate-400">No status data available</div>
                )}
              </div>
            </div>

            {/* Stage Breakdown */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  Operational Stage Distribution
                </h3>
                <span className="text-[11px] text-slate-500">Source: Current_Stage</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {data?.qaasStageDistribution.map((item) => (
                  <div key={item.stage} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 w-32">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.stage === 'Realized'
                            ? 'bg-purple-500'
                            : item.stage === 'Delivery'
                            ? 'bg-blue-500'
                            : item.stage === 'Qualified'
                            ? 'bg-indigo-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span className="font-semibold text-slate-800">{item.stage}</span>
                    </div>
                    <span className="font-mono text-slate-600 font-semibold">{item.count} deals</span>
                    <div className="text-right w-36">
                      <span className="font-mono font-bold text-slate-900">
                        {formatNumber(item.opportunityValue)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Target: {formatNumber(item.targetValue)}
                      </span>
                    </div>
                  </div>
                ))}
                {(!data?.qaasStageDistribution || data.qaasStageDistribution.length === 0) && (
                  <div className="text-center py-4 text-xs text-slate-400">No stage data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Selected-Period Activity Trend */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Selected-Period Opportunity Generation ({filters.timePeriod || '12M'})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Monthly deal flow based on Opportunity Inception Month.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-600">
                  Total Logged:{' '}
                  <strong className="text-slate-900">
                    {data?.qaasMonthlyTrend.reduce((acc, r) => acc + r.count, 0) ?? 0}
                  </strong>
                </span>
                <span className="text-slate-600">
                  Value Logged:{' '}
                  <strong className="text-slate-900">
                    {formatNumber(data?.qaasMonthlyTrend.reduce((acc, r) => acc + r.opportunityValue, 0))}
                  </strong>
                </span>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2 px-3">Month</th>
                    <th className="py-2 px-2 text-right">Deals Logged</th>
                    <th className="py-2 px-2 text-right">Open</th>
                    <th className="py-2 px-2 text-right">Won</th>
                    <th className="py-2 px-2 text-right">Delivered</th>
                    <th className="py-2 px-3 text-right">Target Value</th>
                    <th className="py-2 px-3 text-right">Opportunity Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.qaasMonthlyTrend.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{row.month}</td>
                      <td className="py-2 px-2 text-right font-mono font-semibold text-slate-900">{row.count}</td>
                      <td className="py-2 px-2 text-right font-mono text-amber-700">{row.openCount}</td>
                      <td className="py-2 px-2 text-right font-mono text-emerald-700">{row.wonCount}</td>
                      <td className="py-2 px-2 text-right font-mono text-blue-700">{row.deliveredCount}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">{formatNumber(row.targetValue)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatNumber(row.opportunityValue)}
                      </td>
                    </tr>
                  ))}
                  {(!data?.qaasMonthlyTrend || data.qaasMonthlyTrend.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        No opportunities logged in selected window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* QaaS Register */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>QaaS Commercial Opportunity Register</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-normal">
                    {filteredQaasRegister.length} of {data?.qaasRegister.length ?? 0} Opportunities
                  </span>
                </h3>
              </div>

              {/* Local Controls: Search, Status, Stage */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={qaasSearch}
                    onChange={(e) => setQaasSearch(e.target.value)}
                    placeholder="Search ID, Account, Metric..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:border-indigo-500 w-52"
                  />
                </div>

                <select
                  value={qaasStatusFilter}
                  onChange={(e) => setQaasStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-hidden"
                >
                  <option value="ALL">Status: All</option>
                  <option value="Open">Open</option>
                  <option value="Won">Won</option>
                  <option value="Delivered">Delivered</option>
                </select>

                <select
                  value={qaasStageFilter}
                  onChange={(e) => setQaasStageFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-hidden"
                >
                  <option value="ALL">Stage: All</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Realized">Realized</option>
                </select>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Opportunity ID</th>
                    <th className="py-2.5 px-2">Account</th>
                    <th className="py-2.5 px-2">Metric Type</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2">Current Stage</th>
                    <th className="py-2.5 px-2">Logged Month</th>
                    <th className="py-2.5 px-2 text-right">Target Value</th>
                    <th className="py-2.5 px-2 text-right">Opportunity Value</th>
                    <th className="py-2.5 px-2 text-right">Realization</th>
                    <th className="py-2.5 px-2 text-center">Approval</th>
                    <th className="py-2.5 px-2 text-center">RAG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQaasRegister.map((row) => (
                    <tr key={row.opportunityId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{row.opportunityId}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-900">
                        <button
                          onClick={() => selectAccountAndNavigate(row.accountId)}
                          className="hover:underline text-left text-indigo-600 hover:text-indigo-900 font-bold cursor-pointer"
                        >
                          {row.accountName}
                        </button>
                        <span className="text-[10px] text-slate-400 block">{row.accountId}</span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-700">{row.metricType || 'QaaS'}</td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            row.status === 'Won'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : row.status === 'Delivered'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-medium text-slate-700">{row.currentStage}</td>
                      <td className="py-2.5 px-2 font-mono text-slate-600">{row.month}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                        {formatNumber(row.targetValue)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                        {formatNumber(row.revenueValue)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-800">
                        {formatPct(row.realizationPct)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {row.clientApproval ? (
                          <span className="text-emerald-700 text-xs font-bold">Approved</span>
                        ) : (
                          <span className="text-slate-400 text-xs">Pending</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            row.statusRag?.toLowerCase() === 'green'
                              ? 'bg-emerald-500'
                              : row.statusRag?.toLowerCase() === 'amber'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          title={row.statusRag || 'N/A'}
                        />
                      </td>
                    </tr>
                  ))}
                  {filteredQaasRegister.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        No opportunities matched the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: TAP PORTFOLIO                                 */}
      {/* ==================================================== */}
      {activeTab === 'tap' && (
        <div className="space-y-5">
          {/* TAP Lifecycle & Lever Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TAP As-Of-Today Lifecycle Summary */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  As-Of-Today Project Lifecycle
                </h3>
                <span className="text-[11px] text-slate-500">Timeline Event Derivation</span>
              </div>
              <div className="mt-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="font-semibold text-slate-800">ACTIVE Projects</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {data?.tapSummary.activeProjects ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 pl-4">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-rose-800 font-semibold">↳ Active At Risk</span>
                  </div>
                  <span className="font-mono font-bold text-rose-700">
                    {data?.tapSummary.atRiskProjects ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-800">CLOSED Projects</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {data?.tapSummary.closedProjects ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="font-semibold text-slate-800">PLANNED Projects</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {data?.tapSummary.plannedProjects ?? 0}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                  <span>Closed Projects Benefit Realization:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatPct(data?.tapSummary.closedRealizationPct)}
                  </span>
                </div>
              </div>
            </div>

            {/* Lever Breakdown */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-slate-500" />
                  Transformation Levers Distribution
                </h3>
                <span className="text-[11px] text-slate-500">Source: TAP_Lever</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {data?.tapLeverDistribution.map((item) => (
                  <div key={item.lever} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 w-36">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="font-semibold text-slate-800">{item.lever}</span>
                    </div>
                    <span className="font-mono text-slate-600 font-semibold">{item.count} projects</span>
                    <div className="text-right w-36">
                      <span className="font-mono font-bold text-slate-900">
                        {formatNumber(item.realizedBenefit)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Target: {formatNumber(item.targetBenefit)}
                      </span>
                    </div>
                  </div>
                ))}
                {(!data?.tapLeverDistribution || data.tapLeverDistribution.length === 0) && (
                  <div className="text-center py-4 text-xs text-slate-400">No lever data available</div>
                )}
              </div>
            </div>
          </div>

          {/* TAP Period Activity */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Selected-Period Execution Events ({filters.timePeriod || '12M'})
              </h3>
              <span className="text-[11px] text-slate-500">Supportable Milestone Events</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Projects Initiated in Window:</span>
                <span className="text-xl font-mono font-black text-slate-900 mt-1 block">
                  {data?.tapPeriodActivity.projectsInitiated ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Actual Start Date in selected window</span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Projects Completed in Window:</span>
                <span className="text-xl font-mono font-black text-emerald-700 mt-1 block">
                  {data?.tapPeriodActivity.projectsCompleted ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Actual End Date in selected window</span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Projects Logged in Window:</span>
                <span className="text-xl font-mono font-black text-indigo-700 mt-1 block">
                  {data?.tapPeriodActivity.projectsLogged ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Month registration in window</span>
              </div>
            </div>
          </div>

          {/* TAP Register */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Transformation & Automation Projects Register</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-normal">
                    {filteredTapRegister.length} of {data?.tapRegister.length ?? 0} Projects
                  </span>
                </h3>
              </div>

              {/* Local Controls: Search, Status, Lever */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={tapSearch}
                    onChange={(e) => setTapSearch(e.target.value)}
                    placeholder="Search Project, Account, Lever..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:border-indigo-500 w-52"
                  />
                </div>

                <select
                  value={tapStatusFilter}
                  onChange={(e) => setTapStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-hidden"
                >
                  <option value="ALL">Status: All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ACTIVE_AT_RISK">Active At Risk</option>
                  <option value="CLOSED">Closed</option>
                  <option value="PLANNED">Planned</option>
                </select>

                <select
                  value={tapLeverFilter}
                  onChange={(e) => setTapLeverFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-hidden"
                >
                  <option value="ALL">Lever: All</option>
                  {uniqueLevers.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Project ID</th>
                    <th className="py-2.5 px-2">Project Name</th>
                    <th className="py-2.5 px-2">Account</th>
                    <th className="py-2.5 px-2">Lever / Category</th>
                    <th className="py-2.5 px-2">Current Status</th>
                    <th className="py-2.5 px-2">Start Date</th>
                    <th className="py-2.5 px-2">End Date</th>
                    <th className="py-2.5 px-2 text-right">Target Benefit</th>
                    <th className="py-2.5 px-2 text-right">Recorded Realized</th>
                    <th className="py-2.5 px-2 text-right">Realization</th>
                    <th className="py-2.5 px-2 text-center">RAG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTapRegister.map((row) => (
                    <tr key={row.projectId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{row.projectId}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-900 max-w-[220px] truncate" title={row.projectName}>
                        {row.projectName}
                        {row.processName && (
                          <span className="text-[10px] text-slate-400 block truncate">{row.processName}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 font-medium text-slate-900">
                        <button
                          onClick={() => selectAccountAndNavigate(row.accountId)}
                          className="hover:underline text-left text-indigo-600 hover:text-indigo-900 font-bold cursor-pointer"
                        >
                          {row.accountName}
                        </button>
                        <span className="text-[10px] text-slate-400 block">{row.accountId}</span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-700">
                        <span className="font-semibold text-slate-800">{row.tapLever || 'Automation'}</span>
                        <span className="text-[10px] text-slate-400 block">{row.benefitType || 'Cost Avoidance'}</span>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border inline-block w-fit ${
                              row.asOfTodayStatus === 'ACTIVE'
                                ? row.isAtRisk
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                                : row.asOfTodayStatus === 'CLOSED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {row.asOfTodayStatus}
                          </span>
                          {row.sourceStatus !== row.asOfTodayStatus && (
                            <span className="text-[9px] text-slate-400">Source: {row.sourceStatus}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-600">{row.actualStartDate || '—'}</td>
                      <td className="py-2.5 px-2 font-mono text-slate-600">{row.actualEndDate || row.expectedEndDate || '—'}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                        {formatNumber(row.targetBenefit)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                        {formatNumber(row.realizedBenefit)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-800">
                        {formatPct(row.realizationPct)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            row.isAtRisk || row.statusRag?.toLowerCase() === 'red'
                              ? 'bg-rose-500'
                              : row.statusRag?.toLowerCase() === 'amber'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          title={row.latestUpdate || row.statusRag || 'N/A'}
                        />
                      </td>
                    </tr>
                  ))}
                  {filteredTapRegister.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        No transformation or automation projects registered for this account / filter scope.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: COMMERCIAL CONTEXT                            */}
      {/* ==================================================== */}
      {activeTab === 'commercial' && (
        <div className="space-y-5">
          {/* Billing & Commercial Impact Summary Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base QA Billing Summary */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                    Base QA Billing ({filters.timePeriod || '12M'})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Commercial billing revenue from vw_billed_qa.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-600">Billed Revenue Value:</span>
                  <span className="text-lg font-mono font-black text-slate-900">
                    {formatNumber(data?.commercialContext.billedRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-600">Plan Revenue Value:</span>
                  <span className="text-sm font-mono font-semibold text-slate-700">
                    {formatNumber(data?.commercialContext.planRevenue)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Billing Revenue Achievement:</span>
                  <span className="text-base font-mono font-black text-emerald-700">
                    {formatPct(data?.commercialContext.revenueAchievementPct)}
                  </span>
                </div>
              </div>
            </div>

            {/* SLA Penalty / Reward Commercial Impact */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                    SLA Commercial Impact ({filters.timePeriod || '12M'})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Contractual SLAs Penalty & Reward from vw_rp_tracker.
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Penalty Exposure:</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {formatNumber(data?.commercialContext.penaltyExposureValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-700">Actual Penalty Paid:</span>
                  <span className="font-mono text-rose-700 font-bold">
                    {formatNumber(data?.commercialContext.actualPenaltyPaidValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Reward Opportunity:</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {formatNumber(data?.commercialContext.rewardOpportunityValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Actual Reward Earned:</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {formatNumber(data?.commercialContext.actualRewardEarnedValue)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-bold text-slate-800">Net Commercial Impact:</span>
                  <span
                    className={`font-mono font-black text-base ${
                      (data?.commercialContext.netCommercialImpact ?? 0) >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {(data?.commercialContext.netCommercialImpact ?? 0) > 0 ? '+' : ''}
                    {formatNumber(data?.commercialContext.netCommercialImpact)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
