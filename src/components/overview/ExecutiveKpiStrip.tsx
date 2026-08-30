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

  const officialMonth = overview?.Official_Reporting_Month || 'Jul-26';
  const totalAccounts = overview?.Total_Accounts ?? 0;

  const getTargetDisplay = (kpi?: { Target_Display?: string | null; Target_Value?: number | null }, isPct = true) => {
    if (kpi?.Target_Display) return kpi.Target_Display;
    if (kpi?.Target_Value !== null && kpi?.Target_Value !== undefined) {
      return isPct ? `${(kpi.Target_Value * 100).toFixed(1)}%` : kpi.Target_Value.toFixed(1);
    }
    return 'N/A';
  };

  const formatPctVar = (variance: number | null | undefined) => {
    if (variance === null || variance === undefined) return 'N/A';
    const num = Math.round(variance * 1000) / 10;
    return `${num >= 0 ? '+' : ''}${num}%`;
  };

  const formatCompactNumber = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '—';
    const abs = Math.abs(val);
    if (abs >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(2)}M`;
    }
    if (abs >= 1_000) {
      return `${(val / 1_000).toFixed(1)}K`;
    }
    return val.toFixed(0);
  };

  // 1. SLA Achievement (M002)
  const slaValue = m002?.Actual_Display || (m002?.Actual_Value !== null && m002?.Actual_Value !== undefined ? `${(m002.Actual_Value * 100).toFixed(1)}%` : 'N/A');
  const slaTarget = getTargetDisplay(m002, true);
  const slaRag = m002?.RAG ? ((m002.RAG.toUpperCase()) as RAGStatus) : undefined;

  // 2. Hygiene Compliance (M007)
  const hygieneValue = m007?.Actual_Display || (m007?.Actual_Value !== null && m007?.Actual_Value !== undefined ? `${(m007.Actual_Value * 100).toFixed(1)}%` : 'N/A');
  const hygieneTarget = getTargetDisplay(m007, true);
  const hygieneRag = m007?.RAG ? ((m007.RAG.toUpperCase()) as RAGStatus) : undefined;

  // 3. QA Utilisation (M011)
  const qaUtilValue = m011?.Actual_Display || (m011?.Actual_Value !== null && m011?.Actual_Value !== undefined ? `${(m011.Actual_Value * 100).toFixed(1)}%` : 'N/A');
  const qaUtilTarget = getTargetDisplay(m011, true);
  const qaUtilRag = m011?.RAG ? ((m011.RAG.toUpperCase()) as RAGStatus) : undefined;

  // 4. QaaS Program Value (Value_Adds_Snapshot) - NO AGGREGATE RAG
  const qaasSnapshot = overview?.Value_Adds_Snapshot;
  const qaasValue = qaasSnapshot?.QAAS_Program_Value != null ? formatCompactNumber(qaasSnapshot.QAAS_Program_Value) : '—';
  const qaasSubtitle = qaasSnapshot?.QAAS_Value_Achievement_Pct != null
    ? `${(qaasSnapshot.QAAS_Value_Achievement_Pct * 100).toFixed(1)}% of target`
    : '—';
  const qaasTargetDisplay = qaasSnapshot?.QAAS_Target_Value != null
    ? `Target: ${formatCompactNumber(qaasSnapshot.QAAS_Target_Value)}`
    : 'Target: —';

  // 5. Red Client Sentiment (Client_Sentiment_Red_Accounts) - NO SYNTHETIC RAG
  const redSentimentCount = typeof overview?.Client_Sentiment_Red_Accounts === 'number'
    ? overview.Client_Sentiment_Red_Accounts
    : (Number(overview?.Client_Sentiment_Red_Accounts) || 0);
  const redSentimentSubtitle = `${redSentimentCount} of ${totalAccounts} ${totalAccounts === 1 ? 'account' : 'accounts'}`;
  const redSentimentFooter = `${totalAccounts} In Scope`;

  // 6. Action Closure Rate (Action_Snapshot) - NO RAG
  const actionSnapshot = overview?.Action_Snapshot;
  const actionClosureValue = actionSnapshot?.Closure_Rate_Display || 'N/A';
  const overdueActions = actionSnapshot?.Overdue_Actions ?? 0;
  const openActions = actionSnapshot?.Open_Actions ?? 0;
  const actionSubtitle = `${overdueActions} overdue ${overdueActions === 1 ? 'action' : 'actions'}`;
  const actionFooter = `${openActions} Open`;

  const desktopKpis: {
    id: string;
    title: string;
    value: string;
    subtitle: string;
    rag?: RAGStatus;
    varianceText?: string;
    periodLabel: string;
    onClick: () => void;
    isRedHighlight?: boolean;
    valueColorClass?: string;
  }[] = [
    {
      id: 'sla-achievement',
      title: 'SLA Achievement',
      value: slaValue,
      subtitle: `Target: ${slaTarget}`,
      rag: slaRag,
      varianceText: m002?.Favourable_Variance != null ? `Var: ${formatPctVar(m002.Favourable_Variance)}` : undefined,
      periodLabel: officialMonth,
      onClick: () => navigateToPage('sla-detail'),
    },
    {
      id: 'hygiene-compliance',
      title: 'Hygiene Compliance',
      value: hygieneValue,
      subtitle: `Target: ${hygieneTarget}`,
      rag: hygieneRag,
      varianceText: m007?.Favourable_Variance != null ? `Var: ${formatPctVar(m007.Favourable_Variance)}` : undefined,
      periodLabel: officialMonth,
      onClick: () => navigateToPage('hygiene-inputs'),
    },
    {
      id: 'qa-utilisation',
      title: 'QA Utilisation',
      value: qaUtilValue,
      subtitle: `Target: ${qaUtilTarget}`,
      rag: qaUtilRag,
      varianceText: m011?.Favourable_Variance != null ? `Var: ${formatPctVar(m011.Favourable_Variance)}` : undefined,
      periodLabel: officialMonth,
      onClick: () => navigateToPage('qa-team'),
    },
    {
      id: 'qaas-program-value',
      title: 'QaaS Program Value',
      value: qaasValue,
      subtitle: qaasSubtitle,
      rag: undefined,
      varianceText: qaasTargetDisplay,
      periodLabel: 'Current',
      onClick: () => navigateToPage('value-adds'),
    },
    {
      id: 'red-client-sentiment',
      title: 'Red Client Sentiment',
      value: `${redSentimentCount}`,
      subtitle: redSentimentSubtitle,
      rag: undefined,
      varianceText: redSentimentFooter,
      periodLabel: 'Current',
      onClick: () => openDrawer('sentiment-red'),
      isRedHighlight: redSentimentCount > 0,
      valueColorClass: redSentimentCount > 0 ? 'text-rose-700 font-bold' : 'text-navy-900',
    },
    {
      id: 'action-closure-rate',
      title: 'Action Closure Rate',
      value: actionClosureValue,
      subtitle: actionSubtitle,
      rag: undefined,
      varianceText: actionFooter,
      periodLabel: 'Current',
      onClick: () => navigateToPage('actions'),
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
            status={slaRag || ('Normal' as RAGStatus)}
            onClick={() => navigateToPage('sla-detail')}
          />

          <MetricTile
            title="Hygiene Compliance"
            value={hygieneValue}
            context={`Target: ${hygieneTarget}`}
            status={hygieneRag || ('Normal' as RAGStatus)}
            onClick={() => navigateToPage('hygiene-inputs')}
          />

          <MetricTile
            title="QA Utilisation"
            value={qaUtilValue}
            context={`Target: ${qaUtilTarget}`}
            status={qaUtilRag || ('Normal' as RAGStatus)}
            onClick={() => navigateToPage('qa-team')}
          />

          <MetricTile
            title="QaaS Program Value"
            value={qaasValue}
            context={qaasSubtitle}
            target={qaasTargetDisplay.replace('Target: ', '')}
            status={'Normal' as RAGStatus}
            ariaLabel={`QaaS Program Value: ${qaasValue}. ${qaasSubtitle}. ${qaasTargetDisplay}`}
            onClick={() => navigateToPage('value-adds')}
          />

          <MetricTile
            title="Red Client Sentiment"
            value={`${redSentimentCount}`}
            context={redSentimentSubtitle}
            status={'Normal' as RAGStatus}
            isRedHighlight={redSentimentCount > 0}
            ariaLabel={`Red Client Sentiment: ${redSentimentSubtitle}`}
            onClick={() => openDrawer('sentiment-red')}
          />

          <MetricTile
            title="Action Closure Rate"
            value={actionClosureValue}
            context={actionSubtitle}
            footerNote={actionFooter}
            status={'Normal' as RAGStatus}
            ariaLabel={`Action Closure Rate: ${actionClosureValue}. ${actionSubtitle}. ${actionFooter}`}
            className="col-span-2 sm:col-span-1"
            onClick={() => navigateToPage('actions')}
          />
        </div>
      </div>

      {/* DESKTOP LAYOUT (>= md / 768px): One unified strip with 6 internally divided cells */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 divide-y lg:divide-y-0 md:divide-x divide-border-subtle">
        {desktopKpis.map((kpi) => {
          return (
            <div
              key={kpi.id}
              onClick={kpi.onClick}
              className={`p-3 flex flex-col justify-between h-full cursor-pointer hover:bg-surface-hover transition-colors select-none group ${
                kpi.isRedHighlight ? 'bg-status-red-bg/30' : ''
              }`}
            >
              {/* Top row: Metric Title + Status */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-eyebrow text-slate-500 truncate group-hover:text-navy-900 transition-colors">
                  {kpi.title}
                </span>
                {kpi.rag && <StatusBadge status={kpi.rag} size="xs" />}
              </div>

              {/* Middle: Big Metric Value + Subtitle */}
              <div className="my-1">
                <div className={`text-metric-sm tracking-tight flex items-baseline justify-between tnum ${kpi.valueColorClass || 'text-navy-900'}`}>
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
                  {kpi.periodLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
