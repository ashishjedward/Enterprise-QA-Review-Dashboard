import { getBigQueryClient, getBigQueryConfig } from './bigquery';
import { fetchAuthoritativeReportingContext, ReportingPeriodKey } from './reportingPeriod';

export interface ValueAddsDiagnosticFilters {
  timePeriod?: string;
  vertical?: string;
  qaLeader?: string;
  srDirector?: string;
  accountId?: string;
  site?: string;
  lob?: string;
}

export async function fetchValueAddsDiagnostic(filters: ValueAddsDiagnosticFilters) {
  const bq = getBigQueryClient();
  const { projectId, dataset, location } = getBigQueryConfig();

  const validTimePeriods: ReportingPeriodKey[] = ['3M', '6M', 'YTD', '12M'];
  const timePeriod: ReportingPeriodKey = filters.timePeriod && (validTimePeriods as string[]).includes(filters.timePeriod)
    ? (filters.timePeriod as ReportingPeriodKey)
    : '12M';

  // 1. Fetch Authoritative Reporting Context & Dynamic Time Windows (Anchored to Latest_Closed_Month)
  const authCtx = await fetchAuthoritativeReportingContext(bq, projectId, dataset, location);
  const periodWindow = authCtx.windows[timePeriod];

  const latestClosedMonthStr = authCtx.latestClosedMonth;
  const latestAvailableMonthStr = authCtx.latestAvailableMonth;
  const currentOpenMonthStr = authCtx.currentOpenMonth;
  const currentSubmissionDeadlineStr = authCtx.currentSubmissionDeadline;
  const officialReportingMonth = authCtx.officialReportingMonth;

  const startDateStr = periodWindow.startDate;
  const endDateStr = periodWindow.endDate;

  // Build account scope WHERE clause
  const whereClauses: string[] = ['1=1'];
  const queryParams: Record<string, any> = {
    startDate: startDateStr,
    endDate: endDateStr,
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
    whereClauses.push('m.Account_ID = @accountId');
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

  // QUERY 1: QaaS Opportunities (Portfolio Summary, Distributions, Register, and Period Trend)
  const qaasQuery = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID, m.Account, m.BU, m.Vertical, m.Site, m.LOB, m.QA_Leader, m.Sr_Director
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${scopeFilterSql}
    ),
    qaas_scoped AS (
      SELECT 
        q.Opportunity_ID,
        q.Month,
        q.Account_ID,
        a.Account AS Account_Name,
        COALESCE(q.BU, a.BU) AS BU,
        COALESCE(q.Vertical, a.Vertical) AS Vertical,
        q.Metric_Type,
        q.Current_Stage,
        q.Status,
        q.Revenue_Value,
        q.Target_Value,
        q.Realization_Pct,
        q.Client_Approval,
        q.Status_RAG,
        q.Remarks,
        q.Is_Won,
        q.Is_Delivered,
        q.Is_Open,
        q.Is_Realized
      FROM \`${projectId}.${dataset}.vw_qaas_revenue\` q
      JOIN scoped_accounts a ON q.Account_ID = a.Account_ID
    )
    SELECT 
      (SELECT COUNT(DISTINCT Account_ID) FROM scoped_accounts) AS Scoped_Account_Count,
      -- Portfolio QaaS Totals (Whole Scope)
      COUNT(*) AS Total_Records,
      COUNTIF(Is_Open) AS Open_Count,
      COUNTIF(Is_Won) AS Won_Count,
      COUNTIF(Is_Delivered) AS Delivered_Count,
      COUNTIF(Is_Realized) AS Realized_Count,
      SUM(Target_Value) AS Total_Target_Value,
      SUM(Revenue_Value) AS Total_Opportunity_Value,
      SAFE_DIVIDE(SUM(Revenue_Value), SUM(Target_Value)) AS Value_Achievement_Pct,
      SUM(CASE WHEN Is_Open THEN Target_Value END) AS Open_Target_Value,
      SUM(CASE WHEN Is_Open THEN Revenue_Value END) AS Open_Opportunity_Value,
      SUM(CASE WHEN Is_Realized THEN Target_Value END) AS Realized_Target_Value,
      SUM(CASE WHEN Is_Realized THEN Revenue_Value END) AS Realized_Opportunity_Value,
      SAFE_DIVIDE(SUM(CASE WHEN Is_Realized THEN Revenue_Value END), SUM(CASE WHEN Is_Realized THEN Target_Value END)) AS Realized_Achievement_Pct
    FROM qaas_scoped
  `;

  const qaasDistQuery = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${scopeFilterSql}
    ),
    qaas_scoped AS (
      SELECT q.*
      FROM \`${projectId}.${dataset}.vw_qaas_revenue\` q
      JOIN scoped_accounts a ON q.Account_ID = a.Account_ID
    )
    SELECT 'STATUS' as dist_type, Status as category, COUNT(*) as count, SUM(Target_Value) as target_val, SUM(Revenue_Value) as opp_val
    FROM qaas_scoped
    GROUP BY Status
    UNION ALL
    SELECT 'STAGE' as dist_type, Current_Stage as category, COUNT(*) as count, SUM(Target_Value) as target_val, SUM(Revenue_Value) as opp_val
    FROM qaas_scoped
    GROUP BY Current_Stage
  `;

  const qaasTrendQuery = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${scopeFilterSql}
    ),
    qaas_scoped AS (
      SELECT q.*
      FROM \`${projectId}.${dataset}.vw_qaas_revenue\` q
      JOIN scoped_accounts a ON q.Account_ID = a.Account_ID
      WHERE q.Month >= @startDate AND q.Month <= @endDate
    )
    SELECT 
      FORMAT_DATE('%Y-%m', Month) AS month_str,
      COUNT(*) AS count,
      COUNTIF(Is_Open) AS open_count,
      COUNTIF(Is_Won) AS won_count,
      COUNTIF(Is_Delivered) AS delivered_count,
      SUM(Target_Value) AS target_value,
      SUM(Revenue_Value) AS opportunity_value
    FROM qaas_scoped
    GROUP BY 1
    ORDER BY 1
  `;

  const qaasRegisterQuery = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID, m.Account, m.BU, m.Vertical
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${scopeFilterSql}
    )
    SELECT 
      q.Opportunity_ID,
      FORMAT_DATE('%Y-%m-%d', q.Month) AS Month,
      q.Account_ID,
      a.Account AS Account_Name,
      COALESCE(q.BU, a.BU) AS BU,
      COALESCE(q.Vertical, a.Vertical) AS Vertical,
      q.Metric_Type,
      q.Current_Stage,
      q.Status,
      q.Revenue_Value,
      q.Target_Value,
      q.Realization_Pct,
      q.Client_Approval,
      q.Status_RAG,
      q.Remarks
    FROM \`${projectId}.${dataset}.vw_qaas_revenue\` q
    JOIN scoped_accounts a ON q.Account_ID = a.Account_ID
    ORDER BY q.Month DESC, q.Opportunity_ID DESC
  `;

  // QUERY 2: TAP Portfolio (As-Of-Date Lifecycle, Distributions, Register, Period Activity)
  const tapQuery = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID, m.Account, m.BU, m.Vertical, m.Site, m.LOB, m.QA_Leader, m.Sr_Director
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${scopeFilterSql}
    ),
    tap_classified AS (
      SELECT 
        t.Project_ID,
        t.Month,
        t.Account_ID,
        a.Account AS Account_Name,
        COALESCE(t.BU, a.BU) AS BU,
        COALESCE(t.Vertical, a.Vertical) AS Vertical,
        t.Project_Name,
        t.Process_Name,
        t.Category,
        t.TAP_Lever,
        t.Benefit_Type,
        t.Current_Stage,
        t.Status AS Source_Status,
        t.Project_Approval,
        t.Expected_Start_Date,
        t.Actual_Start_Date,
        t.Expected_End_Date,
        t.Actual_End_Date,
        t.Target_Benefit,
        t.Realized_Benefit,
        t.Realization_Pct,
        t.Status_RAG,
        t.Latest_Update,
        t.Is_At_Risk,
        t.Is_Active AS Source_Is_Active,
        t.Is_Closed AS Source_Is_Closed,
        CASE 
          WHEN t.Actual_Start_Date > CURRENT_DATE('Asia/Kolkata') THEN 'PLANNED'
          WHEN t.Actual_Start_Date <= CURRENT_DATE('Asia/Kolkata') 
               AND (t.Actual_End_Date IS NULL OR t.Actual_End_Date > CURRENT_DATE('Asia/Kolkata')) THEN 'ACTIVE'
          WHEN t.Actual_End_Date IS NOT NULL AND t.Actual_End_Date <= CURRENT_DATE('Asia/Kolkata') THEN 'CLOSED'
          ELSE 'UNKNOWN'
        END AS As_Of_Today_Status
      FROM \`${projectId}.${dataset}.vw_tap_summary\` t
      JOIN scoped_accounts a ON t.Account_ID = a.Account_ID
    )
    SELECT 
      COUNT(*) AS Total_Projects,
      COUNTIF(As_Of_Today_Status = 'PLANNED') AS Planned_Projects,
      COUNTIF(As_Of_Today_Status = 'ACTIVE') AS Active_Projects,
      COUNTIF(As_Of_Today_Status = 'ACTIVE' AND Is_At_Risk) AS Active_At_Risk_Projects,
      COUNTIF(As_Of_Today_Status = 'CLOSED') AS Closed_Projects,
      COUNTIF(Is_At_Risk) AS Total_At_Risk_Projects,
      SUM(Target_Benefit) AS Total_Target_Benefit,
      SUM(Realized_Benefit) AS Recorded_Realized_Benefit,
      SAFE_DIVIDE(SUM(Realized_Benefit), SUM(Target_Benefit)) AS Portfolio_Realization_Pct,
      SAFE_DIVIDE(
        SUM(CASE WHEN As_Of_Today_Status = 'CLOSED' THEN Realized_Benefit END),
        SUM(CASE WHEN As_Of_Today_Status = 'CLOSED' THEN Target_Benefit END)
      ) AS Closed_Realization_Pct
    FROM tap_classified
  `;

  const tapDistQuery = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${scopeFilterSql}
    ),
    tap_scoped AS (
      SELECT t.*
      FROM \`${projectId}.${dataset}.vw_tap_summary\` t
      JOIN scoped_accounts a ON t.Account_ID = a.Account_ID
    )
    SELECT 'LEVER' as dist_type, COALESCE(TAP_Lever, 'Other') as category, COUNT(*) as count, SUM(Target_Benefit) as target_val, SUM(Realized_Benefit) as realized_val
    FROM tap_scoped
    GROUP BY category
    UNION ALL
    SELECT 'BENEFIT_TYPE' as dist_type, COALESCE(Benefit_Type, 'Other') as category, COUNT(*) as count, SUM(Target_Benefit) as target_val, SUM(Realized_Benefit) as realized_val
    FROM tap_scoped
    GROUP BY category
  `;

  const tapRegisterQuery = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID, m.Account, m.BU, m.Vertical
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${scopeFilterSql}
    )
    SELECT 
      t.Project_ID,
      FORMAT_DATE('%Y-%m-%d', t.Month) AS Month,
      t.Account_ID,
      a.Account AS Account_Name,
      COALESCE(t.BU, a.BU) AS BU,
      COALESCE(t.Vertical, a.Vertical) AS Vertical,
      t.Project_Name,
      t.Process_Name,
      t.Category,
      t.TAP_Lever,
      t.Benefit_Type,
      t.Current_Stage,
      t.Status AS Source_Status,
      CASE 
        WHEN t.Actual_Start_Date > CURRENT_DATE('Asia/Kolkata') THEN 'PLANNED'
        WHEN t.Actual_Start_Date <= CURRENT_DATE('Asia/Kolkata') 
             AND (t.Actual_End_Date IS NULL OR t.Actual_End_Date > CURRENT_DATE('Asia/Kolkata')) THEN 'ACTIVE'
        WHEN t.Actual_End_Date IS NOT NULL AND t.Actual_End_Date <= CURRENT_DATE('Asia/Kolkata') THEN 'CLOSED'
        ELSE 'UNKNOWN'
      END AS As_Of_Today_Status,
      t.Project_Approval,
      FORMAT_DATE('%Y-%m-%d', t.Actual_Start_Date) AS Actual_Start_Date,
      FORMAT_DATE('%Y-%m-%d', t.Actual_End_Date) AS Actual_End_Date,
      FORMAT_DATE('%Y-%m-%d', t.Expected_End_Date) AS Expected_End_Date,
      t.Target_Benefit,
      t.Realized_Benefit,
      t.Realization_Pct,
      t.Status_RAG,
      t.Latest_Update,
      t.Is_At_Risk
    FROM \`${projectId}.${dataset}.vw_tap_summary\` t
    JOIN scoped_accounts a ON t.Account_ID = a.Account_ID
    ORDER BY t.Month DESC, t.Project_ID DESC
  `;

  const tapPeriodQuery = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${scopeFilterSql}
    ),
    tap_scoped AS (
      SELECT t.*
      FROM \`${projectId}.${dataset}.vw_tap_summary\` t
      JOIN scoped_accounts a ON t.Account_ID = a.Account_ID
    )
    SELECT 
      COUNTIF(Actual_Start_Date >= @startDate AND Actual_Start_Date <= @endDate) AS Projects_Initiated,
      COUNTIF(Actual_End_Date >= @startDate AND Actual_End_Date <= @endDate AND Actual_End_Date <= CURRENT_DATE('Asia/Kolkata')) AS Projects_Completed,
      COUNTIF(Month >= @startDate AND Month <= @endDate) AS Projects_Logged
    FROM tap_scoped
  `;

  // QUERY 3: Commercial Context (Base QA Billing & RP Tracker / SLA Impact in selected timePeriod)
  const commercialQuery = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      WHERE ${scopeFilterSql}
    ),
    billing_scoped AS (
      SELECT b.*
      FROM \`${projectId}.${dataset}.vw_billed_qa\` b
      JOIN scoped_accounts a ON b.Account_ID = a.Account_ID
      WHERE b.Month >= @startDate AND b.Month <= @endDate
    ),
    rp_scoped AS (
      SELECT r.*
      FROM \`${projectId}.${dataset}.vw_rp_tracker\` r
      JOIN scoped_accounts a ON r.Account_ID = a.Account_ID
      WHERE r.Month >= @startDate AND r.Month <= @endDate
    )
    SELECT 
      -- Billing
      (SELECT SUM(Billed_Revenue) FROM billing_scoped) AS Billed_Revenue,
      (SELECT SUM(Plan_Revenue) FROM billing_scoped) AS Plan_Revenue,
      (SELECT SAFE_DIVIDE(SUM(Billed_Revenue), SUM(Plan_Revenue)) FROM billing_scoped) AS Revenue_Achievement_Pct,
      -- Commercial Impact (RP Tracker)
      (SELECT SUM(Penalty_Exposure_Value) FROM rp_scoped) AS Penalty_Exposure_Value,
      (SELECT SUM(Actual_Penalty_Paid_Value) FROM rp_scoped) AS Actual_Penalty_Paid_Value,
      (SELECT SUM(Reward_Opportunity_Value) FROM rp_scoped) AS Reward_Opportunity_Value,
      (SELECT SUM(Actual_Reward_Earned_Value) FROM rp_scoped) AS Actual_Reward_Earned_Value,
      (SELECT SUM(Net_Commercial_Impact) FROM rp_scoped) AS Net_Commercial_Impact
  `;

  // Execute all queries in parallel
  const [
    [qaasRows],
    [qaasDistRows],
    [qaasTrendRows],
    [qaasRegRows],
    [tapRows],
    [tapDistRows],
    [tapRegRows],
    [tapPeriodRows],
    [commRows]
  ] = await Promise.all([
    bq.query({ query: qaasQuery, params: queryParams }),
    bq.query({ query: qaasDistQuery, params: queryParams }),
    bq.query({ query: qaasTrendQuery, params: queryParams }),
    bq.query({ query: qaasRegisterQuery, params: queryParams }),
    bq.query({ query: tapQuery, params: queryParams }),
    bq.query({ query: tapDistQuery, params: queryParams }),
    bq.query({ query: tapRegisterQuery, params: queryParams }),
    bq.query({ query: tapPeriodQuery, params: queryParams }),
    bq.query({ query: commercialQuery, params: queryParams })
  ]);

  const qaasSummaryRaw = qaasRows[0] || {};
  const tapSummaryRaw = tapRows[0] || {};
  const commSummaryRaw = commRows[0] || {};
  const tapPeriodRaw = tapPeriodRows[0] || {};

  const scopedAccountCount = Number(qaasSummaryRaw.Scoped_Account_Count ?? 0);
  const hasAccounts = scopedAccountCount > 0;

  // Process QaaS distributions
  const qaasStatusDistribution: Array<{ status: string; count: number; targetValue: number; opportunityValue: number }> = [];
  const qaasStageDistribution: Array<{ stage: string; count: number; targetValue: number; opportunityValue: number }> = [];

  for (const row of qaasDistRows) {
    if (row.dist_type === 'STATUS') {
      qaasStatusDistribution.push({
        status: row.category,
        count: Number(row.count || 0),
        targetValue: Number(row.target_val || 0),
        opportunityValue: Number(row.opp_val || 0)
      });
    } else if (row.dist_type === 'STAGE') {
      qaasStageDistribution.push({
        stage: row.category,
        count: Number(row.count || 0),
        targetValue: Number(row.target_val || 0),
        opportunityValue: Number(row.opp_val || 0)
      });
    }
  }

  // Process QaaS Monthly Trend
  const qaasMonthlyTrend = qaasTrendRows.map(r => ({
    month: r.month_str,
    count: Number(r.count || 0),
    openCount: Number(r.open_count || 0),
    wonCount: Number(r.won_count || 0),
    deliveredCount: Number(r.delivered_count || 0),
    targetValue: Number(r.target_value || 0),
    opportunityValue: Number(r.opportunity_value || 0)
  }));

  // Process QaaS Register
  const qaasRegister = qaasRegRows.map(r => ({
    opportunityId: r.Opportunity_ID,
    month: r.Month,
    accountId: r.Account_ID,
    accountName: r.Account_Name,
    bu: r.BU || null,
    vertical: r.Vertical || null,
    metricType: r.Metric_Type || null,
    currentStage: r.Current_Stage || 'Proposal',
    status: r.Status || 'Open',
    targetValue: Number(r.Target_Value || 0),
    revenueValue: Number(r.Revenue_Value || 0),
    realizationPct: r.Realization_Pct !== null ? Number(r.Realization_Pct) : null,
    clientApproval: r.Client_Approval === true,
    statusRag: r.Status_RAG || null,
    remarks: r.Remarks || null
  }));

  // Process TAP Lever & Benefit Type distribution
  const tapLeverDistribution: Array<{ lever: string; count: number; targetBenefit: number; realizedBenefit: number }> = [];
  const tapBenefitTypeDistribution: Array<{ benefitType: string; count: number; targetBenefit: number; realizedBenefit: number }> = [];

  for (const row of tapDistRows) {
    if (row.dist_type === 'LEVER') {
      tapLeverDistribution.push({
        lever: row.category,
        count: Number(row.count || 0),
        targetBenefit: Number(row.target_val || 0),
        realizedBenefit: Number(row.realized_val || 0)
      });
    } else if (row.dist_type === 'BENEFIT_TYPE') {
      tapBenefitTypeDistribution.push({
        benefitType: row.category,
        count: Number(row.count || 0),
        targetBenefit: Number(row.target_val || 0),
        realizedBenefit: Number(row.realized_val || 0)
      });
    }
  }

  // Process TAP Register
  const tapRegister = tapRegRows.map(r => ({
    projectId: r.Project_ID,
    month: r.Month || null,
    accountId: r.Account_ID,
    accountName: r.Account_Name,
    bu: r.BU || null,
    vertical: r.Vertical || null,
    projectName: r.Project_Name,
    processName: r.Process_Name || null,
    category: r.Category || null,
    tapLever: r.TAP_Lever || null,
    benefitType: r.Benefit_Type || null,
    currentStage: r.Current_Stage || null,
    sourceStatus: r.Source_Status || 'Open',
    asOfTodayStatus: r.As_Of_Today_Status || 'ACTIVE',
    projectApproval: r.Project_Approval || null,
    actualStartDate: r.Actual_Start_Date || null,
    actualEndDate: r.Actual_End_Date || null,
    expectedEndDate: r.Expected_End_Date || null,
    targetBenefit: Number(r.Target_Benefit || 0),
    realizedBenefit: Number(r.Realized_Benefit || 0),
    realizationPct: r.Realization_Pct !== null ? Number(r.Realization_Pct) : null,
    statusRag: r.Status_RAG || null,
    latestUpdate: r.Latest_Update || null,
    isAtRisk: r.Is_At_Risk === true
  }));

  const totalQaasRecords = Number(qaasSummaryRaw.Total_Records || 0);
  const totalTapProjects = Number(tapSummaryRaw.Total_Projects || 0);

  return {
    reportingContext: {
      latestAvailableMonth: latestAvailableMonthStr,
      latestClosedMonth: latestClosedMonthStr,
      currentOpenMonth: currentOpenMonthStr,
      officialReportingMonth,
      currentSubmissionDeadline: currentSubmissionDeadlineStr,
      selectedTimePeriod: timePeriod,
      startDate: startDateStr,
      endDate: endDateStr,
      monthCount: periodWindow.monthCount,
    },
    scope: {
      accountCount: scopedAccountCount,
      vertical: filters.vertical || null,
      accountId: filters.accountId || null,
      qaLeader: filters.qaLeader || null,
      srDirector: filters.srDirector || null,
      site: filters.site || null,
      lob: filters.lob || null
    },
    currentPortfolio: {
      // QaaS Current Pipeline (Persistent across timePeriods)
      qaasOpenOpportunities: hasAccounts ? Number(qaasSummaryRaw.Open_Count || 0) : 0,
      qaasOpenTargetValue: hasAccounts && totalQaasRecords > 0 && qaasSummaryRaw.Open_Target_Value !== null ? Number(qaasSummaryRaw.Open_Target_Value) : null,
      qaasOpenOpportunityValue: hasAccounts && totalQaasRecords > 0 && qaasSummaryRaw.Open_Opportunity_Value !== null ? Number(qaasSummaryRaw.Open_Opportunity_Value) : null,
      // TAP Current Portfolio (As-Of-Today lifecycle)
      tapActiveProjects: hasAccounts ? Number(tapSummaryRaw.Active_Projects || 0) : 0,
      tapActiveAtRiskProjects: hasAccounts ? Number(tapSummaryRaw.Active_At_Risk_Projects || 0) : 0,
      tapTotalProjects: hasAccounts ? totalTapProjects : 0,
      tapClosedProjects: hasAccounts ? Number(tapSummaryRaw.Closed_Projects || 0) : 0,
      tapPlannedProjects: hasAccounts ? Number(tapSummaryRaw.Planned_Projects || 0) : 0
    },
    qaasSummary: {
      totalRecords: hasAccounts ? totalQaasRecords : 0,
      openCount: hasAccounts ? Number(qaasSummaryRaw.Open_Count || 0) : 0,
      wonCount: hasAccounts ? Number(qaasSummaryRaw.Won_Count || 0) : 0,
      deliveredCount: hasAccounts ? Number(qaasSummaryRaw.Delivered_Count || 0) : 0,
      realizedCount: hasAccounts ? Number(qaasSummaryRaw.Realized_Count || 0) : 0,
      totalTargetValue: hasAccounts && totalQaasRecords > 0 ? Number(qaasSummaryRaw.Total_Target_Value || 0) : null,
      totalOpportunityValue: hasAccounts && totalQaasRecords > 0 ? Number(qaasSummaryRaw.Total_Opportunity_Value || 0) : null,
      valueAchievementPct: hasAccounts && totalQaasRecords > 0 && qaasSummaryRaw.Value_Achievement_Pct !== null ? Number(qaasSummaryRaw.Value_Achievement_Pct) : null,
      realizedTargetValue: hasAccounts && totalQaasRecords > 0 && qaasSummaryRaw.Realized_Target_Value !== null ? Number(qaasSummaryRaw.Realized_Target_Value) : null,
      realizedOpportunityValue: hasAccounts && totalQaasRecords > 0 && qaasSummaryRaw.Realized_Opportunity_Value !== null ? Number(qaasSummaryRaw.Realized_Opportunity_Value) : null,
      realizedAchievementPct: hasAccounts && totalQaasRecords > 0 && qaasSummaryRaw.Realized_Achievement_Pct !== null ? Number(qaasSummaryRaw.Realized_Achievement_Pct) : null
    },
    qaasStatusDistribution: hasAccounts ? qaasStatusDistribution : [],
    qaasStageDistribution: hasAccounts ? qaasStageDistribution : [],
    qaasMonthlyTrend: hasAccounts ? qaasMonthlyTrend : [],
    qaasRegister: hasAccounts ? qaasRegister : [],
    tapSummary: {
      totalProjects: hasAccounts ? totalTapProjects : 0,
      activeProjects: hasAccounts ? Number(tapSummaryRaw.Active_Projects || 0) : 0,
      atRiskProjects: hasAccounts ? Number(tapSummaryRaw.Active_At_Risk_Projects || 0) : 0,
      closedProjects: hasAccounts ? Number(tapSummaryRaw.Closed_Projects || 0) : 0,
      plannedProjects: hasAccounts ? Number(tapSummaryRaw.Planned_Projects || 0) : 0,
      totalTargetBenefit: hasAccounts && totalTapProjects > 0 ? Number(tapSummaryRaw.Total_Target_Benefit || 0) : null,
      recordedRealizedBenefit: hasAccounts && totalTapProjects > 0 ? Number(tapSummaryRaw.Recorded_Realized_Benefit || 0) : null,
      portfolioRealizationPct: hasAccounts && totalTapProjects > 0 && tapSummaryRaw.Portfolio_Realization_Pct !== null ? Number(tapSummaryRaw.Portfolio_Realization_Pct) : null,
      closedRealizationPct: hasAccounts && totalTapProjects > 0 && tapSummaryRaw.Closed_Realization_Pct !== null ? Number(tapSummaryRaw.Closed_Realization_Pct) : null
    },
    tapLeverDistribution: hasAccounts ? tapLeverDistribution : [],
    tapBenefitTypeDistribution: hasAccounts ? tapBenefitTypeDistribution : [],
    tapPeriodActivity: {
      projectsInitiated: hasAccounts ? Number(tapPeriodRaw.Projects_Initiated || 0) : 0,
      projectsCompleted: hasAccounts ? Number(tapPeriodRaw.Projects_Completed || 0) : 0,
      projectsLogged: hasAccounts ? Number(tapPeriodRaw.Projects_Logged || 0) : 0
    },
    tapRegister: hasAccounts ? tapRegister : [],
    commercialContext: {
      billedRevenue: hasAccounts && commSummaryRaw.Billed_Revenue !== null ? Number(commSummaryRaw.Billed_Revenue) : null,
      planRevenue: hasAccounts && commSummaryRaw.Plan_Revenue !== null ? Number(commSummaryRaw.Plan_Revenue) : null,
      revenueAchievementPct: hasAccounts && commSummaryRaw.Revenue_Achievement_Pct !== null ? Number(commSummaryRaw.Revenue_Achievement_Pct) : null,
      penaltyExposureValue: hasAccounts && commSummaryRaw.Penalty_Exposure_Value !== null ? Number(commSummaryRaw.Penalty_Exposure_Value) : null,
      actualPenaltyPaidValue: hasAccounts && commSummaryRaw.Actual_Penalty_Paid_Value !== null ? Number(commSummaryRaw.Actual_Penalty_Paid_Value) : null,
      rewardOpportunityValue: hasAccounts && commSummaryRaw.Reward_Opportunity_Value !== null ? Number(commSummaryRaw.Reward_Opportunity_Value) : null,
      actualRewardEarnedValue: hasAccounts && commSummaryRaw.Actual_Reward_Earned_Value !== null ? Number(commSummaryRaw.Actual_Reward_Earned_Value) : null,
      netCommercialImpact: hasAccounts && commSummaryRaw.Net_Commercial_Impact !== null ? Number(commSummaryRaw.Net_Commercial_Impact) : null
    }
  };
}
