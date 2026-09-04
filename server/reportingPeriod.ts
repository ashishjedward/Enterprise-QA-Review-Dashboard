import { BigQuery } from '@google-cloud/bigquery';
import { getBigQueryClient, getBigQueryConfig, serializeBigQueryValue } from './bigquery';

export type ReportingPeriodKey = '3M' | '6M' | 'YTD' | '12M';

export interface ReportingWindow {
  period: ReportingPeriodKey;
  startDate: string;        // e.g. "2026-05-01" (first day of start month)
  endDate: string;          // e.g. "2026-07-31" (last day of closed month)
  startMonth: string;       // e.g. "2026-05-01" (first day of start month)
  endMonth: string;         // e.g. "2026-07-01" (first day of closed month)
  startMonthLabel: string;  // e.g. "May-26"
  endMonthLabel: string;    // e.g. "Jul-26"
  monthCount: number;       // 3, 6, 7 (for Jul YTD), 12
}

export interface AuthoritativeReportingContext {
  latestClosedMonth: string;        // e.g. "2026-07-01"
  officialReportingMonth: string;   // e.g. "Jul-26"
  currentOpenMonth: string;         // e.g. "2026-08-01"
  liveReportingMonth: string;       // e.g. "Aug-26"
  latestAvailableMonth: string;     // e.g. "2026-08-01"
  currentSubmissionDeadline: string;// e.g. "2026-09-05"
  windows: Record<ReportingPeriodKey, ReportingWindow>;
}

export function getLastDayOfMonth(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month, 0));
  return d.toISOString().slice(0, 10);
}

export function formatMonthLabel(year: number, month: number): string {
  const moNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${moNames[month - 1]}-${String(year).slice(2)}`;
}

export function resolveReportingWindows(latestClosedMonthStr: string): {
  latestClosedMonth: string;
  officialReportingMonth: string;
  windows: Record<ReportingPeriodKey, ReportingWindow>;
} {
  const cleanDateStr = latestClosedMonthStr.slice(0, 10);
  const parts = cleanDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new Error(`Invalid latestClosedMonth format: "${latestClosedMonthStr}". Expected YYYY-MM or YYYY-MM-DD.`);
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const getFirstDay = (y: number, m: number) => `${y}-${pad(m)}-01`;
  const getPriorMonth = (y: number, m: number, monthsBack: number) => {
    const d = new Date(Date.UTC(y, m - 1 - monthsBack, 1));
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
    };
  };

  const endDayStr = getLastDayOfMonth(year, month);
  const endMonthStr = getFirstDay(year, month);
  const endMonthLabel = formatMonthLabel(year, month);

  // 3M: 2 months prior to latestClosedMonth
  const p3 = getPriorMonth(year, month, 2);
  const start3M = getFirstDay(p3.year, p3.month);

  // 6M: 5 months prior to latestClosedMonth
  const p6 = getPriorMonth(year, month, 5);
  const start6M = getFirstDay(p6.year, p6.month);

  // YTD: January 1 of latestClosedMonth's calendar year
  const startYTD = getFirstDay(year, 1);

  // 12M: 11 months prior to latestClosedMonth
  const p12 = getPriorMonth(year, month, 11);
  const start12M = getFirstDay(p12.year, p12.month);

  return {
    latestClosedMonth: endMonthStr,
    officialReportingMonth: endMonthLabel,
    windows: {
      '3M': {
        period: '3M',
        startDate: start3M,
        endDate: endDayStr,
        startMonth: start3M,
        endMonth: endMonthStr,
        startMonthLabel: formatMonthLabel(p3.year, p3.month),
        endMonthLabel,
        monthCount: 3,
      },
      '6M': {
        period: '6M',
        startDate: start6M,
        endDate: endDayStr,
        startMonth: start6M,
        endMonth: endMonthStr,
        startMonthLabel: formatMonthLabel(p6.year, p6.month),
        endMonthLabel,
        monthCount: 6,
      },
      'YTD': {
        period: 'YTD',
        startDate: startYTD,
        endDate: endDayStr,
        startMonth: startYTD,
        endMonth: endMonthStr,
        startMonthLabel: formatMonthLabel(year, 1),
        endMonthLabel,
        monthCount: month, // e.g. July = 7, August = 8, January = 1
      },
      '12M': {
        period: '12M',
        startDate: start12M,
        endDate: endDayStr,
        startMonth: start12M,
        endMonth: endMonthStr,
        startMonthLabel: formatMonthLabel(p12.year, p12.month),
        endMonthLabel,
        monthCount: 12,
      },
    },
  };
}

export async function fetchAuthoritativeReportingContext(
  bqClient?: BigQuery,
  projId?: string,
  ds?: string,
  loc?: string
): Promise<AuthoritativeReportingContext> {
  const bq = bqClient || getBigQueryClient();
  const config = getBigQueryConfig();
  const projectId = projId || config.projectId;
  const dataset = ds || config.dataset;
  const location = loc || config.location;

  const query = `
    SELECT
      Latest_Available_Month,
      Latest_Closed_Month,
      FORMAT_DATE('%b-%y', Latest_Closed_Month) AS Official_Reporting_Month,
      Current_Open_Month,
      FORMAT_DATE('%b-%y', Current_Open_Month) AS Live_Reporting_Month,
      Current_Submission_Deadline
    FROM \`${projectId}.${dataset}.vw_reporting_context\`
    LIMIT 1
  `;

  const [rows] = await bq.query({ query, location });
  if (!rows || rows.length === 0) {
    throw new Error('Authoritative reporting context unavailable: vw_reporting_context returned empty result');
  }

  const row = serializeBigQueryValue(rows[0]) as Record<string, unknown>;
  const latestClosedMonth = String(row.Latest_Closed_Month || '');
  if (!latestClosedMonth) {
    throw new Error('Authoritative reporting context unavailable: Latest_Closed_Month is empty');
  }

  const resolved = resolveReportingWindows(latestClosedMonth);

  return {
    latestClosedMonth: resolved.latestClosedMonth,
    officialReportingMonth: String(row.Official_Reporting_Month || resolved.officialReportingMonth),
    currentOpenMonth: String(row.Current_Open_Month || ''),
    liveReportingMonth: String(row.Live_Reporting_Month || ''),
    latestAvailableMonth: String(row.Latest_Available_Month || ''),
    currentSubmissionDeadline: String(row.Current_Submission_Deadline || ''),
    windows: resolved.windows,
  };
}
