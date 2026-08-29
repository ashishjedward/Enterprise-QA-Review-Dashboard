import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { MiniBar } from '../components/common/MiniBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { getSlaDiagnostic } from '../services/api';
import { SlaDiagnosticData, SlaAccountRow } from '../types/api';

export const SlaDetailPage: React.FC = () => {
  const {
    filters,
    navigateToPage,
    selectAccountAndNavigate,
    resetFilters,
  } = useFilters();

  const [data, setData] = useState<SlaDiagnosticData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tableFilter, setTableFilter] = useState<'ALL' | 'RED' | 'PENALTY' | 'BOTTOM5'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getSlaDiagnostic({
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
        setError(err?.message || 'Failed to load SLA Diagnostic data.');
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

  // Loading State
  if (loading && !data) {
    return (
      <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="h-4 w-64 bg-slate-200 animate-pulse rounded" />
          <div className="h-7 w-28 bg-slate-200 animate-pulse rounded" />
        </div>

        {/* Headline Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white p-4 rounded-md border border-slate-200 shadow-xs animate-pulse">
              <div className="h-3 w-28 bg-slate-200 rounded mb-3" />
              <div className="h-7 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-36 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="h-60 bg-white border border-slate-200 rounded-md p-4 shadow-xs animate-pulse">
          <div className="h-4 w-48 bg-slate-200 rounded mb-4" />
          <div className="h-40 bg-slate-50 rounded" />
        </div>

        {/* Comparisons Skeleton */}
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
            <span className="font-bold text-slate-900">SLA Achievement Diagnostic</span>
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
          <h3 className="text-sm font-bold text-slate-800">Failed to load SLA Diagnostic</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'An unexpected error occurred.'}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                getSlaDiagnostic({
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
                    setError(err?.message || 'Failed to load SLA Diagnostic data.');
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

  const { Headline, Range_Context, Trend, Comparisons, Accounts, SLA_Related_Escalations, Root_Cause_Summary } = data;

  // Zero accounts state
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
            <span className="font-bold text-slate-900">SLA Achievement Diagnostic</span>
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

        <div className="bg-white border border-slate-200 rounded-md p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No accounts match the current filter selection.</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Try clearing one or more filters to view SLA metrics.</p>
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

  // Filter and Search Accounts
  const bottom5 = Accounts.slice(0, 5);
  const redSlaAccounts = Accounts.filter((a) => a.RAG === 'Red');
  const penaltyAccounts = Accounts.filter((a) => a.Penalty_Risk === 'High' || a.Penalty_Risk === 'Medium');

  let filteredAccountRows: SlaAccountRow[] = Accounts;
  if (tableFilter === 'RED') filteredAccountRows = redSlaAccounts;
  else if (tableFilter === 'PENALTY') filteredAccountRows = penaltyAccounts;
  else if (tableFilter === 'BOTTOM5') filteredAccountRows = bottom5;

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    filteredAccountRows = filteredAccountRows.filter(
      (a) =>
        a.Account_Name.toLowerCase().includes(q) ||
        a.Account_ID.toLowerCase().includes(q) ||
        a.Vertical.toLowerCase().includes(q) ||
        a.QA_Leader.toLowerCase().includes(q) ||
        a.Sr_Director.toLowerCase().includes(q) ||
        a.Site.toLowerCase().includes(q) ||
        a.LOB.toLowerCase().includes(q) ||
        (a.Root_Cause && a.Root_Cause.toLowerCase().includes(q))
    );
  }

  // Trend Chart Coordinate Calculation
  const trendPoints = Trend || [];
  const minChartVal = 85;
  const maxChartVal = 100;
  const chartRange = maxChartVal - minChartVal;

  const validChartPoints = trendPoints.map((pt, idx) => {
    const actPct = pt.Actual_Value * 100;
    const tgtPct = pt.Target_Value * 100;
    const x = trendPoints.length > 1 ? 50 + (idx / (trendPoints.length - 1)) * 700 : 400;
    const yActual = 125 - ((actPct - minChartVal) / chartRange) * 100;
    const yTarget = 125 - ((tgtPct - minChartVal) / chartRange) * 100;
    return {
      x,
      yActual,
      yTarget,
      actPct,
      tgtPct,
      actualDisplay: pt.Actual_Display,
      targetDisplay: pt.Target_Display,
      month: pt.Reporting_Month,
      rag: pt.RAG,
      idx,
    };
  });

  const actualPolyline = validChartPoints.map((p) => `${p.x},${p.yActual}`).join(' ');
  const targetPolyline = validChartPoints.map((p) => `${p.x},${p.yTarget}`).join(' ');

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Breadcrumb & Header Nav */}
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
          <span className="font-bold text-slate-900">SLA Achievement Diagnostic</span>
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
        {/* Card 1: Current SLA Achievement */}
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Current SLA Achievement</span>
            <StatusBadge status={Headline.RAG} size="xs" />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">{Headline.Actual_Display}</span>
            <span className="text-xs font-bold text-slate-600">Target: {Headline.Target_Display}</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5">
            <span>Variance vs Target:</span>
            <span
              className={`font-bold font-mono ${
                Headline.Variance_Value >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {Headline.Variance_Display}
            </span>
          </div>
        </div>

        {/* Card 2: Accounts on Target */}
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Accounts on Target</span>
            {(() => {
              let badgeStatus: string = 'N/A';
              let badgeLabel: string = 'N/A';

              if (Headline.Total_Accounts === 0) {
                badgeStatus = 'N/A';
                badgeLabel = 'N/A';
              } else if (Headline.Accounts_On_Target === Headline.Total_Accounts) {
                badgeStatus = 'GREEN';
                badgeLabel = 'Meeting SLA';
              } else if (Headline.Accounts_On_Target > 0) {
                badgeStatus = 'AMBER';
                badgeLabel = 'Partially Meeting';
              } else {
                badgeStatus = 'RED';
                badgeLabel = 'Off Target';
              }

              return <StatusBadge status={badgeStatus} size="xs" label={badgeLabel} />;
            })()}
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {Headline.Accounts_On_Target} / {Headline.Total_Accounts}
            </span>
            <span className="text-xs text-slate-500">{Headline.Pass_Rate_Pct}% Passing</span>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5 flex items-center justify-between">
            <span>Green: {Headline.Green_Account_Count}</span>
            <span>Amber: {Headline.Amber_Account_Count}</span>
            <span>Red: {Headline.Red_Account_Count}</span>
          </div>
        </div>

        {/* Card 3: Red SLA Breach Accounts */}
        <div className="bg-white p-3.5 rounded-md border border-rose-200 bg-rose-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">Red SLA Breach Accounts</span>
            <StatusBadge status="RED" size="xs" label={`${Headline.Red_Account_Count} Red`} />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-900 font-mono">{Headline.Red_Account_Count}</span>
            <span className="text-xs text-rose-700 font-medium">Critical Contract Breaches</span>
          </div>
          <div className="text-[11px] text-rose-700/80 border-t border-rose-100 pt-1.5 truncate">
            {redSlaAccounts.length > 0
              ? redSlaAccounts.map((a) => a.Account_Name).join(', ')
              : 'No critical breaches'}
          </div>
        </div>

        {/* Card 4: Contractual Penalty Risk */}
        <div className="bg-white p-3.5 rounded-md border border-amber-200 bg-amber-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Contractual Penalty Risk</span>
            <StatusBadge
              status={
                Headline.High_Penalty_Risk_Count > 0
                  ? 'RED'
                  : Headline.Medium_Penalty_Risk_Count > 0
                  ? 'AMBER'
                  : 'GREEN'
              }
              size="xs"
              label={`${Headline.Total_Penalty_Risk_Count} Accounts`}
            />
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-900 font-mono">
              {Headline.Total_Penalty_Risk_Count}
            </span>
            <span className="text-xs text-amber-800 font-semibold font-mono">
              {Headline.High_Penalty_Risk_Count} High &bull; {Headline.Medium_Penalty_Risk_Count} Med
            </span>
          </div>
          <div className="text-[11px] text-amber-700/80 border-t border-amber-100 pt-1.5">
            {SLA_Related_Escalations.Open_SLA_Escalations} Open SLA Breach Escalations (
            {SLA_Related_Escalations.High_Critical_Open_Escalations} High/Crit)
          </div>
        </div>
      </div>

      {/* Period Trend Line Chart Section */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {Range_Context.requestedPeriod} SLA Trend vs Effective Target
              </h3>
              {Range_Context.historyCoverageStatus === 'PARTIAL_HISTORY' && (
                <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                  {Range_Context.availableMonthCount} of {Range_Context.requestedMonthCount} months available
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Monthly cohort performance ({Range_Context.startMonth} to {Range_Context.endMonth})
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-sky-600 inline-block"></span>
              <span className="text-slate-700 font-medium">Actual SLA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
              <span className="text-slate-500 font-medium">Effective Target</span>
            </div>
          </div>
        </div>

        {/* High-Precision SVG Line Chart */}
        <div className="w-full h-44 pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 140" preserveAspectRatio="none">
            {/* Grid horizontal lines */}
            {[88, 91, 94, 97, 100].map((val) => {
              const y = 125 - ((val - minChartVal) / chartRange) * 100;
              return (
                <g key={val}>
                  <line x1="45" y1={y} x2="770" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x="15" y={y + 3} fontSize="9" fill="#94a3b8" fontFamily="monospace">
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Target Line / Polyline */}
            {validChartPoints.length > 0 && (
              <polyline
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={targetPolyline}
              />
            )}

            {/* Actual SLA Polyline */}
            {validChartPoints.length > 0 && (
              <>
                <polyline
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={actualPolyline}
                />
                {validChartPoints.map((p) => {
                  const isBelow = p.actPct < p.tgtPct;
                  return (
                    <g key={p.idx} className="group">
                      <circle
                        cx={p.x}
                        cy={p.yActual}
                        r={isBelow ? 4 : 3.5}
                        fill={isBelow ? '#dc2626' : '#0284c7'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <text
                        x={p.x}
                        y={p.yActual - 8}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fill={isBelow ? '#b91c1c' : '#0f172a'}
                        fontFamily="monospace"
                      >
                        {p.actualDisplay}
                      </text>
                      <text x={p.x} y="136" fontSize="10" fill="#64748b" textAnchor="middle">
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

      {/* Comparisons Grid (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vertical Comparison */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-900 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span>SLA by Vertical</span>
            <span className="text-[10px] text-slate-500 font-normal">Live Aggregates</span>
          </div>
          <div className="space-y-1">
            {Comparisons.byVertical.map((v, idx) => (
              <MiniBar
                key={idx}
                label={v.Dimension_Label}
                subLabel={`${v.Account_Count} accs`}
                value={v.Actual_Value * 100}
                target={v.Target_Value * 100}
                rag={v.RAG === 'Green' ? 'GREEN' : v.RAG === 'Amber' ? 'AMBER' : 'RED'}
                min={85}
                max={100}
              />
            ))}
          </div>
        </div>

        {/* QA Leader Comparison */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-900 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span>SLA by QA Leader</span>
            <span className="text-[10px] text-slate-500 font-normal">Live Aggregates</span>
          </div>
          <div className="space-y-1">
            {Comparisons.byQaLeader.map((l, idx) => (
              <MiniBar
                key={idx}
                label={l.Dimension_Label}
                subLabel={`${l.Account_Count} accs`}
                value={l.Actual_Value * 100}
                target={l.Target_Value * 100}
                rag={l.RAG === 'Green' ? 'GREEN' : l.RAG === 'Amber' ? 'AMBER' : 'RED'}
                min={85}
                max={100}
              />
            ))}
          </div>
        </div>

        {/* Sr Director Comparison */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-900 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span>SLA by Sr Director</span>
            <span className="text-[10px] text-slate-500 font-normal">Live Aggregates</span>
          </div>
          <div className="space-y-1">
            {Comparisons.bySrDirector.map((d, idx) => (
              <MiniBar
                key={idx}
                label={d.Dimension_Label}
                subLabel={`${d.Account_Count} accs`}
                value={d.Actual_Value * 100}
                target={d.Target_Value * 100}
                rag={d.RAG === 'Green' ? 'GREEN' : d.RAG === 'Amber' ? 'AMBER' : 'RED'}
                min={85}
                max={100}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Root Cause Summary Section */}
      {Root_Cause_Summary && Root_Cause_Summary.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Primary Root Cause Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Distribution of Root_Cause_I across {Headline.Total_Accounts} accounts at latest closed month
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Root_Cause_Summary.map((rc, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <span className="text-[11px] font-semibold text-slate-700 truncate" title={rc.Category}>
                  {rc.Category}
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-bold font-mono text-slate-900">{rc.Account_Count}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{rc.Percentage_Of_Total}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Performance Drill-Down Table */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Account-Level SLA Performance & Risk Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredAccountRows.length} of {Accounts.length} accounts. Click any row to inspect Account 360.
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
                className="pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Table Filter Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTableFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                  tableFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({Accounts.length})
              </button>
              <button
                onClick={() => setTableFilter('BOTTOM5')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                  tableFilter === 'BOTTOM5'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Bottom 5
              </button>
              <button
                onClick={() => setTableFilter('RED')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                  tableFilter === 'RED'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                }`}
              >
                Red ({redSlaAccounts.length})
              </button>
              <button
                onClick={() => setTableFilter('PENALTY')}
                className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                  tableFilter === 'PENALTY'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                Penalty Risk ({penaltyAccounts.length})
              </button>
            </div>
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
                <th className="py-2.5 px-2">Site &bull; LOB</th>
                <th className="py-2.5 px-2 text-right">Actual SLA</th>
                <th className="py-2.5 px-2 text-right">Target</th>
                <th className="py-2.5 px-2 text-right">Variance</th>
                <th className="py-2.5 px-2">Performance</th>
                <th className="py-2.5 px-2">Penalty Risk</th>
                <th className="py-2.5 px-2">Root Cause</th>
                <th className="py-2.5 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccountRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-6 text-center text-slate-500">
                    No accounts found matching the current search or tab filter.
                  </td>
                </tr>
              ) : (
                filteredAccountRows.map((acc) => (
                  <tr
                    key={acc.Account_ID}
                    onClick={() => selectAccountAndNavigate(acc.Account_ID)}
                    className="hover:bg-sky-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-900 group-hover:text-sky-700">
                      <div>{acc.Account_Name}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                        {acc.Account_ID}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600">{acc.Vertical}</td>
                    <td className="py-2.5 px-2 text-slate-700 font-medium">{acc.QA_Leader}</td>
                    <td className="py-2.5 px-2 text-slate-600">{acc.Sr_Director}</td>
                    <td className="py-2.5 px-2 text-slate-500 font-mono text-[11px]">
                      {acc.Site} &bull; {acc.LOB}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-900 font-mono">
                      {acc.Actual_Display}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-500 font-mono">
                      {acc.Target_Display}
                    </td>
                    <td
                      className={`py-2.5 px-2 text-right font-mono font-semibold ${
                        acc.Variance_Value >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {acc.Variance_Display}
                    </td>
                    <td className="py-2.5 px-2">
                      <StatusBadge status={acc.RAG} size="xs" />
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                          acc.Penalty_Risk === 'High'
                            ? 'text-rose-800 bg-rose-50 border-rose-200'
                            : acc.Penalty_Risk === 'Medium'
                            ? 'text-amber-800 bg-amber-50 border-amber-200'
                            : 'text-slate-600 bg-slate-50 border-slate-200'
                        }`}
                      >
                        {acc.Penalty_Risk} Risk
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 text-[11px] max-w-[140px] truncate" title={acc.Root_Cause || 'None'}>
                      {acc.Root_Cause || '—'}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="text-sky-700 font-semibold text-[11px] group-hover:underline flex items-center justify-end gap-0.5">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </span>
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
