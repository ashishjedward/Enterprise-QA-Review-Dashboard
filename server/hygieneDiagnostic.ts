import { BigQuery } from '@google-cloud/bigquery';
import { getBigQueryClient, getBigQueryConfig, serializeBigQueryValue } from './bigquery';
import { ScopeFilters } from './scopedOverview';
import { resolveReportingWindows } from './reportingPeriod';

export type HygieneTimePeriod = '3M' | '6M' | 'YTD' | '12M';

export interface HygieneScopeInfo {
  vertical: string | null;
  qaLeader: string | null;
  srDirector: string | null;
  accountId: string | null;
  site: string | null;
  lob: string | null;
  totalAccounts: number;
  accountsWithData: number;
  accountsNoRedAmber: number;
  accountsWithAmber: number;
  accountsWithRed: number;
}

export interface HygieneReportingContext {
  latestClosedMonth: string;
  officialReportingMonth: string;
  latestAvailableMonth: string;
  currentOpenMonth: string;
}

export interface HygieneRangeContext {
  requestedPeriod: HygieneTimePeriod;
  requestedMonthCount: number;
  availableMonthCount: number;
  startMonth: string;
  endMonth: string;
  historyCoverageStatus: 'FULL_HISTORY' | 'PARTIAL_HISTORY';
}

export interface HygieneMetricSummary {
  metricId: 'M006' | 'M007' | 'M008' | 'M009' | 'M010';
  metricName: string;
  metricScale: 'DECIMAL_PERCENTAGE' | 'ZERO_TO_100';
  actualValue: number | null;
  actualDisplay: string;
  targetValue: number | null;
  targetDisplay: string;
  varianceValue: number | null;
  varianceDisplay: string;
  rag: 'Green' | 'Amber' | 'Red' | null;
  totalAccounts: number;
  applicableAccountCount: number;
  accountsWithData: number;
  greenAccountCount: number;
  amberAccountCount: number;
  redAccountCount: number;
  dataPresenceStatus: string;
}

export interface PortfolioTniSummary {
  applicableAccounts: number;
  publishedAccounts: number;
  pendingAccounts: number;
  notApplicableAccounts: number;
  adherenceValue: number | null;
  adherenceDisplay: string;
  targetValue: null;
  targetDisplay: string;
  rag: null;
}

export interface AccountKpiCell {
  actualValue: number | null;
  actualDisplay: string;
  targetValue: number | null;
  targetDisplay: string;
  rag: 'Green' | 'Amber' | 'Red' | null;
  dataPresenceStatus: string;
}

export interface AccountM010Cell extends AccountKpiCell {
  isApplicable: boolean;
}

export interface AccountTniCell {
  isApplicable: boolean;
  status: string;
  rag: 'Green' | 'Amber' | 'Red' | null;
}

export interface AccountHygieneRegisterRow {
  accountId: string;
  accountName: string;
  vertical: string;
  qaLeader: string;
  srDirector: string;
  site: string;
  lob: string;
  m006: AccountKpiCell;
  m007: AccountKpiCell;
  m008: AccountKpiCell;
  m009: AccountKpiCell;
  m010: AccountM010Cell;
  tni: AccountTniCell;
  redKpiCount: number;
  amberKpiCount: number;
  applicableKpiCount: number;
  kpiWithDataCount: number;
}

export interface HygieneTrendPoint {
  month: string;
  reportingMonth: string;
  m006Actual: number | null;
  m006Display: string;
  m007Actual: number | null;
  m007Display: string;
  m008Actual: number | null;
  m008Display: string;
  m009Actual: number | null;
  m009Display: string;
  m010Actual: number | null;
  m010Display: string;
  tniAdherencePct: number | null;
  tniAdherenceDisplay: string;
}

export interface AuditFeedbackBreakdown {
  totalAuditTarget: number;
  totalAuditsCompleted: number;
  auditAchievementValue: number | null;
  auditAchievementDisplay: string;
  feedbackWithin24hCount: number;
  feedbackWithin24hPct: number | null;
  feedbackWithin24hDisplay: string;
  feedback24to48hCount: number;
  feedback24to48hPct: number | null;
  feedback24to48hDisplay: string;
  feedbackOver48hCount: number;
  feedbackOver48hPct: number | null;
  feedbackOver48hDisplay: string;
}

export interface HygieneAuditBreakdown {
  complianceAuditAccuracy: number | null;
  complianceAuditDisplay: string;
  totalComplianceAudits: number;
  hygieneAuditAccuracy: number | null;
  hygieneAuditDisplay: string;
  totalHygieneAudits: number;
  rcaBreakdown: Array<{ reason: string; count: number }>;
}

export interface CalibrationOperationalBreakdown {
  totalTargetAttendance: number;
  totalActualAttendance: number;
  weightedAttendanceRatio: number | null;
  weightedAttendanceDisplay: string;
}

export interface AtaAlignmentBreakdown {
  avgSelfAssessmentScore: number | null;
  avgSelfAssessmentDisplay: string;
  avgClientScore: number | null;
  avgClientDisplay: string;
  avgClientVsSelfGapPp: number | null;
  avgClientVsSelfGapDisplay: string;
  spotCheckCount: number;
  applicableMsaAccounts: number;
}

export interface HygieneDiagnosticData {
  scope: HygieneScopeInfo;
  reportingContext: HygieneReportingContext;
  rangeContext: HygieneRangeContext;
  headlineKpis: {
    m006: HygieneMetricSummary;
    m007: HygieneMetricSummary;
    m008: HygieneMetricSummary;
    m009: HygieneMetricSummary;
    m010: HygieneMetricSummary;
    tni: PortfolioTniSummary;
  };
  historicalTrends: HygieneTrendPoint[];
  operationalBreakdowns: {
    auditFeedback: AuditFeedbackBreakdown;
    hygieneAudits: HygieneAuditBreakdown;
    calibration: CalibrationOperationalBreakdown;
    ataAlignment: AtaAlignmentBreakdown;
  };
  accountRegister: AccountHygieneRegisterRow[];
}

export interface HygieneDiagnosticResponse {
  data: HygieneDiagnosticData;
}

/**
 * Builds parameterized WHERE clause for account filtering
 */
function buildAccountWhereClause(
  filters: ScopeFilters,
  params: Record<string, any>,
  tableAlias = 'a'
): string {
  const clauses: string[] = [];

  if (filters.vertical && filters.vertical !== 'ALL') {
    clauses.push(`${tableAlias}.Vertical = @vertical`);
    params.vertical = filters.vertical;
  }
  if (filters.qaLeader && filters.qaLeader !== 'ALL') {
    clauses.push(`${tableAlias}.QA_Leader = @qaLeader`);
    params.qaLeader = filters.qaLeader;
  }
  if (filters.srDirector && filters.srDirector !== 'ALL') {
    clauses.push(`${tableAlias}.Sr_Director = @srDirector`);
    params.srDirector = filters.srDirector;
  }
  if (filters.accountId && filters.accountId !== 'ALL') {
    clauses.push(`${tableAlias}.Account_ID = @accountId`);
    params.accountId = filters.accountId;
  }
  if (filters.site && filters.site !== 'ALL') {
    clauses.push(`${tableAlias}.Site = @site`);
    params.site = filters.site;
  }
  if (filters.lob && filters.lob !== 'ALL') {
    clauses.push(`${tableAlias}.LOB = @lob`);
    params.lob = filters.lob;
  }

  return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
}

/**
 * Formats a decimal (0-1) as a percentage string (e.g. 0.9485 -> "94.9%")
 */
function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return `${(val * 100).toFixed(1)}%`;
}

/**
 * Formats a 0-100 score string (e.g. 91.965 -> "92.0") without %
 */
function formatScore(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return val.toFixed(1);
}

/**
 * Formats date to Month-Year label (e.g. "2026-07-01" -> "Jul-26")
 */
function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 2) return dateStr;
  const year = parts[0].slice(-2);
  const monthNum = parseInt(parts[1], 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[monthNum - 1] || parts[1];
  return `${monthName}-${year}`;
}

export async function fetchHygieneDiagnostic(
  filters: ScopeFilters & { timePeriod?: string }
): Promise<HygieneDiagnosticData> {
  const period = (filters.timePeriod || '3M') as HygieneTimePeriod;
  if (!['3M', '6M', 'YTD', '12M'].includes(period)) {
    throw new Error(`Invalid timePeriod: ${period}. Supported values are 3M, 6M, YTD, 12M.`);
  }

  const bq = getBigQueryClient();
  const { projectId, dataset, location } = getBigQueryConfig();

  // ----------------------------------------------------
  // QUERY 1: Latest Closed Snapshot, KPIs, TNI, and Account Register
  // ----------------------------------------------------
  const q1Params: Record<string, any> = {};
  const accountWhereQ1 = buildAccountWhereClause(filters, q1Params, 'm');

  const query1 = `
    WITH reporting_ctx AS (
      SELECT
        CAST(Latest_Closed_Month AS STRING) AS Latest_Closed_Month,
        CAST(Latest_Available_Month AS STRING) AS Latest_Available_Month,
        CAST(Current_Open_Month AS STRING) AS Current_Open_Month
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
      ${accountWhereQ1}
    ),
    kpi_snapshots AS (
      SELECT
        s.Account_ID,
        s.Metric_ID,
        s.Actual_Value,
        s.Actual_Display,
        s.Target_Value,
        s.Target_Display,
        s.Effective_RAG AS RAG,
        s.Data_Presence_Status
      FROM \`${projectId}.${dataset}.vw_kpi_snapshot_official\` s
      JOIN scoped_accounts a ON s.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(s.Month AS STRING) = rc.Latest_Closed_Month
        AND s.Metric_ID IN ('M006', 'M007', 'M008', 'M009', 'M010')
    ),
    tni_records AS (
      SELECT
        t.Account_ID,
        t.Is_TNI_Applicable,
        t.TNI_Status,
        t.Status_RAG,
        t.Published_Date
      FROM \`${projectId}.${dataset}.vw_tni\` t
      JOIN scoped_accounts a ON t.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(t.Month AS STRING) = rc.Latest_Closed_Month
    ),
    ata_ext_records AS (
      SELECT
        e.Account_ID,
        e.Is_MSA_Applicable,
        e.Client_Score,
        e.Self_Assessment_Score,
        e.Target_Score,
        e.Status_RAG
      FROM \`${projectId}.${dataset}.vw_ata_external_msa\` e
      JOIN scoped_accounts a ON e.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(e.Month AS STRING) = rc.Latest_Closed_Month
    ),
    m006_scope_agg AS (
      SELECT
        SUM(Audits_Completed) AS total_audits_completed,
        SUM(Audit_Target) AS total_audit_target,
        SAFE_DIVIDE(SUM(Audits_Completed), SUM(Audit_Target)) AS m006_actual
      FROM \`${projectId}.${dataset}.vw_audit_feedback\` f
      JOIN scoped_accounts a ON f.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(f.Month AS STRING) = rc.Latest_Closed_Month
    ),
    m007_scope_agg AS (
      SELECT
        SUM(Correct_Count) AS total_correct_count,
        SUM(Total_Audits) AS total_audits_count,
        SAFE_DIVIDE(SUM(Correct_Count), SUM(Total_Audits)) AS m007_actual
      FROM \`${projectId}.${dataset}.vw_hygiene_audits\` h
      JOIN scoped_accounts a ON h.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(h.Month AS STRING) = rc.Latest_Closed_Month
    ),
    m008_scope_agg AS (
      SELECT
        AVG(Attendance_Pct) AS m008_actual
      FROM \`${projectId}.${dataset}.vw_calibration\` c
      JOIN scoped_accounts a ON c.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(c.Month AS STRING) = rc.Latest_Closed_Month
    ),
    m009_scope_agg AS (
      SELECT
        AVG(Self_Assessment_Score) AS m009_actual,
        COUNTIF(Self_Assessment_Score IS NOT NULL) AS m009_data_count
      FROM \`${projectId}.${dataset}.vw_ata_internal\` i
      JOIN scoped_accounts a ON i.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(i.Month AS STRING) = rc.Latest_Closed_Month
        AND i.Applicable = true
    ),
    m010_scope_agg AS (
      SELECT
        AVG(Client_Score) AS m010_actual,
        COUNTIF(Client_Score IS NOT NULL) AS m010_applicable_count
      FROM \`${projectId}.${dataset}.vw_ata_external_msa\` e
      JOIN scoped_accounts a ON e.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(e.Month AS STRING) = rc.Latest_Closed_Month
        AND e.Is_MSA_Applicable = true
    ),
    kpi_executive AS (
      SELECT
        Metric_ID,
        Actual_Value,
        Actual_Display,
        Target_Value,
        CASE
          WHEN Metric_ID IN ('M006', 'M007', 'M008') THEN CONCAT(CAST(ROUND(Target_Value * 100, 1) AS STRING), '%')
          ELSE CAST(Target_Value AS STRING)
        END AS Target_Display,
        Aggregate_RAG
      FROM \`${projectId}.${dataset}.vw_executive_kpi_official\`
      WHERE Metric_ID IN ('M006', 'M007', 'M008', 'M009', 'M010')
    )
    SELECT
      (SELECT AS STRUCT * FROM reporting_ctx) AS reporting_ctx,
      (SELECT ARRAY_AGG(e) FROM kpi_executive e) AS executive_kpis,
      (SELECT AS STRUCT * FROM m006_scope_agg) AS m006_agg,
      (SELECT AS STRUCT * FROM m007_scope_agg) AS m007_agg,
      (SELECT AS STRUCT * FROM m008_scope_agg) AS m008_agg,
      (SELECT AS STRUCT * FROM m009_scope_agg) AS m009_agg,
      (SELECT AS STRUCT * FROM m010_scope_agg) AS m010_agg,
      ARRAY(
        SELECT AS STRUCT
          a.Account_ID,
          a.Account_Name,
          a.Vertical,
          a.QA_Leader,
          a.Sr_Director,
          a.Site,
          a.LOB,
          (SELECT AS STRUCT * FROM kpi_snapshots s WHERE s.Account_ID = a.Account_ID AND s.Metric_ID = 'M006') AS m006,
          (SELECT AS STRUCT * FROM kpi_snapshots s WHERE s.Account_ID = a.Account_ID AND s.Metric_ID = 'M007') AS m007,
          (SELECT AS STRUCT * FROM kpi_snapshots s WHERE s.Account_ID = a.Account_ID AND s.Metric_ID = 'M008') AS m008,
          (SELECT AS STRUCT * FROM kpi_snapshots s WHERE s.Account_ID = a.Account_ID AND s.Metric_ID = 'M009') AS m009,
          (SELECT AS STRUCT * FROM kpi_snapshots s WHERE s.Account_ID = a.Account_ID AND s.Metric_ID = 'M010') AS m010,
          (SELECT AS STRUCT * FROM tni_records t WHERE t.Account_ID = a.Account_ID) AS tni,
          (SELECT AS STRUCT * FROM ata_ext_records e WHERE e.Account_ID = a.Account_ID) AS ata_ext
        FROM scoped_accounts a
        ORDER BY a.Account_Name ASC
      ) AS accounts
  `;

  // ----------------------------------------------------
  // QUERY 2: Historical Trends across Requested Range
  // ----------------------------------------------------
  const q2Params: Record<string, any> = {};
  const accountWhereQ2 = buildAccountWhereClause(filters, q2Params, 'm');

  const query2 = `
    WITH reporting_ctx AS (
      SELECT
        CAST(Latest_Closed_Month AS STRING) AS Latest_Closed_Month,
        PARSE_DATE('%Y-%m-%d', CAST(Latest_Closed_Month AS STRING)) AS latest_closed_date
      FROM \`${projectId}.${dataset}.vw_reporting_context\`
      LIMIT 1
    ),
    range_calc AS (
      SELECT
        Latest_Closed_Month,
        latest_closed_date,
        CASE
          WHEN @period = '3M' THEN DATE_SUB(latest_closed_date, INTERVAL 2 MONTH)
          WHEN @period = '6M' THEN DATE_SUB(latest_closed_date, INTERVAL 5 MONTH)
          WHEN @period = 'YTD' THEN DATE_TRUNC(latest_closed_date, YEAR)
          WHEN @period = '12M' THEN DATE_SUB(latest_closed_date, INTERVAL 11 MONTH)
          ELSE DATE_SUB(latest_closed_date, INTERVAL 2 MONTH)
        END AS start_date
      FROM reporting_ctx
    ),
    scoped_accounts AS (
      SELECT m.Account_ID
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      ${accountWhereQ2}
    ),
    m006_monthly AS (
      SELECT
        CAST(f.Month AS STRING) AS Month,
        SAFE_DIVIDE(SUM(f.Audits_Completed), SUM(f.Audit_Target)) AS m006_actual
      FROM \`${projectId}.${dataset}.vw_audit_feedback\` f
      JOIN scoped_accounts a ON f.Account_ID = a.Account_ID
      CROSS JOIN range_calc r
      WHERE f.Month >= r.start_date AND f.Month <= r.latest_closed_date
      GROUP BY Month
    ),
    m007_monthly AS (
      SELECT
        CAST(h.Month AS STRING) AS Month,
        SAFE_DIVIDE(SUM(h.Correct_Count), SUM(h.Total_Audits)) AS m007_actual
      FROM \`${projectId}.${dataset}.vw_hygiene_audits\` h
      JOIN scoped_accounts a ON h.Account_ID = a.Account_ID
      CROSS JOIN range_calc r
      WHERE h.Month >= r.start_date AND h.Month <= r.latest_closed_date
      GROUP BY Month
    ),
    m008_monthly AS (
      SELECT
        CAST(c.Month AS STRING) AS Month,
        AVG(c.Attendance_Pct) AS m008_actual
      FROM \`${projectId}.${dataset}.vw_calibration\` c
      JOIN scoped_accounts a ON c.Account_ID = a.Account_ID
      CROSS JOIN range_calc r
      WHERE c.Month >= r.start_date AND c.Month <= r.latest_closed_date
      GROUP BY Month
    ),
    m009_monthly AS (
      SELECT
        CAST(i.Month AS STRING) AS Month,
        AVG(i.Self_Assessment_Score) AS m009_actual
      FROM \`${projectId}.${dataset}.vw_ata_internal\` i
      JOIN scoped_accounts a ON i.Account_ID = a.Account_ID
      CROSS JOIN range_calc r
      WHERE i.Month >= r.start_date AND i.Month <= r.latest_closed_date
        AND i.Applicable = true
      GROUP BY Month
    ),
    m010_monthly AS (
      SELECT
        CAST(e.Month AS STRING) AS Month,
        AVG(e.Client_Score) AS m010_actual
      FROM \`${projectId}.${dataset}.vw_ata_external_msa\` e
      JOIN scoped_accounts a ON e.Account_ID = a.Account_ID
      CROSS JOIN range_calc r
      WHERE e.Month >= r.start_date AND e.Month <= r.latest_closed_date
        AND e.Is_MSA_Applicable = true
      GROUP BY Month
    ),
    tni_monthly AS (
      SELECT
        CAST(t.Month AS STRING) AS Month,
        SAFE_DIVIDE(
          COUNTIF(t.Is_TNI_Applicable = true AND t.TNI_Status = 'Published'),
          COUNTIF(t.Is_TNI_Applicable = true)
        ) AS tni_adherence
      FROM \`${projectId}.${dataset}.vw_tni\` t
      JOIN scoped_accounts a ON t.Account_ID = a.Account_ID
      CROSS JOIN range_calc r
      WHERE t.Month >= r.start_date AND t.Month <= r.latest_closed_date
      GROUP BY Month
    ),
    months_series AS (
      SELECT DISTINCT Month FROM m006_monthly
      UNION DISTINCT SELECT Month FROM m007_monthly
      UNION DISTINCT SELECT Month FROM m008_monthly
      UNION DISTINCT SELECT Month FROM m009_monthly
      UNION DISTINCT SELECT Month FROM m010_monthly
      UNION DISTINCT SELECT Month FROM tni_monthly
    )
    SELECT
      r.start_date,
      r.latest_closed_date,
      ARRAY(
        SELECT AS STRUCT
          m.Month,
          m006.m006_actual,
          m007.m007_actual,
          m008.m008_actual,
          m009.m009_actual,
          m010.m010_actual,
          tni.tni_adherence
        FROM months_series m
        LEFT JOIN m006_monthly m006 ON m.Month = m006.Month
        LEFT JOIN m007_monthly m007 ON m.Month = m007.Month
        LEFT JOIN m008_monthly m008 ON m.Month = m008.Month
        LEFT JOIN m009_monthly m009 ON m.Month = m009.Month
        LEFT JOIN m010_monthly m010 ON m.Month = m010.Month
        LEFT JOIN tni_monthly tni ON m.Month = tni.Month
        ORDER BY m.Month ASC
      ) AS trend_points
    FROM range_calc r
  `;
  q2Params.period = period;

  // ----------------------------------------------------
  // QUERY 3: Operational Breakdowns (at Latest Closed Month)
  // ----------------------------------------------------
  const q3Params: Record<string, any> = {};
  const accountWhereQ3 = buildAccountWhereClause(filters, q3Params, 'm');

  const query3 = `
    WITH reporting_ctx AS (
      SELECT
        CAST(Latest_Closed_Month AS STRING) AS Latest_Closed_Month
      FROM \`${projectId}.${dataset}.vw_reporting_context\`
      LIMIT 1
    ),
    scoped_accounts AS (
      SELECT m.Account_ID
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      ${accountWhereQ3}
    ),
    audit_feedback_breakdown AS (
      SELECT
        COALESCE(SUM(f.Audit_Target), 0) AS total_audit_target,
        COALESCE(SUM(f.Audits_Completed), 0) AS total_audits_completed,
        SAFE_DIVIDE(SUM(f.Audits_Completed), SUM(f.Audit_Target)) AS achievement_pct,
        COALESCE(SUM(f.Feedback_Within_24h), 0) AS within_24h_count,
        SAFE_DIVIDE(SUM(f.Feedback_Within_24h), SUM(f.Feedback_Applicable_Count)) AS within_24h_pct,
        COALESCE(SUM(f.Feedback_24_to_48h), 0) AS f24_to_48h_count,
        SAFE_DIVIDE(SUM(f.Feedback_24_to_48h), SUM(f.Feedback_Applicable_Count)) AS f24_to_48h_pct,
        COALESCE(SUM(f.Feedback_Over_48h), 0) AS over_48h_count,
        SAFE_DIVIDE(SUM(f.Feedback_Over_48h), SUM(f.Feedback_Applicable_Count)) AS over_48h_pct
      FROM \`${projectId}.${dataset}.vw_audit_feedback\` f
      JOIN scoped_accounts a ON f.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(f.Month AS STRING) = rc.Latest_Closed_Month
    ),
    hygiene_audits_types AS (
      SELECT
        SAFE_DIVIDE(
          SUM(CASE WHEN h.Audit_Type = 'Compliance' THEN h.Correct_Count ELSE 0 END),
          SUM(CASE WHEN h.Audit_Type = 'Compliance' THEN h.Total_Audits ELSE 0 END)
        ) AS compliance_accuracy,
        COALESCE(SUM(CASE WHEN h.Audit_Type = 'Compliance' THEN h.Total_Audits ELSE 0 END), 0) AS total_compliance_audits,
        SAFE_DIVIDE(
          SUM(CASE WHEN h.Audit_Type = 'Hygiene' THEN h.Correct_Count ELSE 0 END),
          SUM(CASE WHEN h.Audit_Type = 'Hygiene' THEN h.Total_Audits ELSE 0 END)
        ) AS hygiene_accuracy,
        COALESCE(SUM(CASE WHEN h.Audit_Type = 'Hygiene' THEN h.Total_Audits ELSE 0 END), 0) AS total_hygiene_audits
      FROM \`${projectId}.${dataset}.vw_hygiene_audits\` h
      JOIN scoped_accounts a ON h.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(h.Month AS STRING) = rc.Latest_Closed_Month
    ),
    hygiene_rca AS (
      SELECT
        h.RCA AS reason,
        COUNT(*) AS count
      FROM \`${projectId}.${dataset}.vw_hygiene_audits\` h
      JOIN scoped_accounts a ON h.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(h.Month AS STRING) = rc.Latest_Closed_Month
        AND h.RCA IS NOT NULL AND TRIM(h.RCA) != ''
      GROUP BY reason
      ORDER BY count DESC
      LIMIT 5
    ),
    calibration_vol AS (
      SELECT
        COALESCE(SUM(c.Target_Calibration_Attendance), 0) AS total_target_attendance,
        COALESCE(SUM(c.Actual_Calibration_Attendance), 0) AS total_actual_attendance,
        SAFE_DIVIDE(SUM(c.Actual_Calibration_Attendance), SUM(c.Target_Calibration_Attendance)) AS weighted_attendance_ratio
      FROM \`${projectId}.${dataset}.vw_calibration\` c
      JOIN scoped_accounts a ON c.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(c.Month AS STRING) = rc.Latest_Closed_Month
    ),
    ata_align AS (
      SELECT
        AVG(e.Self_Assessment_Score) AS avg_self_score,
        AVG(e.Client_Score) AS avg_client_score,
        AVG(e.Client_vs_Self_Gap_pp) AS avg_gap_pp,
        COUNTIF(e.Spot_Check_Done_by_Client = true) AS spot_check_count,
        COUNTIF(e.Is_MSA_Applicable = true AND e.Client_Score IS NOT NULL) AS applicable_msa_count
      FROM \`${projectId}.${dataset}.vw_ata_external_msa\` e
      JOIN scoped_accounts a ON e.Account_ID = a.Account_ID
      CROSS JOIN reporting_ctx rc
      WHERE CAST(e.Month AS STRING) = rc.Latest_Closed_Month
        AND e.Is_MSA_Applicable = true
    )
    SELECT
      (SELECT AS STRUCT * FROM audit_feedback_breakdown) AS audit_feedback,
      (SELECT AS STRUCT * FROM hygiene_audits_types) AS hygiene_types,
      (SELECT AS STRUCT * FROM calibration_vol) AS calibration,
      (SELECT AS STRUCT * FROM ata_align) AS ata_alignment,
      ARRAY(
        SELECT AS STRUCT reason, count
        FROM hygiene_rca
      ) AS rca_list
  `;

  // ----------------------------------------------------
  // Execute Queries Concurrently
  // ----------------------------------------------------
  const [res1, res2, res3] = await Promise.all([
    bq.query({ query: query1, params: q1Params, location }),
    bq.query({ query: query2, params: q2Params, location }),
    bq.query({ query: query3, params: q3Params, location }),
  ]);

  const raw1: any = serializeBigQueryValue(res1[0]?.[0]) || {};
  const raw2: any = serializeBigQueryValue(res2[0]?.[0]) || {};
  const raw3: any = serializeBigQueryValue(res3[0]?.[0]) || {};

  const reportingCtx: HygieneReportingContext = {
    latestClosedMonth: raw1.reporting_ctx?.Latest_Closed_Month || '',
    officialReportingMonth: raw1.reporting_ctx?.Official_Reporting_Month || formatMonthYear(raw1.reporting_ctx?.Latest_Closed_Month || ''),
    latestAvailableMonth: raw1.reporting_ctx?.Latest_Available_Month || '',
    currentOpenMonth: raw1.reporting_ctx?.Current_Open_Month || '',
  };

  // Process Account Register
  const rawAccounts: any[] = raw1.accounts || [];
  let accountsWithDataCount = 0;
  let accountsNoRedAmberCount = 0;
  let accountsWithAmberCount = 0;
  let accountsWithRedCount = 0;

  // Track RAG counts per KPI
  const kpiCounts: Record<string, { green: number; amber: number; red: number; applicable: number; withData: number }> = {
    M006: { green: 0, amber: 0, red: 0, applicable: 0, withData: 0 },
    M007: { green: 0, amber: 0, red: 0, applicable: 0, withData: 0 },
    M008: { green: 0, amber: 0, red: 0, applicable: 0, withData: 0 },
    M009: { green: 0, amber: 0, red: 0, applicable: 0, withData: 0 },
    M010: { green: 0, amber: 0, red: 0, applicable: 0, withData: 0 },
  };

  // TNI counts
  let tniApplicable = 0;
  let tniPublished = 0;
  let tniPending = 0;
  let tniNotApplicable = 0;

  const accountRegister: AccountHygieneRegisterRow[] = rawAccounts.map((acc) => {
    const rawM006 = acc.m006;
    const rawM007 = acc.m007;
    const rawM008 = acc.m008;
    const rawM009 = acc.m009;
    const rawM010 = acc.m010;
    const rawTni = acc.tni;
    const rawAtaExt = acc.ata_ext;

    // Helper for KPI cell - consumes Target_Value and Target_Display from BQ view
    const parseCell = (
      kpiObj: any,
      metricId: string,
      scale: 'DECIMAL_PERCENTAGE' | 'ZERO_TO_100'
    ): AccountKpiCell => {
      const tgtVal = kpiObj?.Target_Value !== undefined && kpiObj?.Target_Value !== null ? Number(kpiObj.Target_Value) : null;
      const tgtDisp = kpiObj?.Target_Display ?? (tgtVal !== null ? String(tgtVal) : 'N/A');

      if (!kpiObj || kpiObj.Actual_Value === null || kpiObj.Actual_Value === undefined) {
        return {
          actualValue: null,
          actualDisplay: 'N/A',
          targetValue: tgtVal,
          targetDisplay: tgtDisp,
          rag: null,
          dataPresenceStatus: kpiObj?.Data_Presence_Status || 'NO SOURCE ROW / NOT APPLICABLE',
        };
      }

      const val = typeof kpiObj.Actual_Value === 'number' ? kpiObj.Actual_Value : parseFloat(kpiObj.Actual_Value);
      const rag = (kpiObj.RAG as 'Green' | 'Amber' | 'Red') || null;

      kpiCounts[metricId].withData++;
      kpiCounts[metricId].applicable++;
      if (rag === 'Green') kpiCounts[metricId].green++;
      if (rag === 'Amber') kpiCounts[metricId].amber++;
      if (rag === 'Red') kpiCounts[metricId].red++;

      return {
        actualValue: val,
        actualDisplay: kpiObj.Actual_Display || (scale === 'DECIMAL_PERCENTAGE' ? formatPercent(val) : formatScore(val)),
        targetValue: tgtVal,
        targetDisplay: tgtDisp,
        rag,
        dataPresenceStatus: kpiObj.Data_Presence_Status || 'HAS DATA',
      };
    };

    const cellM006 = parseCell(rawM006, 'M006', 'DECIMAL_PERCENTAGE');
    const cellM007 = parseCell(rawM007, 'M007', 'DECIMAL_PERCENTAGE');
    const cellM008 = parseCell(rawM008, 'M008', 'DECIMAL_PERCENTAGE');
    const cellM009 = parseCell(rawM009, 'M009', 'ZERO_TO_100');

    // M010 special applicability
    const isM010Applicable = rawAtaExt?.Is_MSA_Applicable === true;
    let cellM010: AccountM010Cell;
    const m010TgtVal = rawM010?.Target_Value !== undefined && rawM010?.Target_Value !== null ? Number(rawM010.Target_Value) : null;
    const m010TgtDisp = rawM010?.Target_Display ?? (m010TgtVal !== null ? String(m010TgtVal) : 'N/A');

    if (isM010Applicable && rawM010 && rawM010.Actual_Value !== null && rawM010.Actual_Value !== undefined) {
      const val = typeof rawM010.Actual_Value === 'number' ? rawM010.Actual_Value : parseFloat(rawM010.Actual_Value);
      const rag = (rawM010.RAG as 'Green' | 'Amber' | 'Red') || null;

      kpiCounts.M010.withData++;
      kpiCounts.M010.applicable++;
      if (rag === 'Green') kpiCounts.M010.green++;
      if (rag === 'Amber') kpiCounts.M010.amber++;
      if (rag === 'Red') kpiCounts.M010.red++;

      cellM010 = {
        isApplicable: true,
        actualValue: val,
        actualDisplay: rawM010.Actual_Display || formatScore(val),
        targetValue: m010TgtVal,
        targetDisplay: m010TgtDisp,
        rag,
        dataPresenceStatus: rawM010.Data_Presence_Status || 'HAS DATA',
      };
    } else {
      cellM010 = {
        isApplicable: isM010Applicable,
        actualValue: null,
        actualDisplay: 'N/A',
        targetValue: m010TgtVal,
        targetDisplay: m010TgtDisp,
        rag: null,
        dataPresenceStatus: isM010Applicable ? 'NO CLIENT SCORE' : 'NO SOURCE ROW / NOT APPLICABLE',
      };
    }

    // TNI Cell
    const isTniApplicable = rawTni?.Is_TNI_Applicable === true;
    let tniStatus = 'Not Applicable';
    let tniRag: 'Green' | 'Amber' | 'Red' | null = null;

    if (isTniApplicable) {
      tniApplicable++;
      if (rawTni?.TNI_Status === 'Published') {
        tniPublished++;
        tniStatus = 'Published';
        tniRag = 'Green';
      } else {
        tniPending++;
        tniStatus = 'Pending';
        tniRag = 'Red';
      }
    } else {
      tniNotApplicable++;
      tniStatus = 'Not Applicable';
      tniRag = null;
    }

    const cellTni: AccountTniCell = {
      isApplicable: isTniApplicable,
      status: tniStatus,
      rag: tniRag,
    };

    // Calculate core KPI counts (M006-M010 only)
    const coreCells = [cellM006, cellM007, cellM008, cellM009, cellM010];
    let redKpiCount = 0;
    let amberKpiCount = 0;
    let applicableKpiCount = 0;
    let kpiWithDataCount = 0;

    coreCells.forEach((c) => {
      if (c.actualValue !== null) {
        kpiWithDataCount++;
        applicableKpiCount++;
        if (c.rag === 'Red') redKpiCount++;
        if (c.rag === 'Amber') amberKpiCount++;
      } else if ('isApplicable' in c && (c as AccountM010Cell).isApplicable) {
        applicableKpiCount++;
      }
    });

    if (kpiWithDataCount > 0) {
      accountsWithDataCount++;
      if (redKpiCount > 0) {
        accountsWithRedCount++;
      } else if (amberKpiCount > 0) {
        accountsWithAmberCount++;
      } else {
        accountsNoRedAmberCount++;
      }
    }

    return {
      accountId: acc.Account_ID,
      accountName: acc.Account_Name,
      vertical: acc.Vertical || 'N/A',
      qaLeader: acc.QA_Leader || 'N/A',
      srDirector: acc.Sr_Director || 'N/A',
      site: acc.Site || 'N/A',
      lob: acc.LOB || 'N/A',
      m006: cellM006,
      m007: cellM007,
      m008: cellM008,
      m009: cellM009,
      m010: cellM010,
      tni: cellTni,
      redKpiCount,
      amberKpiCount,
      applicableKpiCount,
      kpiWithDataCount,
    };
  });

  const totalAccounts = rawAccounts.length;

  // Index Executive KPIs from BigQuery semantic layer
  const execKpiMap = new Map<string, any>();
  if (Array.isArray(raw1.executive_kpis)) {
    for (const item of raw1.executive_kpis) {
      if (item && item.Metric_ID) {
        execKpiMap.set(item.Metric_ID, item);
      }
    }
  }

  // Construct Headline KPIs
  const buildHeadlineKpi = (
    metricId: 'M006' | 'M007' | 'M008' | 'M009' | 'M010',
    metricName: string,
    scale: 'DECIMAL_PERCENTAGE' | 'ZERO_TO_100',
    actualVal: number | null
  ): HygieneMetricSummary => {
    const execItem = execKpiMap.get(metricId);
    const targetVal = execItem?.Target_Value !== undefined && execItem?.Target_Value !== null
      ? Number(execItem.Target_Value)
      : null;
    const targetDisp = execItem?.Target_Display ?? (targetVal !== null ? String(targetVal) : 'N/A');

    let rag: 'Green' | 'Amber' | 'Red' | null = null;
    let varianceVal: number | null = null;
    let varianceDisp = 'N/A';

    // RAG from BQ semantic executive layer when available, or account-level evaluation
    if (totalAccounts === 1 && rawAccounts[0]) {
      const cell = metricId === 'M006' ? (rawAccounts[0] as any).m006 :
                   metricId === 'M007' ? (rawAccounts[0] as any).m007 :
                   metricId === 'M008' ? (rawAccounts[0] as any).m008 :
                   metricId === 'M009' ? (rawAccounts[0] as any).m009 :
                   (rawAccounts[0] as any).m010;
      rag = cell?.rag ?? null;
    } else if (execItem?.Aggregate_RAG && totalAccounts >= 190) {
      rag = execItem.Aggregate_RAG as 'Green' | 'Amber' | 'Red';
    } else {
      // Filtered scope count distribution
      const counts = kpiCounts[metricId];
      if (counts.red > counts.green && counts.red > counts.amber) {
        rag = 'Red';
      } else if (counts.amber >= counts.green && counts.amber > 0) {
        rag = 'Amber';
      } else if (counts.green > 0) {
        rag = 'Green';
      }
    }

    if (actualVal !== null && !isNaN(actualVal) && targetVal !== null) {
      varianceVal = actualVal - targetVal;
      varianceDisp = scale === 'DECIMAL_PERCENTAGE'
        ? `${varianceVal >= 0 ? '+' : ''}${(varianceVal * 100).toFixed(1)}%`
        : `${varianceVal >= 0 ? '+' : ''}${varianceVal.toFixed(1)}`;
    }

    const actualDisp = scale === 'DECIMAL_PERCENTAGE' ? formatPercent(actualVal) : formatScore(actualVal);

    return {
      metricId,
      metricName,
      metricScale: scale,
      actualValue: actualVal,
      actualDisplay: actualDisp,
      targetValue: targetVal,
      targetDisplay: targetDisp,
      varianceValue: varianceVal,
      varianceDisplay: varianceDisp,
      rag,
      totalAccounts,
      applicableAccountCount: kpiCounts[metricId].applicable,
      accountsWithData: kpiCounts[metricId].withData,
      greenAccountCount: kpiCounts[metricId].green,
      amberAccountCount: kpiCounts[metricId].amber,
      redAccountCount: kpiCounts[metricId].red,
      dataPresenceStatus: kpiCounts[metricId].withData > 0 ? 'HAS DATA' : 'NO SOURCE ROW / NOT APPLICABLE',
    };
  };

  const m006Val = raw1.m006_agg?.m006_actual != null ? parseFloat(raw1.m006_agg.m006_actual) : null;
  const m007Val = raw1.m007_agg?.m007_actual != null ? parseFloat(raw1.m007_agg.m007_actual) : null;
  const m008Val = raw1.m008_agg?.m008_actual != null ? parseFloat(raw1.m008_agg.m008_actual) : null;
  const m009Val = raw1.m009_agg?.m009_actual != null ? parseFloat(raw1.m009_agg.m009_actual) : null;
  const m010Val = raw1.m010_agg?.m010_actual != null ? parseFloat(raw1.m010_agg.m010_actual) : null;

  const headlineM006 = buildHeadlineKpi('M006', 'Audit & Feedback', 'DECIMAL_PERCENTAGE', m006Val);
  const headlineM007 = buildHeadlineKpi('M007', 'Hygiene Audits', 'DECIMAL_PERCENTAGE', m007Val);
  const headlineM008 = buildHeadlineKpi('M008', 'Calibration', 'DECIMAL_PERCENTAGE', m008Val);
  const headlineM009 = buildHeadlineKpi('M009', 'ATA Internal', 'ZERO_TO_100', m009Val);
  const headlineM010 = buildHeadlineKpi('M010', 'ATA External', 'ZERO_TO_100', m010Val);

  // TNI Headline (No invented target, neutral rag)
  const tniAdherenceValue = tniApplicable > 0 ? tniPublished / tniApplicable : null;
  const headlineTni: PortfolioTniSummary = {
    applicableAccounts: tniApplicable,
    publishedAccounts: tniPublished,
    pendingAccounts: tniPending,
    notApplicableAccounts: tniNotApplicable,
    adherenceValue: tniAdherenceValue,
    adherenceDisplay: formatPercent(tniAdherenceValue),
    targetValue: null,
    targetDisplay: 'N/A',
    rag: null,
  };

  // Process Range Context & Historical Trends
  const rawTrendPoints: any[] = raw2.trend_points || [];
  const historicalTrends: HygieneTrendPoint[] = rawTrendPoints.map((pt) => {
    const m006A = pt.m006_actual != null ? parseFloat(pt.m006_actual) : null;
    const m007A = pt.m007_actual != null ? parseFloat(pt.m007_actual) : null;
    const m008A = pt.m008_actual != null ? parseFloat(pt.m008_actual) : null;
    const m009A = pt.m009_actual != null ? parseFloat(pt.m009_actual) : null;
    const m010A = pt.m010_actual != null ? parseFloat(pt.m010_actual) : null;
    const tniA = pt.tni_adherence != null ? parseFloat(pt.tni_adherence) : null;

    return {
      month: pt.Month,
      reportingMonth: formatMonthYear(pt.Month),
      m006Actual: m006A,
      m006Display: formatPercent(m006A),
      m007Actual: m007A,
      m007Display: formatPercent(m007A),
      m008Actual: m008A,
      m008Display: formatPercent(m008A),
      m009Actual: m009A,
      m009Display: formatScore(m009A),
      m010Actual: m010A,
      m010Display: formatScore(m010A),
      tniAdherencePct: tniA,
      tniAdherenceDisplay: formatPercent(tniA),
    };
  });

  const resolvedPeriod = resolveReportingWindows(reportingCtx.latestClosedMonth);
  const requestedMonthCount = resolvedPeriod.windows[period]?.monthCount || 3;
  const availableMonthCount = historicalTrends.length;
  const historyCoverageStatus = availableMonthCount >= requestedMonthCount ? 'FULL_HISTORY' : 'PARTIAL_HISTORY';

  const rangeContext: HygieneRangeContext = {
    requestedPeriod: period,
    requestedMonthCount,
    availableMonthCount,
    startMonth: historicalTrends[0]?.month || '',
    endMonth: historicalTrends[historicalTrends.length - 1]?.month || '',
    historyCoverageStatus,
  };

  // Process Operational Breakdowns
  const rawAf = raw3.audit_feedback || {};
  const rawHt = raw3.hygiene_types || {};
  const rawCal = raw3.calibration || {};
  const rawAta = raw3.ata_alignment || {};
  const rawRca: any[] = raw3.rca_list || [];

  const auditFeedbackBreakdown: AuditFeedbackBreakdown = {
    totalAuditTarget: rawAf.total_audit_target != null ? parseInt(rawAf.total_audit_target, 10) : 0,
    totalAuditsCompleted: rawAf.total_audits_completed != null ? parseInt(rawAf.total_audits_completed, 10) : 0,
    auditAchievementValue: rawAf.achievement_pct != null ? parseFloat(rawAf.achievement_pct) : null,
    auditAchievementDisplay: formatPercent(rawAf.achievement_pct != null ? parseFloat(rawAf.achievement_pct) : null),
    feedbackWithin24hCount: rawAf.within_24h_count != null ? parseInt(rawAf.within_24h_count, 10) : 0,
    feedbackWithin24hPct: rawAf.within_24h_pct != null ? parseFloat(rawAf.within_24h_pct) : null,
    feedbackWithin24hDisplay: formatPercent(rawAf.within_24h_pct != null ? parseFloat(rawAf.within_24h_pct) : null),
    feedback24to48hCount: rawAf.f24_to_48h_count != null ? parseInt(rawAf.f24_to_48h_count, 10) : 0,
    feedback24to48hPct: rawAf.f24_to_48h_pct != null ? parseFloat(rawAf.f24_to_48h_pct) : null,
    feedback24to48hDisplay: formatPercent(rawAf.f24_to_48h_pct != null ? parseFloat(rawAf.f24_to_48h_pct) : null),
    feedbackOver48hCount: rawAf.over_48h_count != null ? parseInt(rawAf.over_48h_count, 10) : 0,
    feedbackOver48hPct: rawAf.over_48h_pct != null ? parseFloat(rawAf.over_48h_pct) : null,
    feedbackOver48hDisplay: formatPercent(rawAf.over_48h_pct != null ? parseFloat(rawAf.over_48h_pct) : null),
  };

  const hygieneAuditBreakdown: HygieneAuditBreakdown = {
    complianceAuditAccuracy: rawHt.compliance_accuracy != null ? parseFloat(rawHt.compliance_accuracy) : null,
    complianceAuditDisplay: formatPercent(rawHt.compliance_accuracy != null ? parseFloat(rawHt.compliance_accuracy) : null),
    totalComplianceAudits: rawHt.total_compliance_audits != null ? parseInt(rawHt.total_compliance_audits, 10) : 0,
    hygieneAuditAccuracy: rawHt.hygiene_accuracy != null ? parseFloat(rawHt.hygiene_accuracy) : null,
    hygieneAuditDisplay: formatPercent(rawHt.hygiene_accuracy != null ? parseFloat(rawHt.hygiene_accuracy) : null),
    totalHygieneAudits: rawHt.total_hygiene_audits != null ? parseInt(rawHt.total_hygiene_audits, 10) : 0,
    rcaBreakdown: rawRca.map((r) => ({
      reason: r.reason || 'General Execution',
      count: r.count != null ? parseInt(r.count, 10) : 0,
    })),
  };

  const calTarget = rawCal.total_target_attendance != null ? parseInt(rawCal.total_target_attendance, 10) : 0;
  const calActual = rawCal.total_actual_attendance != null ? parseInt(rawCal.total_actual_attendance, 10) : 0;
  const calRatio = rawCal.weighted_attendance_ratio != null ? parseFloat(rawCal.weighted_attendance_ratio) : null;

  const calibrationBreakdown: CalibrationOperationalBreakdown = {
    totalTargetAttendance: calTarget,
    totalActualAttendance: calActual,
    weightedAttendanceRatio: calRatio,
    weightedAttendanceDisplay: formatPercent(calRatio),
  };

  const ataSelf = rawAta.avg_self_score != null ? parseFloat(rawAta.avg_self_score) : null;
  const ataClient = rawAta.avg_client_score != null ? parseFloat(rawAta.avg_client_score) : null;
  const ataGap = rawAta.avg_gap_pp != null ? parseFloat(rawAta.avg_gap_pp) : null;

  const ataAlignmentBreakdown: AtaAlignmentBreakdown = {
    avgSelfAssessmentScore: ataSelf,
    avgSelfAssessmentDisplay: formatScore(ataSelf),
    avgClientScore: ataClient,
    avgClientDisplay: formatScore(ataClient),
    avgClientVsSelfGapPp: ataGap,
    avgClientVsSelfGapDisplay: ataGap != null ? `${ataGap >= 0 ? '+' : ''}${ataGap.toFixed(2)} pp` : 'N/A',
    spotCheckCount: rawAta.spot_check_count != null ? parseInt(rawAta.spot_check_count, 10) : 0,
    applicableMsaAccounts: rawAta.applicable_msa_count != null ? parseInt(rawAta.applicable_msa_count, 10) : 0,
  };

  const scopeInfo: HygieneScopeInfo = {
    vertical: filters.vertical && filters.vertical !== 'ALL' ? filters.vertical : null,
    qaLeader: filters.qaLeader && filters.qaLeader !== 'ALL' ? filters.qaLeader : null,
    srDirector: filters.srDirector && filters.srDirector !== 'ALL' ? filters.srDirector : null,
    accountId: filters.accountId && filters.accountId !== 'ALL' ? filters.accountId : null,
    site: filters.site && filters.site !== 'ALL' ? filters.site : null,
    lob: filters.lob && filters.lob !== 'ALL' ? filters.lob : null,
    totalAccounts,
    accountsWithData: accountsWithDataCount,
    accountsNoRedAmber: accountsNoRedAmberCount,
    accountsWithAmber: accountsWithAmberCount,
    accountsWithRed: accountsWithRedCount,
  };

  return {
    scope: scopeInfo,
    reportingContext: reportingCtx,
    rangeContext,
    headlineKpis: {
      m006: headlineM006,
      m007: headlineM007,
      m008: headlineM008,
      m009: headlineM009,
      m010: headlineM010,
      tni: headlineTni,
    },
    historicalTrends,
    operationalBreakdowns: {
      auditFeedback: auditFeedbackBreakdown,
      hygieneAudits: hygieneAuditBreakdown,
      calibration: calibrationBreakdown,
      ataAlignment: ataAlignmentBreakdown,
    },
    accountRegister,
  };
}
