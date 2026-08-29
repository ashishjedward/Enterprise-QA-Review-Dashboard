import React from 'react';
import { RAGStatus } from '../../types';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  rag?: RAGStatus;
  target?: number;
  showPoints?: boolean;
  strokeWidth?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 72,
  height = 20,
  rag = 'GREEN',
  target,
  showPoints = false,
  strokeWidth = 1.5,
  className = '',
}) => {
  if (!data || data.length < 2) return <div style={{ width, height }} className="bg-slate-100/60 rounded" />;

  const min = Math.min(...data, target !== undefined ? target * 0.98 : Infinity);
  const max = Math.max(...data, target !== undefined ? target * 1.02 : -Infinity);
  const range = max - min === 0 ? 1 : max - min;
  const paddingY = 2;
  const usableHeight = height - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 4) + 2;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return `${x},${y}`;
  }).join(' ');

  let strokeColor = '#0284c7'; // default neutral analytical teal/blue
  if (rag === 'GREEN') strokeColor = '#16a34a';
  else if (rag === 'AMBER') strokeColor = '#d97706';
  else if (rag === 'RED') strokeColor = '#dc2626';

  const lastPointX = width - 2;
  const lastPointY = height - paddingY - ((data[data.length - 1] - min) / range) * usableHeight;

  return (
    <svg 
      width={width} 
      height={height} 
      className={`overflow-visible inline-block ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      {target !== undefined && (
        <line
          x1={2}
          y1={height - paddingY - ((target - min) / range) * usableHeight}
          x2={width - 2}
          y2={height - paddingY - ((target - min) / range) * usableHeight}
          stroke="#cbd5e1"
          strokeDasharray="2 2"
          strokeWidth={1}
        />
      )}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {showPoints && (
        <circle
          cx={lastPointX}
          cy={lastPointY}
          r={2}
          fill={strokeColor}
        />
      )}
    </svg>
  );
};
