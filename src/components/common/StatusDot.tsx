import React from 'react';
import { RAGStatus } from '../../types';

export interface StatusDotProps {
  status: RAGStatus | 'Open' | 'Overdue' | 'Due Soon' | 'Closed' | 'High' | 'Medium' | 'Low';
  className?: string;
  label?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, className = '', label }) => {
  let dotColor = 'bg-slate-400';
  let defaultLabel = 'Status: Normal';

  if (status === 'GREEN' || status === 'Closed') {
    dotColor = 'bg-status-green-dot';
    defaultLabel = 'Status: On Track';
  } else if (status === 'AMBER' || status === 'Due Soon' || status === 'Medium') {
    dotColor = 'bg-status-amber-dot';
    defaultLabel = 'Status: Caution';
  } else if (status === 'RED' || status === 'Overdue' || status === 'High') {
    dotColor = 'bg-status-red-dot';
    defaultLabel = 'Status: At Risk';
  } else if (status === 'Open' || status === 'Low') {
    dotColor = 'bg-sky-500';
    defaultLabel = 'Status: Open';
  }

  const srText = label ? `Status: ${label}` : defaultLabel;

  return (
    <span className={`inline-flex items-center shrink-0 ${className}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />
      <span className="sr-only">{srText}</span>
    </span>
  );
};
