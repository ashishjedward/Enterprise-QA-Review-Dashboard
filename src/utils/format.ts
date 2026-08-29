/**
 * Utility functions for numeric and text formatting in the enterprise dashboard.
 */

/**
 * Formats a delta value with strict sign semantics:
 * - Positive: +1.4%
 * - Negative: −0.5% (using true Unicode minus U+2212, never hyphen)
 * - Zero: 0.0% (unsigned)
 */
export function formatDelta(value: number, unit: string = '%', decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) return `0.0${unit}`;
  const rounded = Number(value.toFixed(decimals));
  if (rounded === 0 || Object.is(rounded, -0)) {
    return `${(0).toFixed(decimals)}${unit}`;
  }
  if (rounded > 0) {
    return `+${rounded.toFixed(decimals)}${unit}`;
  }
  return `\u2212${Math.abs(rounded).toFixed(decimals)}${unit}`;
}

/**
 * Formats a number with tabular-friendly fixed decimal places.
 */
export function formatNumber(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) return '0.0';
  return value.toFixed(decimals);
}

/**
 * Formats percentage values safely.
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}%`;
}
