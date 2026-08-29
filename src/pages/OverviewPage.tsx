import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useDashboardData } from '../context/DashboardDataContext';
import { ExecutiveKpiStrip } from '../components/overview/ExecutiveKpiStrip';
import { ClientSentimentSection } from '../components/overview/ClientSentimentSection';
import { ProcessHealthSection } from '../components/overview/ProcessHealthSection';
import { ValueAddsSection } from '../components/overview/ValueAddsSection';
import { HygieneInputsSection } from '../components/overview/HygieneInputsSection';
import { QATeamSection } from '../components/overview/QATeamSection';
import { LeadershipInsights } from '../components/overview/LeadershipInsights';
import { ActionSnapshotSection } from '../components/overview/ActionSnapshotSection';
import { CompactAskGeminiEntry } from '../components/overview/CompactAskGeminiEntry';

export const OverviewPage: React.FC = () => {
  const { overview, isLoading, error, refresh } = useDashboardData();

  if (isLoading && !overview) {
    return (
      <div className="space-y-3 max-w-[1600px] mx-auto pb-6 animate-pulse">
        <div className="h-28 bg-slate-100 rounded border border-slate-200" />
        <div className="h-44 bg-slate-100 rounded border border-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-8 h-80 bg-slate-100 rounded border border-slate-200" />
          <div className="lg:col-span-4 h-80 bg-slate-100 rounded border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="bg-rose-50 border border-rose-200 rounded p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-rose-900">Failed to load live overview data</h3>
          <p className="text-sm text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-xs cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-3 max-w-[1600px] mx-auto pb-6">
      {/* Top Executive KPI Strip */}
      <section aria-label="Executive KPI Strip">
        <ExecutiveKpiStrip />
      </section>

      {/* First-Class Client Sentiment Section (Reduced ~20% height with attention strip) */}
      <section aria-label="Client Sentiment Overview">
        <ClientSentimentSection />
      </section>

      {/* Primary Diagnostic Grid: Process Health (8 cols) + Leadership Insights (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <ProcessHealthSection />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <LeadershipInsights />
        </div>
      </div>

      {/* Value-adds & QA Team Resource Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 items-stretch">
        <div className="lg:col-span-6 flex flex-col">
          <ValueAddsSection />
        </div>
        <div className="lg:col-span-6 flex flex-col">
          <QATeamSection />
        </div>
      </div>

      {/* Hygiene Inputs Matrix */}
      <section aria-label="Hygiene Inputs Matrix">
        <HygieneInputsSection />
      </section>

      {/* Action Snapshot */}
      <section aria-label="Action and Governance Snapshot">
        <ActionSnapshotSection />
      </section>

      {/* Compact Ask Gemini Assistant Strip */}
      <section aria-label="Ask Gemini Review Assistant">
        <CompactAskGeminiEntry />
      </section>
    </div>
  );
};
