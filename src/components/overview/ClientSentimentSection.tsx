import React from 'react';
import { HeartPulse, ChevronRight } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import { StatusBadge } from '../common/StatusBadge';
import { RAGStatus } from '../../types';

export const ClientSentimentSection: React.FC = () => {
  const { openDrawer } = useFilters();
  const { overview } = useDashboardData();

  const redCount = Number(overview?.Client_Sentiment_Red_Accounts ?? 0);
  const amberCount = Number(overview?.Client_Sentiment_Amber_Accounts ?? 0);
  const greenCount = Number(overview?.Client_Sentiment_Green_Accounts ?? 0);
  const total = Number(overview?.Total_Accounts ?? (redCount + amberCount + greenCount) ?? 1);

  const redPct = total > 0 ? Math.round((redCount / total) * 100) : 0;
  const amberPct = total > 0 ? Math.round((amberCount / total) * 100) : 0;
  const greenPct = total > 0 ? Math.max(0, 100 - redPct - amberPct) : 0;

  const rawRag = overview?.Enterprise_Client_Sentiment_RAG;
  const overallRag = (rawRag ? String(rawRag).toUpperCase() : 'Normal') as RAGStatus;

  const topAttention = overview?.Top_Attention_Accounts?.[0];

  return (
    <div className="bg-surface border border-border-default rounded shadow-elevation-1 p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-label text-navy-900 tracking-tight uppercase">
                Client Sentiment Overview
              </h2>
              <span className="text-caption px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold uppercase tracking-wider">
                Executive
              </span>
            </div>
            <p className="text-caption text-slate-500 hidden sm:block">
              Continuous CSAT pulse, stakeholder satisfaction surveys, and renewal sentiment risk.
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => openDrawer('sentiment-all')}
          className="text-label font-bold text-teal-600 hover:text-teal-800 self-end sm:self-auto cursor-pointer flex items-center gap-1 transition-colors"
        >
          <span>Sentiment Register &rarr;</span>
        </button>
      </div>

      {/* Main KPI Row: Large Number + 3 Sentiment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
        {/* Left: Overall Health Banner */}
        <div className="md:col-span-3 flex flex-col justify-between p-3 bg-surface-subtle border border-border-default rounded">
          <div>
            <span className="text-eyebrow text-slate-500">Enterprise Sentiment</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-metric-lg text-navy-900 font-bold tnum">
                {overview?.Enterprise_Client_Sentiment_Display || `${total - redCount}/${total}`}
              </span>
              <span className="text-caption text-slate-500 font-medium">Healthy</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between">
            <span className="text-caption font-semibold text-slate-700">Posture</span>
            <StatusBadge status={overallRag} size="sm" />
          </div>
        </div>

        {/* Right: 3 Sentiment Distribution Cards */}
        <div className="md:col-span-9 grid grid-cols-3 divide-x divide-border-subtle border border-border-default rounded overflow-hidden">
          {/* Green Card */}
          <button
            onClick={() => openDrawer('sentiment-green')}
            className="p-3 bg-surface hover:bg-surface-hover text-left flex flex-col justify-between transition-colors cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-label font-semibold text-status-green-text flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-green-dot" />
                  Green
                </span>
                <span className="text-caption text-slate-400 font-medium group-hover:text-slate-700 transition-colors">
                  {greenPct}%
                </span>
              </div>
              <div className="text-metric-md text-navy-900 tnum mt-1">
                {greenCount}
              </div>
            </div>
            <div className="mt-2 text-caption text-slate-500 font-medium group-hover:text-teal-600 flex items-center gap-0.5">
              <span>Healthy accounts</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Amber Card */}
          <button
            onClick={() => openDrawer('sentiment-amber')}
            className="p-3 bg-surface hover:bg-surface-hover text-left flex flex-col justify-between transition-colors cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-label font-semibold text-status-amber-text flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-amber-dot" />
                  Amber
                </span>
                <span className="text-caption text-slate-400 font-medium group-hover:text-slate-700 transition-colors">
                  {amberPct}%
                </span>
              </div>
              <div className="text-metric-md text-navy-900 tnum mt-1">
                {amberCount}
              </div>
            </div>
            <div className="mt-2 text-caption text-slate-500 font-medium group-hover:text-teal-600 flex items-center gap-0.5">
              <span>Watchlist accounts</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Red Card */}
          <button
            onClick={() => openDrawer('sentiment-red')}
            className="p-3 bg-surface hover:bg-surface-hover text-left flex flex-col justify-between transition-colors cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-label font-semibold text-status-red-text flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-red-dot animate-pulse" />
                  Red
                </span>
                <span className="text-caption text-slate-400 font-medium group-hover:text-slate-700 transition-colors">
                  {redPct}%
                </span>
              </div>
              <div className="text-metric-md text-navy-900 tnum mt-1">
                {redCount}
              </div>
            </div>
            <div className="mt-2 text-caption text-slate-500 font-medium group-hover:text-teal-600 flex items-center gap-0.5">
              <span>Immediate risk</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Sentiment Proportion Bar */}
      <div className="mb-3">
        <div className="w-full bg-slate-100 h-2 rounded overflow-hidden flex">
          {greenPct > 0 && (
            <div
              style={{ width: `${greenPct}%` }}
              className="bg-emerald-500 h-full transition-all duration-300"
              title={`Green: ${greenCount} accounts (${greenPct}%)`}
            />
          )}
          {amberPct > 0 && (
            <div
              style={{ width: `${amberPct}%` }}
              className="bg-amber-500 h-full transition-all duration-300"
              title={`Amber: ${amberCount} accounts (${amberPct}%)`}
            />
          )}
          {redPct > 0 && (
            <div
              style={{ width: `${redPct}%` }}
              className="bg-rose-500 h-full transition-all duration-300"
              title={`Red: ${redCount} accounts (${redPct}%)`}
            />
          )}
        </div>
      </div>

      {/* Attention Strip */}
      {redCount > 0 ? (
        <>
          {/* Mobile Attention Card (< md) */}
          <div
            onClick={() => openDrawer('sentiment-red')}
            className="md:hidden bg-status-red-bg border border-status-red-border rounded p-3 transition-colors active:bg-rose-100/60 cursor-pointer flex flex-col justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-red-dot shrink-0" />
              <span className="text-label text-status-red-text leading-snug">
                {redCount} Red accounts require immediate attention
              </span>
            </div>
            <div className="flex justify-end">
              <span className="text-caption font-bold text-status-red-text flex items-center gap-1">
                View Red Accounts &rarr;
              </span>
            </div>
          </div>

          {/* Desktop Attention Strip (>= md) */}
          <div className="hidden md:flex flex-row items-center justify-between gap-2 bg-status-red-bg border border-status-red-border rounded px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-status-red-dot shrink-0 animate-pulse" />
              <span className="text-label font-bold text-status-red-text shrink-0">
                {redCount} Red accounts require immediate attention
              </span>
              {topAttention && (
                <>
                  <span className="text-slate-300 inline">|</span>
                  <span className="text-caption text-slate-600 truncate inline">
                    Highest risk: <strong className="text-navy-900">{topAttention.Account_Name || topAttention.Account || topAttention.Account_ID}</strong> ({topAttention.Primary_Attention_Driver || topAttention.Key_Issue || 'Critical risk identified'})
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => openDrawer('sentiment-red')}
              className="text-label font-bold text-status-red-text hover:underline flex items-center gap-1 shrink-0 cursor-pointer group"
            >
              <span>View Red Accounts &rarr;</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between bg-status-green-bg border border-status-green-border rounded px-3 py-2 text-label text-status-green-text font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-green-dot" />
            <span className="text-label">All monitored accounts currently maintain healthy client sentiment posture.</span>
          </div>
          <button
            onClick={() => openDrawer('sentiment-all')}
            className="text-label font-bold text-status-green-text hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Portfolio &rarr;</span>
          </button>
        </div>
      )}
    </div>
  );
};
