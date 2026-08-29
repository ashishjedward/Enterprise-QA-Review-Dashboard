import React from 'react';
import { RefreshCw, Download, Sparkles, ShieldCheck, Menu } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

export const Header: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { lastUpdated, isRefreshing, refreshDashboard, openDrawer, navigateToPage, activePage } = useFilters();

  return (
    <header className="bg-surface border-b border-border-default sticky top-0 z-30 px-3 sm:px-6 py-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded text-slate-500 hover:text-navy-900 hover:bg-slate-100 md:hidden cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="w-8 h-8 rounded bg-navy-900 flex items-center justify-center text-white shrink-0 shadow-elevation-1">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-body font-bold sm:text-body-lg text-navy-900 tracking-tight">
                Enterprise QA Review Dashboard
              </h1>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 text-caption font-bold bg-slate-100 text-slate-700 rounded border border-border-default uppercase tracking-wider">
                Executive
              </span>
            </div>
            <p className="text-caption text-slate-500 font-normal">
              Leadership view of QA performance, risk, value and action across enterprise operations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center text-label">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-border-default rounded text-slate-600 text-caption tnum">
            <span className="w-2 h-2 rounded-full bg-status-green-dot"></span>
            <span>Last updated: {lastUpdated}</span>
          </div>

          <button
            onClick={refreshDashboard}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-label font-semibold text-slate-700 bg-surface border border-border-default rounded hover:bg-surface-hover active:bg-slate-100 transition-colors disabled:opacity-60 cursor-pointer"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => openDrawer('ask-gemini')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-label font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Ask Gemini</span>
          </button>

          <button
            onClick={() => navigateToPage('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-label font-semibold border rounded transition-colors cursor-pointer ${
              activePage === 'reports'
                ? 'bg-navy-900 text-white border-navy-900'
                : 'text-slate-700 bg-surface border-border-default hover:bg-surface-hover'
            }`}
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export Pack</span>
          </button>
        </div>
      </div>
    </header>
  );
};
