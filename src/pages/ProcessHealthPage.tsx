import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  ArrowLeft, 
  ChevronRight, 
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { getProcessHealthMatrix } from '../services/api';
import { ProcessHealthMatrixData, ProcessHealthMatrixRow } from '../types/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { RAGStatus } from '../types';

export const ProcessHealthPage: React.FC = () => {
  const { 
    filters,
    setFilter,
    navigateToPage, 
    selectAccountAndNavigate 
  } = useFilters();

  const { overview, isLoading: overviewLoading, error: overviewError } = useDashboardData();

  const [filterRag, setFilterRag] = useState<'ALL' | 'HAS_RED' | 'HAS_AMBER' | 'ALL_GREEN'>('ALL');
  const [matrixData, setMatrixData] = useState<ProcessHealthMatrixData | null>(null);
  const [matrixLoading, setMatrixLoading] = useState<boolean>(true);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  // Fetch Matrix whenever filters change
  useEffect(() => {
    let isCancelled = false;
    setMatrixLoading(true);
    setMatrixError(null);

    const apiFilters = {
      vertical: filters.vertical !== 'ALL' ? filters.vertical : undefined,
      qaLeader: filters.qaLeader !== 'ALL' ? filters.qaLeader : undefined,
      srDirector: filters.srDirector !== 'ALL' ? filters.srDirector : undefined,
      accountId: filters.account !== 'ALL' ? filters.account : undefined,
      site: filters.site !== 'ALL' ? filters.site : undefined,
      lob: filters.lob !== 'ALL' ? filters.lob : undefined,
    };

    getProcessHealthMatrix(apiFilters)
      .then((res) => {
        if (!isCancelled) {
          setMatrixData(res.data);
          setMatrixLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load Process Health matrix:', err);
          setMatrixError(err.message || 'Unable to load Process Health matrix data');
          setMatrixLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    filters.vertical,
    filters.qaLeader,
    filters.srDirector,
    filters.account,
    filters.site,
    filters.lob,
  ]);

  // Extract authoritative M002-M005 KPI cards from scoped overview
  const kpiMap = useMemo(() => {
    const map = new Map<string, any>();
    if (overview?.KPI_Cards) {
      overview.KPI_Cards.forEach((k) => {
        map.set(k.Metric_ID, k);
      });
    }
    return map;
  }, [overview?.KPI_Cards]);

  const m002 = kpiMap.get('M002'); // SLA Achievement
  const m003 = kpiMap.get('M003'); // RNP Format
  const m004 = kpiMap.get('M004'); // EURA
  const m005 = kpiMap.get('M005'); // BEST QM

  const reportingMonth = matrixData?.Reporting_Context?.Official_Reporting_Month || overview?.Official_Reporting_Month || '';
  const totalAccountCount = matrixData?.Scope?.accountCount ?? (overview?.Scope?.accountCount ?? 0);

  // Helper to format variance
  const formatVariance = (variance: number | null | undefined, unit: string = '%') => {
    if (variance === null || variance === undefined) return 'N/A';
    const isScore = unit === 'Score' || unit === '';
    const formattedVal = isScore
      ? variance.toFixed(1)
      : `${(variance * 100).toFixed(1)}%`;
    return variance > 0 ? `+${formattedVal}` : formattedVal;
  };

  // 6 Primary Process Health Metrics Cards configuration
  const processCards = [
    {
      id: 'sla',
      code: 'M002',
      name: 'SLA Achievement',
      currentDisplay: m002?.Actual_Display || (overview ? 'N/A' : '-'),
      targetDisplay: m002?.Target_Display ? `Target: ${m002.Target_Display}` : m002?.Target_Value != null ? `Target: ${(m002.Target_Value * 100).toFixed(1)}%` : 'Target: N/A',
      varianceDisplay: formatVariance(m002?.Favourable_Variance, '%'),
      isPositive: (m002?.Favourable_Variance ?? 0) >= 0,
      hasVariance: m002?.Favourable_Variance != null,
      rag: (m002?.RAG?.toUpperCase() as RAGStatus) || null,
      description: 'Contractual service level compliance across all communication channels.',
      detailRoute: 'sla-detail' as const,
      isLifecycle: false,
    },
    {
      id: 'rnp',
      code: 'M003',
      name: 'RNP Format Score',
      currentDisplay: m003?.Actual_Display || (overview ? 'N/A' : '-'),
      targetDisplay: m003?.Target_Display ? `Target: ${m003.Target_Display}` : m003?.Target_Value != null ? `Target: ${(m003.Target_Value * 100).toFixed(1)}%` : 'Target: N/A',
      varianceDisplay: formatVariance(m003?.Favourable_Variance, '%'),
      isPositive: (m003?.Favourable_Variance ?? 0) >= 0,
      hasVariance: m003?.Favourable_Variance != null,
      rag: (m003?.RAG?.toUpperCase() as RAGStatus) || null,
      description: 'Right-First-Time Non-Productive audit format and transactional hygiene benchmark.',
      detailRoute: null,
      isLifecycle: false,
    },
    {
      id: 'escalations',
      code: 'ESC',
      name: 'Escalations Volume',
      currentDisplay: overview ? String(overview.Open_Escalations ?? 0) : '-',
      targetDisplay: 'Target: N/A',
      varianceDisplay: `${overview?.High_Critical_Escalations ?? 0} High / Critical`,
      isPositive: (overview?.High_Critical_Escalations ?? 0) === 0,
      hasVariance: false,
      rag: null,
      description: 'Executive client and operational escalations requiring root-cause remediation.',
      detailRoute: null,
      isLifecycle: true,
      badgeLabel: 'Active Backlog',
    },
    {
      id: 'eura',
      code: 'M004',
      name: 'EURA Quality',
      currentDisplay: m004?.Actual_Display || (overview ? 'N/A' : '-'),
      targetDisplay: m004?.Target_Display ? `Target: ${m004.Target_Display}` : m004?.Target_Value != null ? `Target: ${(m004.Target_Value * 100).toFixed(1)}%` : 'Target: N/A',
      varianceDisplay: formatVariance(m004?.Favourable_Variance, '%'),
      isPositive: (m004?.Favourable_Variance ?? 0) >= 0,
      hasVariance: m004?.Favourable_Variance != null,
      rag: (m004?.RAG?.toUpperCase() as RAGStatus) || null,
      description: 'End-User Resolution Accuracy auditing across multi-tier transactions.',
      detailRoute: null,
      isLifecycle: false,
    },
    {
      id: 'cqm',
      code: 'CQM',
      name: 'CQM Tracker',
      currentDisplay: overview ? String(overview.Open_CQM ?? 0) : '-',
      targetDisplay: 'Target: N/A',
      varianceDisplay: `${overview?.CQM_30_Plus ?? 0} > 30 Days`,
      isPositive: (overview?.CQM_30_Plus ?? 0) === 0,
      hasVariance: false,
      rag: null,
      description: 'Customer Quality Metric adherence and structured error calibration index.',
      detailRoute: null,
      isLifecycle: true,
      badgeLabel: 'Active Backlog',
    },
    {
      id: 'best-qm',
      code: 'M005',
      name: 'BEST QM Quality',
      currentDisplay: m005?.Actual_Display || (overview ? 'N/A' : '-'),
      targetDisplay: m005?.Target_Display ? `Target: ${m005.Target_Display}` : m005?.Target_Value != null ? `Target: ${m005.Target_Value}` : 'Target: N/A',
      varianceDisplay: formatVariance(m005?.Favourable_Variance, 'Score'),
      isPositive: (m005?.Favourable_Variance ?? 0) >= 0,
      hasVariance: m005?.Favourable_Variance != null,
      rag: (m005?.RAG?.toUpperCase() as RAGStatus) || null,
      description: 'Core 5-parameter transactional quality evaluation standard.',
      detailRoute: 'best-qm-detail' as const,
      isLifecycle: false,
    },
  ];

  // Filter matrix rows based on factual individual metric RAG status
  const displayedRows = useMemo(() => {
    if (!matrixData?.Rows) return [];
    if (filterRag === 'ALL') return matrixData.Rows;

    const normalizeRag = (rag: string | null | undefined): string => (rag || '').trim().toUpperCase();

    return matrixData.Rows.filter((row: ProcessHealthMatrixRow) => {
      const rags = [
        normalizeRag(row.SLA.RAG),
        normalizeRag(row.BEST_QM.RAG),
        normalizeRag(row.EURA.RAG),
        normalizeRag(row.RNP_Format.RAG),
      ].filter((r) => r.length > 0);

      if (filterRag === 'HAS_RED') {
        return rags.some((r) => r === 'RED');
      }
      if (filterRag === 'HAS_AMBER') {
        return rags.some((r) => r === 'AMBER');
      }
      if (filterRag === 'ALL_GREEN') {
        return rags.length === 4 && rags.every((r) => r === 'GREEN');
      }
      return true;
    });
  }, [matrixData?.Rows, filterRag]);

  const handleRowClick = (accountId: string) => {
    setFilter('account', accountId);
    selectAccountAndNavigate(accountId);
  };

  const getRagColorClass = (rag: string | null | undefined) => {
    const upper = (rag || '').trim().toUpperCase();
    if (upper === 'GREEN') return 'text-emerald-700';
    if (upper === 'AMBER') return 'text-amber-700';
    if (upper === 'RED') return 'text-rose-700';
    return 'text-slate-700';
  };

  return (
    <div className="space-y-3.5 max-w-[1600px] mx-auto pb-10">
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
          <span className="font-bold text-[#1A2B4B]">Process Health & Operational Quality Diagnostic</span>
        </div>

        <div className="flex items-center gap-2">
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
            <div className="w-8 h-8 rounded-xs bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488] shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[#1A2B4B] tracking-tight uppercase">
                  Process Health Cockpit
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {totalAccountCount} {totalAccountCount === 1 ? 'Account' : 'Accounts'} in Scope
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  Official Month: {reportingMonth}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative operational telemetry tracking SLA, BEST QM, Escalations, EURA, CQM, and RNP Format.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateToPage('sla-detail')}
              className="px-2.5 py-1.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-xs text-xs font-bold hover:bg-sky-100 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>SLA Diagnostic</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => navigateToPage('best-qm-detail')}
              className="px-2.5 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-xs text-xs font-bold hover:bg-teal-100 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>BEST QM Diagnostic</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {(overviewError || matrixError) && (
        <div className="bg-rose-50 border border-rose-200 rounded-xs p-3 flex items-center gap-2 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{overviewError || matrixError}</span>
        </div>
      )}

      {/* 6 Process Health KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {processCards.map((m) => (
          <div
            key={m.id}
            onClick={() => m.detailRoute ? navigateToPage(m.detailRoute) : null}
            className={`bg-white border border-slate-200 rounded-xs p-3 hover:border-[#0D9488] transition-all flex flex-col justify-between shadow-xs ${
              m.detailRoute ? 'cursor-pointer group' : ''
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">
                    {m.code}
                  </div>
                  <span className="text-xs font-bold text-[#1A2B4B] group-hover:text-[#0D9488] transition-colors">
                    {m.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {m.rag ? (
                    <StatusBadge status={m.rag} size="xs" />
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {m.badgeLabel || 'Backlog'}
                    </span>
                  )}
                </div>
              </div>

              <div className="my-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-[#1A2B4B] font-mono">
                  {overviewLoading ? '-' : m.currentDisplay}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {m.targetDisplay}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed mb-2 font-normal">
                {m.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] font-mono">
                {m.hasVariance ? (
                  <>
                    <span className="text-slate-400">Variance:</span>
                    <span className={`font-bold ${m.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {m.varianceDisplay}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400">Backlog Focus:</span>
                    <span className="font-bold text-slate-700">{m.varianceDisplay}</span>
                  </>
                )}
              </div>

              {m.detailRoute && (
                <span className="text-[10px] font-bold text-[#0D9488] flex items-center gap-0.5 group-hover:underline">
                  Drill <ChevronRight className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Account Performance Matrix for Process Health */}
      <div className="bg-white border border-slate-200 rounded-xs p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[#1A2B4B] uppercase tracking-tight">
                Account-Level Process Health Matrix
              </h3>
              {matrixLoading && (
                <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              )}
            </div>
            <p className="text-xs text-slate-500">
              Granular review of all 6 process metrics across {totalAccountCount} accounts in scope. Click any row to view full account diagnostic.
            </p>
          </div>

          {/* Factual Metric RAG Filter Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterRag('ALL')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xs cursor-pointer transition-colors ${
                filterRag === 'ALL' ? 'bg-[#1A2B4B] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({matrixData?.Rows?.length ?? 0})
            </button>
            <button
              onClick={() => setFilterRag('HAS_RED')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xs cursor-pointer transition-colors ${
                filterRag === 'HAS_RED' ? 'bg-rose-600 text-white' : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
              }`}
            >
              Has Red KPI
            </button>
            <button
              onClick={() => setFilterRag('HAS_AMBER')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xs cursor-pointer transition-colors ${
                filterRag === 'HAS_AMBER' ? 'bg-amber-600 text-white' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              Has Amber KPI
            </button>
            <button
              onClick={() => setFilterRag('ALL_GREEN')}
              className={`px-2.5 py-1 text-xs font-bold rounded-xs cursor-pointer transition-colors ${
                filterRag === 'ALL_GREEN' ? 'bg-emerald-600 text-white' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              All 4 KPIs Green
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
                <th className="py-2.5 px-2 text-right">SLA</th>
                <th className="py-2.5 px-2 text-right">BEST QM</th>
                <th className="py-2.5 px-2 text-right">Escalations</th>
                <th className="py-2.5 px-2 text-right">EURA</th>
                <th className="py-2.5 px-2 text-right">CQM</th>
                <th className="py-2.5 px-2 text-right">RNP Format</th>
                <th className="py-2.5 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRows.map((acc: ProcessHealthMatrixRow) => (
                <tr
                  key={acc.Account_ID}
                  onClick={() => handleRowClick(acc.Account_ID)}
                  className="hover:bg-teal-50/30 cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 px-3 font-bold text-[#1A2B4B] group-hover:text-[#0D9488]">
                    {acc.Account_Name}
                  </td>
                  <td className="py-2.5 px-2 text-slate-600">{acc.Vertical || 'N/A'}</td>
                  <td className="py-2.5 px-2 text-slate-700 font-medium">{acc.QA_Leader || 'N/A'}</td>
                  
                  {/* SLA */}
                  <td className="py-2.5 px-2 text-right font-mono">
                    <span className={`font-bold ${getRagColorClass(acc.SLA.RAG)}`}>
                      {acc.SLA.Actual_Display || 'N/A'}
                    </span>
                  </td>

                  {/* BEST QM */}
                  <td className="py-2.5 px-2 text-right font-mono">
                    <span className={`font-bold ${getRagColorClass(acc.BEST_QM.RAG)}`}>
                      {acc.BEST_QM.Actual_Display || 'N/A'}
                    </span>
                  </td>

                  {/* Escalations */}
                  <td className="py-2.5 px-2 text-right font-mono text-slate-800">
                    <div className="flex flex-col items-end">
                      <span className="font-bold">{acc.Open_Escalations}</span>
                      {acc.High_Critical_Escalations > 0 && (
                        <span className="text-[10px] text-rose-600 font-medium">
                          {acc.High_Critical_Escalations} High
                        </span>
                      )}
                    </div>
                  </td>

                  {/* EURA */}
                  <td className="py-2.5 px-2 text-right font-mono">
                    <span className={`font-bold ${getRagColorClass(acc.EURA.RAG)}`}>
                      {acc.EURA.Actual_Display || 'N/A'}
                    </span>
                  </td>

                  {/* CQM */}
                  <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                    <div className="flex flex-col items-end">
                      <span className="font-bold">{acc.Open_CQM}</span>
                      {acc.CQM_30_Plus > 0 && (
                        <span className="text-[10px] text-amber-600 font-medium">
                          {acc.CQM_30_Plus} &gt;30d
                        </span>
                      )}
                    </div>
                  </td>

                  {/* RNP Format */}
                  <td className="py-2.5 px-2 text-right font-mono">
                    <span className={`font-bold ${getRagColorClass(acc.RNP_Format.RAG)}`}>
                      {acc.RNP_Format.Actual_Display || 'N/A'}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-2 text-right">
                    <span className="text-[#0D9488] font-bold text-[11px] group-hover:underline flex items-center justify-end gap-0.5">
                      Diagnostic <ChevronRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}

              {!matrixLoading && displayedRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No accounts match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
