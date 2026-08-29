import React from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { MetricRow } from '../common/MetricRow';
import { MetricTile } from '../common/MetricTile';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import { RAGStatus } from '../../types';

export const HygieneInputsSection: React.FC = () => {
  const { openDrawer } = useFilters();
  const { overview } = useDashboardData();

  const kpis = overview?.KPI_Cards || [];
  const m006 = kpis.find((k) => k.Metric_ID === 'M006');
  const m007 = kpis.find((k) => k.Metric_ID === 'M007');
  const m008 = kpis.find((k) => k.Metric_ID === 'M008');

  const tniSupplemental = overview?.Hygiene_Supplemental;
  const tniPct = tniSupplemental?.TNI_Published_Pct;
  const tniTarget = tniSupplemental?.TNI_Target;
  const tniDisplay = tniPct !== null && tniPct !== undefined ? `${(tniPct * 100).toFixed(1)}%` : 'N/A';
  const tniTargetDisplay = tniTarget !== null && tniTarget !== undefined ? `${(tniTarget * 100).toFixed(1)}%` : undefined;
  const tniRag = (tniSupplemental?.TNI_RAG?.toUpperCase() as RAGStatus) || ('Normal' as any);

  const getTargetDisplay = (kpi?: { Target_Display?: string | null; Target_Value?: number | null }) => {
    if (kpi?.Target_Display) return kpi.Target_Display;
    if (kpi?.Target_Value !== null && kpi?.Target_Value !== undefined) {
      return `${(kpi.Target_Value * 100).toFixed(1)}%`;
    }
    return undefined;
  };

  const getRagStatus = (kpi?: { RAG?: string | null }): RAGStatus => {
    if (kpi?.RAG) return kpi.RAG.toUpperCase() as RAGStatus;
    return 'Normal' as any;
  };

  const hygieneItems = [
    {
      name: 'Audit & Feedback Volume',
      shortLabel: 'Audits',
      currentValue: m006?.Actual_Display || (m006?.Actual_Value !== null && m006?.Actual_Value !== undefined ? `${(m006.Actual_Value * 100).toFixed(1)}%` : 'N/A'),
      target: getTargetDisplay(m006),
      rag: getRagStatus(m006),
    },
    {
      name: 'Hygiene Audit Compliance',
      shortLabel: 'Hygiene',
      currentValue: m007?.Actual_Display || (m007?.Actual_Value !== null && m007?.Actual_Value !== undefined ? `${(m007.Actual_Value * 100).toFixed(1)}%` : 'N/A'),
      target: getTargetDisplay(m007),
      rag: getRagStatus(m007),
    },
    {
      name: 'TNI Published Adherence',
      shortLabel: 'TNI',
      currentValue: tniDisplay,
      target: tniTargetDisplay,
      rag: tniRag,
    },
    {
      name: 'Calibration',
      shortLabel: 'Calibration',
      currentValue: m008?.Actual_Display || (m008?.Actual_Value !== null && m008?.Actual_Value !== undefined ? `${(m008.Actual_Value * 100).toFixed(1)}%` : 'N/A'),
      target: getTargetDisplay(m008),
      rag: getRagStatus(m008),
    },
  ];

  return (
    <div className="bg-surface border border-border-default rounded shadow-elevation-1 p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-border-subtle gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-label text-navy-900 tracking-tight uppercase font-semibold">
              Hygiene Inputs Matrix
            </h2>
            <p className="text-caption text-slate-500 hidden sm:block">
              Audit volume rigor, TNI adherence, ATA calibration, and compliance governance.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openDrawer('hygiene')}
          className="text-label font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1.5 self-end sm:self-auto cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label="Open Hygiene Diagnostic Drawer"
        >
          <span>Diagnostic Drawer</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MOBILE LAYOUT (< md / 768px): Single-Column List of MetricRow */}
      <div className="md:hidden divide-y divide-border-subtle border border-border-default rounded overflow-hidden">
        {hygieneItems.map((item, idx) => (
          <MetricRow
            key={idx}
            title={item.name}
            shortTitle={item.shortLabel}
            value={item.currentValue}
            target={item.target ? `Tgt ${item.target}` : undefined}
            status={item.rag}
            onClick={() => openDrawer('hygiene')}
          />
        ))}
      </div>

      {/* DESKTOP LAYOUT (>= md / 768px): 4-Column Grid of MetricTile */}
      <div className="hidden md:grid md:grid-cols-4 divide-x divide-y md:divide-y-0 border border-border-default rounded overflow-hidden">
        {hygieneItems.map((item, idx) => (
          <MetricTile
            key={idx}
            title={item.name}
            value={item.currentValue}
            target={item.target}
            status={item.rag}
            onClick={() => openDrawer('hygiene')}
            className="h-full"
          />
        ))}
      </div>
    </div>
  );
};
