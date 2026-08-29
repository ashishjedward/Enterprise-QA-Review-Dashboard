import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sliders,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useFilters } from '../context/FilterContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { getHygieneDiagnostic } from '../services/api';
import {
  HygieneDiagnosticData,
  AccountHygieneRegisterRow,
  HygieneMetricSummary,
} from '../types/api';

export const HygieneInputsPage: React.FC = () => {
  const {
    filters,
    navigateToPage,
    selectAccountAndNavigate,
    openDrawer,
    resetFilters,
  } = useFilters();

  const [data, setData] = useState<HygieneDiagnosticData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tableFilter, setTableFilter] = useState<'ALL' | 'RED' | 'AMBER' | 'NO_RED_AMBER'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTrendMetric, setActiveTrendMetric] = useState<'M006' | 'M007' | 'M008' | 'M009' | 'M010' | 'TNI'>('M006');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getHygieneDiagnostic({
      timePeriod: filters.timePeriod,
      vertical: filters.vertical,
      qaLeader: filters.qaLeader,
      srDirector: filters.srDirector,
      account: filters.account,
      site: filters.site,
      lob: filters.lob,
    })
      .then((res) => {
        if (!isMounted) return;
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'Failed to load Hygiene Diagnostic data.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    filters.timePeriod,
    filters.vertical,
    filters.qaLeader,
    filters.srDirector,
    filters.account,
    filters.site,
    filters.lob,
  ]);

  // Filtered account register rows
  const displayedRegisterRows = useMemo(() => {
    if (!data?.accountRegister) return [];
    return data.accountRegister.filter((row: AccountHygieneRegisterRow) => {
      if (tableFilter === 'RED' && row.redKpiCount === 0) return false;
      if (tableFilter === 'AMBER' && row.amberKpiCount === 0) return false;
      if (tableFilter === 'NO_RED_AMBER' && (row.redKpiCount > 0 || row.amberKpiCount > 0 || row.kpiWithDataCount === 0)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          row.accountName.toLowerCase().includes(q) ||
          row.accountId.toLowerCase().includes(q) ||
          row.vertical.toLowerCase().includes(q) ||
          row.qaLeader.toLowerCase().includes(q) ||
          row.site.toLowerCase().includes(q) ||
          row.lob.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data?.accountRegister, tableFilter, searchQuery]);

  // Loading State Skeleton
  if (loading && !data) {
    return (
      <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="h-4 w-64 bg-slate-200 animate-pulse rounded" />
          <div className="h-7 w-28 bg-slate-200 animate-pulse rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-white p-3.5 rounded-md border border-slate-200 shadow-xs animate-pulse">
              <div className="h-3 w-24 bg-slate-200 rounded mb-2.5" />
              <div className="h-6 w-16 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-28 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

        <div className="h-72 bg-white border border-slate-200 rounded-md p-4 shadow-xs animate-pulse">
          <div className="h-4 w-48 bg-slate-200 rounded mb-4" />
          <div className="h-56 bg-slate-50 rounded" />
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              onClick={() => navigateToPage('overview')}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Enterprise
            </button>
            <span>&gt;</span>
            <span className="font-bold text-[#1A2B4B]">Hygiene Inputs & Operational Governance</span>
          </div>
          <button
            onClick={() => navigateToPage('overview')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-md p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-sm font-bold text-rose-900">Unable to load Hygiene Diagnostic data</h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            {error || 'An unexpected error occurred while communicating with the BigQuery backend.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                getHygieneDiagnostic({
                  timePeriod: filters.timePeriod,
                  vertical: filters.vertical,
                  qaLeader: filters.qaLeader,
                  srDirector: filters.srDirector,
                  account: filters.account,
                  site: filters.site,
                  lob: filters.lob,
                })
                  .then((res) => {
                    setData(res.data);
                    setLoading(false);
                  })
                  .catch((err) => {
                    setError(err?.message || 'Retry failed');
                    setLoading(false);
                  });
              }}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    scope,
    reportingContext,
    rangeContext,
    headlineKpis,
    historicalTrends,
    operationalBreakdowns,
  } = data;

  const coreKpis: Array<{
    id: 'M006' | 'M007' | 'M008' | 'M009' | 'M010';
    summary: HygieneMetricSummary;
    formula: string;
    note?: string;
  }> = [
    {
      id: 'M006',
      summary: headlineKpis.m006,
      formula: 'SUM(Audits Completed) / SUM(Audit Target)',
    },
    {
      id: 'M007',
      summary: headlineKpis.m007,
      formula: 'SUM(Correct Count) / SUM(Total Audits)',
    },
    {
      id: 'M008',
      summary: headlineKpis.m008,
      formula: 'AVG(Attendance Pct) across accounts',
    },
    {
      id: 'M009',
      summary: headlineKpis.m009,
      formula: 'AVG(Self Assessment Score)',
      note: 'Scale 0–100',
    },
    {
      id: 'M010',
      summary: headlineKpis.m010,
      formula: 'AVG(Client MSA Score)',
      note: `${headlineKpis.m010.applicableAccountCount} applicable accounts`,
    },
  ];

  // Chart configuration based on active metric
  const getChartConfig = () => {
    switch (activeTrendMetric) {
      case 'M006':
        return {
          title: 'M006 — Audit & Feedback Achievement Trajectory',
          dataKey: 'm006Actual',
          displayKey: 'm006Display',
          target: 0.95,
          targetLabel: 'Target 95%',
          isPercent: true,
          unit: '%',
          strokeColor: '#0D9488',
        };
      case 'M007':
        return {
          title: 'M007 — Hygiene Audits Accuracy Trajectory',
          dataKey: 'm007Actual',
          displayKey: 'm007Display',
          target: 0.96,
          targetLabel: 'Target 96%',
          isPercent: true,
          unit: '%',
          strokeColor: '#3B82F6',
        };
      case 'M008':
        return {
          title: 'M008 — Calibration Attendance Trajectory',
          dataKey: 'm008Actual',
          displayKey: 'm008Display',
          target: 0.95,
          targetLabel: 'Target 95%',
          isPercent: true,
          unit: '%',
          strokeColor: '#10B981',
        };
      case 'M009':
        return {
          title: 'M009 — ATA Internal Quality Score Trajectory',
          dataKey: 'm009Actual',
          displayKey: 'm009Display',
          target: 95,
          targetLabel: 'Target 95',
          isPercent: false,
          unit: ' Score',
          strokeColor: '#F59E0B',
        };
      case 'M010':
        return {
          title: 'M010 — ATA External Client Score Trajectory',
          dataKey: 'm010Actual',
          displayKey: 'm010Display',
          target: 94,
          targetLabel: 'Target 94',
          isPercent: false,
          unit: ' Score',
          strokeColor: '#8B5CF6',
        };
      case 'TNI':
        return {
          title: 'TNI Published Adherence Trajectory',
          dataKey: 'tniAdherencePct',
          displayKey: 'tniAdherenceDisplay',
          target: null,
          targetLabel: 'No Target (Governance)',
          isPercent: true,
          unit: '%',
          strokeColor: '#475569',
        };
    }
  };

  const chartConfig = getChartConfig();

  return (
    <div className="space-y-3.5 max-w-[1600px] mx-auto pb-10">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigateToPage('overview')}
            className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            Enterprise
          </button>
          <span>&gt;</span>
          <span className="font-bold text-[#1A2B4B]">Hygiene Inputs & Operational Governance</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openDrawer('hygiene')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0D9488] bg-teal-50 border border-teal-200 rounded-xs hover:bg-teal-100 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Hygiene Drawer</span>
          </button>

          <button
            onClick={() => navigateToPage('overview')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
        </div>
      </div>

      {/* Headline Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xs p-3.5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xs bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[#1A2B4B] tracking-tight uppercase">
                  Operational Hygiene & Governance Matrix
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-xs">
                  Closed: {reportingContext.officialReportingMonth}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Authoritative quality governance tracking 5 core Hygiene KPIs (M006–M010) and TNI published adherence.
              </p>
            </div>
          </div>

          {/* Scope & Risk Breakdown Summary */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xs border border-slate-200 text-xs">
            <div className="pr-2 border-r border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Accounts in Scope:</span>
              <span className="font-bold text-[#1A2B4B] font-mono">{scope.totalAccounts}</span>
            </div>
            <div className="pr-2 border-r border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">No Red/Amber KPI:</span>
              <span className="font-bold text-emerald-700 font-mono">{scope.accountsNoRedAmber}</span>
            </div>
            <div className="pr-2 border-r border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Has Amber KPI:</span>
              <span className="font-bold text-amber-700 font-mono">{scope.accountsWithAmber}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Has Red KPI:</span>
              <span className={`font-bold font-mono ${scope.accountsWithRed > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                {scope.accountsWithRed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Core KPI Cards + 1 Operational Governance Tile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {coreKpis.map(({ id, summary, formula, note }) => {
          const isNeutral = summary.rag === null;
          return (
            <div
              key={id}
              onClick={() => setActiveTrendMetric(id)}
              className={`bg-white border rounded-xs p-3 transition-all flex flex-col justify-between shadow-xs cursor-pointer ${
                activeTrendMetric === id
                  ? 'border-[#0D9488] ring-1 ring-[#0D9488]'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-[#1A2B4B] line-clamp-1">
                    {summary.metricId} {summary.metricName}
                  </span>
                  <StatusBadge status={summary.rag} size="xs" />
                </div>

                <div className="my-1.5 flex items-baseline justify-between">
                  <span className="text-xl font-black text-navy-900 tnum">
                    {summary.actualDisplay}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Target: {summary.targetDisplay}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Variance:</span>
                  <span
                    className={`font-bold ${
                      summary.varianceValue === null
                        ? 'text-slate-500'
                        : summary.varianceValue >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {summary.varianceDisplay}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 text-[9px] text-slate-400 flex items-center justify-between">
                <span className="truncate" title={formula}>{formula}</span>
                {note && <span className="shrink-0 font-medium text-slate-500 ml-1">{note}</span>}
              </div>
            </div>
          );
        })}

        {/* TNI Operational Governance Tile (Explicitly separated from core KPIs) */}
        <div
          onClick={() => setActiveTrendMetric('TNI')}
          className={`bg-slate-50 border rounded-xs p-3 transition-all flex flex-col justify-between shadow-xs cursor-pointer ${
            activeTrendMetric === 'TNI'
              ? 'border-slate-800 ring-1 ring-slate-800'
              : 'border-slate-300 hover:border-slate-500'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-1 mb-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#1A2B4B]">
                  TNI Published Adherence
                </span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-200 text-slate-700 rounded-xs">
                GOVERNANCE
              </span>
            </div>

            <div className="my-1.5 flex items-baseline justify-between">
              <span className="text-xl font-black text-navy-900 tnum">
                {headlineKpis.tni.adherenceDisplay}
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                Target: N/A
              </span>
            </div>

            <div className="space-y-0.5 text-[10px] text-slate-600 pt-1 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span>Published:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {headlineKpis.tni.publishedAccounts} / {headlineKpis.tni.applicableAccounts}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pending:</span>
                <span className="font-bold text-rose-700 font-mono">
                  {headlineKpis.tni.pendingAccounts}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-200 text-[9px] text-slate-500 flex items-center justify-between">
            <span>Not Applicable: {headlineKpis.tni.notApplicableAccounts}</span>
            <span className="font-medium text-slate-600">Neutral RAG</span>
          </div>
        </div>
      </div>

      {/* Historical Performance & Trajectory Chart */}
      <div className="bg-white border border-slate-200 rounded-xs p-3.5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0D9488]" />
            <h2 className="text-xs sm:text-sm font-bold text-[#1A2B4B]">
              {chartConfig.title}
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-xs font-mono">
              {rangeContext.availableMonthCount} Months ({rangeContext.historyCoverageStatus === 'FULL_HISTORY' ? 'Full' : 'Partial History'})
            </span>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {(['M006', 'M007', 'M008', 'M009', 'M010', 'TNI'] as const).map((mKey) => (
              <button
                key={mKey}
                onClick={() => setActiveTrendMetric(mKey)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                  activeTrendMetric === mKey
                    ? 'bg-[#1A2B4B] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {mKey === 'TNI' ? 'TNI Adherence' : mKey}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Trajectory Line */}
        <div className="h-64 w-full pt-3">
          {historicalTrends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No historical trend data available for current scope.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalTrends} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="reportingMonth"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={chartConfig.isPercent ? [0.7, 1.05] : [70, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => (chartConfig.isPercent ? `${Math.round(v * 100)}%` : `${v}`)}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0].payload;
                      const val = p[chartConfig.dataKey];
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded shadow-lg text-xs space-y-1">
                          <div className="font-bold text-slate-200">{p.reportingMonth} ({p.month})</div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-400">Actual:</span>
                            <span className="font-bold text-teal-400 font-mono">
                              {val !== null && val !== undefined
                                ? chartConfig.isPercent
                                  ? `${(val * 100).toFixed(1)}%`
                                  : Number(val).toFixed(1)
                                : 'N/A'}
                            </span>
                          </div>
                          {chartConfig.target !== null && (
                            <div className="flex items-center justify-between gap-4 text-[10px]">
                              <span className="text-slate-400">Target:</span>
                              <span className="text-slate-300 font-mono">{chartConfig.targetLabel}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {chartConfig.target !== null && (
                  <ReferenceLine
                    y={chartConfig.target}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    label={{
                      value: chartConfig.targetLabel,
                      position: 'top',
                      fill: '#dc2626',
                      fontSize: 10,
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey={chartConfig.dataKey}
                  stroke={chartConfig.strokeColor}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: chartConfig.strokeColor }}
                  activeDot={{ r: 6 }}
                  name={chartConfig.title}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Operational Governance & Diagnostics Breakdowns (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Panel 1: Audit & Feedback Cycle */}
        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-xs font-bold text-[#1A2B4B]">Audit & Feedback Cycle</span>
            <span className="text-[10px] text-slate-500">M006 Breakdown</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Audit Target:</span>
              <span className="font-mono font-bold text-slate-800">
                {operationalBreakdowns.auditFeedback.totalAuditTarget.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Audits Completed:</span>
              <span className="font-mono font-bold text-emerald-700">
                {operationalBreakdowns.auditFeedback.totalAuditsCompleted.toLocaleString()} ({operationalBreakdowns.auditFeedback.auditAchievementDisplay})
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Feedback Delivery Timeliness
              </span>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">&le; 24 Hours:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {operationalBreakdowns.auditFeedback.feedbackWithin24hDisplay} ({operationalBreakdowns.auditFeedback.feedbackWithin24hCount})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">24 – 48 Hours:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {operationalBreakdowns.auditFeedback.feedback24to48hDisplay} ({operationalBreakdowns.auditFeedback.feedback24to48hCount})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">&gt; 48 Hours:</span>
                  <span className="font-mono font-bold text-rose-700">
                    {operationalBreakdowns.auditFeedback.feedbackOver48hDisplay} ({operationalBreakdowns.auditFeedback.feedbackOver48hCount})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Hygiene & Compliance Audits */}
        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-xs font-bold text-[#1A2B4B]">Hygiene & Compliance</span>
            <span className="text-[10px] text-slate-500">M007 Accuracy</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Compliance Accuracy:</span>
              <span className="font-mono font-bold text-slate-800">
                {operationalBreakdowns.hygieneAudits.complianceAuditDisplay} ({operationalBreakdowns.hygieneAudits.totalComplianceAudits} audits)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hygiene Accuracy:</span>
              <span className="font-mono font-bold text-emerald-700">
                {operationalBreakdowns.hygieneAudits.hygieneAuditDisplay} ({operationalBreakdowns.hygieneAudits.totalHygieneAudits} audits)
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Top Root Causes (RCA)
              </span>
              <div className="space-y-0.5">
                {operationalBreakdowns.hygieneAudits.rcaBreakdown.length === 0 ? (
                  <span className="text-[10px] text-slate-400">No RCA items recorded.</span>
                ) : (
                  operationalBreakdowns.hygieneAudits.rcaBreakdown.map((r, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-slate-600">
                      <span className="truncate max-w-[140px]" title={r.reason}>{r.reason}</span>
                      <span className="font-mono font-bold text-slate-800">{r.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: Calibration Operational Volume */}
        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-xs font-bold text-[#1A2B4B]">Calibration Attendance</span>
            <span className="text-[10px] text-slate-500">M008 Operational</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Official M008 (Mean):</span>
              <span className="font-mono font-bold text-emerald-700">
                {headlineKpis.m008.actualDisplay}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Attendance:</span>
              <span className="font-mono font-bold text-slate-800">
                {operationalBreakdowns.calibration.totalTargetAttendance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Actual Attendance:</span>
              <span className="font-mono font-bold text-slate-800">
                {operationalBreakdowns.calibration.totalActualAttendance.toLocaleString()}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-100">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Attendance-weighted completion:</span>
                <span className="font-mono font-bold text-teal-700">
                  {operationalBreakdowns.calibration.weightedAttendanceDisplay}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                *Weighted attendance ratio of all participants. Official M008 is account-level average.
              </p>
            </div>
          </div>
        </div>

        {/* Panel 4: ATA Alignment */}
        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-xs font-bold text-[#1A2B4B]">ATA Alignment</span>
            <span className="text-[10px] text-slate-500">M009 vs M010</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Avg Self-Assessment:</span>
              <span className="font-mono font-bold text-slate-800">
                {operationalBreakdowns.ataAlignment.avgSelfAssessmentDisplay}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Avg Client Score:</span>
              <span className="font-mono font-bold text-slate-800">
                {operationalBreakdowns.ataAlignment.avgClientDisplay}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Client vs Self Gap:</span>
              <span className="font-mono font-bold text-slate-800">
                {operationalBreakdowns.ataAlignment.avgClientVsSelfGapDisplay}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-100">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Client Spot Checks:</span>
                <span className="font-mono font-bold text-teal-700">
                  {operationalBreakdowns.ataAlignment.spotCheckCount} ({operationalBreakdowns.ataAlignment.applicableMsaAccounts} MSA)
                </span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 leading-tight">
                Self vs Client score comparison across eligible MSA contract accounts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Hygiene Register Table */}
      <div className="bg-white border border-slate-200 rounded-xs shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-3.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-[#1A2B4B]">
              Account Hygiene Governance Register
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({displayedRegisterRows.length} / {scope.totalAccounts})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Table Filter Tabs */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xs p-0.5 text-xs">
              <button
                onClick={() => setTableFilter('ALL')}
                className={`px-2.5 py-1 font-semibold rounded-xs transition-colors cursor-pointer ${
                  tableFilter === 'ALL'
                    ? 'bg-[#1A2B4B] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({scope.totalAccounts})
              </button>
              <button
                onClick={() => setTableFilter('RED')}
                className={`px-2.5 py-1 font-semibold rounded-xs transition-colors cursor-pointer ${
                  tableFilter === 'RED'
                    ? 'bg-rose-700 text-white'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Has Red KPI ({scope.accountsWithRed})
              </button>
              <button
                onClick={() => setTableFilter('AMBER')}
                className={`px-2.5 py-1 font-semibold rounded-xs transition-colors cursor-pointer ${
                  tableFilter === 'AMBER'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Has Amber KPI ({scope.accountsWithAmber})
              </button>
              <button
                onClick={() => setTableFilter('NO_RED_AMBER')}
                className={`px-2.5 py-1 font-semibold rounded-xs transition-colors cursor-pointer ${
                  tableFilter === 'NO_RED_AMBER'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                No Red/Amber ({scope.accountsNoRedAmber})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search account, leader, site..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-xs bg-white focus:outline-none focus:border-[#0D9488] w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-3">Vertical</th>
                <th className="py-2.5 px-3">QA Leader</th>
                <th className="py-2.5 px-2.5 text-center" title="M006: Target 95%">M006 Audit & Feedback</th>
                <th className="py-2.5 px-2.5 text-center" title="M007: Target 96%">M007 Hygiene</th>
                <th className="py-2.5 px-2.5 text-center" title="M008: Target 95%">M008 Calibration</th>
                <th className="py-2.5 px-2.5 text-center" title="M009: Target 95">M009 ATA Internal</th>
                <th className="py-2.5 px-2.5 text-center" title="M010: Target 94">M010 ATA External</th>
                <th className="py-2.5 px-2.5 text-center" title="TNI Publication Status">TNI Published</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedRegisterRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400 text-xs">
                    No accounts found matching filter criteria.
                  </td>
                </tr>
              ) : (
                displayedRegisterRows.map((acc) => (
                  <tr
                    key={acc.accountId}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => selectAccountAndNavigate(acc.accountId)}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#1A2B4B] group-hover:text-[#0D9488] transition-colors">
                        {acc.accountName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {acc.accountId} &bull; {acc.site} &bull; {acc.lob}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{acc.vertical}</td>
                    <td className="py-2.5 px-3 text-slate-600">{acc.qaLeader}</td>

                    {/* M006 */}
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">{acc.m006.actualDisplay}</span>
                        <StatusBadge status={acc.m006.rag} size="xs" />
                      </div>
                    </td>

                    {/* M007 */}
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">{acc.m007.actualDisplay}</span>
                        <StatusBadge status={acc.m007.rag} size="xs" />
                      </div>
                    </td>

                    {/* M008 */}
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">{acc.m008.actualDisplay}</span>
                        <StatusBadge status={acc.m008.rag} size="xs" />
                      </div>
                    </td>

                    {/* M009 */}
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">{acc.m009.actualDisplay}</span>
                        <StatusBadge status={acc.m009.rag} size="xs" />
                      </div>
                    </td>

                    {/* M010 */}
                    <td className="py-2.5 px-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800">
                          {acc.m010.actualDisplay}
                        </span>
                        {acc.m010.isApplicable ? (
                          <StatusBadge status={acc.m010.rag} size="xs" />
                        ) : (
                          <span className="text-[9px] text-slate-400 font-medium">N/A</span>
                        )}
                      </div>
                    </td>

                    {/* TNI */}
                    <td className="py-2.5 px-2.5 text-center">
                      {acc.tni.isApplicable ? (
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-xs text-[10px] font-bold ${
                            acc.tni.status === 'Published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {acc.tni.status}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">N/A</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAccountAndNavigate(acc.accountId);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#0D9488] bg-teal-50 border border-teal-200 rounded-xs hover:bg-teal-100 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
