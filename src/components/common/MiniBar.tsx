import React from 'react';
import { RAGStatus } from '../../types';

interface MiniBarProps {
  label: string;
  value: number;
  target?: number;
  unit?: string;
  max?: number;
  min?: number;
  rag?: RAGStatus;
  subLabel?: string;
  onClick?: () => void;
  isClickable?: boolean;
  highlight?: boolean;
}

export const MiniBar: React.FC<MiniBarProps> = ({
  label,
  value,
  target,
  unit = '%',
  max = 100,
  min = 80,
  rag,
  subLabel,
  onClick,
  isClickable = false,
  highlight = false,
}) => {
  const normalizedRange = max - min;
  const clampedValue = Math.min(Math.max(value, min), max);
  const fillPercentage = Math.max(0, Math.min(100, ((clampedValue - min) / normalizedRange) * 100));

  let barColor = 'bg-sky-600';
  if (rag === 'GREEN') barColor = 'bg-emerald-600';
  else if (rag === 'AMBER') barColor = 'bg-amber-500';
  else if (rag === 'RED') barColor = 'bg-rose-600';

  const targetPercentage = target !== undefined ? Math.max(0, Math.min(100, ((target - min) / normalizedRange) * 100)) : null;

  return (
    <div 
      onClick={onClick}
      className={`group py-1.5 px-2 rounded transition-colors ${
        isClickable ? 'cursor-pointer hover:bg-slate-50' : ''
      } ${highlight ? 'bg-slate-50/80 font-medium' : ''}`}
    >
      <div className="flex items-center justify-between text-xs mb-1">
        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
          <span className="text-slate-800 font-medium truncate">{label}</span>
          {subLabel && <span className="text-slate-500 text-[11px] truncate">({subLabel})</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-900">{value.toFixed(1)}{unit}</span>
          {target !== undefined && (
            <span className="text-[11px] text-slate-500">Tgt: {target.toFixed(1)}{unit}</span>
          )}
        </div>
      </div>
      <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${barColor}`} 
          style={{ width: `${fillPercentage}%` }} 
        />
        {targetPercentage !== null && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" 
            style={{ left: `${targetPercentage}%` }} 
            title={`Target: ${target}${unit}`}
          />
        )}
      </div>
    </div>
  );
};
