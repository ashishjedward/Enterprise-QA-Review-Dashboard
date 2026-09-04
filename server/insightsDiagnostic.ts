import { getBigQueryClient, getBigQueryConfig, serializeBigQueryValue } from './bigquery';
import { fetchAuthoritativeReportingContext, formatMonthLabel, ReportingPeriodKey } from './reportingPeriod';

export interface InsightsDiagnosticFilters {
  timePeriod?: string;
  vertical?: string;
  qaLeader?: string;
  srDirector?: string;
  accountId?: string;
  site?: string;
  lob?: string;
}

export type AttentionBandType = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WATCH';
export type EvidenceStatus = 'Red' | 'Amber' | 'Green' | 'Neutral';
export type ActivePageToken =
  | 'overview'
  | 'process-health'
  | 'value-adds'
  | 'hygiene-inputs'
  | 'qa-team'
  | 'actions'
  | 'insights'
  | 'reports'
  | 'sla-detail'
  | 'best-qm-detail'
  | 'account-diagnostic';

export interface InsightEvidenceItem {
  metricId?: string;
  label: string;
  actual: string | number;
  target?: string | number | null;
  status: EvidenceStatus;
  detail?: string;
  navigationTarget?: ActivePageToken;
}

export interface PriorityInsightCard {
  id: string;
  accountId: string;
  accountName: string;
  vertical: string;
  qaLeader: string;
  srDirector: string;
  site: string;
  lob: string;
  priority: AttentionBandType;
  attentionScore: number;
  attentionRank: number;
  primaryDriver: string;
  headline: string;
  summary: string;
  evidence: InsightEvidenceItem[];
  recommendedAction: string;
  navigationTarget: {
    page: ActivePageToken;
    accountId?: string;
  };
}

export interface CrossPortfolioTheme {
  themeId: string;
  category: string;
  title: string;
  affectedAccountCount: number;
  totalApplicableAccounts: number;
  affectedAccountPct: number;
  summary: string;
  topAccounts: Array<{
    accountId: string;
    accountName: string;
    actual: string;
    rag: string;
  }>;
  navigationTarget: {
    page: ActivePageToken;
  };
}

export interface PositiveSignalItem {
  id: string;
  accountId?: string;
  accountName?: string;
  title: string;
  metricLabel: string;
  achievementValue: string;
  summary: string;
  navigationTarget?: {
    page: ActivePageToken;
    accountId?: string;
  };
}

export interface RiskRadarRow {
  accountId: string;
  accountName: string;
  vertical: string;
  qaLeader: string;
  srDirector: string;
  site: string;
  lob: string;
  attentionRank: number;
  attentionScore: number;
  attentionBand: AttentionBandType;
  primaryDriver: string;
  redKpiCount: number;
  redKpis: string[];
  clientSentiment: number | null;
  clientSentimentRag: 'Red' | 'Amber' | 'Green' | 'N/A';
  openEscalations: number;
  highCriticalEscalations: number;
  openZt: number;
  openCqm: number;
  openActions: number;
  overdueActions: number;
  highCriticalActions: number;
  activeTapAtRisk: number;
}

export interface PeriodTrendPoint {
  month: string;
  actualValue: number | null;
  actualDisplay: string | null;
  rag: string | null;
}

export interface PeriodTrendItem {
  metricId: string;
  metricName: string;
  scale: string;
  higherIsBetter: boolean;
  startMonth: string;
  endMonth: string;
  startValue: number | null;
  startDisplay: string | null;
  endValue: number | null;
  endDisplay: string | null;
  delta: number | null;
  deltaDisplay: string;
  isFavourable: boolean | null;
  startRag: string | null;
  endRag: string | null;
  points: PeriodTrendPoint[];
  navigationTarget?: ActivePageToken;
}

export interface CommercialContextData {
  timePeriodLabel: string;
  penaltyExposure: number;
  penaltyPaid: number;
  rewardOpportunity: number;
  rewardEarned: number;
  netCommercialImpact: number;
}

export interface InsightsDiagnosticResponse {
  reportingContext: {
    reportingMonth: string;
    latestClosedMonth: string;
    latestAvailableMonth: string;
    currentOpenMonth: string;
    currentSubmissionDeadline: string;
    dataAsOfDate: string;
    businessTimezone: string;
    totalMonitoredAccounts: number;
    timePeriod: string;
  };
  scopeSummary: {
    totalAccountsInScope: number;
    criticalAttentionCount: number;
    highAttentionCount: number;
    mediumAttentionCount: number;
    watchAttentionCount: number;
    accountsWithRedKpi: number;
    redSentimentCount: number;
    amberSentimentCount: number;
    greenSentimentCount: number;
    openEscalationCount: number;
    highCriticalEscalationCount: number;
    openZtCount: number;
    hrActionOpenZtCount: number;
    openCqmCount: number;
    openActionCount: number;
    overdueActionCount: number;
    highCriticalActionCount: number;
    activeTapAtRiskCount: number;
    actionClosureRate: number | null;
    actionClosureRateDisplay: string;
  };
  executiveSynthesis: {
    leadSummary: string;
    keyObservations: string[];
    governanceStatus: 'CRITICAL' | 'ATTENTION' | 'STABLE' | 'HEALTHY';
  };
  priorityInsights: PriorityInsightCard[];
  crossPortfolioThemes: CrossPortfolioTheme[];
  positiveSignals: PositiveSignalItem[];
  riskRadarRows: RiskRadarRow[];
  periodTrends: PeriodTrendItem[];
  currentCommercialContext: CommercialContextData;
  selectedPeriodCommercialContext: CommercialContextData;
}

export async function fetchInsightsDiagnostic(
  filters: InsightsDiagnosticFilters
): Promise<InsightsDiagnosticResponse> {
  const bq = getBigQueryClient();
  const { projectId, dataset, location } = getBigQueryConfig();

  const validTimePeriods: ReportingPeriodKey[] = ['3M', '6M', 'YTD', '12M'];
  const timePeriod: ReportingPeriodKey =
    filters.timePeriod && (validTimePeriods as string[]).includes(filters.timePeriod)
      ? (filters.timePeriod as ReportingPeriodKey)
      : '12M';

  // 1. Fetch Authoritative Reporting Context & Dynamic Time Windows
  const authCtx = await fetchAuthoritativeReportingContext(bq, projectId, dataset, location);
  const periodWindow = authCtx.windows[timePeriod];

  const latestClosedMonthStr = authCtx.latestClosedMonth;
  const latestAvailableMonthStr = authCtx.latestAvailableMonth;
  const currentOpenMonthStr = authCtx.currentOpenMonth;
  const currentSubmissionDeadlineStr = authCtx.currentSubmissionDeadline;
  const officialReportingMonth = authCtx.officialReportingMonth;

  // Closed months only ending at latestClosedMonth
  const trendStartDateStr = periodWindow.startMonth;
  const commStartDateStr = periodWindow.startMonth;
  const commEndDateStr = latestClosedMonthStr;

  // Build filter predicates
  const whereClauses: string[] = ['1=1'];
  const queryParams: Record<string, any> = {
    latestClosedMonth: latestClosedMonthStr,
    trendStartDate: trendStartDateStr,
    commStartDate: commStartDateStr,
    commEndDate: commEndDateStr,
  };

  if (filters.vertical && filters.vertical !== 'ALL') {
    whereClauses.push('m.Vertical = @vertical');
    queryParams.vertical = filters.vertical;
  }
  if (filters.qaLeader && filters.qaLeader !== 'ALL') {
    whereClauses.push('m.QA_Leader = @qaLeader');
    queryParams.qaLeader = filters.qaLeader;
  }
  if (filters.srDirector && filters.srDirector !== 'ALL') {
    whereClauses.push('m.Sr_Director = @srDirector');
    queryParams.srDirector = filters.srDirector;
  }
  if (filters.accountId && filters.accountId !== 'ALL') {
    whereClauses.push('(m.Account_ID = @accountId OR m.Account = @accountId)');
    queryParams.accountId = filters.accountId;
  }
  if (filters.site && filters.site !== 'ALL') {
    whereClauses.push('m.Site = @site');
    queryParams.site = filters.site;
  }
  if (filters.lob && filters.lob !== 'ALL') {
    whereClauses.push('m.LOB = @lob');
    queryParams.lob = filters.lob;
  }

  const scopeFilterSql = whereClauses.join(' AND ');

  // =========================================================================
  // QUERY 1: EXECUTIVE RADAR, RECONCILED ATTENTION, INCIDENTS & ACTIONS
  // Reconciles live action points against Enterprise-Global Attention Rank!
  // =========================================================================
  const query1Sql = `
    WITH live_actions_global AS (
      SELECT
        Account_ID,
        COUNTIF(
          Open_Date <= CURRENT_DATE("Asia/Kolkata")
          AND (Closed_Date IS NULL OR Closed_Date > CURRENT_DATE("Asia/Kolkata"))
        ) AS Live_Open_Action_Count,
        COUNTIF(
          Open_Date <= CURRENT_DATE("Asia/Kolkata")
          AND (Closed_Date IS NULL OR Closed_Date > CURRENT_DATE("Asia/Kolkata"))
          AND Due_Date < CURRENT_DATE("Asia/Kolkata")
        ) AS Live_Overdue_Action_Count,
        COUNTIF(
          Open_Date <= CURRENT_DATE("Asia/Kolkata")
          AND (Closed_Date IS NULL OR Closed_Date > CURRENT_DATE("Asia/Kolkata"))
          AND Priority IN ("High", "Critical")
        ) AS Live_High_Critical_Action_Count,
        COUNTIF(
          Closed_Date IS NOT NULL AND Closed_Date <= CURRENT_DATE("Asia/Kolkata")
        ) AS Live_Closed_Action_Count,
        COUNTIF(
          Open_Date <= CURRENT_DATE("Asia/Kolkata")
          AND (
            Due_Date <= CURRENT_DATE("Asia/Kolkata")
            OR (Closed_Date IS NOT NULL AND Closed_Date <= CURRENT_DATE("Asia/Kolkata"))
          )
        ) AS Live_Matured_Action_Count
      FROM \`${projectId}.${dataset}.vw_action_register\`
      GROUP BY Account_ID
    ),
    live_escalations_global AS (
      SELECT
        Account_ID,
        COUNTIF(Is_Open = TRUE) AS Open_Escalation_Count,
        COUNTIF(Is_Open = TRUE AND Is_High_Critical = TRUE) AS High_Critical_Escalation_Count,
        COUNTIF(Is_Open = TRUE AND Is_Client_Sourced = TRUE) AS Client_Open_Escalation_Count,
        MAX(IF(Is_Open = TRUE, Days_Open, NULL)) AS Max_Escalation_Days_Open
      FROM \`${projectId}.${dataset}.vw_escalations\`
      GROUP BY Account_ID
    ),
    live_zt_global AS (
      -- HR Action Required is authoritative from vw_zt_tracker.Requires_HR_Action. Do not infer from ZTP reason or closure workflow fields.
      SELECT
        Account_ID,
        COUNTIF(Is_Open = TRUE) AS Open_ZT_Count,
        COUNTIF(Is_Open = TRUE AND Is_Client_Identified = TRUE) AS Client_Open_ZT_Count,
        COUNTIF(Is_Open = TRUE AND Requires_HR_Action = TRUE) AS HR_Action_Open_ZT_Count,
        MAX(IF(Is_Open = TRUE, Pending_From_Ageing, NULL)) AS Max_ZT_Ageing_Days
      FROM \`${projectId}.${dataset}.vw_zt_tracker\`
      GROUP BY Account_ID
    ),
    live_cqm_global AS (
      SELECT
        Account_ID,
        COUNTIF(Is_Open = TRUE) AS Open_CQM_Count,
        COUNTIF(Is_Open = TRUE AND Ageing_Days >= 30) AS CQM_30_Plus_Count,
        MAX(IF(Is_Open = TRUE, Ageing_Days, NULL)) AS Max_CQM_Ageing_Days
      FROM \`${projectId}.${dataset}.vw_cqm_tracker\`
      GROUP BY Account_ID
    ),
    live_tap_global AS (
      SELECT
        Account_ID,
        COUNT(*) AS Total_Tap_Count,
        COUNTIF(
          Actual_Start_Date <= CURRENT_DATE("Asia/Kolkata")
          AND (Actual_End_Date IS NULL OR Actual_End_Date > CURRENT_DATE("Asia/Kolkata"))
        ) AS Active_Tap_Count,
        COUNTIF(
          Actual_Start_Date <= CURRENT_DATE("Asia/Kolkata")
          AND (Actual_End_Date IS NULL OR Actual_End_Date > CURRENT_DATE("Asia/Kolkata"))
          AND Is_At_Risk = TRUE
        ) AS Active_Tap_At_Risk_Count,
        COUNTIF(Actual_End_Date <= CURRENT_DATE("Asia/Kolkata")) AS Closed_Tap_Count,
        SUM(Target_Benefit) AS Total_Target_Benefit,
        SUM(Realized_Benefit) AS Total_Recorded_Benefit
      FROM \`${projectId}.${dataset}.vw_tap_summary\`
      GROUP BY Account_ID
    ),
    live_staff_global AS (
      SELECT
        Account_ID,
        Required_Headcount AS Required_Staff,
        Actual_Headcount AS Actual_Staff,
        Approved_Headcount AS Approved_Staff,
        Over_Under AS Staff_Variance,
        Status_RAG AS Staff_Posture
      FROM \`${projectId}.${dataset}.vw_staff_over_under\`
      WHERE Month = @latestClosedMonth
    ),
    attention_recalc_global AS (
      SELECT
        la.Account_ID,
        la.Account_Name,
        la.BU,
        la.Vertical,
        la.QA_VP,
        la.Sr_Director,
        la.QA_Director,
        la.QA_Leader,
        la.Site,
        la.LOB,
        la.Process,
        la.Attention_Score AS Source_Attention_Score,
        la.Attention_Rank AS Source_Attention_Rank,
        la.Attention_Band AS Source_Attention_Band,
        la.Primary_Attention_Driver,
        la.Red_KPI_Count,
        la.Red_KPIs,
        la.Amber_KPI_Count,
        la.Client_Sentiment_Score,
        la.Client_Sentiment_RAG,

        -- Live Action points
        COALESCE(act.Live_Open_Action_Count, 0) AS Live_Open_Action_Count,
        COALESCE(act.Live_Overdue_Action_Count, 0) AS Live_Overdue_Action_Count,
        COALESCE(act.Live_High_Critical_Action_Count, 0) AS Live_High_Critical_Action_Count,
        COALESCE(act.Live_Closed_Action_Count, 0) AS Live_Closed_Action_Count,
        COALESCE(act.Live_Matured_Action_Count, 0) AS Live_Matured_Action_Count,

        LEAST(COALESCE(act.Live_Overdue_Action_Count, 0), 5) * 4 AS Live_Overdue_Action_Points,
        LEAST(COALESCE(act.Live_High_Critical_Action_Count, 0), 3) * 5 AS Live_Critical_Action_Points,

        -- Recalculated Score:
        la.Attention_Score
          - la.Overdue_Action_Points
          - la.Critical_Action_Points
          + (LEAST(COALESCE(act.Live_Overdue_Action_Count, 0), 5) * 4)
          + (LEAST(COALESCE(act.Live_High_Critical_Action_Count, 0), 3) * 5)
        AS Reconciled_Attention_Score,

        -- Incident overlays
        COALESCE(esc.Open_Escalation_Count, 0) AS Open_Escalation_Count,
        COALESCE(esc.High_Critical_Escalation_Count, 0) AS High_Critical_Escalation_Count,
        COALESCE(esc.Client_Open_Escalation_Count, 0) AS Client_Open_Escalation_Count,
        esc.Max_Escalation_Days_Open,

        COALESCE(zt.Open_ZT_Count, 0) AS Open_ZT_Count,
        COALESCE(zt.Client_Open_ZT_Count, 0) AS Client_Open_ZT_Count,
        COALESCE(zt.HR_Action_Open_ZT_Count, 0) AS HR_Action_Open_ZT_Count,
        zt.Max_ZT_Ageing_Days,

        COALESCE(cqm.Open_CQM_Count, 0) AS Open_CQM_Count,
        COALESCE(cqm.CQM_30_Plus_Count, 0) AS CQM_30_Plus_Count,
        cqm.Max_CQM_Ageing_Days,

        -- TAP
        COALESCE(tap.Total_Tap_Count, 0) AS Total_Tap_Count,
        COALESCE(tap.Active_Tap_Count, 0) AS Active_Tap_Count,
        COALESCE(tap.Active_Tap_At_Risk_Count, 0) AS Active_Tap_At_Risk_Count,
        COALESCE(tap.Closed_Tap_Count, 0) AS Closed_Tap_Count,
        COALESCE(tap.Total_Target_Benefit, 0) AS Total_Target_Benefit,
        COALESCE(tap.Total_Recorded_Benefit, 0) AS Total_Recorded_Benefit,

        -- Staff
        stf.Required_Staff,
        stf.Actual_Staff,
        stf.Approved_Staff,
        stf.Staff_Variance,
        stf.Staff_Posture
      FROM \`${projectId}.${dataset}.vw_leadership_attention\` la
      LEFT JOIN live_actions_global act ON la.Account_ID = act.Account_ID
      LEFT JOIN live_escalations_global esc ON la.Account_ID = esc.Account_ID
      LEFT JOIN live_zt_global zt ON la.Account_ID = zt.Account_ID
      LEFT JOIN live_cqm_global cqm ON la.Account_ID = cqm.Account_ID
      LEFT JOIN live_tap_global tap ON la.Account_ID = tap.Account_ID
      LEFT JOIN live_staff_global stf ON la.Account_ID = stf.Account_ID
    ),
    enterprise_ranked AS (
      SELECT
        arg.*,
        DENSE_RANK() OVER (
          ORDER BY
            Reconciled_Attention_Score DESC,
            Red_KPI_Count DESC,
            High_Critical_Escalation_Count DESC,
            Open_ZT_Count DESC,
            Live_Overdue_Action_Count DESC,
            Account_ID ASC
        ) AS Enterprise_Attention_Rank,
        CASE
          WHEN Reconciled_Attention_Score >= 30 THEN "CRITICAL"
          WHEN Reconciled_Attention_Score >= 20 THEN "HIGH"
          WHEN Reconciled_Attention_Score >= 10 THEN "MEDIUM"
          ELSE "WATCH"
        END AS Reconciled_Attention_Band
      FROM attention_recalc_global arg
    )
    SELECT
      er.*
    FROM enterprise_ranked er
    JOIN \`${projectId}.${dataset}.vw_account_master\` m ON er.Account_ID = m.Account_ID
    WHERE ${scopeFilterSql}
    ORDER BY er.Enterprise_Attention_Rank ASC
  `;

  // =========================================================================
  // QUERY 2: OFFICIAL KPI SNAPSHOT & PERIOD TRENDS
  // =========================================================================
  const query2Sql = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID, m.Account, m.Vertical
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${scopeFilterSql}
    ),
    kpi_latest_scoped AS (
      SELECT
        k.Account_ID,
        k.Metric_ID,
        k.Metric,
        k.Category,
        k.Metric_Scale,
        k.Actual_Value,
        k.Actual_Display,
        k.Target_Value,
        k.Target_Display,
        k.Effective_RAG,
        k.Is_Higher_Better,
        k.Favourable_Variance,
        k.Data_Presence_Status
      FROM \`${projectId}.${dataset}.vw_kpi_snapshot_official\` k
      JOIN scoped_accounts sa ON k.Account_ID = sa.Account_ID
      WHERE k.Is_Latest_Closed_Period = TRUE
    ),
    kpi_trend_scoped AS (
      SELECT
        k.Month,
        k.Metric_ID,
        k.Metric,
        k.Metric_Scale,
        k.Is_Higher_Better,
        AVG(k.Actual_Value) AS Avg_Actual_Value,
        COUNTIF(k.Effective_RAG = "Red") AS Red_Count,
        COUNTIF(k.Effective_RAG = "Amber") AS Amber_Count,
        COUNTIF(k.Effective_RAG = "Green") AS Green_Count,
        COUNT(k.Actual_Value) AS Accounts_With_Data
      FROM \`${projectId}.${dataset}.vw_kpi_snapshot\` k
      JOIN scoped_accounts sa ON k.Account_ID = sa.Account_ID
      WHERE k.Month >= CAST(@trendStartDate AS DATE) AND k.Month <= CAST(@latestClosedMonth AS DATE)
        AND k.Data_Presence_Status = "HAS DATA"
      GROUP BY k.Month, k.Metric_ID, k.Metric, k.Metric_Scale, k.Is_Higher_Better
      ORDER BY k.Metric_ID, k.Month ASC
    )
    SELECT
      "LATEST" AS Record_Type,
      Account_ID,
      Metric_ID,
      Metric,
      Category,
      Metric_Scale,
      Actual_Value,
      Actual_Display,
      Target_Value,
      Target_Display,
      Effective_RAG,
      Is_Higher_Better,
      Favourable_Variance,
      Data_Presence_Status,
      CAST(NULL AS DATE) AS Month,
      CAST(NULL AS FLOAT64) AS Avg_Actual_Value,
      CAST(NULL AS INT64) AS Red_Count,
      CAST(NULL AS INT64) AS Amber_Count,
      CAST(NULL AS INT64) AS Green_Count,
      CAST(NULL AS INT64) AS Accounts_With_Data
    FROM kpi_latest_scoped

    UNION ALL

    SELECT
      "TREND" AS Record_Type,
      CAST(NULL AS STRING) AS Account_ID,
      Metric_ID,
      Metric,
      CAST(NULL AS STRING) AS Category,
      Metric_Scale,
      CAST(NULL AS FLOAT64) AS Actual_Value,
      CAST(NULL AS STRING) AS Actual_Display,
      CAST(NULL AS FLOAT64) AS Target_Value,
      CAST(NULL AS STRING) AS Target_Display,
      CAST(NULL AS STRING) AS Effective_RAG,
      Is_Higher_Better,
      CAST(NULL AS FLOAT64) AS Favourable_Variance,
      CAST(NULL AS STRING) AS Data_Presence_Status,
      Month,
      Avg_Actual_Value,
      Red_Count,
      Amber_Count,
      Green_Count,
      Accounts_With_Data
    FROM kpi_trend_scoped
  `;

  // =========================================================================
  // QUERY 3: COMMERCIAL & VALUE-ADDS (CURRENT MONTH & SELECTED PERIOD)
  // =========================================================================
  const query3Sql = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${scopeFilterSql}
    ),
    comm_latest AS (
      SELECT
        SUM(rp.Penalty_Exposure_Value) AS Penalty_Exposure,
        SUM(rp.Actual_Penalty_Paid_Value) AS Actual_Penalty_Paid,
        SUM(rp.Reward_Opportunity_Value) AS Reward_Opportunity,
        SUM(rp.Actual_Reward_Earned_Value) AS Actual_Reward_Earned,
        SUM(rp.Net_Commercial_Impact) AS Net_Commercial_Impact
      FROM \`${projectId}.${dataset}.vw_rp_tracker\` rp
      JOIN scoped_accounts sa ON rp.Account_ID = sa.Account_ID
      WHERE rp.Month = @latestClosedMonth
    ),
    comm_period AS (
      SELECT
        SUM(rp.Penalty_Exposure_Value) AS Penalty_Exposure,
        SUM(rp.Actual_Penalty_Paid_Value) AS Actual_Penalty_Paid,
        SUM(rp.Reward_Opportunity_Value) AS Reward_Opportunity,
        SUM(rp.Actual_Reward_Earned_Value) AS Actual_Reward_Earned,
        SUM(rp.Net_Commercial_Impact) AS Net_Commercial_Impact
      FROM \`${projectId}.${dataset}.vw_rp_tracker\` rp
      JOIN scoped_accounts sa ON rp.Account_ID = sa.Account_ID
      WHERE rp.Month >= @commStartDate AND rp.Month <= @commEndDate
    ),
    qaas_scoped AS (
      SELECT
        SUM(qaas.Target_Value) AS Total_Target_Value,
        SUM(qaas.Revenue_Value) AS Total_Program_Value,
        COUNTIF(qaas.Is_Open = TRUE) AS Open_Opportunities_Count,
        SUM(IF(qaas.Is_Open = TRUE, qaas.Target_Value, 0)) AS Open_Opportunities_Value
      FROM \`${projectId}.${dataset}.vw_qaas_revenue\` qaas
      JOIN scoped_accounts sa ON qaas.Account_ID = sa.Account_ID
    )
    SELECT
      cl.Penalty_Exposure AS Latest_Penalty_Exposure,
      cl.Actual_Penalty_Paid AS Latest_Actual_Penalty_Paid,
      cl.Reward_Opportunity AS Latest_Reward_Opportunity,
      cl.Actual_Reward_Earned AS Latest_Actual_Reward_Earned,
      cl.Net_Commercial_Impact AS Latest_Net_Commercial_Impact,

      cp.Penalty_Exposure AS Period_Penalty_Exposure,
      cp.Actual_Penalty_Paid AS Period_Actual_Penalty_Paid,
      cp.Reward_Opportunity AS Period_Reward_Opportunity,
      cp.Actual_Reward_Earned AS Period_Actual_Reward_Earned,
      cp.Net_Commercial_Impact AS Period_Net_Commercial_Impact,

      qs.Total_Target_Value AS QaaS_Target_Value,
      qs.Total_Program_Value AS QaaS_Program_Value,
      qs.Open_Opportunities_Count AS QaaS_Open_Opportunities,
      qs.Open_Opportunities_Value AS QaaS_Open_Opportunity_Value
    FROM comm_latest cl
    CROSS JOIN comm_period cp
    CROSS JOIN qaas_scoped qs
  `;

  // Execute queries in parallel
  const [
    [radarRowsRaw],
    [kpiRowsRaw],
    [commRowsRaw],
  ] = await Promise.all([
    bq.query({ query: query1Sql, params: queryParams, location }),
    bq.query({ query: query2Sql, params: queryParams, location }),
    bq.query({ query: query3Sql, params: queryParams, location }),
  ]);

  const radarRows: any[] = (radarRowsRaw || []).map(r => serializeBigQueryValue(r));
  const kpiRows: any[] = (kpiRowsRaw || []).map(r => serializeBigQueryValue(r));
  const commRow: any = commRowsRaw && commRowsRaw[0] ? serializeBigQueryValue(commRowsRaw[0]) : {};

  // Build KPI lookups
  const kpiByAccount = new Map<string, Map<string, any>>();
  const trendRowsByMetric = new Map<string, any[]>();

  for (const row of kpiRows) {
    if (row.Record_Type === 'LATEST') {
      if (!kpiByAccount.has(row.Account_ID)) {
        kpiByAccount.set(row.Account_ID, new Map<string, any>());
      }
      kpiByAccount.get(row.Account_ID)!.set(row.Metric_ID, row);
    } else if (row.Record_Type === 'TREND') {
      if (!trendRowsByMetric.has(row.Metric_ID)) {
        trendRowsByMetric.set(row.Metric_ID, []);
      }
      trendRowsByMetric.get(row.Metric_ID)!.push(row);
    }
  }

  // Calculate scope summary metrics
  let totalAccountsInScope = radarRows.length;
  let criticalAttentionCount = 0;
  let highAttentionCount = 0;
  let mediumAttentionCount = 0;
  let watchAttentionCount = 0;
  let accountsWithRedKpi = 0;
  let redSentimentCount = 0;
  let amberSentimentCount = 0;
  let greenSentimentCount = 0;
  let openEscalationCount = 0;
  let highCriticalEscalationCount = 0;
  let openZtCount = 0;
  let hrActionOpenZtCount = 0;
  let openCqmCount = 0;
  let openActionCount = 0;
  let overdueActionCount = 0;
  let highCriticalActionCount = 0;
  let activeTapAtRiskCount = 0;
  let totalClosedActions = 0;
  let totalMaturedActions = 0;

  const riskRadarRows: RiskRadarRow[] = [];

  for (const row of radarRows) {
    const band = row.Reconciled_Attention_Band as AttentionBandType;
    if (band === 'CRITICAL') criticalAttentionCount++;
    else if (band === 'HIGH') highAttentionCount++;
    else if (band === 'MEDIUM') mediumAttentionCount++;
    else if (band === 'WATCH') watchAttentionCount++;

    if (row.Red_KPI_Count > 0) accountsWithRedKpi++;

    const sentRag = row.Client_Sentiment_RAG;
    if (sentRag === 'Red') redSentimentCount++;
    else if (sentRag === 'Amber') amberSentimentCount++;
    else if (sentRag === 'Green') greenSentimentCount++;

    openEscalationCount += row.Open_Escalation_Count || 0;
    highCriticalEscalationCount += row.High_Critical_Escalation_Count || 0;
    openZtCount += row.Open_ZT_Count || 0;
    hrActionOpenZtCount += row.HR_Action_Open_ZT_Count || 0;
    openCqmCount += row.Open_CQM_Count || 0;
    openActionCount += row.Live_Open_Action_Count || 0;
    overdueActionCount += row.Live_Overdue_Action_Count || 0;
    highCriticalActionCount += row.Live_High_Critical_Action_Count || 0;
    activeTapAtRiskCount += row.Active_Tap_At_Risk_Count || 0;

    totalClosedActions += row.Live_Closed_Action_Count || 0;
    totalMaturedActions += row.Live_Matured_Action_Count || 0;

    // Parse Red KPIs array
    const redKpisArr = row.Red_KPIs
      ? row.Red_KPIs.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    riskRadarRows.push({
      accountId: row.Account_ID,
      accountName: row.Account_Name,
      vertical: row.Vertical,
      qaLeader: row.QA_Leader,
      srDirector: row.Sr_Director,
      site: row.Site,
      lob: row.LOB,
      attentionRank: row.Enterprise_Attention_Rank,
      attentionScore: row.Reconciled_Attention_Score,
      attentionBand: band,
      primaryDriver: row.Primary_Attention_Driver,
      redKpiCount: row.Red_KPI_Count,
      redKpis: redKpisArr,
      clientSentiment: row.Client_Sentiment_Score,
      clientSentimentRag: (row.Client_Sentiment_RAG as any) || 'N/A',
      openEscalations: row.Open_Escalation_Count || 0,
      highCriticalEscalations: row.High_Critical_Escalation_Count || 0,
      openZt: row.Open_ZT_Count || 0,
      openCqm: row.Open_CQM_Count || 0,
      openActions: row.Live_Open_Action_Count || 0,
      overdueActions: row.Live_Overdue_Action_Count || 0,
      highCriticalActions: row.Live_High_Critical_Action_Count || 0,
      activeTapAtRisk: row.Active_Tap_At_Risk_Count || 0,
    });
  }

  // Calculate Action Closure Rate (Closed / Matured)
  const actionClosureRate =
    totalMaturedActions > 0 ? totalClosedActions / totalMaturedActions : null;
  const actionClosureRateDisplay =
    actionClosureRate !== null ? `${(actionClosureRate * 100).toFixed(1)}%` : 'N/A';

  // =========================================================================
  // PRIORITY INSIGHTS GENERATION (Synthesized Account Cards)
  // =========================================================================
  const priorityInsights: PriorityInsightCard[] = [];

  // Determine top priority accounts (up to 5 for multi-account scope, or 1 for single account)
  const targetCardsCount = filters.accountId && filters.accountId !== 'ALL' ? 1 : 5;
  const topAccountsToCard = radarRows.slice(0, targetCardsCount);

  for (const acc of topAccountsToCard) {
    const accKpis = kpiByAccount.get(acc.Account_ID) || new Map<string, any>();
    const evidence: InsightEvidenceItem[] = [];

    // Helper to format KPI evidence
    const addKpiEvidence = (metricId: string, navTarget: ActivePageToken) => {
      const kpi = accKpis.get(metricId);
      if (kpi && kpi.Data_Presence_Status === 'HAS DATA') {
        evidence.push({
          metricId: kpi.Metric_ID,
          label: kpi.Metric,
          actual: kpi.Actual_Display || String(kpi.Actual_Value),
          target: kpi.Target_Display || (kpi.Target_Value !== null ? String(kpi.Target_Value) : null),
          status: (kpi.Effective_RAG as EvidenceStatus) || 'Neutral',
          navigationTarget: navTarget,
        });
      }
    };

    // Primary driver headline & evidence formulation
    let headline = `${acc.Account_Name} requires leadership oversight on ${acc.Primary_Attention_Driver.toLowerCase()}.`;
    let summary = `Attention score is ${acc.Reconciled_Attention_Score} (Band: ${acc.Reconciled_Attention_Band}, Enterprise Rank #${acc.Enterprise_Attention_Rank}).`;
    let recommendedAction = 'Engage account leadership to review open operational risks and corrective actions.';

    if (acc.Primary_Attention_Driver === 'High / critical escalation') {
      headline = `${acc.Account_Name} requires priority governance on a high-severity escalation.`;
      summary = `${acc.Account_Name} has ${acc.Open_Escalation_Count} open escalation${acc.Open_Escalation_Count > 1 ? 's' : ''}, including ${acc.High_Critical_Escalation_Count} high/critical case${acc.Max_Escalation_Days_Open ? ` (oldest open ${acc.Max_Escalation_Days_Open} days)` : ''}.`;
      recommendedAction = 'Prioritize joint review with Operations on the high-severity escalation.';

      evidence.push({
        label: 'High/Critical Escalations',
        actual: acc.High_Critical_Escalation_Count,
        status: acc.High_Critical_Escalation_Count > 0 ? 'Red' : 'Neutral',
        detail: acc.Max_Escalation_Days_Open ? `Oldest open: ${acc.Max_Escalation_Days_Open} days` : undefined,
        navigationTarget: 'account-diagnostic',
      });
    } else if (acc.Primary_Attention_Driver === 'Client-identified ZT') {
      headline = `${acc.Account_Name} has an active client-identified Zero Tolerance incident.`;
      summary = `A client-identified Zero Tolerance incident is open${acc.Max_ZT_Ageing_Days ? ` with ${acc.Max_ZT_Ageing_Days} days ageing` : ''}, requiring executive containment.`;
      recommendedAction = 'Coordinate with HR / Operations on resolution of the open ZT case.';

      evidence.push({
        label: 'Client-Identified ZT',
        actual: acc.Client_Open_ZT_Count,
        status: 'Red',
        detail: acc.Max_ZT_Ageing_Days ? `Ageing: ${acc.Max_ZT_Ageing_Days} days` : undefined,
        navigationTarget: 'account-diagnostic',
      });
    } else if (acc.Primary_Attention_Driver === 'Red KPI concentration') {
      headline = `${acc.Account_Name} has concentrated Red KPI exposure.`;
      summary = `${acc.Account_Name} has ${acc.Red_KPI_Count} Red KPI${acc.Red_KPI_Count > 1 ? 's' : ''}${acc.Red_KPIs ? ` (${acc.Red_KPIs})` : ''} impacting contractual performance.`;
      recommendedAction = 'Review process health diagnostic and validate contributing defect drivers.';
    } else if (acc.Primary_Attention_Driver === 'Client sentiment') {
      headline = `${acc.Account_Name} requires leadership attention on client sentiment.`;
      summary = `Client Sentiment score is ${acc.Client_Sentiment_Score !== null ? Number(acc.Client_Sentiment_Score).toFixed(1) : 'N/A'} (RAG: ${acc.Client_Sentiment_RAG || 'N/A'}).`;
      recommendedAction = 'Engage client relationship lead and review customer feedback cadence.';

      evidence.push({
        metricId: 'M001',
        label: 'Client Sentiment',
        actual: acc.Client_Sentiment_Score !== null ? Number(acc.Client_Sentiment_Score).toFixed(1) : 'N/A',
        target: '4.2',
        status: (acc.Client_Sentiment_RAG as EvidenceStatus) || 'Red',
        navigationTarget: 'account-diagnostic',
      });
    } else if (acc.Primary_Attention_Driver === 'Overdue actions') {
      headline = `${acc.Account_Name} has accumulated overdue corrective actions.`;
      summary = `${acc.Account_Name} carries ${acc.Live_Overdue_Action_Count} overdue corrective action${acc.Live_Overdue_Action_Count > 1 ? 's' : ''} requiring expedited closure.`;
      recommendedAction = 'Engage account leadership to accelerate closure of overdue actions.';

      evidence.push({
        label: 'Overdue Actions',
        actual: acc.Live_Overdue_Action_Count,
        status: 'Red',
        detail: `${acc.Live_High_Critical_Action_Count} high/critical priority`,
        navigationTarget: 'actions',
      });
    }

    // Add ZT evidence if active and not already first item
    if (acc.Open_ZT_Count > 0 && evidence.every(e => e.label !== 'Client-Identified ZT')) {
      evidence.push({
        label: 'Open ZT Incidents',
        actual: acc.Open_ZT_Count,
        status: 'Red',
        detail: acc.HR_Action_Open_ZT_Count > 0 ? 'HR action required' : undefined,
        navigationTarget: 'account-diagnostic',
      });
    }

    // Add Escalation evidence if open and not already added
    if (acc.Open_Escalation_Count > 0 && evidence.every(e => !e.label.includes('Escalation'))) {
      evidence.push({
        label: 'Open Escalations',
        actual: acc.Open_Escalation_Count,
        status: acc.High_Critical_Escalation_Count > 0 ? 'Red' : 'Amber',
        detail: acc.High_Critical_Escalation_Count > 0 ? `${acc.High_Critical_Escalation_Count} High/Critical` : undefined,
        navigationTarget: 'account-diagnostic',
      });
    }

    // Add Red / Amber KPIs
    const redKpiIds: string[] = [];
    const amberKpiIds: string[] = [];
    accKpis.forEach((k, mId) => {
      if (k.Effective_RAG === 'Red') redKpiIds.push(mId);
      else if (k.Effective_RAG === 'Amber') amberKpiIds.push(mId);
    });

    // Add Red KPIs first
    for (const mId of redKpiIds) {
      if (evidence.length >= 4) break;
      if (mId === 'M002') addKpiEvidence(mId, 'sla-detail');
      else if (mId === 'M005') addKpiEvidence(mId, 'best-qm-detail');
      else if (['M003', 'M004'].includes(mId)) addKpiEvidence(mId, 'process-health');
      else if (['M006', 'M007', 'M008', 'M009', 'M010'].includes(mId)) addKpiEvidence(mId, 'hygiene-inputs');
      else if (['M011', 'M012'].includes(mId)) addKpiEvidence(mId, 'qa-team');
      else addKpiEvidence(mId, 'account-diagnostic');
    }

    // Add Amber KPIs if space permits
    for (const mId of amberKpiIds) {
      if (evidence.length >= 4) break;
      if (mId === 'M002') addKpiEvidence(mId, 'sla-detail');
      else if (mId === 'M005') addKpiEvidence(mId, 'best-qm-detail');
      else if (['M003', 'M004'].includes(mId)) addKpiEvidence(mId, 'process-health');
      else if (['M006', 'M007', 'M008', 'M009', 'M010'].includes(mId)) addKpiEvidence(mId, 'hygiene-inputs');
      else if (['M011', 'M012'].includes(mId)) addKpiEvidence(mId, 'qa-team');
      else addKpiEvidence(mId, 'account-diagnostic');
    }

    // Add TAP risk if active
    if (acc.Active_Tap_At_Risk_Count > 0 && evidence.length < 5) {
      evidence.push({
        label: 'Active TAP at Risk',
        actual: acc.Active_Tap_At_Risk_Count,
        status: 'Amber',
        detail: 'Milestone dependency at risk',
        navigationTarget: 'value-adds',
      });
    }

    priorityInsights.push({
      id: `insight-${acc.Account_ID}`,
      accountId: acc.Account_ID,
      accountName: acc.Account_Name,
      vertical: acc.Vertical,
      qaLeader: acc.QA_Leader,
      srDirector: acc.Sr_Director,
      site: acc.Site,
      lob: acc.LOB,
      priority: acc.Reconciled_Attention_Band as AttentionBandType,
      attentionScore: acc.Reconciled_Attention_Score,
      attentionRank: acc.Enterprise_Attention_Rank,
      primaryDriver: acc.Primary_Attention_Driver,
      headline,
      summary,
      evidence,
      recommendedAction,
      navigationTarget: {
        page: 'account-diagnostic',
        accountId: acc.Account_ID,
      },
    });
  }

  // =========================================================================
  // CROSS-PORTFOLIO THEMES (Top Red KPI themes across scoped accounts)
  // =========================================================================
  const crossPortfolioThemes: CrossPortfolioTheme[] = [];
  const themeCountsByMetric = new Map<
    string,
    {
      metricId: string;
      metric: string;
      category: string;
      redAccounts: Array<{ accountId: string; accountName: string; actual: string; rag: string }>;
      applicableCount: number;
    }
  >();

  for (const [accId, kpiMap] of kpiByAccount.entries()) {
    const accMeta = radarRows.find(r => r.Account_ID === accId);
    kpiMap.forEach((k, mId) => {
      if (k.Data_Presence_Status === 'HAS DATA') {
        if (!themeCountsByMetric.has(mId)) {
          themeCountsByMetric.set(mId, {
            metricId: mId,
            metric: k.Metric,
            category: k.Category,
            redAccounts: [],
            applicableCount: 0,
          });
        }
        const entry = themeCountsByMetric.get(mId)!;
        entry.applicableCount++;
        if (k.Effective_RAG === 'Red') {
          entry.redAccounts.push({
            accountId: accId,
            accountName: accMeta?.Account_Name || accId,
            actual: k.Actual_Display || String(k.Actual_Value),
            rag: 'Red',
          });
        }
      }
    });
  }

  const sortedThemeEntries = Array.from(themeCountsByMetric.values())
    .filter(t => t.redAccounts.length > 0)
    .sort((a, b) => b.redAccounts.length - a.redAccounts.length)
    .slice(0, 5);

  for (const theme of sortedThemeEntries) {
    const pct =
      theme.applicableCount > 0
        ? (theme.redAccounts.length / theme.applicableCount) * 100
        : 0;

    let navPage: ActivePageToken = 'process-health';
    if (theme.metricId === 'M001') navPage = 'account-diagnostic';
    else if (theme.metricId === 'M002') navPage = 'sla-detail';
    else if (theme.metricId === 'M005') navPage = 'best-qm-detail';
    else if (['M006', 'M007', 'M008', 'M009', 'M010'].includes(theme.metricId))
      navPage = 'hygiene-inputs';
    else if (['M011', 'M012'].includes(theme.metricId)) navPage = 'qa-team';

    crossPortfolioThemes.push({
      themeId: `theme-${theme.metricId}`,
      category: theme.category,
      title: `${theme.metric} variance`,
      affectedAccountCount: theme.redAccounts.length,
      totalApplicableAccounts: theme.applicableCount,
      affectedAccountPct: pct,
      summary: `${theme.metric} is Red across ${theme.redAccounts.length} applicable account${theme.redAccounts.length > 1 ? 's' : ''} (${pct.toFixed(1)}% of scoped portfolio with data).`,
      topAccounts: theme.redAccounts.slice(0, 4),
      navigationTarget: {
        page: navPage,
      },
    });
  }

  // =========================================================================
  // POSITIVE SIGNALS (Factual governance and transformation highlights)
  // =========================================================================
  const positiveSignals: PositiveSignalItem[] = [];

  // 1. Single Account Context vs Portfolio Context
  if (filters.accountId && filters.accountId !== 'ALL' && radarRows.length === 1) {
    const acc = radarRows[0];
    // Check 100% action closure
    if (acc.Live_Open_Action_Count === 0 && acc.Live_Overdue_Action_Count === 0 && acc.Live_Closed_Action_Count > 0) {
      positiveSignals.push({
        id: `pos-action-${acc.Account_ID}`,
        accountId: acc.Account_ID,
        accountName: acc.Account_Name,
        title: 'ACTION BACKLOG FULLY CLOSED',
        metricLabel: 'Action Closure Rate',
        achievementValue: '100.0%',
        summary: `All ${acc.Live_Closed_Action_Count} matured actions are closed with 0 overdue actions.`,
        navigationTarget: { page: 'actions', accountId: acc.Account_ID },
      });
    }

    // Check QaaS achievement
    const qaasProgVal = commRow.QaaS_Program_Value || 0;
    const qaasTgtVal = commRow.QaaS_Target_Value || 0;
    if (qaasTgtVal > 0 && qaasProgVal >= qaasTgtVal) {
      const achPct = (qaasProgVal / qaasTgtVal) * 100;
      positiveSignals.push({
        id: `pos-qaas-${acc.Account_ID}`,
        accountId: acc.Account_ID,
        accountName: acc.Account_Name,
        title: 'QAAS PROGRAM VALUE ABOVE TARGET',
        metricLabel: 'Program Value Achievement',
        achievementValue: `${achPct.toFixed(1)}%`,
        summary: `Recorded QaaS Program Value is ${(qaasProgVal / 1000).toFixed(1)}K versus target ${(qaasTgtVal / 1000).toFixed(1)}K (${achPct.toFixed(1)}%).`,
        navigationTarget: { page: 'value-adds', accountId: acc.Account_ID },
      });
    }

    // Check Resource compliance
    const utilKpi = kpiByAccount.get(acc.Account_ID)?.get('M011');
    const attrKpi = kpiByAccount.get(acc.Account_ID)?.get('M012');
    if (utilKpi?.Effective_RAG === 'Green' && attrKpi?.Effective_RAG === 'Green') {
      positiveSignals.push({
        id: `pos-qa-team-${acc.Account_ID}`,
        accountId: acc.Account_ID,
        accountName: acc.Account_Name,
        title: 'QA UTILIZATION & ATTRITION ON TARGET',
        metricLabel: 'Utilization / Attrition',
        achievementValue: `${utilKpi.Actual_Display || '90.0%'} / ${attrKpi.Actual_Display || '0.0%'}`,
        summary: `QA Utilization is ${utilKpi.Actual_Display || '90.0%'} and QA Attrition is ${attrKpi.Actual_Display || '0.0%'}; both meet their current Green targets.`,
        navigationTarget: { page: 'qa-team', accountId: acc.Account_ID },
      });
    }
  } else {
    // Portfolio-level positive signals
    // 1. Accounts with 100% action closure
    const accountsWithZeroOverdueAndClosed = radarRows.filter(
      r => r.Live_Open_Action_Count === 0 && r.Live_Overdue_Action_Count === 0 && r.Live_Closed_Action_Count > 0
    );
    if (accountsWithZeroOverdueAndClosed.length > 0) {
      const accWord = accountsWithZeroOverdueAndClosed.length === 1 ? 'account' : 'accounts';
      positiveSignals.push({
        id: 'pos-portfolio-actions',
        title: 'ACTION BACKLOG DISCIPLINE',
        metricLabel: 'Accounts with Zero Overdue',
        achievementValue: `${accountsWithZeroOverdueAndClosed.length} Account${accountsWithZeroOverdueAndClosed.length !== 1 ? 's' : ''}`,
        summary: `${accountsWithZeroOverdueAndClosed.length} ${accWord} maintain 100% matured action closure with zero open or overdue corrective items.`,
        navigationTarget: { page: 'actions' },
      });
    }

    // 2. QaaS Portfolio Achievement
    const qaasProgVal = commRow.QaaS_Program_Value || 0;
    const qaasTgtVal = commRow.QaaS_Target_Value || 0;
    if (qaasTgtVal > 0 && qaasProgVal >= qaasTgtVal) {
      const achPct = (qaasProgVal / qaasTgtVal) * 100;
      positiveSignals.push({
        id: 'pos-portfolio-qaas',
        title: 'QAAS PROGRAM VALUE ABOVE TARGET',
        metricLabel: 'Portfolio Value Achievement',
        achievementValue: `${achPct.toFixed(1)}%`,
        summary: `Total QaaS Program Value reached ${(qaasProgVal / 1000000).toFixed(2)}M against target of ${(qaasTgtVal / 1000000).toFixed(2)}M (${achPct.toFixed(1)}%).`,
        navigationTarget: { page: 'value-adds' },
      });
    }

    // 3. High Sentiment Accounts
    if (greenSentimentCount > 0) {
      const greenPct = (greenSentimentCount / totalAccountsInScope) * 100;
      positiveSignals.push({
        id: 'pos-portfolio-sentiment',
        title: 'POSITIVE CLIENT PARTNERSHIPS',
        metricLabel: 'Green Sentiment Coverage',
        achievementValue: `${greenPct.toFixed(1)}%`,
        summary: `${greenSentimentCount} account${greenSentimentCount !== 1 ? 's' : ''} have Green client sentiment ratings indicating strong operational satisfaction.`,
        navigationTarget: { page: 'overview' },
      });
    }
  }

  // =========================================================================
  // PERIOD TRENDS (Historical Closed KPI trajectories across 3M/6M/YTD/12M)
  // =========================================================================
  const periodTrends: PeriodTrendItem[] = [];

  const trendMetricsToReport = [
    { id: 'M002', name: 'SLA Achievement', targetPage: 'sla-detail' as ActivePageToken },
    { id: 'M005', name: 'BEST QM', targetPage: 'best-qm-detail' as ActivePageToken },
    { id: 'M011', name: 'QA Utilization', targetPage: 'qa-team' as ActivePageToken },
    { id: 'M012', name: 'QA Attrition', targetPage: 'qa-team' as ActivePageToken },
  ];

  for (const tm of trendMetricsToReport) {
    const rawTrendRows = trendRowsByMetric.get(tm.id) || [];
    if (rawTrendRows.length >= 2) {
      const sortedPoints = rawTrendRows.slice().sort((a, b) => {
        const dateA = a.Month?.value || a.Month || '';
        const dateB = b.Month?.value || b.Month || '';
        return dateA.localeCompare(dateB);
      });

      const startPt = sortedPoints[0];
      const endPt = sortedPoints[sortedPoints.length - 1];

      const startVal = startPt.Avg_Actual_Value !== null ? Number(startPt.Avg_Actual_Value) : null;
      const endVal = endPt.Avg_Actual_Value !== null ? Number(endPt.Avg_Actual_Value) : null;
      const scale = startPt.Metric_Scale || 'DECIMAL_PERCENTAGE';
      const isHigherBetter = startPt.Is_Higher_Better !== false;

      let delta: number | null = null;
      let deltaDisplay = 'N/A';
      let isFavourable: boolean | null = null;

      if (startVal !== null && endVal !== null) {
        delta = endVal - startVal;
        if (scale === 'DECIMAL_PERCENTAGE') {
          const deltaPct = delta * 100;
          deltaDisplay = `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%`;
        } else {
          deltaDisplay = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}`;
        }
        isFavourable = isHigherBetter ? delta >= 0 : delta <= 0;
      }

      // Format start / end display
      const formatVal = (v: number | null) => {
        if (v === null) return 'N/A';
        if (scale === 'DECIMAL_PERCENTAGE') return `${(v * 100).toFixed(1)}%`;
        return v.toFixed(1);
      };

      const points: PeriodTrendPoint[] = sortedPoints.map(pt => {
        const rawDate = pt.Month?.value || pt.Month || '';
        const [y, m] = rawDate.split('-');
        const monthLabel = m && y ? formatMonthLabel(parseInt(y, 10), parseInt(m, 10)) : rawDate;
        const val = pt.Avg_Actual_Value !== null ? Number(pt.Avg_Actual_Value) : null;
        const rag =
          pt.Red_Count > 0 && pt.Red_Count >= pt.Green_Count
            ? 'Red'
            : pt.Amber_Count > pt.Green_Count
            ? 'Amber'
            : 'Green';
        return {
          month: monthLabel,
          actualValue: val,
          actualDisplay: formatVal(val),
          rag,
        };
      });

      const [sY, sM] = (startPt.Month?.value || startPt.Month || '').split('-');
      const [eY, eM] = (endPt.Month?.value || endPt.Month || '').split('-');
      const startMonthLabel = sM && sY ? formatMonthLabel(parseInt(sY, 10), parseInt(sM, 10)) : '';
      const endMonthLabel = eM && eY ? formatMonthLabel(parseInt(eY, 10), parseInt(eM, 10)) : '';

      periodTrends.push({
        metricId: tm.id,
        metricName: tm.name,
        scale,
        higherIsBetter: isHigherBetter,
        startMonth: startMonthLabel,
        endMonth: endMonthLabel,
        startValue: startVal,
        startDisplay: formatVal(startVal),
        endValue: endVal,
        endDisplay: formatVal(endVal),
        delta,
        deltaDisplay,
        isFavourable,
        startRag: points[0]?.rag || null,
        endRag: points[points.length - 1]?.rag || null,
        points,
        navigationTarget: tm.targetPage,
      });
    }
  }

  // =========================================================================
  // COMMERCIAL CONTEXT DATA
  // =========================================================================
  const currentCommercialContext: CommercialContextData = {
    timePeriodLabel: `${officialReportingMonth} (Latest Closed Month)`,
    penaltyExposure: Number(commRow.Latest_Penalty_Exposure || 0),
    penaltyPaid: Number(commRow.Latest_Actual_Penalty_Paid || 0),
    rewardOpportunity: Number(commRow.Latest_Reward_Opportunity || 0),
    rewardEarned: Number(commRow.Latest_Actual_Reward_Earned || 0),
    netCommercialImpact: Number(commRow.Latest_Net_Commercial_Impact || 0),
  };

  const selectedPeriodCommercialContext: CommercialContextData = {
    timePeriodLabel: `${timePeriod} Cumulative Window`,
    penaltyExposure: Number(commRow.Period_Penalty_Exposure || 0),
    penaltyPaid: Number(commRow.Period_Actual_Penalty_Paid || 0),
    rewardOpportunity: Number(commRow.Period_Reward_Opportunity || 0),
    rewardEarned: Number(commRow.Period_Actual_Reward_Earned || 0),
    netCommercialImpact: Number(commRow.Period_Net_Commercial_Impact || 0),
  };

  // =========================================================================
  // EXECUTIVE SYNTHESIS SUMMARY
  // =========================================================================
  let governanceStatus: 'CRITICAL' | 'ATTENTION' | 'STABLE' | 'HEALTHY' = 'STABLE';
  if (criticalAttentionCount > 0 || openZtCount > 0 || highCriticalEscalationCount > 0) {
    governanceStatus = 'CRITICAL';
  } else if (highAttentionCount > 0 || overdueActionCount > 0 || accountsWithRedKpi > 0) {
    governanceStatus = 'ATTENTION';
  } else if (mediumAttentionCount > 0) {
    governanceStatus = 'STABLE';
  } else {
    governanceStatus = 'HEALTHY';
  }

  let leadSummary = '';
  const keyObservations: string[] = [];

  if (totalAccountsInScope === 0) {
    leadSummary = 'No accounts match the current filter scope.';
  } else if (filters.accountId && filters.accountId !== 'ALL' && radarRows.length === 1) {
    const acc = radarRows[0];
    leadSummary = `Executive summary for ${acc.Account_Name} (${acc.Vertical}): Prioritized in ${acc.Reconciled_Attention_Band} attention tier (Enterprise Rank #${acc.Enterprise_Attention_Rank}, Score: ${acc.Reconciled_Attention_Score}) driven by ${acc.Primary_Attention_Driver.toLowerCase()}.`;

    if (acc.High_Critical_Escalation_Count > 0) {
      keyObservations.push(
        `${acc.High_Critical_Escalation_Count} high-severity escalation active requiring joint operational review.`
      );
    }
    if (acc.Open_ZT_Count > 0) {
      keyObservations.push(
        `Active Zero Tolerance incident requiring pending HR / operations action (${acc.Max_ZT_Ageing_Days ? `${acc.Max_ZT_Ageing_Days}d ageing` : 'in progress'}).`
      );
    }
    if (acc.Red_KPI_Count > 0) {
      keyObservations.push(
        `${acc.Red_KPI_Count} Red KPI (${acc.Red_KPIs || 'unspecified'}) below contractual threshold.`
      );
    }
    if (acc.Active_Tap_At_Risk_Count > 0) {
      keyObservations.push(
        `${acc.Active_Tap_At_Risk_Count} active TAP project flagged at risk on milestone dependencies.`
      );
    }
    if (acc.Live_Open_Action_Count === 0 && acc.Live_Overdue_Action_Count === 0) {
      keyObservations.push('Corrective action register is fully closed with 0 overdue items.');
    }
  } else {
    leadSummary = `Executive governance overview across ${totalAccountsInScope} monitored accounts for ${officialReportingMonth}: ${criticalAttentionCount} accounts categorized in Critical attention band, ${redSentimentCount} accounts exhibiting Red client sentiment, and ${overdueActionCount} overdue actions in backlog.`;

    if (criticalAttentionCount > 0) {
      keyObservations.push(
        `${criticalAttentionCount} accounts (${((criticalAttentionCount / totalAccountsInScope) * 100).toFixed(1)}% of portfolio) prioritized in Critical attention tier requiring executive oversight.`
      );
    }
    if (openZtCount > 0) {
      const ztPlural = openZtCount === 1 ? 'incident' : 'incidents';
      const hrText =
        hrActionOpenZtCount === 1
          ? '1 requiring HR action'
          : `${hrActionOpenZtCount} requiring HR action`;
      keyObservations.push(
        `${openZtCount} open Zero Tolerance ${ztPlural} tracked across the scoped portfolio (${hrText}).`
      );
    }
    if (overdueActionCount > 0) {
      keyObservations.push(
        `${overdueActionCount} overdue corrective actions pending across account leadership teams.`
      );
    }
    if (activeTapAtRiskCount > 0) {
      keyObservations.push(
        `${activeTapAtRiskCount} active TAP transformation projects currently flagged at risk.`
      );
    }
  }

  return {
    reportingContext: {
      reportingMonth: officialReportingMonth,
      latestClosedMonth: latestClosedMonthStr,
      latestAvailableMonth: latestAvailableMonthStr,
      currentOpenMonth: currentOpenMonthStr,
      currentSubmissionDeadline: currentSubmissionDeadlineStr,
      dataAsOfDate: new Date().toISOString().split('T')[0],
      businessTimezone: 'Asia/Kolkata',
      totalMonitoredAccounts: totalAccountsInScope,
      timePeriod,
      periodStartDate: periodWindow.startDate,
      periodEndDate: periodWindow.endDate,
      monthCount: periodWindow.monthCount,
    },
    scopeSummary: {
      totalAccountsInScope,
      criticalAttentionCount,
      highAttentionCount,
      mediumAttentionCount,
      watchAttentionCount,
      accountsWithRedKpi,
      redSentimentCount,
      amberSentimentCount,
      greenSentimentCount,
      openEscalationCount,
      highCriticalEscalationCount,
      openZtCount,
      hrActionOpenZtCount,
      openCqmCount,
      openActionCount,
      overdueActionCount,
      highCriticalActionCount,
      activeTapAtRiskCount,
      actionClosureRate,
      actionClosureRateDisplay,
    },
    executiveSynthesis: {
      leadSummary,
      keyObservations,
      governanceStatus,
    },
    priorityInsights,
    crossPortfolioThemes,
    positiveSignals,
    riskRadarRows,
    periodTrends,
    currentCommercialContext,
    selectedPeriodCommercialContext,
  };
}
