import { getBigQueryClient, getBigQueryConfig, serializeBigQueryValue } from './bigquery';
import { ScopeFilters } from './scopedOverview';

export type ActionsTimePeriod = '3M' | '6M' | 'YTD' | '12M';

export interface ActionsDiagnosticFilters extends ScopeFilters {
  timePeriod?: string;
}

export interface ActionsReportingContext {
  businessTimezone: string;
  currentDate: string;
  selectedPeriod: ActionsTimePeriod;
  periodStartDate: string;
  periodEndDate: string;
}

export interface ActionsScopeSummary {
  totalAccountsInScope: number;
  accountsWithEligibleActions: number;
  accountsWithOpenActions: number;
  accountsWithOverdueActions: number;
  accountsWithHighCritActions: number;
}

export interface ActionsCurrentBacklog {
  totalActionCount: number;
  eligibleActionCount: number;
  futureActionCount: number;
  openActions: number;
  closedActions: number;
  overdueActions: number;
  dueNext7Days: number;
  onTrackOpen: number;
  criticalOpen: number;
  highOpen: number;
  mediumOpen: number;
  highCriticalOpen: number;
  closureRate: number | null;
  closureRateDisplay: string;
  closureRateTarget: null;
  closureRateRag: null;
  averageOpenAgeingDays: number | null;
  oldestOpenAgeingDays: number | null;
  averageClosureEffectivenessClosed: number | null;
  averageClosureEffectivenessDisplay: string;
}

export interface ActionsAgeingDistribution {
  range0To7Days: number;
  range8To15Days: number;
  range16To30Days: number;
  range31To60Days: number;
  range60PlusDays: number;
}

export interface ActionsDistributionRow {
  category: string;
  total: number;
  open: number;
  closed: number;
}

export interface ActionsHistoricalPoint {
  monthKey: string;
  monthLabel: string;
  actionsOpened: number;
  actionsClosed: number;
  netFlow: number;
}

export interface ActionsSelectedPeriodActivity {
  actionsOpened: number;
  actionsClosed: number;
  netFlow: number;
  historicalActivity: ActionsHistoricalPoint[];
}

export interface ActionsAccountRollupRow {
  accountId: string;
  accountName: string;
  vertical: string;
  qaLeader: string;
  srDirector: string;
  site: string;
  lob: string;
  totalActions: number;
  eligibleActions: number;
  openActions: number;
  closedActions: number;
  overdueActions: number;
  dueNext7Days: number;
  highCriticalOpen: number;
  closureRate: number | null;
  closureRateDisplay: string;
  oldestOpenAgeingDays: number | null;
}

export interface ActionRegisterRow {
  actionId: string;
  accountId: string;
  accountName: string;
  vertical: string;
  qaLeader: string;
  site: string;
  lob: string;
  source: string;
  riskType: string;
  action: string;
  owner: string;
  priority: string;
  sourceStatus: string;
  asOfTodayStatus: 'OPEN' | 'CLOSED' | 'FUTURE';
  openDate: string;
  dueDate: string;
  closedDate: string | null;
  currentAgeingDays: number | null;
  closureDurationDays: number | null;
  daysOpenSource: number;
  overdueFlag: boolean;
  closureEffectiveness: number | null;
  evidence: string | null;
  isHighPriority: boolean;
}

export interface ActionsDiagnosticData {
  reportingContext: ActionsReportingContext;
  scopeSummary: ActionsScopeSummary;
  currentBacklog: ActionsCurrentBacklog;
  ageingDistribution: ActionsAgeingDistribution;
  priorityDistribution: ActionsDistributionRow[];
  sourceDistribution: ActionsDistributionRow[];
  selectedPeriodActivity: ActionsSelectedPeriodActivity;
  accountRollup: ActionsAccountRollupRow[];
  actionRegister: ActionRegisterRow[];
}

export function validateActionsTimePeriod(period?: string): ActionsTimePeriod {
  if (!period) return '12M';
  const upper = period.toUpperCase();
  if (['3M', '6M', 'YTD', '12M'].includes(upper)) {
    return upper as ActionsTimePeriod;
  }
  throw new Error(`Invalid timePeriod: "${period}". Supported values are 3M, 6M, YTD, 12M.`);
}

export async function fetchActionsDiagnostic(
  filters: ActionsDiagnosticFilters
): Promise<ActionsDiagnosticData> {
  const timePeriod = validateActionsTimePeriod(filters.timePeriod);
  const bq = getBigQueryClient();
  const { projectId, dataset, location } = getBigQueryConfig();

  // 1. Build Scoped Account CTE with Parameterized Filters
  const whereClauses: string[] = [];
  const queryParams: Record<string, any> = {};

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

  const accountWhere = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // 2. Query 1: Current Backlog, Scope, Ageing, Distributions, Rollup, & Register
  const query1 = `
    WITH scoped_accounts AS (
      SELECT
        m.Account_ID,
        m.Account,
        m.Vertical,
        m.QA_Leader,
        m.Sr_Director,
        m.Site,
        m.LOB
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      ${accountWhere}
    ),
    actions_raw AS (
      SELECT
        a.Action_ID,
        a.Account_ID,
        s.Account AS Account_Name,
        s.Vertical,
        s.QA_Leader,
        s.Sr_Director,
        s.Site,
        s.LOB,
        COALESCE(a.Source, 'Other') AS Source,
        COALESCE(a.Risk_Type, 'Operational') AS Risk_Type,
        COALESCE(a.Action, 'Action item') AS Action,
        COALESCE(a.Owner, 'Unassigned') AS Owner,
        COALESCE(a.Priority, 'Medium') AS Priority,
        COALESCE(a.Status, 'Open') AS Source_Status,
        a.Open_Date,
        a.Due_Date,
        a.Closed_Date,
        a.Days_Open AS Days_Open_Source,
        a.Closure_Effectiveness,
        a.Evidence,
        COALESCE(a.Is_High_Priority, FALSE) AS Is_High_Priority,
        
        -- AS-OF-TODAY DERIVATIONS
        CASE
          WHEN a.Open_Date > CURRENT_DATE('Asia/Kolkata') THEN 'FUTURE'
          WHEN a.Open_Date <= CURRENT_DATE('Asia/Kolkata') AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata')) THEN 'OPEN'
          WHEN a.Closed_Date IS NOT NULL AND a.Closed_Date <= CURRENT_DATE('Asia/Kolkata') THEN 'CLOSED'
          ELSE 'UNKNOWN'
        END AS As_Of_Today_Status,

        CASE
          WHEN a.Open_Date <= CURRENT_DATE('Asia/Kolkata') AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata'))
          THEN DATE_DIFF(CURRENT_DATE('Asia/Kolkata'), a.Open_Date, DAY)
          ELSE NULL
        END AS Current_Ageing_Days,

        CASE
          WHEN a.Closed_Date IS NOT NULL AND a.Closed_Date <= CURRENT_DATE('Asia/Kolkata')
          THEN DATE_DIFF(a.Closed_Date, a.Open_Date, DAY)
          ELSE NULL
        END AS Closure_Duration_Days,

        CASE
          WHEN a.Open_Date <= CURRENT_DATE('Asia/Kolkata') 
               AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata'))
               AND a.Due_Date < CURRENT_DATE('Asia/Kolkata')
          THEN TRUE
          ELSE FALSE
        END AS Overdue_Flag
      FROM \`${projectId}.${dataset}.vw_action_register\` a
      INNER JOIN scoped_accounts s ON a.Account_ID = s.Account_ID
    )
    SELECT
      (SELECT CURRENT_DATE('Asia/Kolkata')) AS Current_Business_Date,
      (SELECT COUNT(*) FROM scoped_accounts) AS Scoped_Account_Count,
      
      -- Backlog Aggregate Summary
      COUNT(a.Action_ID) AS Total_Action_Count,
      COUNTIF(a.As_Of_Today_Status != 'FUTURE') AS Eligible_Action_Count,
      COUNTIF(a.As_Of_Today_Status = 'FUTURE') AS Future_Action_Count,
      COUNTIF(a.As_Of_Today_Status = 'OPEN') AS Open_Actions,
      COUNTIF(a.As_Of_Today_Status = 'CLOSED') AS Closed_Actions,
      
      COUNTIF(a.As_Of_Today_Status = 'OPEN' AND a.Due_Date < CURRENT_DATE('Asia/Kolkata')) AS Overdue_Actions,
      COUNTIF(
        a.As_Of_Today_Status = 'OPEN'
        AND a.Due_Date >= CURRENT_DATE('Asia/Kolkata')
        AND a.Due_Date <= DATE_ADD(CURRENT_DATE('Asia/Kolkata'), INTERVAL 7 DAY)
      ) AS Due_Next_7_Days,
      COUNTIF(
        a.As_Of_Today_Status = 'OPEN'
        AND (a.Due_Date IS NULL OR a.Due_Date > DATE_ADD(CURRENT_DATE('Asia/Kolkata'), INTERVAL 7 DAY))
      ) AS On_Track_Open,
      
      COUNTIF(a.As_Of_Today_Status = 'OPEN' AND a.Priority = 'Critical') AS Critical_Open,
      COUNTIF(a.As_Of_Today_Status = 'OPEN' AND a.Priority = 'High') AS High_Open,
      COUNTIF(a.As_Of_Today_Status = 'OPEN' AND a.Priority = 'Medium') AS Medium_Open,
      COUNTIF(a.As_Of_Today_Status = 'OPEN' AND (a.Priority IN ('Critical', 'High') OR a.Is_High_Priority = TRUE)) AS High_Critical_Open,
      
      -- Closure Rate
      COUNTIF(a.As_Of_Today_Status = 'CLOSED') AS Closure_Numerator,
      COUNTIF(
        a.As_Of_Today_Status != 'FUTURE'
        AND (a.Due_Date <= CURRENT_DATE('Asia/Kolkata') OR (a.Closed_Date IS NOT NULL AND a.Closed_Date <= CURRENT_DATE('Asia/Kolkata')))
      ) AS Closure_Denominator,
      
      -- Ageing Summary
      AVG(CASE WHEN a.As_Of_Today_Status = 'OPEN' THEN a.Current_Ageing_Days END) AS Avg_Open_Ageing_Days,
      MAX(CASE WHEN a.As_Of_Today_Status = 'OPEN' THEN a.Current_Ageing_Days END) AS Oldest_Open_Ageing_Days,
      
      -- Ageing Buckets
      COUNTIF(a.As_Of_Today_Status = 'OPEN' AND a.Current_Ageing_Days BETWEEN 0 AND 7) AS Ageing_0_7,
      COUNTIF(a.As_Of_Today_Status = 'OPEN' AND a.Current_Ageing_Days BETWEEN 8 AND 15) AS Ageing_8_15,
      COUNTIF(a.As_Of_Today_Status = 'OPEN' AND a.Current_Ageing_Days BETWEEN 16 AND 30) AS Ageing_16_30,
      COUNTIF(a.As_Of_Today_Status = 'OPEN' AND a.Current_Ageing_Days BETWEEN 31 AND 60) AS Ageing_31_60,
      COUNTIF(a.As_Of_Today_Status = 'OPEN' AND a.Current_Ageing_Days > 60) AS Ageing_60_Plus,
      
      -- Closure Effectiveness for CLOSED actions only
      AVG(CASE WHEN a.As_Of_Today_Status = 'CLOSED' THEN a.Closure_Effectiveness END) AS Avg_Closure_Effectiveness_Closed
    FROM actions_raw a
  `;

  // 3. Query 2: Detailed Distributions (Priority & Source)
  const queryDistributions = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID FROM \`${projectId}.${dataset}.vw_account_master\` m ${accountWhere}
    ),
    actions_raw AS (
      SELECT
        a.Priority,
        COALESCE(a.Source, 'Other') AS Source,
        CASE
          WHEN a.Open_Date > CURRENT_DATE('Asia/Kolkata') THEN 'FUTURE'
          WHEN a.Open_Date <= CURRENT_DATE('Asia/Kolkata') AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata')) THEN 'OPEN'
          WHEN a.Closed_Date IS NOT NULL AND a.Closed_Date <= CURRENT_DATE('Asia/Kolkata') THEN 'CLOSED'
          ELSE 'UNKNOWN'
        END AS As_Of_Today_Status
      FROM \`${projectId}.${dataset}.vw_action_register\` a
      INNER JOIN scoped_accounts s ON a.Account_ID = s.Account_ID
    )
    SELECT
      'PRIORITY' AS Dist_Type,
      Priority AS Category,
      COUNT(*) AS Total,
      COUNTIF(As_Of_Today_Status = 'OPEN') AS Open_Count,
      COUNTIF(As_Of_Today_Status = 'CLOSED') AS Closed_Count
    FROM actions_raw
    GROUP BY Priority
    UNION ALL
    SELECT
      'SOURCE' AS Dist_Type,
      Source AS Category,
      COUNT(*) AS Total,
      COUNTIF(As_Of_Today_Status = 'OPEN') AS Open_Count,
      COUNTIF(As_Of_Today_Status = 'CLOSED') AS Closed_Count
    FROM actions_raw
    GROUP BY Source
  `;

  // 4. Query 3: Account Rollup
  const queryAccountRollup = `
    WITH scoped_accounts AS (
      SELECT
        m.Account_ID,
        m.Account,
        m.Vertical,
        m.QA_Leader,
        m.Sr_Director,
        m.Site,
        m.LOB
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      ${accountWhere}
    ),
    account_actions AS (
      SELECT
        a.Account_ID,
        COUNT(*) AS Total_Actions,
        COUNTIF(a.Open_Date <= CURRENT_DATE('Asia/Kolkata')) AS Eligible_Actions,
        COUNTIF(a.Open_Date <= CURRENT_DATE('Asia/Kolkata') AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata'))) AS Open_Actions,
        COUNTIF(a.Closed_Date IS NOT NULL AND a.Closed_Date <= CURRENT_DATE('Asia/Kolkata')) AS Closed_Actions,
        COUNTIF(
          a.Open_Date <= CURRENT_DATE('Asia/Kolkata')
          AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata'))
          AND a.Due_Date < CURRENT_DATE('Asia/Kolkata')
        ) AS Overdue_Actions,
        COUNTIF(
          a.Open_Date <= CURRENT_DATE('Asia/Kolkata')
          AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata'))
          AND a.Due_Date >= CURRENT_DATE('Asia/Kolkata')
          AND a.Due_Date <= DATE_ADD(CURRENT_DATE('Asia/Kolkata'), INTERVAL 7 DAY)
        ) AS Due_Next_7_Days,
        COUNTIF(
          a.Open_Date <= CURRENT_DATE('Asia/Kolkata')
          AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata'))
          AND (a.Priority IN ('Critical', 'High') OR a.Is_High_Priority = TRUE)
        ) AS High_Critical_Open,
        COUNTIF(
          a.Open_Date <= CURRENT_DATE('Asia/Kolkata')
          AND (a.Due_Date <= CURRENT_DATE('Asia/Kolkata') OR (a.Closed_Date IS NOT NULL AND a.Closed_Date <= CURRENT_DATE('Asia/Kolkata')))
        ) AS Matured_Denominator,
        MAX(
          CASE
            WHEN a.Open_Date <= CURRENT_DATE('Asia/Kolkata') AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata'))
            THEN DATE_DIFF(CURRENT_DATE('Asia/Kolkata'), a.Open_Date, DAY)
          END
        ) AS Oldest_Open_Ageing_Days
      FROM \`${projectId}.${dataset}.vw_action_register\` a
      GROUP BY a.Account_ID
    )
    SELECT
      s.Account_ID,
      s.Account AS Account_Name,
      s.Vertical,
      s.QA_Leader,
      s.Sr_Director,
      s.Site,
      s.LOB,
      COALESCE(act.Total_Actions, 0) AS Total_Actions,
      COALESCE(act.Eligible_Actions, 0) AS Eligible_Actions,
      COALESCE(act.Open_Actions, 0) AS Open_Actions,
      COALESCE(act.Closed_Actions, 0) AS Closed_Actions,
      COALESCE(act.Overdue_Actions, 0) AS Overdue_Actions,
      COALESCE(act.Due_Next_7_Days, 0) AS Due_Next_7_Days,
      COALESCE(act.High_Critical_Open, 0) AS High_Critical_Open,
      SAFE_DIVIDE(act.Closed_Actions, act.Matured_Denominator) AS Closure_Rate,
      act.Oldest_Open_Ageing_Days
    FROM scoped_accounts s
    LEFT JOIN account_actions act ON s.Account_ID = act.Account_ID
    ORDER BY Open_Actions DESC, Overdue_Actions DESC, s.Account ASC
  `;

  // 5. Query 4: Action Register Rows
  const queryRegister = `
    WITH scoped_accounts AS (
      SELECT
        m.Account_ID,
        m.Account,
        m.Vertical,
        m.QA_Leader,
        m.Sr_Director,
        m.Site,
        m.LOB
      FROM \`${projectId}.${dataset}.vw_account_master\` m
      ${accountWhere}
    )
    SELECT
      a.Action_ID,
      a.Account_ID,
      s.Account AS Account_Name,
      s.Vertical,
      s.QA_Leader,
      s.Site,
      s.LOB,
      COALESCE(a.Source, 'Other') AS Source,
      COALESCE(a.Risk_Type, 'Operational') AS Risk_Type,
      COALESCE(a.Action, 'Action item') AS Action,
      COALESCE(a.Owner, 'Unassigned') AS Owner,
      COALESCE(a.Priority, 'Medium') AS Priority,
      COALESCE(a.Status, 'Open') AS Source_Status,
      CASE
        WHEN a.Open_Date > CURRENT_DATE('Asia/Kolkata') THEN 'FUTURE'
        WHEN a.Open_Date <= CURRENT_DATE('Asia/Kolkata') AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata')) THEN 'OPEN'
        WHEN a.Closed_Date IS NOT NULL AND a.Closed_Date <= CURRENT_DATE('Asia/Kolkata') THEN 'CLOSED'
        ELSE 'UNKNOWN'
      END AS As_Of_Today_Status,
      FORMAT_DATE('%Y-%m-%d', a.Open_Date) AS Open_Date,
      FORMAT_DATE('%Y-%m-%d', a.Due_Date) AS Due_Date,
      FORMAT_DATE('%Y-%m-%d', a.Closed_Date) AS Closed_Date,
      CASE
        WHEN a.Open_Date <= CURRENT_DATE('Asia/Kolkata') AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata'))
        THEN DATE_DIFF(CURRENT_DATE('Asia/Kolkata'), a.Open_Date, DAY)
        ELSE NULL
      END AS Current_Ageing_Days,
      CASE
        WHEN a.Closed_Date IS NOT NULL AND a.Closed_Date <= CURRENT_DATE('Asia/Kolkata')
        THEN DATE_DIFF(a.Closed_Date, a.Open_Date, DAY)
        ELSE NULL
      END AS Closure_Duration_Days,
      COALESCE(a.Days_Open, 0) AS Days_Open_Source,
      CASE
        WHEN a.Open_Date <= CURRENT_DATE('Asia/Kolkata') 
             AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata'))
             AND a.Due_Date < CURRENT_DATE('Asia/Kolkata')
        THEN TRUE
        ELSE FALSE
      END AS Overdue_Flag,
      CASE
        WHEN a.Closed_Date IS NOT NULL AND a.Closed_Date <= CURRENT_DATE('Asia/Kolkata')
        THEN a.Closure_Effectiveness
        ELSE NULL
      END AS Closure_Effectiveness,
      a.Evidence,
      COALESCE(a.Is_High_Priority, FALSE) AS Is_High_Priority
    FROM \`${projectId}.${dataset}.vw_action_register\` a
    INNER JOIN scoped_accounts s ON a.Account_ID = s.Account_ID
    ORDER BY 
      CASE
        WHEN a.Open_Date <= CURRENT_DATE('Asia/Kolkata') AND (a.Closed_Date IS NULL OR a.Closed_Date > CURRENT_DATE('Asia/Kolkata')) THEN 1
        WHEN a.Open_Date > CURRENT_DATE('Asia/Kolkata') THEN 2
        ELSE 3
      END ASC,
      Overdue_Flag DESC,
      Current_Ageing_Days DESC,
      a.Open_Date DESC
  `;

  // 6. Query 5: Selected Period Activity & Monthly Historical Trend
  // Define period start based on timePeriod
  let periodIntervalMonths = 11; // 12M default
  if (timePeriod === '3M') periodIntervalMonths = 2;
  else if (timePeriod === '6M') periodIntervalMonths = 5;

  const periodStartExpression =
    timePeriod === 'YTD'
      ? `DATE_TRUNC(CURRENT_DATE('Asia/Kolkata'), YEAR)`
      : `DATE_SUB(DATE_TRUNC(CURRENT_DATE('Asia/Kolkata'), MONTH), INTERVAL ${periodIntervalMonths} MONTH)`;

  const queryPeriodActivity = `
    WITH scoped_accounts AS (
      SELECT m.Account_ID FROM \`${projectId}.${dataset}.vw_account_master\` m ${accountWhere}
    ),
    actions_scoped AS (
      SELECT
        a.Open_Date,
        a.Closed_Date
      FROM \`${projectId}.${dataset}.vw_action_register\` a
      INNER JOIN scoped_accounts s ON a.Account_ID = s.Account_ID
    ),
    period_bounds AS (
      SELECT
        ${periodStartExpression} AS Period_Start_Date,
        CURRENT_DATE('Asia/Kolkata') AS Period_End_Date
    ),
    months_series AS (
      SELECT m
      FROM period_bounds,
      UNNEST(GENERATE_DATE_ARRAY(DATE_TRUNC(Period_Start_Date, MONTH), DATE_TRUNC(Period_End_Date, MONTH), INTERVAL 1 MONTH)) AS m
    ),
    opened_by_month AS (
      SELECT
        DATE_TRUNC(a.Open_Date, MONTH) AS m,
        COUNT(*) AS opened_count
      FROM actions_scoped a, period_bounds p
      WHERE a.Open_Date >= p.Period_Start_Date AND a.Open_Date <= p.Period_End_Date
      GROUP BY 1
    ),
    closed_by_month AS (
      SELECT
        DATE_TRUNC(a.Closed_Date, MONTH) AS m,
        COUNT(*) AS closed_count
      FROM actions_scoped a, period_bounds p
      WHERE a.Closed_Date >= p.Period_Start_Date AND a.Closed_Date <= p.Period_End_Date
      GROUP BY 1
    )
    SELECT
      (SELECT Period_Start_Date FROM period_bounds) AS Period_Start_Date,
      (SELECT Period_End_Date FROM period_bounds) AS Period_End_Date,
      (
        SELECT COUNT(*)
        FROM actions_scoped a, period_bounds p
        WHERE a.Open_Date >= p.Period_Start_Date AND a.Open_Date <= p.Period_End_Date
      ) AS Total_Opened_In_Period,
      (
        SELECT COUNT(*)
        FROM actions_scoped a, period_bounds p
        WHERE a.Closed_Date >= p.Period_Start_Date AND a.Closed_Date <= p.Period_End_Date
      ) AS Total_Closed_In_Period,
      ARRAY(
        SELECT AS STRUCT
          FORMAT_DATE('%Y-%m', ms.m) AS Month_Key,
          FORMAT_DATE('%b-%y', ms.m) AS Month_Label,
          COALESCE(o.opened_count, 0) AS Actions_Opened,
          COALESCE(c.closed_count, 0) AS Actions_Closed,
          COALESCE(o.opened_count, 0) - COALESCE(c.closed_count, 0) AS Net_Flow
        FROM months_series ms
        LEFT JOIN opened_by_month o ON ms.m = o.m
        LEFT JOIN closed_by_month c ON ms.m = c.m
        ORDER BY ms.m ASC
      ) AS Monthly_Activity
  `;

  // 7. Execute Queries in Parallel
  const [
    [backlogRows],
    [distributionRows],
    [rollupRows],
    [registerRows],
    [periodRows],
  ] = await Promise.all([
    bq.query({ query: query1, params: queryParams, location }),
    bq.query({ query: queryDistributions, params: queryParams, location }),
    bq.query({ query: queryAccountRollup, params: queryParams, location }),
    bq.query({ query: queryRegister, params: queryParams, location }),
    bq.query({ query: queryPeriodActivity, params: queryParams, location }),
  ]);

  const rawBacklog = backlogRows && backlogRows.length > 0 ? backlogRows[0] : null;
  const rawPeriod = periodRows && periodRows.length > 0 ? periodRows[0] : null;

  // Process Reporting Context
  const currentDateStr = rawBacklog?.Current_Business_Date?.value || '2026-08-30';
  const periodStartDateStr = rawPeriod?.Period_Start_Date?.value || '2025-09-01';
  const periodEndDateStr = rawPeriod?.Period_End_Date?.value || currentDateStr;

  const reportingContext: ActionsReportingContext = {
    businessTimezone: 'Asia/Kolkata',
    currentDate: currentDateStr,
    selectedPeriod: timePeriod,
    periodStartDate: periodStartDateStr,
    periodEndDate: periodEndDateStr,
  };

  // Process Scope & Backlog
  const totalActionCount = Number(rawBacklog?.Total_Action_Count || 0);
  const eligibleActionCount = Number(rawBacklog?.Eligible_Action_Count || 0);
  const futureActionCount = Number(rawBacklog?.Future_Action_Count || 0);
  const openActions = Number(rawBacklog?.Open_Actions || 0);
  const closedActions = Number(rawBacklog?.Closed_Actions || 0);
  const overdueActions = Number(rawBacklog?.Overdue_Actions || 0);
  const dueNext7Days = Number(rawBacklog?.Due_Next_7_Days || 0);
  const onTrackOpen = Number(rawBacklog?.On_Track_Open || 0);
  const criticalOpen = Number(rawBacklog?.Critical_Open || 0);
  const highOpen = Number(rawBacklog?.High_Open || 0);
  const mediumOpen = Number(rawBacklog?.Medium_Open || 0);
  const highCriticalOpen = Number(rawBacklog?.High_Critical_Open || 0);

  const closureNum = Number(rawBacklog?.Closure_Numerator || 0);
  const closureDen = Number(rawBacklog?.Closure_Denominator || 0);
  const closureRate = closureDen > 0 ? closureNum / closureDen : null;
  const closureRateDisplay = closureRate !== null ? `${(closureRate * 100).toFixed(1)}%` : 'N/A';

  const avgOpenAgeingDays =
    rawBacklog?.Avg_Open_Ageing_Days !== null && rawBacklog?.Avg_Open_Ageing_Days !== undefined
      ? Math.round(Number(rawBacklog.Avg_Open_Ageing_Days) * 10) / 10
      : null;
  const oldestOpenAgeingDays =
    rawBacklog?.Oldest_Open_Ageing_Days !== null && rawBacklog?.Oldest_Open_Ageing_Days !== undefined
      ? Number(rawBacklog.Oldest_Open_Ageing_Days)
      : null;

  const avgClosureEffClosed =
    rawBacklog?.Avg_Closure_Effectiveness_Closed !== null &&
    rawBacklog?.Avg_Closure_Effectiveness_Closed !== undefined
      ? Number(rawBacklog.Avg_Closure_Effectiveness_Closed)
      : null;
  const avgClosureEffDisplay =
    avgClosureEffClosed !== null ? `${(avgClosureEffClosed * 100).toFixed(1)}%` : 'N/A';

  const currentBacklog: ActionsCurrentBacklog = {
    totalActionCount,
    eligibleActionCount,
    futureActionCount,
    openActions,
    closedActions,
    overdueActions,
    dueNext7Days,
    onTrackOpen,
    criticalOpen,
    highOpen,
    mediumOpen,
    highCriticalOpen,
    closureRate,
    closureRateDisplay,
    closureRateTarget: null,
    closureRateRag: null,
    averageOpenAgeingDays: avgOpenAgeingDays,
    oldestOpenAgeingDays,
    averageClosureEffectivenessClosed: avgClosureEffClosed,
    averageClosureEffectivenessDisplay: avgClosureEffDisplay,
  };

  const ageingDistribution: ActionsAgeingDistribution = {
    range0To7Days: Number(rawBacklog?.Ageing_0_7 || 0),
    range8To15Days: Number(rawBacklog?.Ageing_8_15 || 0),
    range16To30Days: Number(rawBacklog?.Ageing_16_30 || 0),
    range31To60Days: Number(rawBacklog?.Ageing_31_60 || 0),
    range60PlusDays: Number(rawBacklog?.Ageing_60_Plus || 0),
  };

  // Process Distributions (Priority and Source)
  const priorityDistribution: ActionsDistributionRow[] = [];
  const sourceDistribution: ActionsDistributionRow[] = [];

  const allPriorities = ['Critical', 'High', 'Medium'];
  const priorityMap: Record<string, { total: number; open: number; closed: number }> = {};
  for (const p of allPriorities) {
    priorityMap[p] = { total: 0, open: 0, closed: 0 };
  }

  const sourceMap: Record<string, { total: number; open: number; closed: number }> = {};

  (distributionRows || []).forEach((row: any) => {
    const distType = String(row.Dist_Type);
    const cat = String(row.Category);
    const total = Number(row.Total || 0);
    const open = Number(row.Open_Count || 0);
    const closed = Number(row.Closed_Count || 0);

    if (distType === 'PRIORITY') {
      if (priorityMap[cat]) {
        priorityMap[cat] = { total, open, closed };
      } else {
        priorityMap[cat] = { total, open, closed };
      }
    } else if (distType === 'SOURCE') {
      sourceMap[cat] = { total, open, closed };
    }
  });

  for (const p of allPriorities) {
    if (priorityMap[p]) {
      priorityDistribution.push({
        category: p,
        total: priorityMap[p].total,
        open: priorityMap[p].open,
        closed: priorityMap[p].closed,
      });
    }
  }

  const sortedSources = Object.keys(sourceMap).sort((a, b) => sourceMap[b].total - sourceMap[a].total);
  for (const s of sortedSources) {
    sourceDistribution.push({
      category: s,
      total: sourceMap[s].total,
      open: sourceMap[s].open,
      closed: sourceMap[s].closed,
    });
  }

  // Process Account Rollup
  let accountsWithEligibleActions = 0;
  let accountsWithOpenActions = 0;
  let accountsWithOverdueActions = 0;
  let accountsWithHighCritActions = 0;

  const accountRollup: ActionsAccountRollupRow[] = (rollupRows || []).map((row: any) => {
    const el = Number(row.Eligible_Actions || 0);
    const op = Number(row.Open_Actions || 0);
    const ov = Number(row.Overdue_Actions || 0);
    const hc = Number(row.High_Critical_Open || 0);
    const cl = Number(row.Closed_Actions || 0);
    const rateVal = row.Closure_Rate !== null && row.Closure_Rate !== undefined ? Number(row.Closure_Rate) : null;
    const oldestAgeing = row.Oldest_Open_Ageing_Days !== null && row.Oldest_Open_Ageing_Days !== undefined ? Number(row.Oldest_Open_Ageing_Days) : null;

    if (el > 0) accountsWithEligibleActions++;
    if (op > 0) accountsWithOpenActions++;
    if (ov > 0) accountsWithOverdueActions++;
    if (hc > 0) accountsWithHighCritActions++;

    return {
      accountId: String(row.Account_ID),
      accountName: String(row.Account_Name),
      vertical: String(row.Vertical || ''),
      qaLeader: String(row.QA_Leader || ''),
      srDirector: String(row.Sr_Director || ''),
      site: String(row.Site || ''),
      lob: String(row.LOB || ''),
      totalActions: Number(row.Total_Actions || 0),
      eligibleActions: el,
      openActions: op,
      closedActions: cl,
      overdueActions: ov,
      dueNext7Days: Number(row.Due_Next_7_Days || 0),
      highCriticalOpen: hc,
      closureRate: rateVal,
      closureRateDisplay: rateVal !== null ? `${(rateVal * 100).toFixed(1)}%` : 'N/A',
      oldestOpenAgeingDays: oldestAgeing,
    };
  });

  const scopeSummary: ActionsScopeSummary = {
    totalAccountsInScope: Number(rawBacklog?.Scoped_Account_Count || accountRollup.length),
    accountsWithEligibleActions,
    accountsWithOpenActions,
    accountsWithOverdueActions,
    accountsWithHighCritActions,
  };

  // Process Action Register
  const actionRegister: ActionRegisterRow[] = (registerRows || []).map((row: any) => ({
    actionId: String(row.Action_ID),
    accountId: String(row.Account_ID),
    accountName: String(row.Account_Name),
    vertical: String(row.Vertical || ''),
    qaLeader: String(row.QA_Leader || ''),
    site: String(row.Site || ''),
    lob: String(row.LOB || ''),
    source: String(row.Source || 'Other'),
    riskType: String(row.Risk_Type || 'Operational'),
    action: String(row.Action || ''),
    owner: String(row.Owner || 'Unassigned'),
    priority: String(row.Priority || 'Medium'),
    sourceStatus: String(row.Source_Status || 'Open'),
    asOfTodayStatus: row.As_Of_Today_Status as 'OPEN' | 'CLOSED' | 'FUTURE',
    openDate: String(row.Open_Date || ''),
    dueDate: String(row.Due_Date || ''),
    closedDate: row.Closed_Date ? String(row.Closed_Date) : null,
    currentAgeingDays: row.Current_Ageing_Days !== null && row.Current_Ageing_Days !== undefined ? Number(row.Current_Ageing_Days) : null,
    closureDurationDays: row.Closure_Duration_Days !== null && row.Closure_Duration_Days !== undefined ? Number(row.Closure_Duration_Days) : null,
    daysOpenSource: Number(row.Days_Open_Source || 0),
    overdueFlag: Boolean(row.Overdue_Flag),
    closureEffectiveness: row.Closure_Effectiveness !== null && row.Closure_Effectiveness !== undefined ? Number(row.Closure_Effectiveness) : null,
    evidence: row.Evidence ? String(row.Evidence) : null,
    isHighPriority: Boolean(row.Is_High_Priority),
  }));

  // Process Selected Period Activity
  const historicalActivity: ActionsHistoricalPoint[] = (rawPeriod?.Monthly_Activity || []).map((pt: any) => ({
    monthKey: String(pt.Month_Key),
    monthLabel: String(pt.Month_Label),
    actionsOpened: Number(pt.Actions_Opened || 0),
    actionsClosed: Number(pt.Actions_Closed || 0),
    netFlow: Number(pt.Net_Flow || 0),
  }));

  const selectedPeriodActivity: ActionsSelectedPeriodActivity = {
    actionsOpened: Number(rawPeriod?.Total_Opened_In_Period || 0),
    actionsClosed: Number(rawPeriod?.Total_Closed_In_Period || 0),
    netFlow: Number(rawPeriod?.Total_Opened_In_Period || 0) - Number(rawPeriod?.Total_Closed_In_Period || 0),
    historicalActivity,
  };

  return {
    reportingContext,
    scopeSummary,
    currentBacklog,
    ageingDistribution,
    priorityDistribution,
    sourceDistribution,
    selectedPeriodActivity,
    accountRollup,
    actionRegister,
  };
}
