import { getBigQueryClient, getBigQueryConfig, serializeBigQueryValue } from './bigquery';
import { ScopeFilters } from './scopedOverview';

export type BestQmTimePeriod = '3M' | '6M' | 'YTD' | '12M';

export interface BestQmScopeInfo {
  vertical: string | null;
  qaLeader: string | null;
  srDirector: string | null;
  accountId: string | null;
  site: string | null;
  lob: string | null;
  accountCount: number;
}

export interface BestQmReportingContext {
  latestClosedMonth: string;
  reportingMonthLabel: string;
  isLatestClosedPeriod: boolean;
}

export interface BestQmRangeContext {
  requestedPeriod: BestQmTimePeriod;
  requestedMonthCount: number;
  availableMonthCount: number;
  startMonth: string;
  endMonth: string;
  historyCoverageStatus: 'FULL_HISTORY' | 'PARTIAL_HISTORY';
}

export interface BestQmHeadline {
  Actual_Value: number | null;
  Actual_Display: string;
  Target_Value: number | null;
  Target_Display: string;
  Variance_Value: number | null;
  Variance_Display: string;
  RAG: 'Green' | 'Amber' | 'Red' | null;
  Accounts_On_Target: number;
  Total_Accounts: number;
  Pass_Rate_Pct: number;
  Green_Account_Count: number;
  Amber_Account_Count: number;
  Red_Account_Count: number;
  Critical_Deficit_Names: string[];
}

export interface BestQmParameter {
  Parameter_Name: string;
  Actual_Value: number;
  Actual_Display: string;
  Target_Value: number;
  Target_Display: string;
  Variance_Value: number;
  Variance_Display: string;
  RAG: 'Green' | 'Amber' | 'Red';
  Account_Count: number;
}

export interface BestQmTrendPoint {
  Month: string;
  Reporting_Month: string;
  Actual_Value: number | null;
  Actual_Display: string;
  Target_Value: number;
  Target_Display: string;
  Variance_Value: number | null;
  Variance_Display: string;
  RAG: 'Green' | 'Amber' | 'Red' | null;
  Account_Count: number;
}

export interface BestQmComparisonItem {
  Dimension_Key: string;
  Dimension_Label: string;
  Actual_Value: number;
  Actual_Display: string;
  Target_Value: number;
  Target_Display: string;
  Variance_Value: number;
  Variance_Display: string;
  RAG: 'Green' | 'Amber' | 'Red';
  Account_Count: number;
}

export interface BestQmComparisons {
  byVertical: BestQmComparisonItem[];
  byQaLeader: BestQmComparisonItem[];
  bySrDirector: BestQmComparisonItem[];
}

export interface BestQmAccountRowParameter {
  Parameter_Name: string;
  Score: number;
  Score_Display: string;
  RAG: string;
}

export interface BestQmAccountRow {
  Account_ID: string;
  Account_Name: string;
  Vertical: string;
  QA_Leader: string;
  Sr_Director: string;
  Site: string;
  LOB: string;
  Actual_Value: number;
  Actual_Display: string;
  Target_Value: number;
  Target_Display: string;
  Variance_Value: number;
  Variance_Display: string;
  RAG: 'Green' | 'Amber' | 'Red';
  Parameters: BestQmAccountRowParameter[];
  LD_Remarks: string | null;
}

export interface BestQmDiagnosticData {
  Scope: BestQmScopeInfo;
  Reporting_Context: BestQmReportingContext;
  Range_Context: BestQmRangeContext;
  Headline: BestQmHeadline;
  Trend: BestQmTrendPoint[];
  Parameters: BestQmParameter[];
  Comparisons: BestQmComparisons;
  Accounts: BestQmAccountRow[];
}

export interface BestQmDiagnosticResponse {
  data: BestQmDiagnosticData;
}

function formatScore(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return val.toFixed(1);
}

function formatVarianceScore(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}`;
}

function computeBestQmRag(val: number | null | undefined): 'Green' | 'Amber' | 'Red' | null {
  if (val === null || val === undefined || isNaN(val)) return null;
  if (val >= 90.0) return 'Green';
  if (val >= 85.0) return 'Amber';
  return 'Red';
}

export async function fetchBestQmDiagnostic(
  filters: ScopeFilters & { timePeriod?: string }
): Promise<BestQmDiagnosticData> {
  const bq = getBigQueryClient();
  const { projectId, dataset, location } = getBigQueryConfig();

  const validPeriods: BestQmTimePeriod[] = ['3M', '6M', 'YTD', '12M'];
  const requestedPeriod: BestQmTimePeriod = (
    filters.timePeriod && validPeriods.includes(filters.timePeriod.toUpperCase() as BestQmTimePeriod)
      ? filters.timePeriod.toUpperCase()
      : '12M'
  ) as BestQmTimePeriod;

  if (filters.timePeriod && !validPeriods.includes(filters.timePeriod.toUpperCase() as BestQmTimePeriod)) {
    throw new Error(`Invalid timePeriod: "${filters.timePeriod}". Supported values are: 3M, 6M, YTD, 12M.`);
  }

  const conditions: string[] = [];
  const params: Record<string, string> = {};
  const types: Record<string, string> = {};

  if (filters.vertical && filters.vertical.trim() !== '') {
    conditions.push('m.Vertical = @vertical');
    params.vertical = filters.vertical.trim();
    types.vertical = 'STRING';
  }
  if (filters.qaLeader && filters.qaLeader.trim() !== '') {
    conditions.push('m.QA_Leader = @qaLeader');
    params.qaLeader = filters.qaLeader.trim();
    types.qaLeader = 'STRING';
  }
  if (filters.srDirector && filters.srDirector.trim() !== '') {
    conditions.push('m.Sr_Director = @srDirector');
    params.srDirector = filters.srDirector.trim();
    types.srDirector = 'STRING';
  }
  if (filters.accountId && filters.accountId.trim() !== '') {
    conditions.push('m.Account_ID = @accountId');
    params.accountId = filters.accountId.trim();
    types.accountId = 'STRING';
  }
  if (filters.site && filters.site.trim() !== '') {
    conditions.push('m.Site = @site');
    params.site = filters.site.trim();
    types.site = 'STRING';
  }
  if (filters.lob && filters.lob.trim() !== '') {
    conditions.push('m.LOB = @lob');
    params.lob = filters.lob.trim();
    types.lob = 'STRING';
  }

  const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

  // 1. Get Reporting Context first to anchor dates
  const contextQuery = `
    SELECT 
      Latest_Closed_Month, 
      FORMAT_DATE('%b-%y', Latest_Closed_Month) AS Official_Reporting_Month
    FROM \`${projectId}.${dataset}.vw_reporting_context\`
    LIMIT 1
  `;
  const [contextRows] = await bq.query({ query: contextQuery, location });
  const latestClosedMonthRaw = contextRows[0]?.Latest_Closed_Month;
  const latestClosedMonthStr = typeof latestClosedMonthRaw === 'object' && latestClosedMonthRaw?.value
    ? latestClosedMonthRaw.value
    : String(latestClosedMonthRaw || '2026-07-01');
  const reportingMonthLabel = contextRows[0]?.Official_Reporting_Month || 'Jul-26';

  // Calculate Range Window month count based on latestClosedMonthStr
  const [latestYear, latestMonthNum] = latestClosedMonthStr.split('-').map(Number);
  let requestedMonthCount = 12;
  if (requestedPeriod === '3M') {
    requestedMonthCount = 3;
  } else if (requestedPeriod === '6M') {
    requestedMonthCount = 6;
  } else if (requestedPeriod === 'YTD') {
    requestedMonthCount = latestMonthNum;
  } else if (requestedPeriod === '12M') {
    requestedMonthCount = 12;
  }

  // QUERY 1: Snapshot (Headline, Parameters, Cohort Comparisons, Account Rows)
  const query1 = `
    WITH rep_context AS (
      SELECT 
        Latest_Closed_Month, 
        FORMAT_DATE('%b-%y', Latest_Closed_Month) AS Official_Reporting_Month
      FROM \`${projectId}.${dataset}.vw_reporting_context\`
      LIMIT 1
    ),
    scoped_accounts AS (
      SELECT
        m.Account_ID,
        m.Account AS Account_Name,
        m.Vertical,
        m.QA_Leader,
        m.Sr_Director,
        m.Site,
        m.LOB
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${whereClause}
    ),
    account_best_qm AS (
      SELECT
        b.Account_ID,
        ANY_VALUE(a.Account_Name) AS Account_Name,
        ANY_VALUE(a.Vertical) AS Vertical,
        ANY_VALUE(a.QA_Leader) AS QA_Leader,
        ANY_VALUE(a.Sr_Director) AS Sr_Director,
        ANY_VALUE(a.Site) AS Site,
        ANY_VALUE(a.LOB) AS LOB,
        AVG(b.Final_Score) AS Actual_Value,
        90.0 AS Target_Value,
        AVG(b.Final_Score) - 90.0 AS Variance_Value,
        CASE 
          WHEN AVG(b.Final_Score) >= 90.0 THEN 'Green'
          WHEN AVG(b.Final_Score) >= 85.0 THEN 'Amber'
          ELSE 'Red'
        END AS RAG,
        ARRAY_AGG(
          STRUCT(
            b.Parameter AS Parameter_Name,
            b.Final_Score AS Score,
            FORMAT('%.1f', b.Final_Score) AS Score_Display,
            b.Status_RAG AS RAG
          ) ORDER BY b.Parameter
        ) AS Parameters,
        STRING_AGG(DISTINCT b.Remarks_of_LD_Team, ' | ') AS LD_Remarks
      FROM \`${projectId}.${dataset}.vw_best_qm\` b
      JOIN scoped_accounts a ON b.Account_ID = a.Account_ID
      CROSS JOIN rep_context rc
      WHERE b.Month = rc.Latest_Closed_Month
      GROUP BY b.Account_ID
    ),
    headline_stats AS (
      SELECT
        COUNT(*) AS Total_Accounts,
        COALESCE(AVG(Actual_Value), 0) AS Actual_Value,
        90.0 AS Target_Value,
        COALESCE(AVG(Actual_Value) - 90.0, 0) AS Variance_Value,
        COUNTIF(Actual_Value >= 90.0) AS Accounts_On_Target,
        COUNTIF(RAG = 'Green') AS Green_Account_Count,
        COUNTIF(RAG = 'Amber') AS Amber_Account_Count,
        COUNTIF(RAG = 'Red') AS Red_Account_Count,
        ARRAY_AGG(IF(RAG = 'Red', Account_Name, NULL) IGNORE NULLS) AS Critical_Deficit_Names
      FROM account_best_qm
    ),
    parameters_summary AS (
      SELECT
        b.Parameter AS Parameter_Name,
        AVG(b.Final_Score) AS Actual_Value,
        90.0 AS Target_Value,
        AVG(b.Final_Score) - 90.0 AS Variance_Value,
        CASE 
          WHEN AVG(b.Final_Score) >= 90.0 THEN 'Green'
          WHEN AVG(b.Final_Score) >= 85.0 THEN 'Amber'
          ELSE 'Red'
        END AS RAG,
        COUNT(DISTINCT b.Account_ID) AS Account_Count
      FROM \`${projectId}.${dataset}.vw_best_qm\` b
      JOIN scoped_accounts a ON b.Account_ID = a.Account_ID
      CROSS JOIN rep_context rc
      WHERE b.Month = rc.Latest_Closed_Month
      GROUP BY b.Parameter
      ORDER BY b.Parameter ASC
    ),
    by_vertical AS (
      SELECT
        Vertical AS Dimension_Key,
        Vertical AS Dimension_Label,
        AVG(Actual_Value) AS Actual_Value,
        90.0 AS Target_Value,
        AVG(Actual_Value) - 90.0 AS Variance_Value,
        COUNT(*) AS Account_Count
      FROM account_best_qm
      GROUP BY Vertical
      ORDER BY Actual_Value ASC
    ),
    by_qa_leader AS (
      SELECT
        QA_Leader AS Dimension_Key,
        QA_Leader AS Dimension_Label,
        AVG(Actual_Value) AS Actual_Value,
        90.0 AS Target_Value,
        AVG(Actual_Value) - 90.0 AS Variance_Value,
        COUNT(*) AS Account_Count
      FROM account_best_qm
      GROUP BY QA_Leader
      ORDER BY Actual_Value ASC
    ),
    by_sr_director AS (
      SELECT
        Sr_Director AS Dimension_Key,
        Sr_Director AS Dimension_Label,
        AVG(Actual_Value) AS Actual_Value,
        90.0 AS Target_Value,
        AVG(Actual_Value) - 90.0 AS Variance_Value,
        COUNT(*) AS Account_Count
      FROM account_best_qm
      GROUP BY Sr_Director
      ORDER BY Actual_Value ASC
    )
    SELECT
      (SELECT COUNT(*) FROM scoped_accounts) AS Scoped_Account_Count,
      (SELECT AS STRUCT * FROM headline_stats) AS Headline,
      (SELECT ARRAY_AGG(p) FROM parameters_summary p) AS Parameters,
      (SELECT ARRAY_AGG(v) FROM by_vertical v) AS By_Vertical,
      (SELECT ARRAY_AGG(l) FROM by_qa_leader l) AS By_Qa_Leader,
      (SELECT ARRAY_AGG(d) FROM by_sr_director d) AS By_Sr_Director,
      (SELECT ARRAY_AGG(a ORDER BY a.Actual_Value ASC) FROM account_best_qm a) AS Accounts
  `;

  // QUERY 2: Historical Multi-Month Trend
  const query2 = `
    WITH rep_context AS (
      SELECT Latest_Closed_Month FROM \`${projectId}.${dataset}.vw_reporting_context\` LIMIT 1
    ),
    period_boundary AS (
      SELECT 
        Latest_Closed_Month,
        CASE 
          WHEN @requestedPeriod = '3M' THEN DATE_SUB(rc.Latest_Closed_Month, INTERVAL 2 MONTH)
          WHEN @requestedPeriod = '6M' THEN DATE_SUB(rc.Latest_Closed_Month, INTERVAL 5 MONTH)
          WHEN @requestedPeriod = 'YTD' THEN DATE_TRUNC(rc.Latest_Closed_Month, YEAR)
          WHEN @requestedPeriod = '12M' THEN DATE_SUB(rc.Latest_Closed_Month, INTERVAL 11 MONTH)
          ELSE DATE_SUB(rc.Latest_Closed_Month, INTERVAL 11 MONTH)
        END AS Start_Month
      FROM rep_context rc
    ),
    scoped_accounts AS (
      SELECT m.Account_ID FROM \`${projectId}.${dataset}.vw_account_master\` m WHERE ${whereClause}
    ),
    account_monthly AS (
      SELECT
        b.Month,
        b.Account_ID,
        AVG(b.Final_Score) AS Account_Score
      FROM \`${projectId}.${dataset}.vw_best_qm\` b
      JOIN scoped_accounts a ON b.Account_ID = a.Account_ID
      CROSS JOIN period_boundary pb
      WHERE b.Month >= pb.Start_Month AND b.Month <= pb.Latest_Closed_Month
      GROUP BY b.Month, b.Account_ID
    ),
    monthly_trend AS (
      SELECT
        Month,
        FORMAT_DATE('%b-%y', Month) AS Reporting_Month,
        AVG(Account_Score) AS Actual_Value,
        90.0 AS Target_Value,
        AVG(Account_Score) - 90.0 AS Variance_Value,
        COUNT(DISTINCT Account_ID) AS Account_Count
      FROM account_monthly
      GROUP BY Month
      ORDER BY Month ASC
    )
    SELECT
      (SELECT Start_Month FROM period_boundary) AS Start_Month,
      (SELECT Latest_Closed_Month FROM period_boundary) AS End_Month,
      ARRAY(SELECT AS STRUCT * FROM monthly_trend) AS trend_rows
  `;

  const queryParams2 = { ...params, requestedPeriod };
  const queryTypes2 = { ...types, requestedPeriod: 'STRING' };

  const [snapResult, trendResult] = await Promise.all([
    bq.query({ query: query1, params, types, location }),
    bq.query({ query: query2, params: queryParams2, types: queryTypes2, location }),
  ]);

  const snapData = snapResult[0]?.[0] || {};
  const trendData = trendResult[0]?.[0] || {};
  const trendRows = trendData.trend_rows || [];

  const startMonthRaw = trendData.Start_Month;
  const startMonthStr = typeof startMonthRaw === 'object' && startMonthRaw?.value
    ? startMonthRaw.value
    : String(startMonthRaw || '');

  const scopedAccountCount = Number(snapData.Scoped_Account_Count || 0);
  const headlineRaw = snapData.Headline || {};
  const totalAccounts = Number(headlineRaw.Total_Accounts || 0);

  // Build Headline
  let headline: BestQmHeadline;
  if (totalAccounts === 0) {
    headline = {
      Actual_Value: null,
      Actual_Display: 'N/A',
      Target_Value: null,
      Target_Display: '90',
      Variance_Value: null,
      Variance_Display: 'N/A',
      RAG: null,
      Accounts_On_Target: 0,
      Total_Accounts: 0,
      Pass_Rate_Pct: 0,
      Green_Account_Count: 0,
      Amber_Account_Count: 0,
      Red_Account_Count: 0,
      Critical_Deficit_Names: [],
    };
  } else {
    const actualVal = Number(headlineRaw.Actual_Value || 0);
    const targetVal = 90.0;
    const varVal = actualVal - targetVal;
    const rag = computeBestQmRag(actualVal);
    const onTarget = Number(headlineRaw.Accounts_On_Target || 0);
    const passRate = totalAccounts > 0 ? Number(((onTarget / totalAccounts) * 100).toFixed(1)) : 0;
    const criticalNames: string[] = Array.isArray(headlineRaw.Critical_Deficit_Names)
      ? headlineRaw.Critical_Deficit_Names.filter((n: string) => Boolean(n))
      : [];

    headline = {
      Actual_Value: Number(actualVal.toFixed(4)),
      Actual_Display: formatScore(actualVal),
      Target_Value: 90,
      Target_Display: '90',
      Variance_Value: Number(varVal.toFixed(4)),
      Variance_Display: formatVarianceScore(varVal),
      RAG: rag,
      Accounts_On_Target: onTarget,
      Total_Accounts: totalAccounts,
      Pass_Rate_Pct: passRate,
      Green_Account_Count: Number(headlineRaw.Green_Account_Count || 0),
      Amber_Account_Count: Number(headlineRaw.Amber_Account_Count || 0),
      Red_Account_Count: Number(headlineRaw.Red_Account_Count || 0),
      Critical_Deficit_Names: criticalNames,
    };
  }

  // Build Parameters
  const paramsRaw = Array.isArray(snapData.Parameters) ? snapData.Parameters : [];
  const parameters: BestQmParameter[] = paramsRaw.map((p: any) => {
    const actual = Number(p.Actual_Value || 0);
    const target = 90.0;
    const variance = actual - target;
    const rag = (p.RAG as 'Green' | 'Amber' | 'Red') || computeBestQmRag(actual) || 'Red';
    return {
      Parameter_Name: String(p.Parameter_Name || ''),
      Actual_Value: Number(actual.toFixed(4)),
      Actual_Display: formatScore(actual),
      Target_Value: 90,
      Target_Display: '90',
      Variance_Value: Number(variance.toFixed(4)),
      Variance_Display: formatVarianceScore(variance),
      RAG: rag,
      Account_Count: Number(p.Account_Count || 0),
    };
  });

  // Build Comparisons
  const mapComparison = (rows: any[]): BestQmComparisonItem[] => {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => {
      const actual = Number(r.Actual_Value || 0);
      const target = 90.0;
      const variance = actual - target;
      return {
        Dimension_Key: String(r.Dimension_Key || ''),
        Dimension_Label: String(r.Dimension_Label || ''),
        Actual_Value: Number(actual.toFixed(4)),
        Actual_Display: formatScore(actual),
        Target_Value: 90,
        Target_Display: '90',
        Variance_Value: Number(variance.toFixed(4)),
        Variance_Display: formatVarianceScore(variance),
        RAG: computeBestQmRag(actual) || 'Red',
        Account_Count: Number(r.Account_Count || 0),
      };
    });
  };

  const comparisons: BestQmComparisons = {
    byVertical: mapComparison(snapData.By_Vertical),
    byQaLeader: mapComparison(snapData.By_Qa_Leader),
    bySrDirector: mapComparison(snapData.By_Sr_Director),
  };

  // Build Account Rows
  const accountsRaw = Array.isArray(snapData.Accounts) ? snapData.Accounts : [];
  const accountRows: BestQmAccountRow[] = accountsRaw.map((a: any) => {
    const actual = Number(a.Actual_Value || 0);
    const target = 90.0;
    const variance = actual - target;
    const rawParams = Array.isArray(a.Parameters) ? a.Parameters : [];
    const itemParams: BestQmAccountRowParameter[] = rawParams.map((p: any) => ({
      Parameter_Name: String(p.Parameter_Name || ''),
      Score: Number(Number(p.Score || 0).toFixed(4)),
      Score_Display: p.Score_Display || formatScore(Number(p.Score || 0)),
      RAG: String(p.RAG || 'Amber'),
    }));

    return {
      Account_ID: String(a.Account_ID || ''),
      Account_Name: String(a.Account_Name || ''),
      Vertical: String(a.Vertical || ''),
      QA_Leader: String(a.QA_Leader || ''),
      Sr_Director: String(a.Sr_Director || ''),
      Site: String(a.Site || ''),
      LOB: String(a.LOB || ''),
      Actual_Value: Number(actual.toFixed(4)),
      Actual_Display: formatScore(actual),
      Target_Value: 90,
      Target_Display: '90',
      Variance_Value: Number(variance.toFixed(4)),
      Variance_Display: formatVarianceScore(variance),
      RAG: (a.RAG as 'Green' | 'Amber' | 'Red') || computeBestQmRag(actual) || 'Red',
      Parameters: itemParams,
      LD_Remarks: a.LD_Remarks ? String(a.LD_Remarks) : null,
    };
  });

  // Build Trend Points
  const trendPoints: BestQmTrendPoint[] = trendRows.map((t: any) => {
    const monthRaw = t.Month;
    const monthStr = typeof monthRaw === 'object' && monthRaw?.value ? monthRaw.value : String(monthRaw);
    const actual = Number(t.Actual_Value || 0);
    const target = 90.0;
    const variance = actual - target;
    return {
      Month: monthStr,
      Reporting_Month: String(t.Reporting_Month || ''),
      Actual_Value: Number(actual.toFixed(4)),
      Actual_Display: formatScore(actual),
      Target_Value: 90,
      Target_Display: '90',
      Variance_Value: Number(variance.toFixed(4)),
      Variance_Display: formatVarianceScore(variance),
      RAG: computeBestQmRag(actual),
      Account_Count: Number(t.Account_Count || 0),
    };
  });

  // Range Context
  const availableMonthCount = trendPoints.length;
  const coverageStatus: 'FULL_HISTORY' | 'PARTIAL_HISTORY' =
    availableMonthCount >= requestedMonthCount ? 'FULL_HISTORY' : 'PARTIAL_HISTORY';

  const rangeContext: BestQmRangeContext = {
    requestedPeriod,
    requestedMonthCount,
    availableMonthCount,
    startMonth: startMonthStr,
    endMonth: latestClosedMonthStr,
    historyCoverageStatus: coverageStatus,
  };

  const reportingContext: BestQmReportingContext = {
    latestClosedMonth: latestClosedMonthStr,
    reportingMonthLabel,
    isLatestClosedPeriod: true,
  };

  const scopeInfo: BestQmScopeInfo = {
    vertical: filters.vertical || null,
    qaLeader: filters.qaLeader || null,
    srDirector: filters.srDirector || null,
    accountId: filters.accountId || null,
    site: filters.site || null,
    lob: filters.lob || null,
    accountCount: scopedAccountCount,
  };

  return {
    Scope: scopeInfo,
    Reporting_Context: reportingContext,
    Range_Context: rangeContext,
    Headline: headline,
    Trend: trendPoints,
    Parameters: parameters,
    Comparisons: comparisons,
    Accounts: accountRows,
  };
}
