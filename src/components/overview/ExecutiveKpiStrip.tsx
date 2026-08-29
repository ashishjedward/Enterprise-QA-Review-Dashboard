import React from 'react';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import { StatusBadge } from '../common/StatusBadge';
import { MetricTile } from '../common/MetricTile';
import { RAGStatus } from '../../types';

export const ExecutiveKpiStrip: React.FC = () => {
  const { navigateToPage, openDrawer } = useFilters();
  const { overview } = useDashboardData();

  const kpiCards = overview?.KPI_Cards || [];
  const m002 = kpiCards.find((k) => k.Metric_ID === 'M002');
  const m007 = kpiCards.find((k) => k.Metric_ID === 'M007');
  const m011 = kpiCards.find((k) => k.Metric_ID === 'M011');

  const getTargetDisplay = (kpi?: { Target_Display?: string | null; Target_Value?: number | null }, isPct = true) => {
    if (kpi?.Target_Display) return kpi.Target_Display;
    if (kpi?.Target_Value !== null && kpi?.Target_Value !== undefined) {
      return isPct ? `${(kpi.Target_Value * 100).toFixed(1)}%` : kpi.Target_Value.toFixed(1);
    }
    return 'N/A';
  };

  const slaValue = m002?.Actual_Display || (m002?.Actual_Value !== null && m002?.Actual_Value !== undefined ? `${(m002.Actual_Value * 100).toFixed(1)}%` : 'N/A');
  const slaTarget = getTargetDisplay(m002, true);
  const slaRag = ((m002?.RAG || 'Normal').toUpperCase()) as RAGStatus;

  const hygieneValue = m007?.Actual_Display || (m007?.Actual_Value !== null && m007?.Actual_Value !== undefined ? `${(m007.Actual_Value * 100).toFixed(1)}%` : 'N/A');
  const hygieneTarget = getTargetDisplay(m007, true);
  const hygieneRag = ((m007?.RAG || 'Normal').toUpperCase()) as RAGStatus;

  const qaUtilValue = m011?.Actual_Display || (m011?.Actual_Value !== null && m011?.Actual_Value !== undefined ? `${(m011.Actual_Value * 100).toFixed(1)}%` : 'N/A');
  const qaUtilTarget = getTargetDisplay(m011, true);
  const qaUtilRag = ((m011?.RAG || 'Normal').toUpperCase()) as RAGStatus;

  const revenueAch = overview?.Revenue_Achievement_Pct !== null && overview?.Revenue_Achievement_Pct !== undefined ? Math.round(Number(overview.Revenue_Achievement_Pct) * 100) : 0;
  const billedRev = overview?.Billed_Revenue !== null && overview?.Billed_Revenue !== undefined ? `${(Number(overview.Billed_Revenue) / 1000000).toFixed(2)}M` : 'N/A';
  const valDeliveredRag = (revenueAch >= 100 ? 'GREEN' : revenueAch >= 90 ? 'AMBER' : 'RED') as RAGStatus;

  const redAccountsCount = Number(overview?.Accounts_With_Red_KPI ?? overview?.Client_Sentiment_Red_Accounts ?? 0);
  const redSentimentCount = Number(overview?.Client_Sentiment_Red_Accounts ?? 0);
  const highRiskRag = (redAccountsCount > 2 ? 'RED' : redAccountsCount > 0 ? 'AMBER' : 'GREEN') as RAGStatus;

  const greenKpiCount = kpiCards.filter((k) => (k.RAG || '').toUpperCase() === 'GREEN').length;
  const totalKpiCount = kpiCards.length || 12;
  const passRate = Math.round((greenKpiCount / (totalKpiCount || 1)) * 100);
  const metricsOnTargetRag = (greenKpiCount >= 7 ? 'GREEN' : 'AMBER') as RAGStatus;

  const formatPctVar = (variance: number | null | undefined) => {
    if (variance === null || variance === undefined) return 'N/A';
    const num = Math.round(variance * 1000) / 10;
    return `${num >= 0 ? '+' : ''}${num}%`;
  };

  const desktopKpis: {
    id: string;
    title: string;
    value: string;
    subtitle: string;
    rag: RAGStatus;
    varianceText?: string;
    onClick: () => void;
    isHighRisk?: boolean;
  }[] = [
    {
      id: 'sla-achievement',
      title: 'SLA Achievement',
      value: slaValue,
      subtitle: `Target: ${slaTarget}`,
      rag: slaRag,
      varianceText: m002?.Favourable_Variance != null ? `Var: ${formatPctVar(m002.Favourable_Variance)}` : undefined,
      onClick: () => navigateToPage('sla-detail'),
    },
    {
      id: 'hygiene-compliance',
      title: 'Hygiene Compliance',
      value: hygieneValue,
      subtitle: `Target: ${hygieneTarget}`,
      rag: hygieneRag,
      varianceText: m007?.Favourable_Variance != null ? `Var: ${formatPctVar(m007.Favourable_Variance)}` : undefined,
      onClick: () => openDrawer('hygiene'),
    },
    {
      id: 'qa-utilisation',
      title: 'QA Utilisation',
      value: qaUtilValue,
      subtitle: `Target: ${qaUtilTarget}`,
      rag: qaUtilRag,
      varianceText: m011?.Favourable_Variance != null ? `Var: ${formatPctVar(m011.Favourable_Variance)}` : undefined,
      onClick: () => navigateToPage('qa-team'),
    },
    {
      id: 'value-delivered',
      title: 'QA Monetization',
      value: billedRev,
      subtitle: `${revenueAch}% Plan Achieved`,
      rag: valDeliveredRag,
      varianceText: overview?.Plan_Revenue ? `Plan: ${(Number(overview.Plan_Revenue) / 1000000).toFixed(2)}M` : undefined,
      onClick: () => navigateToPage('value-adds'),
    },
    {
      id: 'high-risk-accounts',
      title: 'High-Risk Accounts',
      value: `${redAccountsCount}`,
      subtitle: `${redSentimentCount} Red Sentiment`,
      rag: highRiskRag,
      varianceText: `${overview?.Total_Accounts ?? 0} In Scope`,
      onClick: () => openDrawer('attention'),
      isHighRisk: true,
    },
    {
      id: 'metrics-on-target',
      title: 'Metrics On Target',
      value: `${greenKpiCount}/${totalKpiCount}`,
      subtitle: `${passRate}% Pass Rate`,
      rag: metricsOnTargetRag,
      varianceText: `${totalKpiCount - greenKpiCount} Off Target`,
      onClick: () => openDrawer('hygiene'),
    },
  ];

  return (
    <div className="bg-surface border border-border-default rounded shadow-elevation-1">
      {/* MOBILE LAYOUT (< md / 768px): 2x3 MetricTile Grid */}
      <div className="md:hidden p-3">
        <div className="grid grid-cols-2 gap-2">
          <MetricTile
            title="SLA Achievement"
            value={slaValue}
            context={`Target: ${slaTarget}`}
            status={slaRag}
            onClick={() => navigateToPage('sla-detail')}
          />

          <MetricTile
            title="Hygiene Compliance"
            value={hygieneValue}
            context={`Target: ${hygieneTarget}`}
            status={hygieneRag}
            onClick={() => openDrawer('hygiene')}
          />

          <MetricTile
            title="QA Utilisation"
            value={qaUtilValue}
            context={`Target: ${qaUtilTarget}`}
            status={qaUtilRag}
            onClick={() => navigateToPage('qa-team')}
          />

          <MetricTile
            title="QA Monetization"
            value={billedRev}
            context={`${revenueAch}% Achieved`}
            status={valDeliveredRag}
            onClick={() => navigateToPage('value-adds')}
          />

          <MetricTile
            title="High-Risk Accounts"
            value={`${redAccountsCount}`}
            context={`${redSentimentCount} Red Sentiment`}
            status={highRiskRag}
            isRedHighlight={redAccountsCount > 0}
            onClick={() => openDrawer('attention')}
          />

          <MetricTile
            title="Metrics On Target"
            value={`${greenKpiCount}/${totalKpiCount}`}
            context={`${passRate}% Pass Rate`}
            status={metricsOnTargetRag}
            className="col-span-2 sm:col-span-1"
            onClick={() => openDrawer('hygiene')}
          />
        </div>
      </div>

      {/* DESKTOP LAYOUT (>= md / 768px): One unified strip with 6 internally divided cells */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 divide-y lg:divide-y-0 md:divide-x divide-border-subtle">
        {desktopKpis.map((kpi) => {
          const isRed = kpi.isHighRisk && redAccountsCount > 0;
          return (
            <div
              key={kpi.id}
              onClick={kpi.onClick}
              className={`p-3 flex flex-col justify-between h-full cursor-pointer hover:bg-surface-hover transition-colors select-none group ${
                isRed ? 'bg-status-red-bg/30' : ''
              }`}
            >
              {/* Top row: Metric Title + Status */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-eyebrow text-slate-500 truncate group-hover:text-navy-900 transition-colors">
                  {kpi.title}
                </span>
                <StatusBadge status={kpi.rag} size="xs" />
              </div>

              {/* Middle: Big Metric Value + Subtitle */}
              <div className="my-1">
                <div className="text-metric-sm text-navy-900 tracking-tight flex items-baseline justify-between tnum">
                  <span>{kpi.value}</span>
                </div>
                <div className="text-caption text-slate-500 truncate mt-0.5 font-medium tnum">
                  {kpi.subtitle}
                </div>
              </div>

              {/* Bottom: Variance & Context */}
              <div className="flex items-center justify-between pt-2 mt-auto border-t border-border-subtle text-caption">
                <span className="text-caption font-semibold text-slate-600 truncate tnum">
                  {kpi.varianceText || 'In scope'}
                </span>
                <span className="text-caption text-slate-400 font-medium">
                  {overview?.Official_Reporting_Month || 'Current'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
