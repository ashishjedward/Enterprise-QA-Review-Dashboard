import React from 'react';
import { RAGStatus } from '../../types';

interface StatusBadgeProps {
  status?: RAGStatus | 'Green' | 'Amber' | 'Red' | 'Open' | 'Overdue' | 'Due Soon' | 'Closed' | 'High' | 'Medium' | 'Low' | 'N/A' | string | null;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  label, 
  size = 'sm',
  className = '' 
}) => {
  let style = 'bg-slate-100 text-slate-600 border-slate-200';
  let dotColor = 'bg-slate-400';

  const normalized = status ? status.toString().trim().toUpperCase() : 'N/A';

  if (normalized === 'GREEN' || normalized === 'CLOSED') {
    style = 'bg-status-green-bg text-status-green-text border-status-green-border';
    dotColor = 'bg-status-green-dot';
  } else if (normalized === 'AMBER' || normalized === 'DUE SOON' || normalized === 'MEDIUM') {
    style = 'bg-status-amber-bg text-status-amber-text border-status-amber-border';
    dotColor = 'bg-status-amber-dot';
  } else if (normalized === 'RED' || normalized === 'OVERDUE' || normalized === 'HIGH') {
    style = 'bg-status-red-bg text-status-red-text border-status-red-border';
    dotColor = 'bg-status-red-dot';
  } else if (normalized === 'OPEN' || normalized === 'LOW') {
    style = 'bg-sky-50 text-sky-800 border-sky-200';
    dotColor = 'bg-sky-600';
  }

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-caption gap-1 font-semibold',
    sm: 'px-2 py-0.5 text-caption gap-1.5 font-medium',
    md: 'px-2.5 py-1 text-label gap-1.5 font-medium',
  };

  const displayText = label || (
    normalized === 'GREEN' ? 'On Track' :
    normalized === 'AMBER' ? 'Caution' :
    normalized === 'RED' ? 'At Risk' :
    normalized === 'N/A' ? 'N/A' : status || 'N/A'
  );

  return (
    <span 
      className={`inline-flex items-center rounded border whitespace-nowrap ${sizeClasses[size]} ${style} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{displayText}</span>
    </span>
  );
};

