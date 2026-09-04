import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Percent,
  SlidersHorizontal,
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
import { DiagnosticPageHeader } from '../components/common/DiagnosticPageHeader';
import { getQaTeamDiagnostic } from '../services/api';
import {
  QaTeamDiagnosticData,
  QaTeamAccountRegisterRow,
  QaTeamTrendPoint,
  QaTeamSiteRollup,
} from '../types/api';

type AccountTableFilter =
  | 'ALL'
  | 'UNDER_REQUIREMENT'
  | 'OVER_REQUIREMENT'
  | 'EXACTLY_STAFFED'
  | 'UTILIZATION_RED'
  | 'ATTRITION_RED'
  | 'BILLING_BELOW_STANDARD';

type TrendMetricView = 'STAFFING' | 'UTILIZATION' | 'ATTRITION' | 'BILLING';

export const QATeamPage: React.FC = () => {
  const {
    filters,
    navigateToPage,
    selectAccountAndNavigate,
    resetFilters,
  } = useFilters();

  const [data, setData] = useState<QaTeamDiagnosticData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [tableFilter, setTableFilter] = useState<AccountTableFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trendMetric, setTrendMetric] = useState<TrendMetricView>('STAFFING');
  const [sortField, setSortField] = useState<keyof QaTeamAccountRegisterRow>('accountName');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getQaTeamDiagnostic({
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
        setError(err?.message || 'Failed to load QA Team Diagnostic data.');
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

  // Compute filter counts for tab badges
  const filterCounts = useMemo(() => {
    if (!data?.accountRegister) {
      return {
        all: 0,
        under: 0,
        over: 0,
        exact: 0,
        utilRed: 0,
        attrRed: 0,
        billBelowStandard: 0,
      };
    }
    const rows = data.accountRegister;
    return {
      all: rows.length,
      under: rows.filter((r) => r.staffingVariance !== null && r.staffingVariance < 0).length,
      over: rows.filter((r) => r.staffingVariance !== null && r.staffingVariance > 0).length,
      exact: rows.filter((r) => r.staffingVariance === 0).length,
      utilRed: rows.filter((r) => r.utilizationRag === 'Red').length,
      attrRed: rows.filter((r) => r.attritionRag === 'Red').length,
      billBelowStandard: rows.filter((r) => r.billingRag === 'Amber' || r.billingRag === 'Red').length,
    };
  }, [data?.accountRegister]);

  // Filter and sort account register rows
  const displayedRegisterRows = useMemo(() => {
    if (!data?.accountRegister) return [];
    let rows = data.accountRegister.filter((row: QaTeamAccountRegisterRow) => {
      if (tableFilter === 'UNDER_REQUIREMENT' && (row.staffingVariance === null || row.staffingVariance >= 0)) return false;
      if (tableFilter === 'OVER_REQUIREMENT' && (row.staffingVariance === null || row.staffingVariance <= 0)) return false;
      if (tableFilter === 'EXACTLY_STAFFED' && row.staffingVariance !== 0) return false;
      if (tableFilter === 'UTILIZATION_RED' && row.utilizationRag !== 'Red') return false;
      if (tableFilter === 'ATTRITION_RED' && row.attritionRag !== 'Red') return false;
      if (tableFilter === 'BILLING_BELOW_STANDARD') {
        if (row.billingRag !== 'Amber' && row.billingRag !== 'Red') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          row.accountName.toLowerCase().includes(q) ||
          row.accountId.toLowerCase().includes(q) ||
          row.vertical.toLowerCase().includes(q) ||
          row.qaLeader.toLowerCase().includes(q) ||
          row.srDirector.toLowerCase().includes(q) ||
          row.site.toLowerCase().includes(q) ||
          row.lob.toLowerCase().includes(q)
        );
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return rows;
  }, [data?.accountRegister, tableFilter, searchQuery, sortField, sortAsc]);

  const handleSort = (field: keyof QaTeamAccountRegisterRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="h-4 w-72 bg-slate-200 animate-pulse rounded" />
          <div className="h-7 w-28 bg-slate-200 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded p-4 animate-pulse">
              <div className="h-3 w-28 bg-slate-200 rounded mb-2" />
              <div className="h-7 w-20 bg-slate-300 rounded mb-2" />
              <div className="h-3 w-36 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
        <div className="h-24 bg-white border border-slate-200 rounded p-4 animate-pulse" />
        <div className="h-64 bg-white border border-slate-200 rounded p-4 animate-pulse" />
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button onClick={() => navigateToPage('overview')} className="text-slate-600 hover:text-slate-900 font-medium">
              Enterprise
            </button>
            <span>&gt;</span>
            <span className="font-bold text-slate-900">QA Team Capacity & Staffing Diagnostic</span>
          </div>
          <button
            onClick={() => navigateToPage('overview')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
        </div>
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-md text-center max-w-xl mx-auto my-12">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900 mb-1">Diagnostic Query Failed</h3>
          <p className="text-xs text-rose-700 mb-4">{error || 'An unexpected error occurred while loading QA Team data.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-medium hover:bg-rose-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { reportingContext, rangeContext, scopeSummary, headline, siteRollup, bandDistribution, historicalTrends } = data;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Shared Diagnostic Page Header */}
      <DiagnosticPageHeader
        title="QA Team Capacity & Staffing"
        breadcrumbLabel="QA Team Capacity & Staffing"
        description="Staffing capacity, QA utilization, attrition and billing coverage."
        contextBadges={
          <>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
              <Calendar className="w-3 h-3 text-slate-500" />
              Closed Snapshot: {reportingContext.officialReportingMonth}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
              Period: {rangeContext.requestedPeriod} ({rangeContext.availableMonthCount} of {rangeContext.requestedMonthCount} Mo)
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
              <Users className="w-3 h-3 text-slate-500" />
              {scopeSummary.totalAccounts} {scopeSummary.totalAccounts === 1 ? 'Account' : 'Accounts'} in Scope
            </span>
          </>
        }
      />

      {/* 2. Headline Factual KPI Cards (Closed Operating Snapshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: Staffing Capacity */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Staffing Capacity
              </span>
              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                {reportingContext.officialReportingMonth} Closed
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {headline.staffing.actualHeadcount.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {headline.staffing.requiredHeadcount.toLocaleString()} Req
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="text-slate-500">Staffing Variance:</span>
              <span className={`font-mono font-bold ${
                headline.staffing.variance > 0
                  ? 'text-emerald-700'
                  : headline.staffing.variance < 0
                  ? 'text-rose-700'
                  : 'text-slate-700'
              }`}>
                {headline.staffing.varianceDisplay} QA
              </span>
              <span className="text-[10px] text-slate-500">
                ({headline.staffing.variance >= 0 ? 'Surplus' : 'Deficit'})
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Approved: <strong className="font-mono text-slate-800">{headline.staffing.approvedHeadcount.toLocaleString()}</strong></span>
            <span>Under Req: <strong className="font-mono text-rose-700">{headline.staffing.understaffedAccountCount}</strong> accts</span>
          </div>
        </div>

        {/* CARD 2: QA Utilization (M011) */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  QA Utilization
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">M011</span>
              </div>
              <StatusBadge status={headline.utilization.rag} size="sm" />
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {headline.utilization.actualDisplay}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / Target {headline.utilization.targetDisplay}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="text-slate-500">Variance vs Target:</span>
              <span className={`font-mono font-bold ${
                headline.utilization.varianceToTarget !== null && headline.utilization.varianceToTarget >= 0
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}>
                {headline.utilization.varianceToTarget !== null
                  ? `${headline.utilization.varianceToTarget >= 0 ? '+' : ''}${(headline.utilization.varianceToTarget * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Prod/Staff: <strong className="font-mono text-slate-700">{Math.round((headline.utilization.productiveHrs || 0) / 1000)}k/{Math.round((headline.utilization.staffHrs || 0) / 1000)}k hrs</strong></span>
            <span>RAG: <span className="text-emerald-700 font-semibold">{headline.utilization.greenCount}G</span> <span className="text-amber-700 font-semibold">{headline.utilization.amberCount}A</span> <span className="text-rose-700 font-semibold">{headline.utilization.redCount}R</span></span>
          </div>
        </div>

        {/* CARD 3: QA Attrition (M012) */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  QA Attrition
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">M012</span>
              </div>
              <StatusBadge status={headline.attrition.rag} size="sm" />
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {headline.attrition.actualDisplay}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / Target {headline.attrition.targetDisplay}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="text-slate-500">Variance vs Target:</span>
              <span className={`font-mono font-bold ${
                headline.attrition.varianceToTarget !== null && headline.attrition.varianceToTarget <= 0
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}>
                {headline.attrition.varianceToTarget !== null
                  ? `${headline.attrition.varianceToTarget > 0 ? '+' : ''}${(headline.attrition.varianceToTarget * 100).toFixed(1)}%`
                  : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-500">(Lower is better)</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Exits: <strong className="font-mono text-slate-700">{headline.attrition.exits || 0} / {headline.attrition.openingHc || 0} HC</strong></span>
            <span>RAG: <span className="text-emerald-700 font-semibold">{headline.attrition.greenCount}G</span> <span className="text-amber-700 font-semibold">{headline.attrition.amberCount}A</span> <span className="text-rose-700 font-semibold">{headline.attrition.redCount}R</span></span>
          </div>
        </div>

        {/* CARD 4: Commercial Billing Coverage */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Billing Coverage
              </span>
              <StatusBadge status={headline.commercial.rag} size="sm" />
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {headline.commercial.coverageDisplay}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                coverage
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="text-slate-500">FTEs:</span>
              <span className="font-mono text-slate-800 font-semibold">
                {headline.commercial.billedFte.toLocaleString()} Billed / {headline.commercial.billableFte.toLocaleString()} Billable
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Commercial Context</span>
            <span>Under-billed: <strong className="font-mono text-amber-700">{headline.commercial.underBilledAccountCount}</strong> accts</span>
          </div>
        </div>
      </div>

      {/* 3. Current Organization Roster & Band Mix */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Current Organization Roster & Band Mix (Live Snapshot)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Active mapped organization roster across delivery and leadership hierarchy. Distinct from closed operational staffing.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 font-medium">
              Core Operations (B1–C2): <strong className="font-mono font-bold">{bandDistribution.coreOperationsTotal.toLocaleString()}</strong>
            </div>
            <div className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-medium">
              Total Organization (B1–E1): <strong className="font-mono font-bold">{bandDistribution.totalOrganization.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-3">
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">B1 Quality Analyst</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{bandDistribution.b1Qa.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500">Core Analyst</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">B2 Team Leader</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{bandDistribution.b2Tl.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500">Team Lead</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">C1 Asst Manager</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{bandDistribution.c1Am.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500">Operations Mgmt</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">C2 Manager</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{bandDistribution.c2Mgr.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500">QA Manager</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">D1 Director</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{bandDistribution.d1Director.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500">QA Director</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">D2 Sr Director</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{bandDistribution.d2SrDirector.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500">Sr Leadership</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">E1 Vice President</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">{bandDistribution.e1Vp.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500">Executive</span>
          </div>
        </div>
      </div>

      {/* 4. Historical Trends & Operational Trajectory */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Historical Operational Trends ({rangeContext.requestedPeriod})
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Monthly capacity, utilization, attrition, and commercial billing trajectory. Controlled by the global time selector.
            </p>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setTrendMetric('STAFFING')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                trendMetric === 'STAFFING'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staffing Capacity
            </button>
            <button
              onClick={() => setTrendMetric('UTILIZATION')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                trendMetric === 'UTILIZATION'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              QA Utilization (M011)
            </button>
            <button
              onClick={() => setTrendMetric('ATTRITION')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                trendMetric === 'ATTRITION'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              QA Attrition (M012)
            </button>
            <button
              onClick={() => setTrendMetric('BILLING')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                trendMetric === 'BILLING'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Billing Coverage
            </button>
          </div>
        </div>

        <div className="h-64 mt-3">
          {historicalTrends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No historical trend records available for selected scope.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {trendMetric === 'STAFFING' ? (
                <LineChart data={historicalTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="monthDisplay" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '6px', fontSize: '11px' }}
                    formatter={(val: any, name: string) => [val !== null ? `${Number(val).toLocaleString()} QA` : 'N/A', name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Line type="monotone" dataKey="actualQa" name="Actual QA Headcount" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="requiredQa" name="Required QA (SOW)" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} />
                </LineChart>
              ) : trendMetric === 'UTILIZATION' ? (
                <LineChart
                  data={historicalTrends.map((t) => ({
                    ...t,
                    utilPctFormatted: t.utilizationPct !== null ? Number((t.utilizationPct * 100).toFixed(1)) : null,
                    targetUtil: headline.utilization.targetValue !== null ? headline.utilization.targetValue * 100 : 90,
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="monthDisplay" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '6px', fontSize: '11px' }}
                    formatter={(val: any, name: string) => [val !== null ? `${val}%` : 'N/A', name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <ReferenceLine
                    y={headline.utilization.targetValue !== null ? headline.utilization.targetValue * 100 : 90}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: headline.utilization.targetDisplay ? `Target ${headline.utilization.targetDisplay}` : 'Target N/A',
                      fill: '#10b981',
                      fontSize: 10,
                      position: 'insideTopRight'
                    }}
                  />
                  <Line type="monotone" dataKey="utilPctFormatted" name="QA Utilization %" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              ) : trendMetric === 'ATTRITION' ? (
                <LineChart
                  data={historicalTrends.map((t) => ({
                    ...t,
                    attrPctFormatted: t.attritionPct !== null ? Number((t.attritionPct * 100).toFixed(1)) : null,
                    targetAttr: headline.attrition.targetValue !== null ? headline.attrition.targetValue * 100 : 10,
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="monthDisplay" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '6px', fontSize: '11px' }}
                    formatter={(val: any, name: string) => [val !== null ? `${val}%` : 'N/A', name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <ReferenceLine
                    y={headline.attrition.targetValue !== null ? headline.attrition.targetValue * 100 : 10}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{
                      value: headline.attrition.targetDisplay ? `Target ${headline.attrition.targetDisplay}` : 'Target N/A',
                      fill: '#10b981',
                      fontSize: 10,
                      position: 'insideTopRight'
                    }}
                  />
                  <Line type="monotone" dataKey="attrPctFormatted" name="QA Attrition Rate % (Annualized)" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              ) : (
                <LineChart
                  data={historicalTrends.map((t) => ({
                    ...t,
                    covPctFormatted: t.billingCoveragePct !== null ? Number((t.billingCoveragePct * 100).toFixed(1)) : null,
                    targetCov: 95,
                  }))}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="monthDisplay" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '6px', fontSize: '11px' }}
                    formatter={(val: any, name: string) => [val !== null ? `${val}%` : 'N/A', name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target 95%', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
                  <Line type="monotone" dataKey="covPctFormatted" name="Billing Coverage %" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 5. Site Operational Rollup Matrix */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="pb-2.5 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            Delivery Site Operational Rollup ({reportingContext.officialReportingMonth} Closed)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Factual delivery site rollups with weighted utilization, attrition, and commercial billing coverage. No synthetic composite status.
          </p>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Delivery Site</th>
                <th className="py-2.5 px-2 text-center">Accounts</th>
                <th className="py-2.5 px-2 text-right">Required (SOW)</th>
                <th className="py-2.5 px-2 text-right">Actual QA</th>
                <th className="py-2.5 px-2 text-right">Staffing Variance</th>
                <th className="py-2.5 px-3 text-right">M011 Utilization</th>
                <th className="py-2.5 px-3 text-right">M012 Attrition</th>
                <th className="py-2.5 px-3 text-right">Billing Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {siteRollup.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-slate-400 text-xs">
                    No site rollup data available for current scope.
                  </td>
                </tr>
              ) : (
                siteRollup.map((s: QaTeamSiteRollup) => (
                  <tr key={s.site} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {s.site}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-700 font-medium">
                      {s.accountCount}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                      {s.requiredHeadcount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                      {s.actualHeadcount.toLocaleString()}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-mono font-bold ${
                      s.variance > 0
                        ? 'text-emerald-700'
                        : s.variance < 0
                        ? 'text-rose-700'
                        : 'text-slate-700'
                    }`}>
                      {s.variance > 0 ? `+${s.variance}` : s.variance}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono text-slate-800">{s.utilizationDisplay}</span>
                        <StatusBadge status={s.utilizationRag} size="sm" />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono text-slate-800">{s.attritionDisplay}</span>
                        <StatusBadge status={s.attritionRag} size="sm" />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono text-slate-800">{s.billingCoverageDisplay}</span>
                        <StatusBadge status={s.billingRag} size="sm" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Account Operational Register & Filterable Table */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              Account Operating Register & Headcount Roster
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Clear distinction between <strong className="text-slate-700">{reportingContext.officialReportingMonth} Closed Operational Snapshot</strong> and <strong className="text-slate-700">Current Live Organization Roster</strong>.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search account, leader, site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {/* Factual Table Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 mt-3 pb-2 border-b border-slate-100 text-xs">
          <button
            onClick={() => setTableFilter('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              tableFilter === 'ALL'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Accounts
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              tableFilter === 'ALL' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
            }`}>
              {filterCounts.all}
            </span>
          </button>

          <button
            onClick={() => setTableFilter('UNDER_REQUIREMENT')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              tableFilter === 'UNDER_REQUIREMENT'
                ? 'bg-rose-700 text-white font-bold'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Under Requirement
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              tableFilter === 'UNDER_REQUIREMENT' ? 'bg-rose-800 text-rose-100' : 'bg-rose-200 text-rose-900'
            }`}>
              {filterCounts.under}
            </span>
          </button>

          <button
            onClick={() => setTableFilter('OVER_REQUIREMENT')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              tableFilter === 'OVER_REQUIREMENT'
                ? 'bg-emerald-700 text-white font-bold'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Over Requirement
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              tableFilter === 'OVER_REQUIREMENT' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-200 text-emerald-900'
            }`}>
              {filterCounts.over}
            </span>
          </button>

          <button
            onClick={() => setTableFilter('EXACTLY_STAFFED')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              tableFilter === 'EXACTLY_STAFFED'
                ? 'bg-blue-700 text-white font-bold'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Exactly Staffed
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              tableFilter === 'EXACTLY_STAFFED' ? 'bg-blue-800 text-blue-100' : 'bg-blue-200 text-blue-900'
            }`}>
              {filterCounts.exact}
            </span>
          </button>

          <button
            onClick={() => setTableFilter('UTILIZATION_RED')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              tableFilter === 'UTILIZATION_RED'
                ? 'bg-amber-700 text-white font-bold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Utilization Red (&lt;85%)
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              tableFilter === 'UTILIZATION_RED' ? 'bg-amber-800 text-amber-100' : 'bg-amber-200 text-amber-900'
            }`}>
              {filterCounts.utilRed}
            </span>
          </button>

          <button
            onClick={() => setTableFilter('ATTRITION_RED')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              tableFilter === 'ATTRITION_RED'
                ? 'bg-rose-700 text-white font-bold'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Attrition Red (&gt;15%)
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              tableFilter === 'ATTRITION_RED' ? 'bg-rose-800 text-rose-100' : 'bg-rose-200 text-rose-900'
            }`}>
              {filterCounts.attrRed}
            </span>
          </button>

          <button
            onClick={() => setTableFilter('BILLING_BELOW_STANDARD')}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              tableFilter === 'BILLING_BELOW_STANDARD'
                ? 'bg-purple-700 text-white font-bold'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            Billing Below Standard
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              tableFilter === 'BILLING_BELOW_STANDARD' ? 'bg-purple-800 text-purple-100' : 'bg-purple-200 text-purple-900'
            }`}>
              {filterCounts.billBelowStandard}
            </span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 cursor-pointer select-none" onClick={() => handleSort('accountName')}>
                  Account / Leader
                </th>
                <th className="py-2.5 px-2 cursor-pointer select-none" onClick={() => handleSort('vertical')}>
                  Vertical
                </th>
                <th className="py-2.5 px-2 cursor-pointer select-none" onClick={() => handleSort('site')}>
                  Site
                </th>
                {/* Closed Operating Snapshot Section */}
                <th className="py-2.5 px-2 text-right bg-blue-50/40 text-blue-900 cursor-pointer select-none" onClick={() => handleSort('requiredQa')}>
                  Req QA
                </th>
                <th className="py-2.5 px-2 text-right bg-blue-50/40 text-blue-900 cursor-pointer select-none" onClick={() => handleSort('actualQa')}>
                  Actual QA
                </th>
                <th className="py-2.5 px-2 text-right bg-blue-50/40 text-blue-900 cursor-pointer select-none" onClick={() => handleSort('staffingVariance')}>
                  Variance
                </th>
                <th className="py-2.5 px-2 text-center bg-blue-50/40 text-blue-900">
                  Staffing RAG
                </th>
                <th className="py-2.5 px-2 text-right bg-blue-50/40 text-blue-900 cursor-pointer select-none" onClick={() => handleSort('utilizationPct')}>
                  M011 Util
                </th>
                <th className="py-2.5 px-2 text-right bg-blue-50/40 text-blue-900 cursor-pointer select-none" onClick={() => handleSort('attritionPct')}>
                  M012 Attr
                </th>
                <th className="py-2.5 px-2 text-right bg-blue-50/40 text-blue-900 cursor-pointer select-none" onClick={() => handleSort('billingCoveragePct')}>
                  Billing
                </th>
                {/* Current Roster Section */}
                <th className="py-2.5 px-3 text-center bg-slate-100/70 text-slate-800 cursor-pointer select-none" onClick={() => handleSort('mappedQa')}>
                  Live Mapped QA
                </th>
                <th className="py-2.5 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRegisterRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 text-xs">
                    No accounts matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                displayedRegisterRows.map((row: QaTeamAccountRegisterRow) => (
                  <tr key={row.accountId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <button
                          onClick={() => selectAccountAndNavigate(row.accountId)}
                          className="hover:underline text-left text-blue-700 hover:text-blue-900 font-semibold"
                        >
                          {row.accountName}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">({row.accountId})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        QA Leader: <span className="text-slate-700 font-medium">{row.qaLeader}</span> • Sr Dir: <span className="text-slate-700">{row.srDirector}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-700 font-medium">
                      {row.vertical}
                    </td>
                    <td className="py-2.5 px-2 text-slate-600">
                      {row.site}
                    </td>
                    {/* Operational Snapshot Data */}
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600 bg-blue-50/20">
                      {row.requiredQa !== null ? row.requiredQa.toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 bg-blue-50/20">
                      {row.actualQa !== null ? row.actualQa.toLocaleString() : 'N/A'}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-mono font-bold bg-blue-50/20 ${
                      row.staffingVariance !== null
                        ? row.staffingVariance > 0
                          ? 'text-emerald-700'
                          : row.staffingVariance < 0
                          ? 'text-rose-700'
                          : 'text-slate-700'
                        : 'text-slate-400'
                    }`}>
                      {row.staffingVariance !== null ? (row.staffingVariance > 0 ? `+${row.staffingVariance}` : row.staffingVariance) : 'N/A'}
                    </td>
                    <td className="py-2.5 px-2 text-center bg-blue-50/20">
                      <StatusBadge status={row.staffingRag} size="sm" />
                    </td>
                    <td className="py-2.5 px-2 text-right bg-blue-50/20">
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-mono text-slate-800">{row.utilizationDisplay}</span>
                        <StatusBadge status={row.utilizationRag} size="sm" />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right bg-blue-50/20">
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-mono text-slate-800">{row.attritionDisplay}</span>
                        <StatusBadge status={row.attritionRag} size="sm" />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right bg-blue-50/20">
                      <div className="flex items-center justify-end gap-1">
                        <span className="font-mono text-slate-800">{row.billingCoverageDisplay}</span>
                        <StatusBadge status={row.billingRag} size="sm" />
                      </div>
                    </td>
                    {/* Live Roster Data */}
                    <td className="py-2.5 px-3 text-center bg-slate-100/40">
                      <div className="font-mono font-bold text-slate-900">
                        {row.mappedQa}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        B1:{row.b1Count} B2:{row.b2Count} C1:{row.c1Count} C2:{row.c2Count}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => selectAccountAndNavigate(row.accountId)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer"
                        title="View Account 360 Diagnostic"
                      >
                        <span>360</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{displayedRegisterRows.length}</strong> of <strong className="text-slate-800">{data.accountRegister.length}</strong> accounts
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Closed Operating: {reportingContext.officialReportingMonth}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Current Organization Snapshot
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
