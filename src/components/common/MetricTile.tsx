import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { RAGStatus } from '../../types';
import { StatusDot } from './StatusDot';
import { Sparkline } from './Sparkline';

export interface MetricTileProps {
  title: string;
  shortTitle?: string;
  value: string | number;
  unit?: string;
  context?: string;
  target?: string | number;
  status: RAGStatus | 'Open' | 'Overdue' | 'Due Soon' | 'Closed' | 'High' | 'Medium' | 'Low';
  delta?: string;
  isDeltaPositive?: boolean;
  trend?: number[];
  onClick?: () => void;
  isRedHighlight?: boolean;
  className?: string;
  ariaLabel?: string;
  footerNote?: string;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  title,
  shortTitle,
  value,
  unit = '',
  context,
  target,
  status,
  delta,
  isDeltaPositive,
  trend,
  onClick,
  isRedHighlight = false,
  className = '',
  ariaLabel,
  footerNote,
}) => {
  const displayTitle = shortTitle || title;
  const accessibleLabel = ariaLabel || `${title}: ${value}${unit ? ` ${unit}` : ''}. Status: ${status}. ${context || (target ? `Target: ${target}` : '')}`;

  const hasBottomRow = Boolean(delta || (trend && trend.length > 0) || footerNote);

  const containerClasses = `w-full text-left p-3 min-h-[44px] flex flex-col justify-between transition-colors select-none rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 ${
    isRedHighlight
      ? 'bg-status-red-bg/40 hover:bg-status-red-bg/60 active:bg-status-red-bg/70'
      : 'bg-surface hover:bg-surface-hover active:bg-slate-100'
  } ${onClick ? 'cursor-pointer' : ''} ${className}`;

  const content = (
    <>
      {/* Top Block: Title, Value, Target/Context */}
      <div>
        {/* Row 1: [Status Dot] + Title (12px/600, min-h for 2 lines) */}
        <div className="flex items-start gap-1.5 min-h-[32px] mb-1">
          <div className="mt-1 shrink-0">
            <StatusDot status={status} />
          </div>
          <span 
            className="text-eyebrow text-slate-700 font-semibold line-clamp-2 leading-snug break-words" 
            title={title}
          >
            {displayTitle}
          </span>
        </div>

        {/* Row 2: Value (24px/700 .tnum, own line, full width) */}
        <div className="text-metric-sm text-navy-900 font-bold tracking-tight tnum mt-0.5 mb-1 leading-none">
          {value}
          {unit && unit !== '%' && !unit.startsWith('$') ? (
            <span className="text-caption font-medium text-slate-500 ml-1">
              {unit}
            </span>
          ) : (
            unit
          )}
        </div>

        {/* Row 3: Target or context (11px/500, muted, own line) */}
        {(context || target !== undefined) && (
          <div className="text-caption text-slate-500 font-medium tnum truncate mt-0.5">
            {context || `Target: ${target}`}
          </div>
        )}
      </div>

      {/* Row 4 (Optional): Delta / Sparkline or Footnote */}
      {hasBottomRow && (
        <div className="pt-2 mt-2 border-t border-border-subtle flex items-center justify-between text-caption">
          {delta && (
            <span
              className={`inline-flex items-center font-bold text-caption tnum whitespace-nowrap ${
                isDeltaPositive === true
                  ? 'text-status-green-text'
                  : isDeltaPositive === false
                  ? 'text-status-red-text'
                  : 'text-slate-600'
              }`}
            >
              {isDeltaPositive === true && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />}
              {isDeltaPositive === false && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />}
              <span>{delta}</span>
            </span>
          )}

          {footerNote && !delta && (
            <span className="text-caption text-slate-500 truncate font-normal">
              {footerNote}
            </span>
          )}

          {trend && trend.length > 0 && (
            <div className="shrink-0 ml-auto">
              <Sparkline
                data={trend}
                width={40}
                height={12}
                rag={typeof status === 'string' && ['GREEN', 'AMBER', 'RED'].includes(status) ? (status as RAGStatus) : 'GREEN'}
              />
            </div>
          )}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={containerClasses}
        aria-label={accessibleLabel}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={containerClasses} aria-label={accessibleLabel}>
      {content}
    </div>
  );
};
