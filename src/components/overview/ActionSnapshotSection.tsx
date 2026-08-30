import React from 'react';
import { ListChecks, ChevronRight } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import { MetricTile } from '../common/MetricTile';
import { RAGStatus } from '../../types';

export const ActionSnapshotSection: React.FC = () => {
  const { navigateToPage } = useFilters();
  const { overview } = useDashboardData();

  const actionSnapshot = overview?.Action_Snapshot;
  const openCount = Number(actionSnapshot?.Open_Actions ?? overview?.Open_Actions ?? 0);
  const overdueCount = Number(actionSnapshot?.Overdue_Actions ?? overview?.Overdue_Actions ?? 0);
  const dueNext7Count = Number(actionSnapshot?.Due_Next_7_Days ?? overview?.Due_Next_7_Days ?? 0);
  
  const closureRateVal = actionSnapshot?.Closure_Rate ?? null;
  const closureRateDisplay = actionSnapshot?.Closure_Rate_Display 
    || (closureRateVal !== null && closureRateVal !== undefined ? `${(closureRateVal * 100).toFixed(1)}%` : 'N/A');
  const closureRag: RAGStatus = (actionSnapshot?.Closure_Rate_RAG?.toUpperCase() as RAGStatus) || ('Normal' as any);
  const closureRateTarget = actionSnapshot?.Closure_Rate_Target;
  const closureContext = closureRateTarget !== null && closureRateTarget !== undefined
    ? `Target: ${(closureRateTarget * 100).toFixed(1)}%`
    : 'Matured action commitments';

  return (
    <div className="bg-surface border border-border-default rounded shadow-elevation-1 p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-border-subtle gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-slate-100 border border-border-default flex items-center justify-center text-slate-700 shrink-0">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-label text-navy-900 tracking-tight uppercase font-semibold">
              Action & Governance Snapshot
            </h2>
            <p className="text-caption text-slate-500 hidden sm:block">
              Current action backlog, due-date risk, and closure progress.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateToPage('actions')}
          className="text-label font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 self-end sm:self-auto cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label={`Go to Action Hub with ${openCount} open actions`}
        >
          <span>Action Hub ({openCount})</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Action Tiles: 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border-subtle border border-border-default rounded overflow-hidden">
        {/* 1. Open Actions */}
        <MetricTile
          title="OPEN ACTIONS"
          value={openCount}
          context="Current active backlog"
          status="Open"
          onClick={() => navigateToPage('actions')}
          className="h-full"
        />

        {/* 2. Overdue (Clear Red Highlight) */}
        <MetricTile
          title="OVERDUE"
          value={overdueCount}
          context="Past due date"
          status="Overdue"
          isRedHighlight={overdueCount > 0}
          onClick={() => navigateToPage('actions')}
          className="h-full"
        />

        {/* 3. Due Next 7 Days */}
        <MetricTile
          title="DUE NEXT 7 DAYS"
          value={dueNext7Count}
          context="Due within 7 days"
          status="Due Soon"
          onClick={() => navigateToPage('actions')}
          className="h-full"
        />

        {/* 4. Closure Rate */}
        <MetricTile
          title="CLOSURE RATE"
          value={closureRateDisplay}
          context={closureContext}
          status={closureRag}
          onClick={() => navigateToPage('actions')}
          className="h-full"
        />
      </div>

      {/* Full-width interactive footer row directing to Action Hub */}
      <button
        type="button"
        onClick={() => navigateToPage('actions')}
        className="w-full mt-3 py-2 px-3 bg-surface-subtle hover:bg-slate-100 border border-border-default rounded text-caption font-semibold text-slate-700 hover:text-navy-900 flex items-center justify-between transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        aria-label="View all action items and remediation playbooks in Action Hub"
      >
        <span>View all action items & remediation playbooks</span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
};
