import { BigQuery } from '@google-cloud/bigquery';
import { getBigQueryClient, getBigQueryConfig, serializeBigQueryValue } from './bigquery';
import { ScopeFilters } from './scopedOverview';
import { resolveReportingWindows } from './reportingPeriod';

export type SlaTimePeriod = '3M' | '6M' | 'YTD' | '12M';

export interface SlaScopeInfo {
  vertical: string | null;
  qaLeader: string | null;
  srDirector: string | null;
  accountId: string | null;
  site: string | null;
  lob: string | null;
  accountCount: number;
}

export interface SlaReportingContext {
  latestClosedMonth: string;
  reportingMonthLabel: string;
  isLatestClosedPeriod: boolean;
}

export interface SlaRangeContext {
  requestedPeriod: SlaTimePeriod;
  requestedMonthCount: number;
  availableMonthCount: number;
  startMonth: string;
  endMonth: string;
  historyCoverageStatus: 'FULL_HISTORY' | 'PARTIAL_HISTORY';
}

export interface SlaHeadline {
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
  High_Penalty_Risk_Count: number;
  Medium_Penalty_Risk_Count: number;
  Low_Penalty_Risk_Count: number;
  Total_Penalty_Risk_Count: number;
}

export interface SlaTrendPoint {
  Month: string;
  Reporting_Month: string;
  Actual_Value: number;
  Actual_Display: string;
  Target_Value: number;
  Target_Display: string;
  Variance_Value: number;
  Variance_Display: string;
  RAG: 'Green' | 'Amber' | 'Red';
  Account_Count: number;
}

export interface SlaComparisonItem {
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

export interface SlaComparisons {
  byVertical: SlaComparisonItem[];
  byQaLeader: SlaComparisonItem[];
  bySrDirector: SlaComparisonItem[];
}

export interface SlaAccountRow {
  Account_ID: string;
  Account_Name: string;
  Vertical: string;
  QA_Leader: string;
  Sr_Director: string;
  Site: string;
  LOB: string;
  SLA_Name: string;
  Actual_Value: number;
  Actual_Display: string;
  Target_Value: number;
  Target_Display: string;
  Variance_Value: number;
  Variance_Display: string;
  RAG: 'Green' | 'Amber' | 'Red';
  Penalty_Risk: 'Low' | 'Medium' | 'High';
  Reward_Penalty: string;
  Area_of_Opportunity: string | null;
  Root_Cause: string | null;
  POA: string | null;
}

export interface SlaEscalationSummary {
  Total_SLA_Escalations: number;
  Open_SLA_Escalations: number;
  High_Critical_Open_Escalations: number;
  Closed_SLA_Escalations: number;
}

export interface SlaRootCauseSummaryItem {
  Category: string;
  Account_Count: number;
  Percentage_Of_Total: number;
}

export interface SlaDiagnosticData {
  Scope: SlaScopeInfo;
  Reporting_Context: SlaReportingContext;
  Range_Context: SlaRangeContext;
  Headline: SlaHeadline;
  Trend: SlaTrendPoint[];
  Comparisons: SlaComparisons;
  Accounts: SlaAccountRow[];
  SLA_Related_Escalations: SlaEscalationSummary;
  Root_Cause_Summary: SlaRootCauseSummaryItem[];
}

export interface SlaDiagnosticResponse {
  data: SlaDiagnosticData;
}

function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${(val * 100).toFixed(1)}%`;
}

function formatVariance(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  const num = val * 100;
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

function computeSlaRag(actual: number, target: number): 'Green' | 'Amber' | 'Red' {
  if (actual >= target) return 'Green';
  if (actual >= target - 0.05) return 'Amber';
  return 'Red';
}

export async function fetchSlaDiagnostic(
  filters: ScopeFilters & { timePeriod?: string }
): Promise<SlaDiagnosticData> {
  const bq = getBigQueryClient();
  const { projectId, dataset, location } = getBigQueryConfig();

  const validPeriods: SlaTimePeriod[] = ['3M', '6M', 'YTD', '12M'];
  const requestedPeriod: SlaTimePeriod = (
    filters.timePeriod && validPeriods.includes(filters.timePeriod.toUpperCase() as SlaTimePeriod)
      ? filters.timePeriod.toUpperCase()
      : '12M'
  ) as SlaTimePeriod;

  if (filters.timePeriod && !validPeriods.includes(filters.timePeriod.toUpperCase() as SlaTimePeriod)) {
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

  // QUERY 1: Diagnostic Snapshot (Context, Headline, Comparisons, Root Causes, Escalations)
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
    latest_sla AS (
      SELECT
        s.Account_ID,
        s.Account_Name,
        s.Vertical,
        s.QA_Leader,
        s.Sr_Director,
        s.Site,
        s.LOB,
        s.SLA_Name,
        s.Actual_Pct,
        s.Target_Pct,
        s.Variance_pp,
        s.Status_RAG,
        s.Penalty_Risk,
        s.Reward_Penalty,
        s.Area_of_Opportunity,
        s.Root_Cause_I,
        s.POA
      FROM \`${projectId}.${dataset}.vw_sla_achievement\` s
      JOIN scoped_accounts a ON s.Account_ID = a.Account_ID
      CROSS JOIN rep_context rc
      WHERE s.Month = rc.Latest_Closed_Month
    ),
    headline_stats AS (
      SELECT
        COUNT(*) AS Total_Accounts,
        COALESCE(AVG(Actual_Pct), 0) AS Actual_Value,
        COALESCE(AVG(Target_Pct), 0) AS Target_Value,
        COALESCE(AVG(Actual_Pct) - AVG(Target_Pct), 0) AS Variance_Value,
        COUNTIF(Actual_Pct >= Target_Pct) AS Accounts_On_Target,
        COUNTIF(Status_RAG = 'Green') AS Green_Account_Count,
        COUNTIF(Status_RAG = 'Amber') AS Amber_Account_Count,
        COUNTIF(Status_RAG = 'Red') AS Red_Account_Count,
        COUNTIF(Penalty_Risk = 'High') AS High_Penalty_Risk_Count,
        COUNTIF(Penalty_Risk = 'Medium') AS Medium_Penalty_Risk_Count,
        COUNTIF(Penalty_Risk = 'Low') AS Low_Penalty_Risk_Count,
        COUNTIF(Penalty_Risk IN ('High', 'Medium')) AS Total_Penalty_Risk_Count
      FROM latest_sla
    ),
    by_vertical AS (
      SELECT
        Vertical AS Dimension_Key,
        Vertical AS Dimension_Label,
        AVG(Actual_Pct) AS Actual_Value,
        AVG(Target_Pct) AS Target_Value,
        AVG(Actual_Pct) - AVG(Target_Pct) AS Variance_Value,
        COUNT(*) AS Account_Count
      FROM latest_sla
      GROUP BY Vertical
      ORDER BY Actual_Value ASC
    ),
    by_qa_leader AS (
      SELECT
        QA_Leader AS Dimension_Key,
        QA_Leader AS Dimension_Label,
        AVG(Actual_Pct) AS Actual_Value,
        AVG(Target_Pct) AS Target_Value,
        AVG(Actual_Pct) - AVG(Target_Pct) AS Variance_Value,
        COUNT(*) AS Account_Count
      FROM latest_sla
      GROUP BY QA_Leader
      ORDER BY Actual_Value ASC
    ),
    by_sr_director AS (
      SELECT
        Sr_Director AS Dimension_Key,
        Sr_Director AS Dimension_Label,
        AVG(Actual_Pct) AS Actual_Value,
        AVG(Target_Pct) AS Target_Value,
        AVG(Actual_Pct) - AVG(Target_Pct) AS Variance_Value,
        COUNT(*) AS Account_Count
      FROM latest_sla
      GROUP BY Sr_Director
      ORDER BY Actual_Value ASC
    ),
    root_cause_counts AS (
      SELECT
        COALESCE(Root_Cause_I, 'Unspecified') AS Category,
        COUNT(*) AS Account_Count
      FROM latest_sla
      GROUP BY 1
      ORDER BY Account_Count DESC, Category ASC
    ),
    sla_escalations AS (
      SELECT
        COUNT(*) AS Total_SLA_Escalations,
        COUNTIF(Is_Open) AS Open_SLA_Escalations,
        COUNTIF(Is_Open AND Is_High_Critical) AS High_Critical_Open_Escalations,
        COUNTIF(Is_Closed) AS Closed_SLA_Escalations
      FROM \`${projectId}.${dataset}.vw_escalations\` e
      JOIN scoped_accounts a ON e.Account_ID = a.Account_ID
      WHERE e.Escalation_Type = 'SLA breach'
    )
    SELECT
      (SELECT AS STRUCT * FROM rep_context) AS rep_ctx,
      (SELECT AS STRUCT * FROM headline_stats) AS headline,
      (SELECT AS STRUCT * FROM sla_escalations) AS escalations,
      ARRAY(SELECT AS STRUCT * FROM by_vertical) AS comparisons_vertical,
      ARRAY(SELECT AS STRUCT * FROM by_qa_leader) AS comparisons_qa_leader,
      ARRAY(SELECT AS STRUCT * FROM by_sr_director) AS comparisons_sr_director,
      ARRAY(SELECT AS STRUCT * FROM root_cause_counts) AS root_causes
  `;

  // QUERY 2: History (Trend points within period + Account rows at latest closed month)
  const query2 = `
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
    period_boundary AS (
      SELECT
        rc.Latest_Closed_Month,
        CASE
          WHEN @requestedPeriod = '3M' THEN DATE_SUB(rc.Latest_Closed_Month, INTERVAL 2 MONTH)
          WHEN @requestedPeriod = '6M' THEN DATE_SUB(rc.Latest_Closed_Month, INTERVAL 5 MONTH)
          WHEN @requestedPeriod = 'YTD' THEN DATE_TRUNC(rc.Latest_Closed_Month, YEAR)
          WHEN @requestedPeriod = '12M' THEN DATE_SUB(rc.Latest_Closed_Month, INTERVAL 11 MONTH)
          ELSE DATE_SUB(rc.Latest_Closed_Month, INTERVAL 11 MONTH)
        END AS Start_Month
      FROM rep_context rc
    ),
    trend_history AS (
      SELECT
        s.Month,
        FORMAT_DATE('%b-%y', s.Month) AS Reporting_Month,
        AVG(s.Actual_Pct) AS Actual_Value,
        AVG(s.Target_Pct) AS Target_Value,
        AVG(s.Actual_Pct) - AVG(s.Target_Pct) AS Variance_Value,
        COUNT(*) AS Account_Count
      FROM \`${projectId}.${dataset}.vw_sla_achievement\` s
      JOIN scoped_accounts a ON s.Account_ID = a.Account_ID
      CROSS JOIN period_boundary pb
      WHERE s.Month >= pb.Start_Month AND s.Month <= pb.Latest_Closed_Month
      GROUP BY s.Month, Reporting_Month
      ORDER BY s.Month ASC
    ),
    account_rows AS (
      SELECT
        s.Account_ID,
        s.Account_Name,
        s.Vertical,
        s.QA_Leader,
        s.Sr_Director,
        s.Site,
        s.LOB,
        s.SLA_Name,
        s.Actual_Pct AS Actual_Value,
        s.Target_Pct AS Target_Value,
        s.Variance_pp AS Variance_Value,
        s.Status_RAG AS RAG,
        s.Penalty_Risk,
        s.Reward_Penalty,
        s.Area_of_Opportunity,
        s.Root_Cause_I AS Root_Cause,
        s.POA
      FROM \`${projectId}.${dataset}.vw_sla_achievement\` s
      JOIN scoped_accounts a ON s.Account_ID = a.Account_ID
      CROSS JOIN rep_context rc
      WHERE s.Month = rc.Latest_Closed_Month
      ORDER BY s.Variance_pp ASC, s.Account_Name ASC
    )
    SELECT
      (SELECT Start_Month FROM period_boundary) AS Start_Month,
      (SELECT Latest_Closed_Month FROM period_boundary) AS End_Month,
      ARRAY(SELECT AS STRUCT * FROM trend_history) AS trend_rows,
      ARRAY(SELECT AS STRUCT * FROM account_rows) AS accounts
  `;

  const queryParams1 = { ...params };
  const queryTypes1 = { ...types };

  const queryParams2 = { ...params, requestedPeriod };
  const queryTypes2 = { ...types, requestedPeriod: 'STRING' };

  // Execute Query 1 and Query 2 in parallel
  const [res1, res2] = await Promise.all([
    bq.query({ query: query1, params: queryParams1, types: queryTypes1, location }),
    bq.query({ query: query2, params: queryParams2, types: queryTypes2, location }),
  ]);

  const rawData1 = res1[0][0] || {};
  const rawData2 = res2[0][0] || {};

  const repCtxRaw = rawData1.rep_ctx || {};
  const latestClosedMonthRaw = serializeBigQueryValue(repCtxRaw.Latest_Closed_Month);
  if (!latestClosedMonthRaw) {
    throw new Error('Authoritative reporting context unavailable: Latest_Closed_Month is empty in SLA Diagnostic');
  }
  const latestClosedMonth: string = String(latestClosedMonthRaw);
  const resolvedPeriod = resolveReportingWindows(latestClosedMonth);
  const reportingMonthLabel = String(repCtxRaw.Official_Reporting_Month || resolvedPeriod.officialReportingMonth);

  const headlineRaw = rawData1.headline || {};
  const totalAccounts = Number(headlineRaw.Total_Accounts) || 0;
  const actualVal = Number(headlineRaw.Actual_Value) || 0;
  const targetVal = Number(headlineRaw.Target_Value) || 0;
  const varianceVal = Number(headlineRaw.Variance_Value) || 0;
  const accountsOnTarget = Number(headlineRaw.Accounts_On_Target) || 0;
  const passRatePct = totalAccounts > 0 ? (accountsOnTarget / totalAccounts) * 100 : 0;
  const greenAccCount = Number(headlineRaw.Green_Account_Count) || 0;
  const amberAccCount = Number(headlineRaw.Amber_Account_Count) || 0;
  const redAccCount = Number(headlineRaw.Red_Account_Count) || 0;
  const highPenaltyCount = Number(headlineRaw.High_Penalty_Risk_Count) || 0;
  const medPenaltyCount = Number(headlineRaw.Medium_Penalty_Risk_Count) || 0;
  const lowPenaltyCount = Number(headlineRaw.Low_Penalty_Risk_Count) || 0;
  const totalPenaltyCount = Number(headlineRaw.Total_Penalty_Risk_Count) || 0;

  const headlineRag = totalAccounts > 0 ? computeSlaRag(actualVal, targetVal) : null;

  const headline: SlaHeadline = {
    Actual_Value: totalAccounts > 0 ? actualVal : null,
    Actual_Display: totalAccounts > 0 ? formatPercent(actualVal) : 'N/A',
    Target_Value: totalAccounts > 0 ? targetVal : null,
    Target_Display: totalAccounts > 0 ? formatPercent(targetVal) : 'N/A',
    Variance_Value: totalAccounts > 0 ? varianceVal : null,
    Variance_Display: totalAccounts > 0 ? formatVariance(varianceVal) : 'N/A',
    RAG: headlineRag,
    Accounts_On_Target: accountsOnTarget,
    Total_Accounts: totalAccounts,
    Pass_Rate_Pct: Number(passRatePct.toFixed(1)),
    Green_Account_Count: greenAccCount,
    Amber_Account_Count: amberAccCount,
    Red_Account_Count: redAccCount,
    High_Penalty_Risk_Count: highPenaltyCount,
    Medium_Penalty_Risk_Count: medPenaltyCount,
    Low_Penalty_Risk_Count: lowPenaltyCount,
    Total_Penalty_Risk_Count: totalPenaltyCount,
  };

  const mapComparison = (item: any): SlaComparisonItem => {
    const act = Number(item.Actual_Value) || 0;
    const tgt = Number(item.Target_Value) || 0;
    const vr = Number(item.Variance_Value) || 0;
    return {
      Dimension_Key: String(item.Dimension_Key || ''),
      Dimension_Label: String(item.Dimension_Label || ''),
      Actual_Value: act,
      Actual_Display: formatPercent(act),
      Target_Value: tgt,
      Target_Display: formatPercent(tgt),
      Variance_Value: vr,
      Variance_Display: formatVariance(vr),
      RAG: computeSlaRag(act, tgt),
      Account_Count: Number(item.Account_Count) || 0,
    };
  };

  const comparisons: SlaComparisons = {
    byVertical: (rawData1.comparisons_vertical || []).map(mapComparison),
    byQaLeader: (rawData1.comparisons_qa_leader || []).map(mapComparison),
    bySrDirector: (rawData1.comparisons_sr_director || []).map(mapComparison),
  };

  const rootCauses: SlaRootCauseSummaryItem[] = (rawData1.root_causes || []).map((rc: any) => {
    const cnt = Number(rc.Account_Count) || 0;
    const pct = totalAccounts > 0 ? (cnt / totalAccounts) * 100 : 0;
    return {
      Category: String(rc.Category || ''),
      Account_Count: cnt,
      Percentage_Of_Total: Number(pct.toFixed(1)),
    };
  });

  const escRaw = rawData1.escalations || {};
  const escalations: SlaEscalationSummary = {
    Total_SLA_Escalations: Number(escRaw.Total_SLA_Escalations) || 0,
    Open_SLA_Escalations: Number(escRaw.Open_SLA_Escalations) || 0,
    High_Critical_Open_Escalations: Number(escRaw.High_Critical_Open_Escalations) || 0,
    Closed_SLA_Escalations: Number(escRaw.Closed_SLA_Escalations) || 0,
  };

  // Trend & Accounts
  const trendRows = rawData2.trend_rows || [];
  const trend: SlaTrendPoint[] = trendRows.map((tr: any) => {
    const monthStr = serializeBigQueryValue(tr.Month) || '';
    const act = Number(tr.Actual_Value) || 0;
    const tgt = Number(tr.Target_Value) || 0;
    const vr = Number(tr.Variance_Value) || 0;
    return {
      Month: monthStr,
      Reporting_Month: String(tr.Reporting_Month || ''),
      Actual_Value: act,
      Actual_Display: formatPercent(act),
      Target_Value: tgt,
      Target_Display: formatPercent(tgt),
      Variance_Value: vr,
      Variance_Display: formatVariance(vr),
      RAG: computeSlaRag(act, tgt),
      Account_Count: Number(tr.Account_Count) || 0,
    };
  });

  const accountRows = rawData2.accounts || [];
  const accounts: SlaAccountRow[] = accountRows.map((acc: any) => {
    const act = Number(acc.Actual_Value) || 0;
    const tgt = Number(acc.Target_Value) || 0;
    const vr = Number(acc.Variance_Value) || 0;
    return {
      Account_ID: String(acc.Account_ID || ''),
      Account_Name: String(acc.Account_Name || ''),
      Vertical: String(acc.Vertical || ''),
      QA_Leader: String(acc.QA_Leader || ''),
      Sr_Director: String(acc.Sr_Director || ''),
      Site: String(acc.Site || ''),
      LOB: String(acc.LOB || ''),
      SLA_Name: String(acc.SLA_Name || 'SLA Achievement'),
      Actual_Value: act,
      Actual_Display: formatPercent(act),
      Target_Value: tgt,
      Target_Display: formatPercent(tgt),
      Variance_Value: vr,
      Variance_Display: formatVariance(vr),
      RAG: (acc.RAG as 'Green' | 'Amber' | 'Red') || computeSlaRag(act, tgt),
      Penalty_Risk: (acc.Penalty_Risk as 'Low' | 'Medium' | 'High') || 'Low',
      Reward_Penalty: String(acc.Reward_Penalty || 'None'),
      Area_of_Opportunity: acc.Area_of_Opportunity ? String(acc.Area_of_Opportunity) : null,
      Root_Cause: acc.Root_Cause ? String(acc.Root_Cause) : null,
      POA: acc.POA ? String(acc.POA) : null,
    };
  });

  const requestedMonthCount = resolvedPeriod.windows[requestedPeriod].monthCount;
  const availableMonthCount = trend.length;
  const historyCoverageStatus: 'FULL_HISTORY' | 'PARTIAL_HISTORY' =
    availableMonthCount >= requestedMonthCount ? 'FULL_HISTORY' : 'PARTIAL_HISTORY';

  const startMonthStr: string =
    trend.length > 0 ? trend[0].Month : String(serializeBigQueryValue(rawData2.Start_Month) || '');
  const endMonthStr: string =
    trend.length > 0 ? trend[trend.length - 1].Month : latestClosedMonth;

  return {
    Scope: {
      vertical: filters.vertical || null,
      qaLeader: filters.qaLeader || null,
      srDirector: filters.srDirector || null,
      accountId: filters.accountId || null,
      site: filters.site || null,
      lob: filters.lob || null,
      accountCount: totalAccounts,
    },
    Reporting_Context: {
      latestClosedMonth,
      reportingMonthLabel,
      isLatestClosedPeriod: true,
    },
    Range_Context: {
      requestedPeriod,
      requestedMonthCount,
      availableMonthCount,
      startMonth: startMonthStr,
      endMonth: endMonthStr,
      historyCoverageStatus,
    },
    Headline: headline,
    Trend: trend,
    Comparisons: comparisons,
    Accounts: accounts,
    SLA_Related_Escalations: escalations,
    Root_Cause_Summary: rootCauses,
  };
}
