import React from 'react';
import { Lightbulb, ChevronRight, AlertTriangle } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';

export const LeadershipInsights: React.FC = () => {
  const { navigateToPage, openDrawer } = useFilters();
  const { overview } = useDashboardData();

  const kpis = overview?.KPI_Cards || [];
  const m002 = kpis.find((k) => k.Metric_ID === 'M002');

  const redSentimentCount = overview?.Client_Sentiment_Red_Accounts ?? 0;
  const highRiskCount = overview?.Accounts_With_Red_KPI ?? ((overview?.Critical_Attention_Accounts ?? 0) + (overview?.High_Attention_Accounts ?? 0));
  const overdueCount = overview?.Overdue_Actions ?? 0;

  const getTargetDisplay = (kpi?: { Target_Display?: string | null; Target_Value?: number | null }, isPct = true) => {
    if (kpi?.Target_Display) return kpi.Target_Display;
    if (kpi?.Target_Value !== null && kpi?.Target_Value !== undefined) {
      return isPct ? `${(kpi.Target_Value * 100).toFixed(1)}%` : kpi.Target_Value.toFixed(1);
    }
    return 'N/A';
  };

  const topInsights = [
    {
      id: 'ins-sla',
      title: m002?.RAG === 'GREEN' ? 'Enterprise SLA within contractual target bounds' : 'SLA performance requires focused operational governance',
      description: `Scoped SLA achievement stands at ${m002?.Actual_Display || (m002?.Actual_Value !== null && m002?.Actual_Value !== undefined ? `${(m002.Actual_Value * 100).toFixed(1)}%` : 'N/A')} against target ${getTargetDisplay(m002, true)}.`,
      type: m002?.RAG === 'GREEN' ? 'info' : 'risk',
      tag: 'SLA & Contracts',
    },
    {
      id: 'ins-attention',
      title: `${highRiskCount} accounts flagged for leadership inspection`,
      description: `${redSentimentCount} accounts have Red client sentiment, with ${overview?.Open_Escalations != null ? `${overview.Open_Escalations} cases` : 'active'} active escalations across the current scope.`,
      type: 'risk',
      tag: 'Risk & Escalations',
    },
    {
      id: 'ins-governance',
      title: `${overview?.Total_Actions || 0} governance actions currently tracked`,
      description: `Overall closure rate is ${overview?.Action_Snapshot?.Closure_Rate_Display || (overview?.Action_Closure_Rate_Pct !== null && overview?.Action_Closure_Rate_Pct !== undefined ? `${(overview.Action_Closure_Rate_Pct * 100).toFixed(1)}%` : 'N/A')} with ${overdueCount} overdue items pending sign-off.`,
      type: overdueCount > 0 ? 'action' : 'info',
      tag: 'CAPA Governance',
    },
  ];

  return (
    <div className="bg-surface border border-border-default rounded shadow-elevation-1 p-3 sm:p-4 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-label text-navy-900 tracking-tight uppercase">
                Leadership Insights
              </h2>
              <p className="text-caption text-slate-500 hidden sm:block">
                Synthesized operational priorities and cross-vertical highlights.
              </p>
            </div>
          </div>
          <span className="text-caption px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded uppercase tracking-wider">
            Priority Triaged
          </span>
        </div>

        {/* 3 Prominent High-Priority Insights */}
        <div className="divide-y divide-border-subtle mb-3">
          {topInsights.map((insight) => (
            <div
              key={insight.id}
              onClick={() => navigateToPage('insights')}
              className="py-3 first:pt-1 last:pb-1 hover:bg-surface-hover transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-body font-semibold text-navy-900 group-hover:text-teal-600 transition-colors leading-snug">
                  {insight.title}
                </span>
                <span className={`text-caption px-2 py-0.5 rounded font-semibold shrink-0 whitespace-nowrap ${
                  insight.type === 'risk' 
                    ? 'bg-status-red-bg text-status-red-text border border-status-red-border' 
                    : insight.type === 'action'
                    ? 'bg-status-amber-bg text-status-amber-text border border-status-amber-border'
                    : 'bg-slate-100 text-slate-700 border border-border-default'
                }`}>
                  {insight.tag}
                </span>
              </div>
              <p className="text-caption text-slate-600 leading-relaxed font-normal line-clamp-2">
                {insight.description}
              </p>
              <div className="mt-1 flex justify-end">
                <span className="text-caption font-medium text-teal-600 group-hover:underline flex items-center gap-1">
                  View insight &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Leadership Attention */}
        <div className="pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-eyebrow text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-status-red-dot" />
              Leadership Attention
            </span>
            <button
              onClick={() => openDrawer('attention')}
              className="text-caption font-medium text-teal-600 hover:underline cursor-pointer"
            >
              Inspect All &rarr;
            </button>
          </div>

          {/* Compact Actionable Rows */}
          <div className="divide-y divide-border-subtle border border-border-default rounded overflow-hidden">
            <button
              onClick={() => openDrawer('sentiment-red')}
              className="w-full px-3 py-2 bg-surface hover:bg-surface-hover active:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <span className="text-label text-slate-700">Red Client Sentiment</span>
              <div className="flex items-center gap-2">
                <span className="text-label font-bold text-status-red-text tnum">
                  {redSentimentCount} Accounts
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => openDrawer('attention')}
              className="w-full px-3 py-2 bg-surface hover:bg-surface-hover active:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <span className="text-label text-slate-700">High Risk Monitored</span>
              <div className="flex items-center gap-2">
                <span className="text-label font-bold text-status-red-text tnum">
                  {highRiskCount} Accounts
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => navigateToPage('actions')}
              className="w-full px-3 py-2 bg-surface hover:bg-surface-hover active:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <span className="text-label text-slate-700">Overdue Actions</span>
              <div className="flex items-center gap-2">
                <span className="text-label font-bold text-status-red-text tnum">
                  {overdueCount} CAPAs
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 mt-2 border-t border-border-subtle flex items-center justify-between text-caption text-slate-500">
        <span className="text-caption text-slate-400 font-medium">Synthesized across monitored accounts</span>
        <button
          onClick={() => navigateToPage('insights')}
          className="text-teal-600 hover:text-teal-800 text-caption font-bold cursor-pointer flex items-center gap-1 group transition-colors"
        >
          <span>Full Insights Hub</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
