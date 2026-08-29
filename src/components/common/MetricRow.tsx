import React from 'react';
import { RAGStatus } from '../../types';
import { StatusDot } from './StatusDot';

export interface MetricRowProps {
  title: string;
  shortTitle?: string;
  value: string | number;
  unit?: string;
  suffix?: string;
  target?: string | number;
  status: RAGStatus | 'Open' | 'Overdue' | 'Due Soon' | 'Closed' | 'High' | 'Medium' | 'Low';
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export const MetricRow: React.FC<MetricRowProps> = ({
  title,
  shortTitle,
  value,
  unit = '',
  suffix,
  target,
  status,
  onClick,
  className = '',
  ariaLabel,
}) => {
  const displayTitle = shortTitle || title;
  const targetText = target !== undefined 
    ? (typeof target === 'string' && target.startsWith('Tgt') ? target : `Tgt ${target}`) 
    : undefined;

  const accessibleLabel = ariaLabel || `${title}: ${value}${unit ? ` ${unit}` : ''}${suffix ? ` ${suffix}` : ''}. Status: ${status}.${targetText ? ` ${targetText}` : ''}`;

  const containerClasses = `w-full text-left py-2.5 px-3 min-h-[44px] flex items-center justify-between gap-3 transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 hover:bg-surface-hover active:bg-slate-100 ${
    onClick ? 'cursor-pointer' : ''
  } ${className}`;

  const content = (
    <>
      {/* Left Zone: [Dot] + Label */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <StatusDot status={status} />
        <span 
          className="text-label text-navy-900 font-medium truncate leading-snug" 
          title={title}
        >
          {displayTitle}
        </span>
      </div>

      {/* Right Zone: Value (top, 16px/600 .tnum) + Target (bottom, 11px muted .tnum) */}
      <div className="shrink-0 text-right flex flex-col items-end justify-center">
        <div className="text-body font-semibold text-navy-900 tnum leading-tight flex items-baseline gap-1">
          <span>{value}{unit}</span>
          {suffix && (
            <span className="text-caption font-normal text-slate-500">
              {suffix}
            </span>
          )}
        </div>
        {targetText && (
          <div className="text-caption text-slate-500 font-medium tnum leading-tight mt-0.5">
            {targetText}
          </div>
        )}
      </div>
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
