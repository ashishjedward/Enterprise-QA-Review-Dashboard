import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Search,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { MiniBar } from '../components/common/MiniBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { getBestQmDiagnostic } from '../services/api';
import { BestQmDiagnosticData, BestQmAccountRow } from '../types/api';

export const BestQmDetailPage: React.FC = () => {
  const {
    filters,
    navigateToPage,
    selectAccountAndNavigate,
    resetFilters,
  } = useFilters();

  const [data, setData] = useState<BestQmDiagnosticData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tableFilter, setTableFilter] = useState<'ALL' | 'RED' | 'AMBER' | 'BOTTOM5'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getBestQmDiagnostic({
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
        setError(err?.message || 'Failed to load BEST QM Diagnostic data.');
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

  // Loading State Skeleton
  if (loading && !data) {
    return (
      <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="h-4 w-64 bg-slate-200 animate-pulse rounded" />
          <div className="h-7 w-28 bg-slate-200 animate-pulse rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white p-4 rounded-md border border-slate-200 shadow-xs animate-pulse">
              <div className="h-3 w-28 bg-slate-200 rounded mb-3" />
              <div className="h-7 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-36 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

        <div className="h-60 bg-white border border-slate-200 rounded-md p-4 shadow-xs animate-pulse">
          <div className="h-4 w-48 bg-slate-200 rounded mb-4" />
          <div className="h-40 bg-slate-50 rounded" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white p-4 rounded-md border border-slate-200 shadow-xs animate-pulse">
              <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-6 bg-slate-100 rounded" />
                ))}
              </div>
            </div>
          ))}
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
            <span className="text-slate-600">Process Health</span>
            <span>&gt;</span>
            <span className="font-bold text-slate-900">BEST QM Quality Score Diagnostic</span>
          </div>
          <button
            onClick={() => navigateToPage('overview')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
        </div>

        <div className="bg-white border border-rose-200 rounded-md p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3 text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Failed to load BEST QM Diagnostic data</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'An unexpected error occurred.'}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                getBestQmDiagnostic({
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
                    setError(err?.message || 'Failed to load BEST QM Diagnostic data.');
                    setLoading(false);
                  });
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1A2B4B] text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={resetFilters}
              className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { Headline, Reporting_Context, Range_Context, Parameters, Comparisons, Accounts, Trend, Scope } = data;

  // Zero Accounts Empty State
  if (Headline.Total_Accounts === 0 || Accounts.length === 0) {
    return (
      <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              onClick={() => navigateToPage('overview')}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Enterprise
            </button>
            <span>&gt;</span>
            <span className="text-slate-600">Process Health</span>
            <span>&gt;</span>
            <span className="font-bold text-slate-900">BEST QM Quality Score Diagnostic</span>
          </div>
          <button
            onClick={() => navigateToPage('overview')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No accounts match the current filter selection.</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Try clearing one or more filters to view BEST QM quality score metrics.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetFilters}
              className="px-3.5 py-1.5 bg-[#1A2B4B] text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={() => navigateToPage('overview')}
              className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Back to Overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter Accounts Table
  const query = searchQuery.trim().toLowerCase();
  const searchFilteredAccounts = Accounts.filter((a) => {
    if (!query) return true;
    return (
      a.Account_Name.toLowerCase().includes(query) ||
      a.Account_ID.toLowerCase().includes(query) ||
      a.Vertical.toLowerCase().includes(query) ||
      a.QA_Leader.toLowerCase().includes(query) ||
      a.Sr_Director.toLowerCase().includes(query) ||
      a.Site.toLowerCase().includes(query) ||
      a.LOB.toLowerCase().includes(query)
    );
  });

  const sortedByScore = [...searchFilteredAccounts].sort((a, b) => a.Actual_Value - b.Actual_Value);
  const bottom5Accounts = sortedByScore.slice(0, 5);
  const redAccounts = searchFilteredAccounts.filter((a) => a.RAG === 'Red');
  const amberAccounts = searchFilteredAccounts.filter((a) => a.RAG === 'Amber');

  let displayedAccounts: BestQmAccountRow[] = searchFilteredAccounts;
  if (tableFilter === 'RED') displayedAccounts = redAccounts;
  else if (tableFilter === 'AMBER') displayedAccounts = amberAccounts;
  else if (tableFilter === 'BOTTOM5') displayedAccounts = bottom5Accounts;

  // Semantic Status for Card 2: Accounts on Target
  const targetBadgeStatus =
    Headline.Accounts_On_Target === Headline.Total_Accounts && Headline.Total_Accounts > 0
      ? 'Green'
      : Headline.Accounts_On_Target > 0
      ? 'Amber'
      : Headline.Total_Accounts > 0
      ? 'Red'
      : 'N/A';

  const targetBadgeLabel =
    Headline.Accounts_On_Target === Headline.Total_Accounts && Headline.Total_Accounts > 0
      ? 'Meeting Quality'
      : Headline.Accounts_On_Target > 0
      ? 'Partially Meeting'
      : Headline.Total_Accounts > 0
      ? 'Off Target'
      : 'N/A';

  // Trend Chart Coordinate Mapping (Score scale 75 to 100)
  const yMin = 75;
  const yMax = 100;
  const yRange = yMax - yMin;

  const validTrendPoints = Trend.map((t, idx) => {
    if (t.Actual_Value === null || !Number.isFinite(t.Actual_Value)) return null;
    const x = Trend.length > 1 ? 50 + (idx / (Trend.length - 1)) * 710 : 400;
    const y = 130 - ((t.Actual_Value - yMin) / yRange) * 110;
    return {
      x,
      y,
      value: t.Actual_Value,
      display: t.Actual_Display,
      month: t.Reporting_Month,
      rag: t.RAG,
      count: t.Account_Count,
      idx,
    };
  }).filter((p): p is { x: number; y: number; value: number; display: string; month: string; rag: 'Green' | 'Amber' | 'Red' | null; count: number; idx: number } => p !== null);

  const polylinePoints = validTrendPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const targetVal = Headline.Target_Value;
  const targetY = targetVal != null ? 130 - ((targetVal - yMin) / yRange) * 110 : null;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigateToPage('overview')}
            className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            Enterprise
          </button>
          <span>&gt;</span>
          <span className="text-slate-600">Process Health</span>
          <span>&gt;</span>
          <span className="font-bold text-slate-900">BEST QM Quality Score Diagnostic</span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
            {Reporting_Context.reportingMonthLabel} ({Scope.accountCount} {Scope.accountCount === 1 ? 'account' : 'accounts'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateToPage('overview')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
        </div>
      </div>

      {/* KPI Headline Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Card 1: Overall BEST QM Score */}
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Overall BEST QM Score</span>
            <StatusBadge status={Headline.RAG} size="xs" />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {Headline.Actual_Display}
            </span>
            <span className="text-xs font-bold text-slate-600">
              Target: {Headline.Target_Display}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Variance vs Benchmark:</span>
            <span
              className={`font-bold font-mono ${
                (Headline.Variance_Value ?? 0) >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {Headline.Variance_Display}
            </span>
          </div>
        </div>

        {/* Card 2: Accounts on Target */}
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Accounts on Target (&ge;{Headline.Target_Display})</span>
            <StatusBadge status={targetBadgeStatus} size="xs" label={targetBadgeLabel} />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-800 font-mono">
              {Headline.Accounts_On_Target} / {Headline.Total_Accounts}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {Headline.Pass_Rate_Pct}% Pass Rate
            </span>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
            Evaluated for {Reporting_Context.reportingMonthLabel} reporting cycle
          </div>
        </div>

        {/* Card 3: Critical Quality Deficits */}
        <div className="bg-white p-3.5 rounded-md border border-rose-200 bg-rose-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">Critical Quality Deficits</span>
            <StatusBadge status="RED" size="xs" label={`${Headline.Red_Account_Count} Red`} />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-900 font-mono">
              {Headline.Red_Account_Count}
            </span>
            <span className="text-xs text-rose-700 font-medium">&lt; 85 Quality Floor</span>
          </div>
          <div className="text-[11px] text-rose-700/80 border-t border-rose-100 pt-1.5 truncate">
            {Headline.Critical_Deficit_Names.length > 0
              ? Headline.Critical_Deficit_Names.join(', ')
              : 'No Red accounts in current scope'}
          </div>
        </div>

        {/* Card 4: Amber Quality Watchlist */}
        <div className="bg-white p-3.5 rounded-md border border-amber-200 bg-amber-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Amber Quality Watchlist</span>
            <StatusBadge status="AMBER" size="xs" label={`${Headline.Amber_Account_Count} Amber`} />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-900 font-mono">
              {Headline.Amber_Account_Count}
            </span>
            <span className="text-xs text-amber-700 font-medium">85.0 &ndash; 89.9 Score Range</span>
          </div>
          <div className="text-[11px] text-amber-700/80 border-t border-amber-100 pt-1.5">
            {Headline.Amber_Account_Count === 1
              ? '1 account in Amber range'
              : `${Headline.Amber_Account_Count} accounts in Amber range`}
          </div>
        </div>
      </div>

      {/* Period Trend Line Chart Section */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {filters.timePeriod} BEST QM Quality Trend vs {Headline.Target_Display} Benchmark
              </h3>
              {Range_Context.historyCoverageStatus === 'PARTIAL_HISTORY' && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded">
                  {Range_Context.availableMonthCount} of {Range_Context.requestedMonthCount} months available
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Historical quality trajectory averaged across scoped accounts.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span>
              <span className="text-slate-700 font-medium">Actual Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
              <span className="text-slate-500 font-medium">Standard ({Headline.Target_Display})</span>
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full h-48 pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 150" preserveAspectRatio="none">
            {[75, 80, 85, 90, 95, 100].map((val) => {
              const y = 130 - ((val - yMin) / yRange) * 110;
              return (
                <g key={val}>
                  <line x1="50" y1={y} x2="780" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x="20" y={y + 3} fontSize="9" fill="#94a3b8" fontFamily="monospace">
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Target Benchmark Line */}
            {targetY != null && (
              <line
                x1="50"
                y1={targetY}
                x2="780"
                y2={targetY}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
            )}

            {/* Actual Line & Markers */}
            {validTrendPoints.length > 0 && (
              <>
                <polyline
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                />
                {validTrendPoints.map((p) => {
                  const circleColor = p.rag === 'Red' ? '#e11d48' : p.rag === 'Amber' ? '#d97706' : p.rag === 'Green' ? '#16a34a' : '#64748b';
                  const textColor = p.rag === 'Red' ? '#be123c' : p.rag === 'Amber' ? '#b45309' : '#0f172a';
                  const isAttention = p.rag === 'Red' || p.rag === 'Amber';
                  return (
                    <g key={p.idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isAttention ? 4.5 : 3.5}
                        fill={circleColor}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <text
                        x={p.x}
                        y={p.y - 8}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fill={textColor}
                        fontFamily="monospace"
                      >
                        {p.display}
                      </text>
                      <text
                        x={p.x}
                        y="144"
                        fontSize="10"
                        fill="#64748b"
                        textAnchor="middle"
                      >
                        {p.month}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>
      </div>

      {/* BEST QM Parameter Breakdown (Evaluation Dimensions) */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              BEST QM Parameter Breakdown (Evaluation Dimensions)
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated scores across core quality dimensions in the {Reporting_Context.reportingMonthLabel} period.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Target: {Headline.Target_Display}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Parameters.map((param, idx) => (
            <div
              key={idx}
              className="p-3 rounded border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1" title={param.Parameter_Name}>
                    {param.Parameter_Name}
                  </span>
                  <StatusBadge status={param.RAG} size="xs" />
                </div>
                <div className="text-xl font-black text-slate-900 font-mono mb-1">
                  {param.Actual_Display}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 flex justify-between items-center">
                <span>Target: {param.Target_Display}</span>
                <span
                  className={`font-semibold font-mono ${
                    (param.Variance_Value ?? 0) >= 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {param.Variance_Display}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparisons: Vertical, QA Leader & Sr Director */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vertical Comparison */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-900 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span>BEST QM by Vertical</span>
            <span className="text-[10px] text-slate-500 font-normal">Target: {Headline.Target_Display}</span>
          </div>
          <div className="space-y-1">
            {Comparisons.byVertical.map((v, idx) => (
              <MiniBar
                key={idx}
                label={v.Dimension_Label}
                subLabel={`${v.Account_Count} accs`}
                value={v.Actual_Value ?? 0}
                target={v.Target_Value ?? (Headline.Target_Value ?? undefined)}
                unit=""
                rag={v.RAG === 'Green' ? 'GREEN' : v.RAG === 'Amber' ? 'AMBER' : 'RED'}
                min={75}
                max={100}
              />
            ))}
          </div>
        </div>

        {/* QA Leader Comparison */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-900 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span>BEST QM by QA Leader</span>
            <span className="text-[10px] text-slate-500 font-normal">Target: {Headline.Target_Display}</span>
          </div>
          <div className="space-y-1">
            {Comparisons.byQaLeader.map((l, idx) => (
              <MiniBar
                key={idx}
                label={l.Dimension_Label}
                subLabel={`${l.Account_Count} accs`}
                value={l.Actual_Value ?? 0}
                target={l.Target_Value ?? (Headline.Target_Value ?? undefined)}
                unit=""
                rag={l.RAG === 'Green' ? 'GREEN' : l.RAG === 'Amber' ? 'AMBER' : 'RED'}
                min={75}
                max={100}
              />
            ))}
          </div>
        </div>

        {/* Sr Director Comparison */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-900 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span>BEST QM by Sr Director</span>
            <span className="text-[10px] text-slate-500 font-normal">Target: {Headline.Target_Display}</span>
          </div>
          <div className="space-y-1">
            {Comparisons.bySrDirector.map((d, idx) => (
              <MiniBar
                key={idx}
                label={d.Dimension_Label}
                subLabel={`${d.Account_Count} accs`}
                value={d.Actual_Value ?? 0}
                target={d.Target_Value ?? (Headline.Target_Value ?? undefined)}
                unit=""
                rag={d.RAG === 'Green' ? 'GREEN' : d.RAG === 'Amber' ? 'AMBER' : 'RED'}
                min={75}
                max={100}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Account Quality Drill-Down Table */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Account-Level BEST QM Scores &amp; Dimensions
            </h3>
            <p className="text-xs text-slate-500">
              Click any account row to open the complete Account Diagnostic Page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 w-44"
              />
            </div>

            {/* Filter Buttons */}
            <button
              onClick={() => setTableFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                tableFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({searchFilteredAccounts.length})
            </button>
            <button
              onClick={() => setTableFilter('BOTTOM5')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                tableFilter === 'BOTTOM5' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Bottom 5
            </button>
            <button
              onClick={() => setTableFilter('RED')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                tableFilter === 'RED' ? 'bg-rose-600 text-white' : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
              }`}
            >
              Red ({redAccounts.length})
            </button>
            <button
              onClick={() => setTableFilter('AMBER')}
              className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                tableFilter === 'AMBER' ? 'bg-amber-600 text-white' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              Amber ({amberAccounts.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Account Name</th>
                <th className="py-2.5 px-2">Vertical</th>
                <th className="py-2.5 px-2">QA Leader</th>
                <th className="py-2.5 px-2">Sr Director</th>
                <th className="py-2.5 px-2 text-right">BEST QM Score</th>
                <th className="py-2.5 px-2 text-right">Target</th>
                <th className="py-2.5 px-2 text-right">Variance</th>
                <th className="py-2.5 px-2 text-center">Status</th>
                <th className="py-2.5 px-3">Evaluation Dimensions</th>
                <th className="py-2.5 px-3">L&amp;D Recommendation</th>
                <th className="py-2.5 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedAccounts.map((acc) => {
                return (
                  <tr
                    key={acc.Account_ID}
                    onClick={() => selectAccountAndNavigate(acc.Account_ID)}
                    className="hover:bg-sky-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-900 group-hover:text-sky-700">
                      <div>{acc.Account_Name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{acc.Account_ID}</div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600">{acc.Vertical}</td>
                    <td className="py-2.5 px-2 text-slate-700 font-medium">{acc.QA_Leader}</td>
                    <td className="py-2.5 px-2 text-slate-600">{acc.Sr_Director}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-900 font-mono">
                      {acc.Actual_Display}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-500 font-mono">
                      {acc.Target_Display}
                    </td>
                    <td
                      className={`py-2.5 px-2 text-right font-mono font-semibold ${
                        (acc.Variance_Value ?? 0) >= 0 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {acc.Variance_Display}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <StatusBadge status={acc.RAG} size="xs" />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {acc.Parameters.map((p, pIdx) => {
                          const isGreen = p.RAG.toLowerCase() === 'green';
                          const isAmber = p.RAG.toLowerCase() === 'amber';
                          return (
                            <span
                              key={pIdx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                isGreen
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : isAmber
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                              title={`${p.Parameter_Name}: ${p.Score_Display}`}
                            >
                              {p.Parameter_Name.slice(0, 10)}: {p.Score_Display}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-[11px] text-slate-600">
                      {acc.LD_Remarks || '—'}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="text-sky-700 font-semibold text-[11px] group-hover:underline flex items-center justify-end gap-0.5">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
