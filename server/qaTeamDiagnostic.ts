import { BigQuery } from '@google-cloud/bigquery';
import { getBigQueryClient, getBigQueryConfig, serializeBigQueryValue } from './bigquery';
import { fetchAuthoritativeReportingContext } from './reportingPeriod';

export type QaTeamTimePeriod = '3M' | '6M' | 'YTD' | '12M';

export interface QaTeamFilters {
  timePeriod?: string;
  vertical?: string;
  qaLeader?: string;
  srDirector?: string;
  accountId?: string;
  site?: string;
  lob?: string;
}

export interface QaTeamReportingContext {
  officialReportingMonth: string;
  latestClosedMonth: string;
  latestAvailableMonth: string;
  currentOpenMonth: string;
  submissionDeadline: string;
}

export interface QaTeamRangeContext {
  requestedPeriod: QaTeamTimePeriod;
  requestedMonthCount: number;
  availableMonthCount: number;
  historyCoverageStatus: 'COMPLETE' | 'PARTIAL_HISTORY';
  startMonth: string;
  endMonth: string;
  months: string[];
}

export interface QaTeamScopeSummary {
  totalAccounts: number;
  latestClosedActualHc: number;
  currentCoreOperationsHc: number;
  currentTotalOrganizationHc: number;
}

export interface QaTeamStaffingHeadline {
  requiredHeadcount: number;
  actualHeadcount: number;
  approvedHeadcount: number;
  variance: number;
  varianceDisplay: string;
  understaffedAccountCount: number;
  overstaffedAccountCount: number;
  balancedAccountCount: number;
}

export interface QaTeamMetricSummary {
  metricId: 'M011' | 'M012';
  metricName: string;
  productiveHrs?: number;
  staffHrs?: number;
  exits?: number;
  openingHc?: number;
  actualValue: number | null;
  actualDisplay: string;
  targetValue: number;
  targetDisplay: string;
  varianceToTarget: number | null;
  favourableVariance: number | null;
  isHigherBetter: boolean;
  rag: 'Green' | 'Amber' | 'Red' | null;
  greenCount: number;
  amberCount: number;
  redCount: number;
}

export interface QaTeamCommercialSummary {
  billableFte: number;
  billedFte: number;
  coverageValue: number | null;
  coverageDisplay: string;
  rag: 'Green' | 'Amber' | 'Red' | null;
  underBilledAccountCount: number;
}

export interface QaTeamSiteRollup {
  site: string;
  accountCount: number;
  requiredHeadcount: number;
  actualHeadcount: number;
  variance: number;
  utilizationPct: number | null;
  utilizationDisplay: string;
  utilizationRag: 'Green' | 'Amber' | 'Red' | null;
  attritionPct: number | null;
  attritionDisplay: string;
  attritionRag: 'Green' | 'Amber' | 'Red' | null;
  billingCoveragePct: number | null;
  billingCoverageDisplay: string;
  billingRag: 'Green' | 'Amber' | 'Red' | null;
}

export interface QaTeamBandDistribution {
  b1Qa: number;
  b2Tl: number;
  c1Am: number;
  c2Mgr: number;
  d1Director: number;
  d2SrDirector: number;
  e1Vp: number;
  coreOperationsTotal: number;
  totalOrganization: number;
}

export interface QaTeamTrendPoint {
  month: string;
  monthDisplay: string;
  requiredQa: number;
  actualQa: number;
  staffingVariance: number;
  productiveHrs: number;
  staffHrs: number;
  utilizationPct: number | null;
  exits: number;
  openingHc: number;
  attritionPct: number | null;
  billableFte: number;
  billedFte: number;
  billingCoveragePct: number | null;
}

export interface QaTeamAccountRegisterRow {
  accountId: string;
  accountName: string;
  vertical: string;
  qaLeader: string;
  srDirector: string;
  site: string;
  lob: string;
  // Closed Operational Snapshot
  requiredQa: number | null;
  actualQa: number | null;
  approvedQa: number | null;
  staffingVariance: number | null;
  staffingRag: 'Green' | 'Amber' | 'Red' | null;
  utilizationPct: number | null;
  utilizationDisplay: string;
  utilizationRag: 'Green' | 'Amber' | 'Red' | null;
  attritionPct: number | null;
  attritionDisplay: string;
  attritionRag: 'Green' | 'Amber' | 'Red' | null;
  exits: number | null;
  openingHc: number | null;
  billableFte: number | null;
  billedFte: number | null;
  billingCoveragePct: number | null;
  billingCoverageDisplay: string;
  billingRag: 'Green' | 'Amber' | 'Red' | null;
  // Current Live Organization Roster
  mappedQa: number;
  activeQa: number;
  b1Count: number;
  b2Count: number;
  c1Count: number;
  c2Count: number;
}

export interface QaTeamDiagnosticData {
  reportingContext: QaTeamReportingContext;
  rangeContext: QaTeamRangeContext;
  scopeSummary: QaTeamScopeSummary;
  headline: {
    staffing: QaTeamStaffingHeadline;
    utilization: QaTeamMetricSummary;
    attrition: QaTeamMetricSummary;
    commercial: QaTeamCommercialSummary;
  };
  siteRollup: QaTeamSiteRollup[];
  bandDistribution: QaTeamBandDistribution;
  historicalTrends: QaTeamTrendPoint[];
  accountRegister: QaTeamAccountRegisterRow[];
}

function parseDateValue(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.split('T')[0];
  if (val.value && typeof val.value === 'string') return val.value.split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val);
}

function formatMonthDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 2) return dateStr;
  const year = parts[0].slice(2);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = monthNames[monthIdx] || parts[1];
  return `${monthName}-${year}`;
}

export async function fetchQaTeamDiagnostic(filters: QaTeamFilters): Promise<QaTeamDiagnosticData> {
  const period: QaTeamTimePeriod = (filters.timePeriod as QaTeamTimePeriod) || '12M';
  const validPeriods: QaTeamTimePeriod[] = ['3M', '6M', 'YTD', '12M'];
  if (!validPeriods.includes(period)) {
    throw new Error(`Invalid timePeriod: "${filters.timePeriod}". Expected one of: ${validPeriods.join(', ')}`);
  }

  const bq = getBigQueryClient();
  const { projectId, dataset, location } = getBigQueryConfig();

  // 1. Fetch authoritative reporting context & dynamic time windows
  const authCtx = await fetchAuthoritativeReportingContext(bq, projectId, dataset, location);
  const latestClosedMonth = authCtx.latestClosedMonth;
  const latestAvailableMonth = authCtx.latestAvailableMonth;
  const currentOpenMonth = authCtx.currentOpenMonth;
  const submissionDeadline = authCtx.currentSubmissionDeadline;
  const officialReportingMonth = authCtx.officialReportingMonth;

  const resolvedWindow = authCtx.windows[period];
  const requestedMonthCount = resolvedWindow.monthCount;
  const historyStartMonth = resolvedWindow.startMonth;

  // Filter params setup
  const params: Record<string, any> = {
    latestClosedMonth,
    historyStartMonth,
  };

  const accountFilterClauses: string[] = [];
  if (filters.vertical && filters.vertical !== 'ALL') {
    accountFilterClauses.push('m.Vertical = @vertical');
    params.vertical = filters.vertical;
  }
  if (filters.qaLeader && filters.qaLeader !== 'ALL') {
    accountFilterClauses.push('m.QA_Leader = @qaLeader');
    params.qaLeader = filters.qaLeader;
  }
  if (filters.srDirector && filters.srDirector !== 'ALL') {
    accountFilterClauses.push('m.Sr_Director = @srDirector');
    params.srDirector = filters.srDirector;
  }
  if (filters.accountId && filters.accountId !== 'ALL') {
    accountFilterClauses.push('m.Account_ID = @accountId');
    params.accountId = filters.accountId;
  }
  if (filters.site && filters.site !== 'ALL') {
    accountFilterClauses.push('m.Site = @site');
    params.site = filters.site;
  }
  if (filters.lob && filters.lob !== 'ALL') {
    accountFilterClauses.push('m.LOB = @lob');
    params.lob = filters.lob;
  }

  const accountFilterSql = accountFilterClauses.length > 0
    ? `WHERE ${accountFilterClauses.join(' AND ')}`
    : '';

  // Common Table Expression for scoped accounts
  const scopedAccountsCte = `
    WITH scoped_accounts AS (
      SELECT 
        m.Account_ID,
        m.Account AS Account_Name,
        m.BU,
        m.Vertical,
        m.QA_VP,
        m.Sr_Director,
        m.QA_Director,
        m.QA_Leader,
        m.Site,
        m.LOB,
        COALESCE(m.B1, 0) AS B1,
        COALESCE(m.B2, 0) AS B2,
        COALESCE(m.C1, 0) AS C1,
        COALESCE(m.C2, 0) AS C2,
        COALESCE(m.D1, 0) AS D1,
        COALESCE(m.D2, 0) AS D2,
        COALESCE(m.E1, 0) AS E1,
        (COALESCE(m.B1, 0) + COALESCE(m.B2, 0) + COALESCE(m.C1, 0) + COALESCE(m.C2, 0)) AS Core_Operations_HC,
        (COALESCE(m.B1, 0) + COALESCE(m.B2, 0) + COALESCE(m.C1, 0) + COALESCE(m.C2, 0) + COALESCE(m.D1, 0) + COALESCE(m.D2, 0) + COALESCE(m.E1, 0)) AS Total_Org_HC
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      ${accountFilterSql}
    )
  `;

  // QUERY 1: Closed Month Operating Snapshot & Account Register
  const query1 = `
    ${scopedAccountsCte}
    SELECT 
      sa.Account_ID,
      sa.Account_Name,
      sa.BU,
      sa.Vertical,
      sa.QA_VP,
      sa.Sr_Director,
      sa.QA_Director,
      sa.QA_Leader,
      sa.Site,
      sa.LOB,
      sa.B1,
      sa.B2,
      sa.C1,
      sa.C2,
      sa.D1,
      sa.D2,
      sa.E1,
      sa.Core_Operations_HC,
      sa.Total_Org_HC,
      s.Approved_Headcount,
      s.Required_Headcount,
      s.Actual_Headcount,
      s.Over_Under AS Staffing_Variance,
      s.Gap_Pct,
      s.Status_RAG AS Staffing_Status_RAG,
      s.Is_Understaffed,
      s.Is_Overstaffed,
      s.Is_Exactly_Staffed,
      u.Productive_Hrs,
      u.Staff_Hrs,
      u.Utilization_Pct,
      u.Status_RAG AS Utilization_Status_RAG,
      a.Opening_HC,
      a.Exits,
      a.Annualized_Attrition_Pct,
      a.Status_RAG AS Attrition_Status_RAG,
      b.Billable_FTE,
      b.Billed_FTE,
      b.Billing_Coverage_Pct,
      b.Status_RAG AS Billing_Status_RAG
    FROM scoped_accounts sa
    LEFT JOIN \`${projectId}.${dataset}.vw_staff_over_under\` s 
      ON sa.Account_ID = s.Account_ID AND CAST(s.Month AS STRING) = @latestClosedMonth
    LEFT JOIN \`${projectId}.${dataset}.vw_qa_utilization\` u 
      ON sa.Account_ID = u.Account_ID AND CAST(u.Month AS STRING) = @latestClosedMonth
    LEFT JOIN \`${projectId}.${dataset}.vw_qa_attrition\` a 
      ON sa.Account_ID = a.Account_ID AND CAST(a.Month AS STRING) = @latestClosedMonth
    LEFT JOIN \`${projectId}.${dataset}.vw_billed_qa\` b 
      ON sa.Account_ID = b.Account_ID AND CAST(b.Month AS STRING) = @latestClosedMonth
    ORDER BY sa.Account_Name ASC
  `;

  // QUERY 2: Historical Monthly Rollups
  const query2 = `
    ${scopedAccountsCte}
    SELECT 
      CAST(s.Month AS STRING) AS Month_Str,
      FORMAT_DATE("%b-%y", s.Month) AS Month_Display,
      SUM(s.Required_Headcount) AS Total_Required_QA,
      SUM(s.Actual_Headcount) AS Total_Actual_QA,
      SUM(s.Over_Under) AS Total_Staffing_Variance,
      SUM(u.Productive_Hrs) AS Total_Productive_Hrs,
      SUM(u.Staff_Hrs) AS Total_Staff_Hrs,
      SAFE_DIVIDE(SUM(u.Productive_Hrs), SUM(u.Staff_Hrs)) AS Weighted_Utilization,
      SUM(a.Exits) AS Total_Exits,
      SUM(a.Opening_HC) AS Total_Opening_HC,
      SAFE_DIVIDE(SUM(a.Exits), SUM(a.Opening_HC)) * 12 AS Weighted_Attrition,
      SUM(b.Billable_FTE) AS Total_Billable_FTE,
      SUM(b.Billed_FTE) AS Total_Billed_FTE,
      SAFE_DIVIDE(SUM(b.Billed_FTE), SUM(b.Billable_FTE)) AS Weighted_Billing_Coverage
    FROM \`${projectId}.${dataset}.vw_staff_over_under\` s
    INNER JOIN scoped_accounts sa ON s.Account_ID = sa.Account_ID
    LEFT JOIN \`${projectId}.${dataset}.vw_qa_utilization\` u 
      ON s.Account_ID = u.Account_ID AND s.Month = u.Month
    LEFT JOIN \`${projectId}.${dataset}.vw_qa_attrition\` a 
      ON s.Account_ID = a.Account_ID AND s.Month = a.Month
    LEFT JOIN \`${projectId}.${dataset}.vw_billed_qa\` b 
      ON s.Account_ID = b.Account_ID AND s.Month = b.Month
    WHERE CAST(s.Month AS STRING) >= @historyStartMonth 
      AND CAST(s.Month AS STRING) <= @latestClosedMonth
    GROUP BY Month_Str, Month_Display, s.Month
    ORDER BY s.Month ASC
  `;

  // QUERY 3: Site Rollup (Closed Month)
  const query3 = `
    ${scopedAccountsCte}
    SELECT 
      sa.Site,
      COUNT(DISTINCT sa.Account_ID) AS Account_Count,
      SUM(s.Required_Headcount) AS Site_Required_Headcount,
      SUM(s.Actual_Headcount) AS Site_Actual_Headcount,
      SUM(s.Over_Under) AS Site_Staffing_Variance,
      SUM(u.Productive_Hrs) AS Site_Productive_Hrs,
      SUM(u.Staff_Hrs) AS Site_Staff_Hrs,
      SAFE_DIVIDE(SUM(u.Productive_Hrs), SUM(u.Staff_Hrs)) AS Site_Utilization,
      SUM(a.Exits) AS Site_Exits,
      SUM(a.Opening_HC) AS Site_Opening_HC,
      SAFE_DIVIDE(SUM(a.Exits), SUM(a.Opening_HC)) * 12 AS Site_Attrition,
      SUM(b.Billable_FTE) AS Site_Billable_FTE,
      SUM(b.Billed_FTE) AS Site_Billed_FTE,
      SAFE_DIVIDE(SUM(b.Billed_FTE), SUM(b.Billable_FTE)) AS Site_Billing_Coverage
    FROM scoped_accounts sa
    LEFT JOIN \`${projectId}.${dataset}.vw_staff_over_under\` s 
      ON sa.Account_ID = s.Account_ID AND CAST(s.Month AS STRING) = @latestClosedMonth
    LEFT JOIN \`${projectId}.${dataset}.vw_qa_utilization\` u 
      ON sa.Account_ID = u.Account_ID AND CAST(u.Month AS STRING) = @latestClosedMonth
    LEFT JOIN \`${projectId}.${dataset}.vw_qa_attrition\` a 
      ON sa.Account_ID = a.Account_ID AND CAST(a.Month AS STRING) = @latestClosedMonth
    LEFT JOIN \`${projectId}.${dataset}.vw_billed_qa\` b 
      ON sa.Account_ID = b.Account_ID AND CAST(b.Month AS STRING) = @latestClosedMonth
    GROUP BY sa.Site
    ORDER BY Account_Count DESC, sa.Site ASC
  `;

  // QUERY 4: Current Organization Band Distribution
  const query4 = `
    ${scopedAccountsCte}
    SELECT 
      SUM(sa.B1) AS Total_B1,
      SUM(sa.B2) AS Total_B2,
      SUM(sa.C1) AS Total_C1,
      SUM(sa.C2) AS Total_C2,
      SUM(sa.D1) AS Total_D1,
      SUM(sa.D2) AS Total_D2,
      SUM(sa.E1) AS Total_E1,
      SUM(sa.Core_Operations_HC) AS Total_Core_Operations,
      SUM(sa.Total_Org_HC) AS Total_Organization
    FROM scoped_accounts sa
  `;

  // QUERY 5: Executive Rollup for M011 and M012
  const queryExec = `
    SELECT
      Metric_ID,
      Actual_Value,
      Actual_Display,
      Target_Value,
      CONCAT(CAST(ROUND(Target_Value * 100, 1) AS STRING), '%') AS Target_Display,
      Aggregate_RAG
    FROM \`${projectId}.${dataset}.vw_executive_kpi_official\`
    WHERE Metric_ID IN ('M011', 'M012')
  `;

  // Execute all queries in parallel
  const [
    [registerRows],
    [trendRows],
    [siteRows],
    [bandRows],
    [execRows],
  ] = await Promise.all([
    bq.query({ query: query1, params, location }),
    bq.query({ query: query2, params, location }),
    bq.query({ query: query3, params, location }),
    bq.query({ query: query4, params, location }),
    bq.query({ query: queryExec, location }),
  ]);

  const totalAccounts = registerRows ? registerRows.length : 0;

  // Process Band Distribution
  const bandRaw = bandRows && bandRows.length > 0 ? bandRows[0] : null;
  const bandDistribution: QaTeamBandDistribution = {
    b1Qa: Number(bandRaw?.Total_B1 || 0),
    b2Tl: Number(bandRaw?.Total_B2 || 0),
    c1Am: Number(bandRaw?.Total_C1 || 0),
    c2Mgr: Number(bandRaw?.Total_C2 || 0),
    d1Director: Number(bandRaw?.Total_D1 || 0),
    d2SrDirector: Number(bandRaw?.Total_D2 || 0),
    e1Vp: Number(bandRaw?.Total_E1 || 0),
    coreOperationsTotal: Number(bandRaw?.Total_Core_Operations || 0),
    totalOrganization: Number(bandRaw?.Total_Organization || 0),
  };

  // Process Account Register Rows & Headline Totals
  let totalRequiredHc = 0;
  let totalActualHc = 0;
  let totalApprovedHc = 0;
  let understaffedAccountCount = 0;
  let overstaffedAccountCount = 0;
  let balancedAccountCount = 0;

  let totalProductiveHrs = 0;
  let totalStaffHrs = 0;
  let m011GreenCount = 0;
  let m011AmberCount = 0;
  let m011RedCount = 0;

  let totalExits = 0;
  let totalOpeningHc = 0;
  let m012GreenCount = 0;
  let m012AmberCount = 0;
  let m012RedCount = 0;

  let totalBillableFte = 0;
  let totalBilledFte = 0;
  let underBilledAccountCount = 0;

  const accountRegister: QaTeamAccountRegisterRow[] = (registerRows || []).map((r: any) => {
    const serialized = serializeBigQueryValue(r) as Record<string, any>;
    const req = serialized.Required_Headcount !== null && serialized.Required_Headcount !== undefined ? Number(serialized.Required_Headcount) : null;
    const act = serialized.Actual_Headcount !== null && serialized.Actual_Headcount !== undefined ? Number(serialized.Actual_Headcount) : null;
    const app = serialized.Approved_Headcount !== null && serialized.Approved_Headcount !== undefined ? Number(serialized.Approved_Headcount) : null;
    const variance = (act !== null && req !== null) ? (act - req) : null;

    if (req !== null) totalRequiredHc += req;
    if (act !== null) totalActualHc += act;
    if (app !== null) totalApprovedHc += app;

    if (variance !== null) {
      if (variance < 0) understaffedAccountCount++;
      else if (variance > 0) overstaffedAccountCount++;
      else balancedAccountCount++;
    }

    // Utilization (M011)
    const prodHrs = serialized.Productive_Hrs !== null && serialized.Productive_Hrs !== undefined ? Number(serialized.Productive_Hrs) : null;
    const staffHrs = serialized.Staff_Hrs !== null && serialized.Staff_Hrs !== undefined ? Number(serialized.Staff_Hrs) : null;
    if (prodHrs !== null) totalProductiveHrs += prodHrs;
    if (staffHrs !== null) totalStaffHrs += staffHrs;

    const utilPct = serialized.Utilization_Pct !== null && serialized.Utilization_Pct !== undefined ? Number(serialized.Utilization_Pct) : null;
    const utilDisplay = utilPct !== null ? `${(utilPct * 100).toFixed(1)}%` : 'N/A';
    // Authoritative RAG directly from vw_qa_utilization
    const utilRag = (serialized.Utilization_Status_RAG as 'Green' | 'Amber' | 'Red') || null;
    if (utilRag === 'Green') m011GreenCount++;
    else if (utilRag === 'Amber') m011AmberCount++;
    else if (utilRag === 'Red') m011RedCount++;

    // Attrition (M012)
    const exits = serialized.Exits !== null && serialized.Exits !== undefined ? Number(serialized.Exits) : null;
    const openingHc = serialized.Opening_HC !== null && serialized.Opening_HC !== undefined ? Number(serialized.Opening_HC) : null;
    if (exits !== null) totalExits += exits;
    if (openingHc !== null) totalOpeningHc += openingHc;

    const attrPct = serialized.Annualized_Attrition_Pct !== null && serialized.Annualized_Attrition_Pct !== undefined ? Number(serialized.Annualized_Attrition_Pct) : null;
    const attrDisplay = attrPct !== null ? `${(attrPct * 100).toFixed(1)}%` : 'N/A';
    // Authoritative RAG directly from vw_qa_attrition
    const attrRag = (serialized.Attrition_Status_RAG as 'Green' | 'Amber' | 'Red') || null;
    if (attrRag === 'Green') m012GreenCount++;
    else if (attrRag === 'Amber') m012AmberCount++;
    else if (attrRag === 'Red') m012RedCount++;

    // Billing
    const billable = serialized.Billable_FTE !== null && serialized.Billable_FTE !== undefined ? Number(serialized.Billable_FTE) : null;
    const billed = serialized.Billed_FTE !== null && serialized.Billed_FTE !== undefined ? Number(serialized.Billed_FTE) : null;
    if (billable !== null) totalBillableFte += billable;
    if (billed !== null) totalBilledFte += billed;

    const billCov = serialized.Billing_Coverage_Pct !== null && serialized.Billing_Coverage_Pct !== undefined ? Number(serialized.Billing_Coverage_Pct) : null;
    const billDisplay = billCov !== null ? `${(billCov * 100).toFixed(1)}%` : 'N/A';
    // NON-GOVERNED LOCAL LOGIC: Commercial billing coverage has no official Metric_ID in Metric_Master/vw_kpi_snapshot_official; uses vw_billed_qa Status_RAG when present or retained product logic.
    let billRag: 'Green' | 'Amber' | 'Red' | null = (serialized.Billing_Status_RAG as 'Green' | 'Amber' | 'Red') || null;
    if (!billRag && billCov !== null) {
      if (billCov >= 0.95) billRag = 'Green';
      else if (billCov >= 0.90) billRag = 'Amber';
      else billRag = 'Red';
    }
    if (billable !== null && billed !== null && billed < billable) {
      underBilledAccountCount++;
    }

    const staffRagRaw = serialized.Staffing_Status_RAG;
    const staffRag: 'Green' | 'Amber' | 'Red' | null = (staffRagRaw === 'Green' || staffRagRaw === 'Amber' || staffRagRaw === 'Red') ? staffRagRaw : null;

    return {
      accountId: serialized.Account_ID,
      accountName: serialized.Account_Name,
      vertical: serialized.Vertical,
      qaLeader: serialized.QA_Leader,
      srDirector: serialized.Sr_Director,
      site: serialized.Site,
      lob: serialized.LOB,
      requiredQa: req,
      actualQa: act,
      approvedQa: app,
      staffingVariance: variance,
      staffingRag: staffRag,
      utilizationPct: utilPct,
      utilizationDisplay: utilDisplay,
      utilizationRag: utilRag,
      attritionPct: attrPct,
      attritionDisplay: attrDisplay,
      attritionRag: attrRag,
      exits,
      openingHc,
      billableFte: billable,
      billedFte: billed,
      billingCoveragePct: billCov,
      billingCoverageDisplay: billDisplay,
      billingRag: billRag,
      mappedQa: Number(serialized.Core_Operations_HC || 0),
      activeQa: Number(serialized.Core_Operations_HC || 0),
      b1Count: Number(serialized.B1 || 0),
      b2Count: Number(serialized.B2 || 0),
      c1Count: Number(serialized.C1 || 0),
      c2Count: Number(serialized.C2 || 0),
    };
  });

  // Calculate Headline Metrics
  const staffingVariance = totalActualHc - totalRequiredHc;
  const staffingVarianceDisplay = staffingVariance > 0 ? `+${staffingVariance}` : `${staffingVariance}`;

  // M011 Headline
  const m011Exec = (execRows || []).find((r: any) => r.Metric_ID === 'M011');
  const m011Actual = totalStaffHrs > 0 ? (totalProductiveHrs / totalStaffHrs) : null;
  const m011Display = m011Actual !== null ? `${(m011Actual * 100).toFixed(1)}%` : 'N/A';
  const m011Target = m011Exec?.Target_Value != null ? Number(m011Exec.Target_Value) : 0.90;
  const m011VarianceToTarget = m011Actual !== null ? (m011Actual - m011Target) : null;
  const m011FavourableVariance = m011VarianceToTarget;
  let m011Rag: 'Green' | 'Amber' | 'Red' | null = null;
  if (totalAccounts === 1 && accountRegister[0]) {
    m011Rag = accountRegister[0].utilizationRag;
  } else if (m011Exec?.Aggregate_RAG && totalAccounts >= 190) {
    m011Rag = m011Exec.Aggregate_RAG as 'Green' | 'Amber' | 'Red';
  } else if (m011RedCount > m011GreenCount && m011RedCount > m011AmberCount) {
    m011Rag = 'Red';
  } else if (m011AmberCount >= m011GreenCount) {
    m011Rag = 'Amber';
  } else if (m011GreenCount > 0) {
    m011Rag = 'Green';
  }

  // M012 Headline
  const m012Exec = (execRows || []).find((r: any) => r.Metric_ID === 'M012');
  const m012Actual = totalOpeningHc > 0 ? ((totalExits / totalOpeningHc) * 12) : null;
  const m012Display = m012Actual !== null ? `${(m012Actual * 100).toFixed(1)}%` : 'N/A';
  const m012Target = m012Exec?.Target_Value != null ? Number(m012Exec.Target_Value) : 0.10;
  const m012VarianceToTarget = m012Actual !== null ? (m012Actual - m012Target) : null;
  const m012FavourableVariance = m012Actual !== null ? (m012Target - m012Actual) : null;
  let m012Rag: 'Green' | 'Amber' | 'Red' | null = null;
  if (totalAccounts === 1 && accountRegister[0]) {
    m012Rag = accountRegister[0].attritionRag;
  } else if (m012Exec?.Aggregate_RAG && totalAccounts >= 190) {
    m012Rag = m012Exec.Aggregate_RAG as 'Green' | 'Amber' | 'Red';
  } else if (m012RedCount > m012GreenCount && m012RedCount > m012AmberCount) {
    m012Rag = 'Red';
  } else if (m012AmberCount >= m012GreenCount) {
    m012Rag = 'Amber';
  } else if (m012GreenCount > 0) {
    m012Rag = 'Green';
  }

  // Commercial Headline
  const billingCoverage = totalBillableFte > 0 ? (totalBilledFte / totalBillableFte) : null;
  const billingCoverageDisplay = billingCoverage !== null ? `${(billingCoverage * 100).toFixed(1)}%` : 'N/A';
  // NON-GOVERNED LOCAL LOGIC: Commercial billing coverage has no official Metric_ID in Metric_Master/vw_kpi_snapshot_official; retained temporarily as un-governed product logic.
  let billingRag: 'Green' | 'Amber' | 'Red' | null = null;
  if (billingCoverage !== null) {
    if (billingCoverage >= 0.95) billingRag = 'Green';
    else if (billingCoverage >= 0.90) billingRag = 'Amber';
    else billingRag = 'Red';
  }

  // Process Site Rollup
  const siteRollup: QaTeamSiteRollup[] = (siteRows || []).map((s: any) => {
    const sSer = serializeBigQueryValue(s) as Record<string, any>;
    const sReq = Number(sSer.Site_Required_Headcount || 0);
    const sAct = Number(sSer.Site_Actual_Headcount || 0);
    const sVar = sAct - sReq;

    const sUtil = sSer.Site_Utilization !== null && sSer.Site_Utilization !== undefined ? Number(sSer.Site_Utilization) : null;
    const sUtilDisplay = sUtil !== null ? `${(sUtil * 100).toFixed(1)}%` : 'N/A';
    // Authoritative semantic RAG is unavailable at site level for M011; return null per governance principle
    const sUtilRag: 'Green' | 'Amber' | 'Red' | null = null;

    const sAttr = sSer.Site_Attrition !== null && sSer.Site_Attrition !== undefined ? Number(sSer.Site_Attrition) : null;
    const sAttrDisplay = sAttr !== null ? `${(sAttr * 100).toFixed(1)}%` : 'N/A';
    // Authoritative semantic RAG is unavailable at site level for M012; return null per governance principle
    const sAttrRag: 'Green' | 'Amber' | 'Red' | null = null;

    const sBill = sSer.Site_Billing_Coverage !== null && sSer.Site_Billing_Coverage !== undefined ? Number(sSer.Site_Billing_Coverage) : null;
    const sBillDisplay = sBill !== null ? `${(sBill * 100).toFixed(1)}%` : 'N/A';
    let sBillRag: 'Green' | 'Amber' | 'Red' | null = null;
    if (sBill !== null) {
      if (sBill >= 0.95) sBillRag = 'Green';
      else if (sBill >= 0.90) sBillRag = 'Amber';
      else sBillRag = 'Red';
    }

    return {
      site: sSer.Site || 'Unknown',
      accountCount: Number(sSer.Account_Count || 0),
      requiredHeadcount: sReq,
      actualHeadcount: sAct,
      variance: sVar,
      utilizationPct: sUtil,
      utilizationDisplay: sUtilDisplay,
      utilizationRag: sUtilRag,
      attritionPct: sAttr,
      attritionDisplay: sAttrDisplay,
      attritionRag: sAttrRag,
      billingCoveragePct: sBill,
      billingCoverageDisplay: sBillDisplay,
      billingRag: sBillRag,
    };
  });

  // Process Historical Trends
  const monthsArray: string[] = [];
  const historicalTrends: QaTeamTrendPoint[] = (trendRows || []).map((t: any) => {
    const tSer = serializeBigQueryValue(t) as Record<string, any>;
    const mStr = tSer.Month_Str ? parseDateValue(tSer.Month_Str) : '';
    if (mStr) monthsArray.push(mStr);

    const rQa = Number(tSer.Total_Required_QA || 0);
    const aQa = Number(tSer.Total_Actual_QA || 0);
    const vQa = aQa - rQa;

    const prodH = Number(tSer.Total_Productive_Hrs || 0);
    const stfH = Number(tSer.Total_Staff_Hrs || 0);
    const util = tSer.Weighted_Utilization !== null && tSer.Weighted_Utilization !== undefined ? Number(tSer.Weighted_Utilization) : null;

    const ex = Number(tSer.Total_Exits || 0);
    const op = Number(tSer.Total_Opening_HC || 0);
    const attr = tSer.Weighted_Attrition !== null && tSer.Weighted_Attrition !== undefined ? Number(tSer.Weighted_Attrition) : null;

    const bFte = Number(tSer.Total_Billable_FTE || 0);
    const bdFte = Number(tSer.Total_Billed_FTE || 0);
    const cov = tSer.Weighted_Billing_Coverage !== null && tSer.Weighted_Billing_Coverage !== undefined ? Number(tSer.Weighted_Billing_Coverage) : null;

    return {
      month: mStr,
      monthDisplay: tSer.Month_Display || formatMonthDisplay(mStr),
      requiredQa: rQa,
      actualQa: aQa,
      staffingVariance: vQa,
      productiveHrs: prodH,
      staffHrs: stfH,
      utilizationPct: util,
      exits: ex,
      openingHc: op,
      attritionPct: attr,
      billableFte: bFte,
      billedFte: bdFte,
      billingCoveragePct: cov,
    };
  });

  const availableMonthCount = historicalTrends.length;
  const historyCoverageStatus: 'COMPLETE' | 'PARTIAL_HISTORY' =
    availableMonthCount >= requestedMonthCount ? 'COMPLETE' : 'PARTIAL_HISTORY';

  return {
    reportingContext: {
      officialReportingMonth,
      latestClosedMonth,
      latestAvailableMonth,
      currentOpenMonth,
      submissionDeadline,
    },
    rangeContext: {
      requestedPeriod: period,
      requestedMonthCount,
      availableMonthCount,
      historyCoverageStatus,
      startMonth: historicalTrends[0]?.month || historyStartMonth,
      endMonth: latestClosedMonth,
      months: monthsArray,
    },
    scopeSummary: {
      totalAccounts,
      latestClosedActualHc: totalActualHc,
      currentCoreOperationsHc: bandDistribution.coreOperationsTotal,
      currentTotalOrganizationHc: bandDistribution.totalOrganization,
    },
    headline: {
      staffing: {
        requiredHeadcount: totalRequiredHc,
        actualHeadcount: totalActualHc,
        approvedHeadcount: totalApprovedHc,
        variance: staffingVariance,
        varianceDisplay: staffingVarianceDisplay,
        understaffedAccountCount,
        overstaffedAccountCount,
        balancedAccountCount,
      },
      utilization: {
        metricId: 'M011',
        metricName: 'QA Utilization',
        productiveHrs: totalProductiveHrs,
        staffHrs: totalStaffHrs,
        actualValue: m011Actual,
        actualDisplay: m011Display,
        targetValue: m011Target,
        targetDisplay: '90%',
        varianceToTarget: m011VarianceToTarget,
        favourableVariance: m011FavourableVariance,
        isHigherBetter: true,
        rag: m011Rag,
        greenCount: m011GreenCount,
        amberCount: m011AmberCount,
        redCount: m011RedCount,
      },
      attrition: {
        metricId: 'M012',
        metricName: 'QA Attrition',
        exits: totalExits,
        openingHc: totalOpeningHc,
        actualValue: m012Actual,
        actualDisplay: m012Display,
        targetValue: m012Target,
        targetDisplay: '10%',
        varianceToTarget: m012VarianceToTarget,
        favourableVariance: m012FavourableVariance,
        isHigherBetter: false,
        rag: m012Rag,
        greenCount: m012GreenCount,
        amberCount: m012AmberCount,
        redCount: m012RedCount,
      },
      commercial: {
        billableFte: totalBillableFte,
        billedFte: totalBilledFte,
        coverageValue: billingCoverage,
        coverageDisplay: billingCoverageDisplay,
        rag: billingRag,
        underBilledAccountCount,
      },
    },
    siteRollup,
    bandDistribution,
    historicalTrends,
    accountRegister,
  };
}
