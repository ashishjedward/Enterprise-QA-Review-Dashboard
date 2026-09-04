import { TimePeriod, MetricTrendPoint } from '../types';

export const FULL_12_MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'] as const;

/**
 * Returns the month labels for the selected time period.
 */
export function getMonthsForPeriod(period: TimePeriod): typeof FULL_12_MONTHS[number][] {
  switch (period) {
    case '3M':
      return [...FULL_12_MONTHS.slice(-3)];
    case '6M':
      return [...FULL_12_MONTHS.slice(-6)];
    case 'YTD': {
      const janIndex = FULL_12_MONTHS.indexOf('Jan');
      return janIndex >= 0 ? [...FULL_12_MONTHS.slice(janIndex)] : [...FULL_12_MONTHS.slice(-8)];
    }
    case '12M':
    default:
      return [...FULL_12_MONTHS];
  }
}

/**
 * Returns the corresponding index range into FULL_12_MONTHS (and 12M historical arrays)
 */
export function getMonthIndicesForPeriod(period: TimePeriod): number[] {
  const months = getMonthsForPeriod(period);
  return months.map((m) => FULL_12_MONTHS.indexOf(m)).filter((idx) => idx !== -1);
}

/**
 * Slices a 12-month historical trend array based on the selected time period.
 */
export function sliceHistoryByPeriod<T>(history: T[] | undefined | null, period: TimePeriod): T[] {
  const safeHistory = Array.isArray(history) ? history : [];
  if (safeHistory.length === 0) return [];

  const indices = getMonthIndicesForPeriod(period);
  return indices
    .map((idx) => safeHistory[idx])
    .filter((item): item is T => item !== undefined && item !== null);
}

/**
 * Slices numeric trend points or values for sparklines / charts
 */
export function sliceTrendValuesByPeriod(values: number[] | undefined | null, period: TimePeriod): number[] {
  const safeValues = Array.isArray(values) ? values : [];
  if (safeValues.length === 0) return [];
  const indices = getMonthIndicesForPeriod(period);
  return indices
    .map((idx) => safeValues[idx])
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
}
