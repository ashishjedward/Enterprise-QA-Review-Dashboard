import React, { useState, useEffect, useMemo } from 'react';
import { 
  ListChecks, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Filter, 
  Search,
  ChevronRight, 
  ArrowLeft, 
  Calendar, 
  UserCheck,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  Building2,
  FileText,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { useFilters } from '../context/FilterContext';
import { getActionsDiagnostic } from '../services/api';
import { 
  ActionsDiagnosticData, 
  ActionRegisterRow, 
  ActionsAccountRollupRow 
} from '../types/api';

type TabView = 'REGISTER' | 'AGEING_DISTRIBUTION' | 'PERIOD_ACTIVITY' | 'ACCOUNT_ROLLUP';
type StatusPillFilter = 'ALL' | 'OVERDUE' | 'DUE_SOON' | 'ON_TRACK' | 'CLOSED' | 'HIGH_CRITICAL';

export const ActionsPage: React.FC = () => {
  const { 
    filters, 
    navigateToPage, 
    selectAccountAndNavigate,
    resetFilters 
  } = useFilters();

  const [data, setData] = useState<ActionsDiagnosticData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabView>('REGISTER');
  const [statusFilter, setStatusFilter] = useState<StatusPillFilter>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [sortField, setSortField] = useState<keyof ActionRegisterRow>('currentAgeingDays');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const [rollupSortField, setRollupSortField] = useState<keyof ActionsAccountRollupRow>('openActions');
  const [rollupSortAsc, setRollupSortAsc] = useState<boolean>(false);

  const loadData = () => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getActionsDiagnostic({
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
        setError(err?.message || 'Failed to load Actions Diagnostic data.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [
    filters.timePeriod,
    filters.vertical,
    filters.qaLeader,
    filters.srDirector,
    filters.account,
    filters.site,
    filters.lob,
  ]);

  const backlog = data?.currentBacklog;
  const reportingContext = data?.reportingContext;
  const scopeSummary = data?.scopeSummary;

  // Filter and sort action register
  const filteredRegister = useMemo(() => {
    if (!data?.actionRegister) return [];

    return data.actionRegister
      .filter((item) => {
        // Status filter
        if (statusFilter === 'OVERDUE' && !item.overdueFlag) return false;
        if (
          statusFilter === 'DUE_SOON' &&
          !(
            item.asOfTodayStatus === 'OPEN' &&
            !item.overdueFlag &&
            item.dueDate &&
            item.dueDate <=
              new Date(
                new Date(reportingContext?.currentDate || '2026-08-30').getTime() +
                  7 * 24 * 60 * 60 * 1000
              )
                .toISOString()
                .split('T')[0]
          )
        ) {
          return false;
        }
        if (
          statusFilter === 'ON_TRACK' &&
          !(
            item.asOfTodayStatus === 'OPEN' &&
            !item.overdueFlag &&
            (!item.dueDate ||
              item.dueDate >
                new Date(
                  new Date(reportingContext?.currentDate || '2026-08-30').getTime() +
                    7 * 24 * 60 * 60 * 1000
                )
                  .toISOString()
                  .split('T')[0])
          )
        ) {
          return false;
        }
        if (statusFilter === 'CLOSED' && item.asOfTodayStatus !== 'CLOSED') return false;
        if (
          statusFilter === 'HIGH_CRITICAL' &&
          !(
            item.asOfTodayStatus === 'OPEN' &&
            (item.priority === 'Critical' || item.priority === 'High' || item.isHighPriority)
          )
        ) {
          return false;
        }

        // Priority filter
        if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;

        // Source filter
        if (sourceFilter !== 'ALL' && item.source !== sourceFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchAccount = item.accountName.toLowerCase().includes(q);
          const matchAction = item.action.toLowerCase().includes(q);
          const matchOwner = item.owner.toLowerCase().includes(q);
          const matchSource = item.source.toLowerCase().includes(q);
          const matchRisk = item.riskType.toLowerCase().includes(q);
          const matchId = item.actionId.toLowerCase().includes(q);
          if (!matchAccount && !matchAction && !matchOwner && !matchSource && !matchRisk && !matchId) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortAsc ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          return sortAsc ? (aVal === bVal ? 0 : aVal ? 1 : -1) : aVal === bVal ? 0 : aVal ? -1 : 1;
        }
        return 0;
      });
  }, [data?.actionRegister, statusFilter, priorityFilter, sourceFilter, searchQuery, sortField, sortAsc, reportingContext]);

  // Sort account rollup
  const sortedRollup = useMemo(() => {
    if (!data?.accountRollup) return [];

    return [...data.accountRollup].sort((a, b) => {
      let aVal = a[rollupSortField];
      let bVal = b[rollupSortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return rollupSortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return rollupSortAsc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [data?.accountRollup, rollupSortField, rollupSortAsc]);

  const handleSort = (field: keyof ActionRegisterRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleRollupSort = (field: keyof ActionsAccountRollupRow) => {
    if (rollupSortField === field) {
      setRollupSortAsc(!rollupSortAsc);
    } else {
      setRollupSortField(field);
      setRollupSortAsc(false);
    }
  };

  // Ageing Distribution Chart Data
  const ageingChartData = useMemo(() => {
    if (!data?.ageingDistribution) return [];
    return [
      { name: '0-7 Days', count: data.ageingDistribution.range0To7Days, color: '#10b981' },
      { name: '8-15 Days', count: data.ageingDistribution.range8To15Days, color: '#38bdf8' },
      { name: '16-30 Days', count: data.ageingDistribution.range16To30Days, color: '#f59e0b' },
      { name: '31-60 Days', count: data.ageingDistribution.range31To60Days, color: '#f97316' },
      { name: '60+ Days', count: data.ageingDistribution.range60PlusDays, color: '#ef4444' },
    ];
  }, [data?.ageingDistribution]);

  // Unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    if (!data?.sourceDistribution) return [];
    return data.sourceDistribution.map((s) => s.category);
  }, [data?.sourceDistribution]);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigateToPage('overview')}
            className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            Enterprise
          </button>
          <span>&gt;</span>
          <span className="font-bold text-slate-900">Action &amp; Closure Management</span>
          {reportingContext && (
            <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600">
              <Calendar className="w-3 h-3 text-slate-400" />
              As of {reportingContext.currentDate} (IST)
            </span>
          )}
          {filters.vertical && filters.vertical !== 'ALL' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-semibold text-sky-700">
              Vertical: {filters.vertical}
            </span>
          )}
          {filters.account && filters.account !== 'ALL' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-semibold text-indigo-700">
              Account: {filters.account}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            title="Refresh live data"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => navigateToPage('overview')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">Loading Actions Diagnostic Telemetry...</h3>
          <p className="text-xs text-slate-500 mt-1">
            Reconstructing live as-of-date event lifecycle from BigQuery semantic views.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-rose-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Failed to load Actions Diagnostic data</h3>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => loadData()}
            className="mt-4 px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Top KPI Ribbon (Interactive) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {/* Total Backlog */}
            <div
              onClick={() => {
                setStatusFilter('ALL');
                setActiveTab('REGISTER');
              }}
              className={`p-3 rounded-md border cursor-pointer transition-all flex flex-col justify-between ${
                statusFilter === 'ALL' && activeTab === 'REGISTER'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold">Total Backlog</span>
                <ListChecks className="w-3.5 h-3.5 opacity-60" />
              </div>
              <div className="text-2xl font-black font-mono mt-1">{backlog?.openActions ?? 0}</div>
              <div className="text-[10px] opacity-75 mt-1 flex items-center justify-between">
                <span>{backlog?.eligibleActionCount ?? 0} total eligible</span>
                {backlog?.futureActionCount ? (
                  <span className="text-amber-400 font-medium">({backlog.futureActionCount} fut.)</span>
                ) : null}
              </div>
            </div>

            {/* Overdue Actions */}
            <div
              onClick={() => {
                setStatusFilter('OVERDUE');
                setActiveTab('REGISTER');
              }}
              className={`p-3 rounded-md border cursor-pointer transition-all flex flex-col justify-between ${
                statusFilter === 'OVERDUE' && activeTab === 'REGISTER'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-white border-rose-200 bg-rose-50/20 hover:bg-rose-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold ${
                    statusFilter === 'OVERDUE' && activeTab === 'REGISTER' ? 'text-white' : 'text-rose-800'
                  }`}
                >
                  Overdue
                </span>
                <AlertCircle
                  className={`w-3.5 h-3.5 ${
                    statusFilter === 'OVERDUE' && activeTab === 'REGISTER' ? 'text-white' : 'text-rose-600'
                  }`}
                />
              </div>
              <div
                className={`text-2xl font-black font-mono mt-1 ${
                  statusFilter === 'OVERDUE' && activeTab === 'REGISTER' ? 'text-white' : 'text-rose-900'
                }`}
              >
                {backlog?.overdueActions ?? 0}
              </div>
              <span
                className={`text-[10px] ${
                  statusFilter === 'OVERDUE' && activeTab === 'REGISTER' ? 'text-rose-100' : 'text-rose-700'
                }`}
              >
                Immediate intervention
              </span>
            </div>

            {/* Due Next 7 Days */}
            <div
              onClick={() => {
                setStatusFilter('DUE_SOON');
                setActiveTab('REGISTER');
              }}
              className={`p-3 rounded-md border cursor-pointer transition-all flex flex-col justify-between ${
                statusFilter === 'DUE_SOON' && activeTab === 'REGISTER'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white border-amber-200 bg-amber-50/20 hover:bg-amber-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold ${
                    statusFilter === 'DUE_SOON' && activeTab === 'REGISTER' ? 'text-white' : 'text-amber-800'
                  }`}
                >
                  Due Next 7d
                </span>
                <Clock
                  className={`w-3.5 h-3.5 ${
                    statusFilter === 'DUE_SOON' && activeTab === 'REGISTER' ? 'text-white' : 'text-amber-600'
                  }`}
                />
              </div>
              <div
                className={`text-2xl font-black font-mono mt-1 ${
                  statusFilter === 'DUE_SOON' && activeTab === 'REGISTER' ? 'text-white' : 'text-amber-900'
                }`}
              >
                {backlog?.dueNext7Days ?? 0}
              </div>
              <span
                className={`text-[10px] ${
                  statusFilter === 'DUE_SOON' && activeTab === 'REGISTER' ? 'text-amber-100' : 'text-amber-700'
                }`}
              >
                Urgent delivery window
              </span>
            </div>

            {/* On-Track Open */}
            <div
              onClick={() => {
                setStatusFilter('ON_TRACK');
                setActiveTab('REGISTER');
              }}
              className={`p-3 rounded-md border cursor-pointer transition-all flex flex-col justify-between ${
                statusFilter === 'ON_TRACK' && activeTab === 'REGISTER'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-semibold ${
                    statusFilter === 'ON_TRACK' && activeTab === 'REGISTER' ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  On-Track Open
                </span>
                <Activity className="w-3.5 h-3.5 opacity-60" />
              </div>
              <div
                className={`text-2xl font-black font-mono mt-1 ${
                  statusFilter === 'ON_TRACK' && activeTab === 'REGISTER' ? 'text-white' : 'text-slate-900'
                }`}
              >
                {backlog?.onTrackOpen ?? 0}
              </div>
              <span
                className={`text-[10px] ${
                  statusFilter === 'ON_TRACK' && activeTab === 'REGISTER' ? 'text-sky-100' : 'text-slate-500'
                }`}
              >
                Within schedule timeline
              </span>
            </div>

            {/* High & Critical */}
            <div
              onClick={() => {
                setStatusFilter('HIGH_CRITICAL');
                setActiveTab('REGISTER');
              }}
              className={`p-3 rounded-md border cursor-pointer transition-all flex flex-col justify-between ${
                statusFilter === 'HIGH_CRITICAL' && activeTab === 'REGISTER'
                  ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                  : 'bg-white border-purple-200 bg-purple-50/20 hover:bg-purple-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold ${
                    statusFilter === 'HIGH_CRITICAL' && activeTab === 'REGISTER' ? 'text-white' : 'text-purple-900'
                  }`}
                >
                  High / Critical
                </span>
                <ShieldAlert
                  className={`w-3.5 h-3.5 ${
                    statusFilter === 'HIGH_CRITICAL' && activeTab === 'REGISTER' ? 'text-white' : 'text-purple-600'
                  }`}
                />
              </div>
              <div
                className={`text-2xl font-black font-mono mt-1 ${
                  statusFilter === 'HIGH_CRITICAL' && activeTab === 'REGISTER' ? 'text-white' : 'text-purple-950'
                }`}
              >
                {backlog?.highCriticalOpen ?? 0}
              </div>
              <span
                className={`text-[10px] ${
                  statusFilter === 'HIGH_CRITICAL' && activeTab === 'REGISTER' ? 'text-purple-100' : 'text-purple-700'
                }`}
              >
                {backlog?.criticalOpen ?? 0} crit, {backlog?.highOpen ?? 0} high
              </span>
            </div>

            {/* Closure Rate */}
            <div
              onClick={() => {
                setStatusFilter('CLOSED');
                setActiveTab('REGISTER');
              }}
              className={`p-3 rounded-md border cursor-pointer transition-all flex flex-col justify-between ${
                statusFilter === 'CLOSED' && activeTab === 'REGISTER'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-white border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold ${
                    statusFilter === 'CLOSED' && activeTab === 'REGISTER' ? 'text-white' : 'text-emerald-900'
                  }`}
                >
                  Closure Rate
                </span>
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    statusFilter === 'CLOSED' && activeTab === 'REGISTER' ? 'text-white' : 'text-emerald-600'
                  }`}
                />
              </div>
              <div
                className={`text-2xl font-black font-mono mt-1 ${
                  statusFilter === 'CLOSED' && activeTab === 'REGISTER' ? 'text-white' : 'text-emerald-950'
                }`}
              >
                {backlog?.closureRateDisplay ?? 'N/A'}
              </div>
              <span
                className={`text-[10px] ${
                  statusFilter === 'CLOSED' && activeTab === 'REGISTER' ? 'text-emerald-100' : 'text-emerald-700'
                }`}
              >
                {backlog?.closedActions ?? 0} closed / matured
              </span>
            </div>

            {/* Open Ageing */}
            <div
              onClick={() => {
                setActiveTab('AGEING_DISTRIBUTION');
              }}
              className={`p-3 rounded-md border cursor-pointer transition-all flex flex-col justify-between ${
                activeTab === 'AGEING_DISTRIBUTION'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold">Avg Ageing</span>
                <TrendingUp className="w-3.5 h-3.5 opacity-60" />
              </div>
              <div className="text-2xl font-black font-mono mt-1">
                {backlog?.averageOpenAgeingDays !== null ? `${backlog?.averageOpenAgeingDays}d` : 'N/A'}
              </div>
              <span className="text-[10px] opacity-75 mt-1">
                Oldest: {backlog?.oldestOpenAgeingDays !== null ? `${backlog?.oldestOpenAgeingDays}d` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pt-1 pb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('REGISTER')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'REGISTER'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Action Register ({filteredRegister.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('AGEING_DISTRIBUTION')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'AGEING_DISTRIBUTION'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Ageing &amp; Distribution</span>
              </button>

              <button
                onClick={() => setActiveTab('PERIOD_ACTIVITY')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'PERIOD_ACTIVITY'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Period Activity &amp; Net Flow</span>
              </button>

              <button
                onClick={() => setActiveTab('ACCOUNT_ROLLUP')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'ACCOUNT_ROLLUP'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Account Rollup ({data.accountRollup.length})</span>
              </button>
            </div>

            {/* Scope Summary Badge */}
            {scopeSummary && (
              <div className="text-[11px] text-slate-500 font-medium hidden md:flex items-center gap-3">
                <span>
                  <strong>{scopeSummary.totalAccountsInScope}</strong> accounts in scope
                </span>
                <span>•</span>
                <span>
                  <strong>{scopeSummary.accountsWithOpenActions}</strong> with open actions
                </span>
                <span>•</span>
                <span>
                  <strong>{scopeSummary.accountsWithOverdueActions}</strong> with overdue
                </span>
              </div>
            )}
          </div>

          {/* TAB 1: ACTION REGISTER */}
          {activeTab === 'REGISTER' && (
            <div className="space-y-3">
              {/* Filter and Search Toolbar */}
              <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Pills */}
                  <span className="text-xs font-semibold text-slate-500 mr-0.5">Status:</span>
                  {(
                    [
                      { key: 'ALL', label: 'All' },
                      { key: 'OVERDUE', label: 'Overdue' },
                      { key: 'DUE_SOON', label: 'Due Next 7d' },
                      { key: 'ON_TRACK', label: 'On-Track' },
                      { key: 'HIGH_CRITICAL', label: 'High/Crit' },
                      { key: 'CLOSED', label: 'Closed' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.key}
                      onClick={() => setStatusFilter(st.key)}
                      className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
                        statusFilter === st.key
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}

                  <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                  {/* Priority Select */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>

                  {/* Source Select */}
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="ALL">All Sources</option>
                    {uniqueSources.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative min-w-[260px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search account, action, owner, source..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Action Register Table */}
              <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-[700px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10 shadow-xs">
                      <tr className="border-b border-slate-200 text-slate-600 font-semibold select-none">
                        <th
                          onClick={() => handleSort('accountName')}
                          className="py-2.5 px-3 cursor-pointer hover:text-slate-900"
                        >
                          Account {sortField === 'accountName' && (sortAsc ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('actionId')}
                          className="py-2.5 px-2 cursor-pointer hover:text-slate-900"
                        >
                          Action ID {sortField === 'actionId' && (sortAsc ? '↑' : '↓')}
                        </th>
                        <th className="py-2.5 px-3 min-w-[280px]">Action Item &amp; Details</th>
                        <th
                          onClick={() => handleSort('owner')}
                          className="py-2.5 px-2 cursor-pointer hover:text-slate-900"
                        >
                          Owner {sortField === 'owner' && (sortAsc ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('source')}
                          className="py-2.5 px-2 cursor-pointer hover:text-slate-900"
                        >
                          Source {sortField === 'source' && (sortAsc ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('priority')}
                          className="py-2.5 px-2 cursor-pointer hover:text-slate-900 text-center"
                        >
                          Priority {sortField === 'priority' && (sortAsc ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('asOfTodayStatus')}
                          className="py-2.5 px-2 cursor-pointer hover:text-slate-900 text-center"
                        >
                          Status {sortField === 'asOfTodayStatus' && (sortAsc ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('openDate')}
                          className="py-2.5 px-2 cursor-pointer hover:text-slate-900 font-mono text-center"
                        >
                          Open Date {sortField === 'openDate' && (sortAsc ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('dueDate')}
                          className="py-2.5 px-2 cursor-pointer hover:text-slate-900 font-mono text-center"
                        >
                          Due Date {sortField === 'dueDate' && (sortAsc ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('currentAgeingDays')}
                          className="py-2.5 px-2 cursor-pointer hover:text-slate-900 font-mono text-right"
                        >
                          Ageing {sortField === 'currentAgeingDays' && (sortAsc ? '↑' : '↓')}
                        </th>
                        <th className="py-2.5 px-2 text-center">Effectiveness</th>
                        <th className="py-2.5 px-2 text-right">Drilldown</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRegister.map((act) => {
                        const isOverdue = act.overdueFlag;
                        const isFuture = act.asOfTodayStatus === 'FUTURE';
                        const isClosed = act.asOfTodayStatus === 'CLOSED';

                        return (
                          <tr
                            key={act.actionId}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isOverdue ? 'bg-rose-50/30' : isFuture ? 'bg-amber-50/20' : ''
                            }`}
                          >
                            {/* Account Name */}
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => selectAccountAndNavigate(act.accountId)}
                                className="font-bold text-slate-900 hover:text-sky-700 text-left cursor-pointer flex items-center gap-1"
                              >
                                <span>{act.accountName}</span>
                              </button>
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                {act.vertical} • {act.qaLeader || act.site}
                              </div>
                            </td>

                            {/* Action ID */}
                            <td className="py-2.5 px-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              {act.actionId}
                            </td>

                            {/* Action Text */}
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-slate-900 leading-snug">{act.action}</div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                  {act.riskType}
                                </span>
                                {act.evidence && (
                                  <span className="text-slate-400 italic truncate max-w-[250px]" title={act.evidence}>
                                    Ev: {act.evidence}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Owner */}
                            <td className="py-2.5 px-2 whitespace-nowrap">
                              <div className="font-semibold text-slate-900">{act.owner}</div>
                            </td>

                            {/* Source */}
                            <td className="py-2.5 px-2 whitespace-nowrap text-slate-600 text-[11px]">
                              {act.source}
                            </td>

                            {/* Priority */}
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  act.priority === 'Critical'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : act.priority === 'High'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {act.priority}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              {isFuture ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Future Dated
                                </span>
                              ) : isClosed ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Closed
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                                  Overdue
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                  Open
                                </span>
                              )}
                            </td>

                            {/* Open Date */}
                            <td className="py-2.5 px-2 font-mono text-[11px] text-slate-600 text-center whitespace-nowrap">
                              {act.openDate}
                            </td>

                            {/* Due Date */}
                            <td className="py-2.5 px-2 font-mono text-[11px] text-center whitespace-nowrap">
                              <span className={isOverdue ? 'font-bold text-rose-700' : 'text-slate-600'}>
                                {act.dueDate}
                              </span>
                            </td>

                            {/* Ageing */}
                            <td className="py-2.5 px-2 font-mono text-right whitespace-nowrap">
                              {act.asOfTodayStatus === 'OPEN' && act.currentAgeingDays !== null ? (
                                <span
                                  className={`font-bold ${
                                    act.currentAgeingDays > 60
                                      ? 'text-rose-700'
                                      : act.currentAgeingDays > 30
                                      ? 'text-amber-700'
                                      : 'text-slate-800'
                                  }`}
                                >
                                  {act.currentAgeingDays}d
                                </span>
                              ) : act.asOfTodayStatus === 'CLOSED' && act.closureDurationDays !== null ? (
                                <span className="text-slate-400 text-[11px]">
                                  {act.closureDurationDays}d closed
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Closure Effectiveness */}
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              {act.closureEffectiveness !== null ? (
                                <span className="font-mono font-semibold text-[11px] text-emerald-700">
                                  {(act.closureEffectiveness * 100).toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>

                            {/* Drilldown */}
                            <td className="py-2.5 px-2 text-right whitespace-nowrap">
                              <button
                                onClick={() => selectAccountAndNavigate(act.accountId)}
                                className="text-sky-700 font-semibold text-[11px] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>360</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredRegister.length === 0 && (
                        <tr>
                          <td colSpan={12} className="py-12 text-center text-slate-400">
                            <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="font-semibold">No action items match the selected filter criteria.</p>
                            <button
                              onClick={() => {
                                setStatusFilter('ALL');
                                setPriorityFilter('ALL');
                                setSourceFilter('ALL');
                                setSearchQuery('');
                              }}
                              className="mt-2 text-sky-600 font-semibold hover:underline text-xs"
                            >
                              Reset filters
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AGEING & DISTRIBUTION ANALYSIS */}
          {activeTab === 'AGEING_DISTRIBUTION' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ageing Distribution Card */}
                <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Open Action Ageing Profile</h3>
                      <p className="text-[11px] text-slate-500">
                        Distribution of active open actions by days elapsed since Open_Date
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        Avg: {backlog?.averageOpenAgeingDays ?? 0}d
                      </span>
                    </div>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip
                          formatter={(val: number) => [`${val} actions`, 'Count']}
                          contentStyle={{ fontSize: '12px', borderRadius: '4px' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {ageingChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mt-2 pt-2 border-t border-slate-100 text-center">
                    {ageingChartData.map((d) => (
                      <div key={d.name} className="p-1 rounded bg-slate-50">
                        <div className="text-[10px] text-slate-500">{d.name}</div>
                        <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">{d.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Breakdown Card */}
                <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Action Distribution by Priority</h3>
                      <p className="text-[11px] text-slate-500">Open vs Closed volume across priority tiers</p>
                    </div>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.priorityDistribution}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip
                          formatter={(val: number, name: string) => [`${val} actions`, name]}
                          contentStyle={{ fontSize: '12px', borderRadius: '4px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="open" name="Open Backlog" fill="#0284c7" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="closed" name="Closed" fill="#10b981" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100">
                    {data.priorityDistribution.map((p) => (
                      <div key={p.category} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{p.category} Priority</span>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-sky-700 font-bold">{p.open} open</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-emerald-700">{p.closed} closed</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-500">{p.total} total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Source Distribution Card */}
              <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Action Origins &amp; Risk Driver Sources</h3>
                    <p className="text-[11px] text-slate-500">
                      Breakdown of action volume generated across governance channels
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {data.sourceDistribution.map((src) => {
                    const openPct = src.total > 0 ? (src.open / src.total) * 100 : 0;
                    return (
                      <div
                        key={src.category}
                        onClick={() => {
                          setSourceFilter(src.category);
                          setActiveTab('REGISTER');
                        }}
                        className="p-3 rounded border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 truncate">{src.category}</span>
                          <span className="text-xs font-mono font-bold text-slate-700">{src.total}</span>
                        </div>

                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden flex">
                          <div className="bg-sky-600 h-full" style={{ width: `${openPct}%` }} />
                          <div className="bg-emerald-600 h-full" style={{ width: `${100 - openPct}%` }} />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                          <span className="text-sky-700 font-semibold">{src.open} open</span>
                          <span className="text-emerald-700 font-semibold">{src.closed} closed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERIOD EVENT ACTIVITY & NET FLOW */}
          {activeTab === 'PERIOD_ACTIVITY' && (
            <div className="space-y-4">
              {/* Period Headline Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Actions Opened in Period</span>
                  <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                    {data.selectedPeriodActivity.actionsOpened}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {reportingContext?.periodStartDate} to {reportingContext?.periodEndDate}
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Actions Closed in Period</span>
                  <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
                    {data.selectedPeriodActivity.actionsClosed}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Verified closures completed within window
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Net Flow (Opened − Closed)</span>
                  <div
                    className={`text-2xl font-black font-mono mt-1 ${
                      data.selectedPeriodActivity.netFlow > 0
                        ? 'text-amber-700'
                        : data.selectedPeriodActivity.netFlow < 0
                        ? 'text-emerald-700'
                        : 'text-slate-900'
                    }`}
                  >
                    {data.selectedPeriodActivity.netFlow > 0
                      ? `+${data.selectedPeriodActivity.netFlow}`
                      : data.selectedPeriodActivity.netFlow}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {data.selectedPeriodActivity.netFlow > 0
                      ? 'Backlog accumulation rate'
                      : 'Backlog drawdown rate'}
                  </span>
                </div>
              </div>

              {/* Monthly Historical Activity Chart */}
              <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Monthly Action Velocity &amp; Closure Trend</h3>
                    <p className="text-[11px] text-slate-500">
                      Actions opened vs closed per monthly period interval
                    </p>
                  </div>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.selectedPeriodActivity.historicalActivity}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(val: number, name: string) => [`${val} actions`, name]}
                        contentStyle={{ fontSize: '12px', borderRadius: '4px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="actionsOpened" name="Opened" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="actionsClosed" name="Closed" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table Breakdown of Monthly History */}
                <div className="overflow-x-auto mt-4 pt-4 border-t border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-2 px-3">Month</th>
                        <th className="py-2 px-3 text-right font-mono">Actions Opened</th>
                        <th className="py-2 px-3 text-right font-mono">Actions Closed</th>
                        <th className="py-2 px-3 text-right font-mono">Net Flow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.selectedPeriodActivity.historicalActivity.map((m) => (
                        <tr key={m.monthKey} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-900">{m.monthLabel}</td>
                          <td className="py-2 px-3 text-right font-mono text-sky-700 font-semibold">
                            {m.actionsOpened}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">
                            {m.actionsClosed}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            <span
                              className={
                                m.netFlow > 0
                                  ? 'text-amber-700'
                                  : m.netFlow < 0
                                  ? 'text-emerald-700'
                                  : 'text-slate-500'
                              }
                            >
                              {m.netFlow > 0 ? `+${m.netFlow}` : m.netFlow}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT ROLLUP */}
          {activeTab === 'ACCOUNT_ROLLUP' && (
            <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
              <div className="overflow-x-auto max-h-[700px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 z-10 shadow-xs">
                    <tr className="border-b border-slate-200 text-slate-600 font-semibold select-none">
                      <th
                        onClick={() => handleRollupSort('accountName')}
                        className="py-2.5 px-3 cursor-pointer hover:text-slate-900"
                      >
                        Account {rollupSortField === 'accountName' && (rollupSortAsc ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleRollupSort('vertical')}
                        className="py-2.5 px-2 cursor-pointer hover:text-slate-900"
                      >
                        Vertical {rollupSortField === 'vertical' && (rollupSortAsc ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleRollupSort('qaLeader')}
                        className="py-2.5 px-2 cursor-pointer hover:text-slate-900"
                      >
                        QA Leader {rollupSortField === 'qaLeader' && (rollupSortAsc ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleRollupSort('totalActions')}
                        className="py-2.5 px-2 cursor-pointer hover:text-slate-900 text-right font-mono"
                      >
                        Total {rollupSortField === 'totalActions' && (rollupSortAsc ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleRollupSort('openActions')}
                        className="py-2.5 px-2 cursor-pointer hover:text-slate-900 text-right font-mono"
                      >
                        Open Backlog {rollupSortField === 'openActions' && (rollupSortAsc ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleRollupSort('overdueActions')}
                        className="py-2.5 px-2 cursor-pointer hover:text-slate-900 text-right font-mono"
                      >
                        Overdue {rollupSortField === 'overdueActions' && (rollupSortAsc ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleRollupSort('dueNext7Days')}
                        className="py-2.5 px-2 cursor-pointer hover:text-slate-900 text-right font-mono"
                      >
                        Due 7d {rollupSortField === 'dueNext7Days' && (rollupSortAsc ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleRollupSort('highCriticalOpen')}
                        className="py-2.5 px-2 cursor-pointer hover:text-slate-900 text-right font-mono"
                      >
                        High/Crit {rollupSortField === 'highCriticalOpen' && (rollupSortAsc ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleRollupSort('closedActions')}
                        className="py-2.5 px-2 cursor-pointer hover:text-slate-900 text-right font-mono"
                      >
                        Closed {rollupSortField === 'closedActions' && (rollupSortAsc ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleRollupSort('closureRate')}
                        className="py-2.5 px-2 cursor-pointer hover:text-slate-900 text-right font-mono"
                      >
                        Closure Rate {rollupSortField === 'closureRate' && (rollupSortAsc ? '↑' : '↓')}
                      </th>
                      <th
                        onClick={() => handleRollupSort('oldestOpenAgeingDays')}
                        className="py-2.5 px-2 cursor-pointer hover:text-slate-900 text-right font-mono"
                      >
                        Max Ageing {rollupSortField === 'oldestOpenAgeingDays' && (rollupSortAsc ? '↑' : '↓')}
                      </th>
                      <th className="py-2.5 px-2 text-right">Account 360</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedRollup.map((row) => (
                      <tr key={row.accountId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <button
                            onClick={() => selectAccountAndNavigate(row.accountId)}
                            className="hover:text-sky-700 text-left cursor-pointer"
                          >
                            {row.accountName}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 text-[11px]">{row.vertical}</td>
                        <td className="py-2.5 px-2 text-slate-600 text-[11px]">{row.qaLeader}</td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-500">{row.totalActions}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold">
                          <span className={row.openActions > 0 ? 'text-sky-800' : 'text-slate-400'}>
                            {row.openActions}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold">
                          <span className={row.overdueActions > 0 ? 'text-rose-700' : 'text-slate-400'}>
                            {row.overdueActions}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold">
                          <span className={row.dueNext7Days > 0 ? 'text-amber-700' : 'text-slate-400'}>
                            {row.dueNext7Days}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold">
                          <span className={row.highCriticalOpen > 0 ? 'text-purple-800' : 'text-slate-400'}>
                            {row.highCriticalOpen}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-emerald-700">{row.closedActions}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-semibold">
                          {row.closureRateDisplay}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                          {row.oldestOpenAgeingDays !== null ? `${row.oldestOpenAgeingDays}d` : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            onClick={() => selectAccountAndNavigate(row.accountId)}
                            className="text-sky-700 font-semibold text-[11px] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>View</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
