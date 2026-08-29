import React from 'react';
import { Activity, ChevronRight, ExternalLink } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import { Sparkline } from '../common/Sparkline';
import { StatusBadge } from '../common/StatusBadge';
import { RAGStatus } from '../../types';

interface ProcessRow {
  id: string;
  name: string;
  currentDisplay: string;
  targetDisplay: string;
  varianceDisplay: string;
  rag: RAGStatus;
  trend: number[];
  isClickable: boolean;
  targetRoute?: 'sla-detail' | 'best-qm-detail';
}

export const ProcessHealthSection: React.FC = () => {
  const { navigateToPage } = useFilters();
  const { overview } = useDashboardData();

  const kpis = overview?.KPI_Cards || [];
  const m002 = kpis.find((k) => k.Metric_ID === 'M002');
  const m003 = kpis.find((k) => k.Metric_ID === 'M003');
  const m004 = kpis.find((k) => k.Metric_ID === 'M004');
  const m005 = kpis.find((k) => k.Metric_ID === 'M005');

  const formatPctVar = (variance: number | null | undefined) => {
    if (variance === null || variance === undefined) return 'N/A';
    const num = Math.round(variance * 1000) / 10;
    return `${num >= 0 ? '+' : ''}${num}%`;
  };

  const openEscalations = overview?.Open_Escalations !== null && overview?.Open_Escalations !== undefined ? Number(overview.Open_Escalations) : undefined;
  const highCritEscalations = overview?.High_Critical_Escalations !== null && overview?.High_Critical_Escalations !== undefined ? Number(overview.High_Critical_Escalations) : undefined;
  const escalationsRag: RAGStatus = 'Normal' as any;

  const openCqm = overview?.Open_CQM !== null && overview?.Open_CQM !== undefined ? Number(overview.Open_CQM) : undefined;
  const cqm30Plus = overview?.CQM_30_Plus !== null && overview?.CQM_30_Plus !== undefined ? Number(overview.CQM_30_Plus) : undefined;
  const cqmRag: RAGStatus = 'Normal' as any;

  const getTargetDisplay = (kpi?: { Target_Display?: string | null; Target_Value?: number | null }, isPct = true) => {
    if (kpi?.Target_Display) return kpi.Target_Display;
    if (kpi?.Target_Value !== null && kpi?.Target_Value !== undefined) {
      return isPct ? `${(kpi.Target_Value * 100).toFixed(1)}%` : kpi.Target_Value.toFixed(1);
    }
    return 'N/A';
  };

  const rows: ProcessRow[] = [
    {
      id: 'sla',
      name: 'SLA Achievement',
      currentDisplay: m002?.Actual_Display || (m002?.Actual_Value !== null && m002?.Actual_Value !== undefined ? `${(m002.Actual_Value * 100).toFixed(1)}%` : 'N/A'),
      targetDisplay: getTargetDisplay(m002, true),
      varianceDisplay: formatPctVar(m002?.Favourable_Variance),
      rag: (m002?.RAG?.toUpperCase() as RAGStatus) || ('Normal' as any),
      trend: [],
      isClickable: true,
      targetRoute: 'sla-detail',
    },
    {
      id: 'rnp',
      name: 'RNP Format',
      currentDisplay: m003?.Actual_Display || (m003?.Actual_Value !== null && m003?.Actual_Value !== undefined ? `${(m003.Actual_Value * 100).toFixed(1)}%` : 'N/A'),
      targetDisplay: getTargetDisplay(m003, true),
      varianceDisplay: formatPctVar(m003?.Favourable_Variance),
      rag: (m003?.RAG?.toUpperCase() as RAGStatus) || ('Normal' as any),
      trend: [],
      isClickable: false,
    },
    {
      id: 'escalations',
      name: 'Escalations',
      currentDisplay: openEscalations != null ? `${openEscalations} cases` : 'N/A',
      targetDisplay: 'N/A',
      varianceDisplay: highCritEscalations != null ? `${highCritEscalations} High/Crit` : 'N/A',
      rag: escalationsRag,
      trend: [],
      isClickable: false,
    },
    {
      id: 'eura',
      name: 'EURA',
      currentDisplay: m004?.Actual_Display || (m004?.Actual_Value !== null && m004?.Actual_Value !== undefined ? `${(m004.Actual_Value * 100).toFixed(1)}%` : 'N/A'),
      targetDisplay: getTargetDisplay(m004, true),
      varianceDisplay: formatPctVar(m004?.Favourable_Variance),
      rag: (m004?.RAG?.toUpperCase() as RAGStatus) || ('Normal' as any),
      trend: [],
      isClickable: false,
    },
    {
      id: 'cqm',
      name: 'CQM Tracker',
      currentDisplay: openCqm != null ? `${openCqm} open` : 'N/A',
      targetDisplay: 'N/A',
      varianceDisplay: cqm30Plus != null ? `${cqm30Plus} > 30d` : 'N/A',
      rag: cqmRag,
      trend: [],
      isClickable: false,
    },
    {
      id: 'best-qm',
      name: 'BEST QM',
      currentDisplay: m005?.Actual_Display || (m005?.Actual_Value !== null && m005?.Actual_Value !== undefined ? `${m005.Actual_Value.toFixed(1)}` : 'N/A'),
      targetDisplay: getTargetDisplay(m005, false),
      varianceDisplay: m005?.Favourable_Variance !== null && m005?.Favourable_Variance !== undefined 
        ? `${m005.Favourable_Variance >= 0 ? '+' : ''}${m005.Favourable_Variance.toFixed(1)}` 
        : 'N/A',
      rag: (m005?.RAG?.toUpperCase() as RAGStatus) || ('Normal' as any),
      trend: [],
      isClickable: true,
      targetRoute: 'best-qm-detail',
    },
  ];

  return (
    <div className="bg-surface border border-border-default rounded shadow-elevation-1 p-3 sm:p-4 flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-border-subtle gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-label text-navy-900 tracking-tight uppercase">
                Process Health
              </h2>
              <p className="text-caption text-slate-500 hidden sm:block">
                Transactional quality, contract SLAs, and resolution rigor.
              </p>
            </div>
          </div>
          <span className="text-caption text-slate-500 font-medium self-start sm:self-auto">
            6 core operational metrics
          </span>
        </div>

        {/* Mobile-Only 2-Line Row Layout (< md) */}
        <div className="md:hidden divide-y divide-border-subtle">
          {rows.map((row) => (
            <div
              key={row.id}
              onClick={() => {
                if (row.isClickable && row.targetRoute) {
                  navigateToPage(row.targetRoute);
                }
              }}
              className={`py-2 px-1 transition-colors ${
                row.isClickable 
                  ? 'active:bg-teal-50/50 cursor-pointer group' 
                  : 'hover:bg-slate-50/50'
              }`}
            >
              {/* Row 1: Metric Name (left) & Current Value (right) */}
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-label text-navy-900 truncate group-hover:text-teal-600 transition-colors">
                    {row.name}
                  </span>
                  {row.isClickable && (
                    <ChevronRight className="w-4 h-4 text-teal-600 shrink-0" />
                  )}
                </div>
                <div className="text-label text-navy-900 tnum shrink-0 text-right">
                  {row.currentDisplay}
                </div>
              </div>

              {/* Row 2: Target (left), Variance (right), Status (right) */}
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 text-caption">
                <div className="text-slate-500 font-medium text-caption truncate tnum">
                  Target: {row.targetDisplay}
                </div>
                <div className={`text-caption font-bold tnum text-right ${
                  row.rag === 'GREEN' ? 'text-status-green-text' :
                  row.rag === 'AMBER' ? 'text-status-amber-text' : 'text-status-red-text'
                }`}>
                  {row.varianceDisplay}
                </div>
                <div className="flex justify-end shrink-0 min-w-[64px]">
                  <StatusBadge status={row.rag} size="xs" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Rows (>= md) */}
        <div className="hidden md:block divide-y divide-border-subtle">
          {rows.map((row) => (
            <div
              key={row.id}
              onClick={() => {
                if (row.isClickable && row.targetRoute) {
                  navigateToPage(row.targetRoute);
                }
              }}
              className={`py-2 px-2 flex items-center justify-between gap-2 transition-colors ${
                row.isClickable 
                  ? 'hover:bg-teal-50/40 cursor-pointer group' 
                  : 'hover:bg-slate-50/50'
              }`}
            >
              {/* Metric Name */}
              <div className="flex items-center gap-1.5 min-w-0 max-w-[38%]">
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-label text-navy-900 truncate group-hover:text-teal-600 transition-colors">
                      {row.name}
                    </span>
                    {row.isClickable && (
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Current Value & Target */}
              <div className="text-right shrink-0">
                <div className="text-label text-navy-900 tnum">
                  {row.currentDisplay}
                </div>
                <div className="text-caption text-slate-500 font-medium tnum">
                  Target: {row.targetDisplay}
                </div>
              </div>

              {/* Variance & Status */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-caption font-semibold tnum ${
                  row.rag === 'GREEN' ? 'text-status-green-text' :
                  row.rag === 'AMBER' ? 'text-status-amber-text' : 'text-status-red-text'
                }`}>
                  {row.varianceDisplay}
                </span>
                <StatusBadge status={row.rag} size="xs" />
              </div>

              {/* 6-Month Sparkline */}
              <div className="flex items-center gap-2 shrink-0">
                <Sparkline
                  data={row.trend}
                  width={48}
                  height={14}
                  rag={row.rag}
                  showPoints={true}
                />
                {row.isClickable && (
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Footer link to diagnostic pages */}
      <div className="hidden md:flex pt-2 mt-2 border-t border-border-subtle items-center justify-between text-caption text-slate-500">
        <span className="text-caption">Click SLA or BEST QM for root cause diagnostics</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateToPage('sla-detail')}
            className="text-teal-600 hover:text-teal-800 text-caption font-bold cursor-pointer transition-colors"
          >
            SLA Diagnostic &rarr;
          </button>
          <button
            onClick={() => navigateToPage('best-qm-detail')}
            className="text-teal-600 hover:text-teal-800 text-caption font-bold cursor-pointer transition-colors"
          >
            BEST QM Diagnostic &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
