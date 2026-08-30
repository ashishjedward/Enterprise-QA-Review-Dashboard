import { BigQuery } from '@google-cloud/bigquery';
import { getBigQueryClient, getBigQueryConfig, serializeBigQueryValue } from './bigquery';

export const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'Asia/Kolkata';

export interface ScopeFilters {
  vertical?: string;
  qaLeader?: string;
  srDirector?: string;
  accountId?: string;
  site?: string;
  lob?: string;
}

export interface ReportingContext {
  Latest_Available_Month: string;
  Latest_Closed_Month: string;
  Official_Reporting_Month: string;
  Current_Open_Month: string;
  Live_Reporting_Month: string;
  Current_Submission_Deadline: string;
}

export async function fetchReportingContext(bq: BigQuery, projectId: string, dataset: string, location?: string): Promise<ReportingContext> {
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
  try {
    const [rows] = await bq.query({ query, location });
    if (rows && rows[0]) {
      const row = serializeBigQueryValue(rows[0]) as Record<string, unknown>;
      return {
        Latest_Available_Month: (row.Latest_Available_Month as string) || '2026-08-01',
        Latest_Closed_Month: (row.Latest_Closed_Month as string) || '2026-07-01',
        Official_Reporting_Month: (row.Official_Reporting_Month as string) || 'Jul-26',
        Current_Open_Month: (row.Current_Open_Month as string) || '2026-08-01',
        Live_Reporting_Month: (row.Live_Reporting_Month as string) || 'Aug-26',
        Current_Submission_Deadline: (row.Current_Submission_Deadline as string) || '2026-09-05',
      };
    }
  } catch (err) {
    console.error('Error fetching reporting context:', err);
  }
  return {
    Latest_Available_Month: '2026-08-01',
    Latest_Closed_Month: '2026-07-01',
    Official_Reporting_Month: 'Jul-26',
    Current_Open_Month: '2026-08-01',
    Live_Reporting_Month: 'Aug-26',
    Current_Submission_Deadline: '2026-09-05',
  };
}

const DEFAULT_METRIC_META = [
  { Metric_ID: 'M001', Display_Order: 1, Category: 'Enterprise', Category_Sort_Order: 1, Metric: 'Client Sentiment', Metric_Scale: 'SCORE', Default_Target: 4.2, Direction: 'Higher' },
  { Metric_ID: 'M002', Display_Order: 2, Category: 'Process Health', Category_Sort_Order: 2, Metric: 'SLA Achievement', Metric_Scale: 'DECIMAL_PERCENTAGE', Default_Target: 0.95, Direction: 'Higher' },
  { Metric_ID: 'M003', Display_Order: 3, Category: 'Process Health', Category_Sort_Order: 2, Metric: 'RNP Format', Metric_Scale: 'DECIMAL_PERCENTAGE', Default_Target: 0.95, Direction: 'Higher' },
  { Metric_ID: 'M004', Display_Order: 4, Category: 'Process Health', Category_Sort_Order: 2, Metric: 'EURA', Metric_Scale: 'DECIMAL_PERCENTAGE', Default_Target: 0.95, Direction: 'Higher' },
  { Metric_ID: 'M005', Display_Order: 5, Category: 'Process Health', Category_Sort_Order: 2, Metric: 'BEST QM', Metric_Scale: 'INTEGER_PERCENTAGE', Default_Target: 90.0, Direction: 'Higher' },
  { Metric_ID: 'M006', Display_Order: 6, Category: 'Hygiene', Category_Sort_Order: 3, Metric: 'Audit & Feedback', Metric_Scale: 'DECIMAL_PERCENTAGE', Default_Target: 0.95, Direction: 'Higher' },
  { Metric_ID: 'M007', Display_Order: 7, Category: 'Hygiene', Category_Sort_Order: 3, Metric: 'Hygiene Audits', Metric_Scale: 'DECIMAL_PERCENTAGE', Default_Target: 0.96, Direction: 'Higher' },
  { Metric_ID: 'M008', Display_Order: 8, Category: 'Hygiene', Category_Sort_Order: 3, Metric: 'Calibration', Metric_Scale: 'DECIMAL_PERCENTAGE', Default_Target: 0.95, Direction: 'Higher' },
  { Metric_ID: 'M009', Display_Order: 9, Category: 'Hygiene', Category_Sort_Order: 3, Metric: 'ATA Internal', Metric_Scale: 'INTEGER_PERCENTAGE', Default_Target: 95.0, Direction: 'Higher' },
  { Metric_ID: 'M010', Display_Order: 10, Category: 'Hygiene', Category_Sort_Order: 3, Metric: 'ATA External', Metric_Scale: 'INTEGER_PERCENTAGE', Default_Target: 94.0, Direction: 'Higher' },
  { Metric_ID: 'M011', Display_Order: 11, Category: 'QA Team', Category_Sort_Order: 4, Metric: 'QA Utilization', Metric_Scale: 'DECIMAL_PERCENTAGE', Default_Target: 0.90, Direction: 'Higher' },
  { Metric_ID: 'M012', Display_Order: 12, Category: 'QA Team', Category_Sort_Order: 4, Metric: 'QA Attrition', Metric_Scale: 'DECIMAL_PERCENTAGE', Default_Target: 0.10, Direction: 'Lower' },
];

function buildZeroScopeKpiCards() {
  return DEFAULT_METRIC_META.map((m) => ({
    Metric_ID: m.Metric_ID,
    Display_Order: m.Display_Order,
    Category: m.Category,
    Category_Sort_Order: m.Category_Sort_Order,
    Metric: m.Metric,
    Actual_Value: null,
    Actual_Display: null,
    Target_Value: m.Default_Target,
    RAG: null,
    Favourable_Variance: null,
    Accounts_In_Scope: 0,
    Accounts_With_Data: 0,
    Accounts_Without_Data: 0,
    Data_Coverage_Pct: 0,
    Green_Account_Count: 0,
    Amber_Account_Count: 0,
    Red_Account_Count: 0,
  }));
}

function getSupplementalQuery(projectId: string, dataset: string, whereClause: string) {
  return `
    WITH scoped_accounts AS (
      SELECT Account_ID FROM \`${projectId}.${dataset}.vw_account_master\`
      WHERE ${whereClause}
    ),
    reporting_month AS (
      SELECT Latest_Closed_Month FROM \`${projectId}.${dataset}.vw_reporting_context\` LIMIT 1
    ),
    tni_calc AS (
      SELECT
        COUNTIF(t.Is_TNI_Applicable = TRUE) AS TNI_Applicable_Accounts,
        COUNTIF(t.Is_TNI_Applicable = TRUE AND (t.TNI_Status = 'Published' OR t.Published_Date IS NOT NULL)) AS TNI_Published_Accounts,
        SAFE_DIVIDE(
          COUNTIF(t.Is_TNI_Applicable = TRUE AND (t.TNI_Status = 'Published' OR t.Published_Date IS NOT NULL)),
          COUNTIF(t.Is_TNI_Applicable = TRUE)
        ) AS TNI_Published_Pct
      FROM \`${projectId}.${dataset}.vw_tni\` t
      JOIN scoped_accounts acc ON t.Account_ID = acc.Account_ID
      JOIN reporting_month r ON t.Month = r.Latest_Closed_Month
    ),
    mro_calc AS (
      SELECT
        SUM(m.MRO_Completed) AS MRO_Numerator,
        SUM(m.MRO_Target) AS MRO_Denominator,
        SAFE_DIVIDE(SUM(m.MRO_Completed), SUM(m.MRO_Target)) AS MRO_Actual_Value
      FROM \`${projectId}.${dataset}.vw_mro_summary\` m
      JOIN scoped_accounts acc ON m.Account_ID = acc.Account_ID
      JOIN reporting_month r ON m.Month = r.Latest_Closed_Month
    ),
    ideas_calc AS (
      SELECT
        COUNT(1) AS TP_Loves_Ideas_Submissions,
        COUNTIF(i.Is_Accepted = TRUE OR UPPER(TRIM(i.Accepted_Rejected)) = 'ACCEPTED') AS TP_Loves_Ideas_Approved,
        COUNTIF(i.Is_Implemented = TRUE OR UPPER(TRIM(i.Current_Status)) = 'IMPLEMENTED') AS TP_Loves_Ideas_Implemented
      FROM \`${projectId}.${dataset}.vw_tp_loves_ideas\` i
      JOIN scoped_accounts acc ON i.Account_ID = acc.Account_ID
      JOIN reporting_month r ON i.Month = r.Latest_Closed_Month
    ),
    action_base AS (
      SELECT
        a.*,
        CASE
          WHEN a.Open_Date > CURRENT_DATE('${BUSINESS_TIMEZONE}')
            THEN 'FUTURE'
          WHEN a.Open_Date <= CURRENT_DATE('${BUSINESS_TIMEZONE}')
            AND (
              a.Closed_Date IS NULL
              OR a.Closed_Date > CURRENT_DATE('${BUSINESS_TIMEZONE}')
            )
            THEN 'OPEN'
          WHEN a.Closed_Date IS NOT NULL
            AND a.Closed_Date <= CURRENT_DATE('${BUSINESS_TIMEZONE}')
            THEN 'CLOSED'
        END AS As_Of_Today_Status
      FROM \`${projectId}.${dataset}.vw_action_register\` a
      JOIN scoped_accounts acc ON a.Account_ID = acc.Account_ID
    ),
    action_calc AS (
      SELECT
        COUNTIF(As_Of_Today_Status = 'OPEN') AS Open_Actions,
        COUNTIF(
          As_Of_Today_Status = 'OPEN'
          AND Due_Date < CURRENT_DATE('${BUSINESS_TIMEZONE}')
        ) AS Overdue_Actions,
        COUNTIF(
          As_Of_Today_Status = 'OPEN'
          AND (UPPER(Priority) IN ('CRITICAL', 'HIGH') OR Is_High_Priority = TRUE)
        ) AS High_Critical_Actions,
        COUNTIF(
          As_Of_Today_Status = 'OPEN'
          AND Due_Date >= CURRENT_DATE('${BUSINESS_TIMEZONE}')
          AND Due_Date <= DATE_ADD(CURRENT_DATE('${BUSINESS_TIMEZONE}'), INTERVAL 7 DAY)
        ) AS Due_Next_7_Days,
        SAFE_DIVIDE(
          COUNTIF(As_Of_Today_Status = 'CLOSED'),
          COUNTIF(
            Open_Date <= CURRENT_DATE('${BUSINESS_TIMEZONE}')
            AND (
              Due_Date <= CURRENT_DATE('${BUSINESS_TIMEZONE}')
              OR (Closed_Date IS NOT NULL AND Closed_Date <= CURRENT_DATE('${BUSINESS_TIMEZONE}'))
            )
          )
        ) AS Closure_Rate
      FROM action_base
    ),
    qaas_calc AS (
      SELECT
        COUNT(*) AS QAAS_Record_Count,
        COUNTIF(q.Is_Open = TRUE) AS QAAS_Open_Opportunities,

        SUM(q.Target_Value) AS QAAS_Target_Value,
        SUM(q.Revenue_Value) AS QAAS_Program_Value,

        SAFE_DIVIDE(
          SUM(q.Revenue_Value),
          SUM(q.Target_Value)
        ) AS QAAS_Value_Achievement_Pct,

        SUM(
          CASE WHEN q.Is_Open = TRUE
          THEN q.Target_Value
          ELSE NULL END
        ) AS QAAS_Open_Target_Value,

        SUM(
          CASE WHEN q.Is_Open = TRUE
          THEN q.Revenue_Value
          ELSE NULL END
        ) AS QAAS_Open_Opportunity_Value

      FROM \`${projectId}.${dataset}.vw_qaas_revenue\` q
      JOIN scoped_accounts acc
        ON q.Account_ID = acc.Account_ID
    ),
    tap_base AS (
      SELECT
        t.*,
        CASE
          WHEN t.Actual_Start_Date > CURRENT_DATE('${BUSINESS_TIMEZONE}')
            THEN 'PLANNED'
          WHEN t.Actual_Start_Date <= CURRENT_DATE('${BUSINESS_TIMEZONE}')
            AND (
              t.Actual_End_Date IS NULL
              OR t.Actual_End_Date > CURRENT_DATE('${BUSINESS_TIMEZONE}')
            )
            THEN 'ACTIVE'
          WHEN t.Actual_End_Date IS NOT NULL
            AND t.Actual_End_Date <= CURRENT_DATE('${BUSINESS_TIMEZONE}')
            THEN 'CLOSED'
          ELSE 'UNKNOWN'
        END AS As_Of_Today_Status
      FROM \`${projectId}.${dataset}.vw_tap_summary\` t
      JOIN scoped_accounts acc
        ON t.Account_ID = acc.Account_ID
    ),
    tap_calc AS (
      SELECT
        COUNT(*) AS TAP_Total_Projects,

        COUNTIF(
          As_Of_Today_Status = 'ACTIVE'
        ) AS TAP_Active_Projects_Current,

        COUNTIF(
          As_Of_Today_Status = 'ACTIVE'
          AND Is_At_Risk = TRUE
        ) AS TAP_Active_At_Risk_Current,

        COUNTIF(
          As_Of_Today_Status = 'CLOSED'
        ) AS TAP_Closed_Projects_Current,

        COUNTIF(
          As_Of_Today_Status = 'PLANNED'
        ) AS TAP_Planned_Projects_Current,

        SUM(Target_Benefit) AS TAP_Target_Benefit_Current,

        SUM(Realized_Benefit) AS TAP_Recorded_Benefit,

        SAFE_DIVIDE(
          SUM(Realized_Benefit),
          SUM(Target_Benefit)
        ) AS TAP_Portfolio_Realization_Pct

      FROM tap_base
    )
    SELECT
      -- TNI
      t.TNI_Applicable_Accounts,
      t.TNI_Published_Accounts,
      t.TNI_Published_Pct,
      CAST(NULL AS FLOAT64) AS TNI_Target,
      CAST(NULL AS STRING) AS TNI_RAG,

      -- MRO
      m.MRO_Actual_Value,
      CASE
        WHEN m.MRO_Actual_Value IS NULL THEN NULL
        ELSE FORMAT('%.1f%%', m.MRO_Actual_Value * 100)
      END AS MRO_Actual_Display,
      m.MRO_Numerator,
      m.MRO_Denominator,
      CAST(NULL AS FLOAT64) AS MRO_Target,
      CAST(NULL AS STRING) AS MRO_RAG,

      -- TP Loves Ideas
      i.TP_Loves_Ideas_Submissions,
      i.TP_Loves_Ideas_Approved,
      i.TP_Loves_Ideas_Implemented,
      CAST(NULL AS FLOAT64) AS TP_Loves_Ideas_Target,
      CAST(NULL AS STRING) AS TP_Loves_Ideas_RAG,

      -- Action Snapshot
      act.Open_Actions,
      act.Overdue_Actions,
      act.High_Critical_Actions,
      act.Due_Next_7_Days,
      act.Closure_Rate,
      CASE
        WHEN act.Closure_Rate IS NULL THEN NULL
        ELSE FORMAT('%.1f%%', act.Closure_Rate * 100)
      END AS Closure_Rate_Display,
      CAST(NULL AS FLOAT64) AS Closure_Rate_Target,
      CAST(NULL AS STRING) AS Closure_Rate_RAG,

      -- Value Adds Snapshot
      q.QAAS_Record_Count,
      q.QAAS_Open_Opportunities,
      q.QAAS_Target_Value,
      q.QAAS_Program_Value,
      q.QAAS_Value_Achievement_Pct,
      q.QAAS_Open_Target_Value,
      q.QAAS_Open_Opportunity_Value,

      tap.TAP_Total_Projects,
      tap.TAP_Active_Projects_Current AS TAP_Active_Projects,
      tap.TAP_Active_At_Risk_Current AS TAP_Active_At_Risk,
      tap.TAP_Closed_Projects_Current AS TAP_Closed_Projects,
      tap.TAP_Planned_Projects_Current AS TAP_Planned_Projects,
      tap.TAP_Target_Benefit_Current AS TAP_Target_Benefit,
      tap.TAP_Recorded_Benefit,
      tap.TAP_Portfolio_Realization_Pct
    FROM tni_calc t
    CROSS JOIN mro_calc m
    CROSS JOIN ideas_calc i
    CROSS JOIN action_calc act
    CROSS JOIN qaas_calc q
    CROSS JOIN tap_calc tap
  `;
}

function parseSupplementalRow(row: Record<string, unknown> | undefined) {
  if (!row) {
    return {
      Hygiene_Supplemental: {
        TNI_Applicable_Accounts: 0,
        TNI_Published_Accounts: 0,
        TNI_Published_Pct: null,
        TNI_Target: null,
        TNI_RAG: null,
        MRO_Actual_Value: null,
        MRO_Actual_Display: null,
        MRO_Numerator: null,
        MRO_Denominator: null,
        MRO_Target: null,
        MRO_RAG: null,
        TP_Loves_Ideas_Submissions: 0,
        TP_Loves_Ideas_Approved: null,
        TP_Loves_Ideas_Implemented: null,
        TP_Loves_Ideas_Target: null,
        TP_Loves_Ideas_RAG: null,
      },
      Action_Snapshot: {
        Open_Actions: 0,
        Overdue_Actions: 0,
        High_Critical_Actions: 0,
        Due_Next_7_Days: 0,
        Closure_Rate: null,
        Closure_Rate_Display: null,
        Closure_Rate_Target: null,
        Closure_Rate_RAG: null,
      },
      Value_Adds_Snapshot: {
        QAAS_Record_Count: 0,
        QAAS_Open_Opportunities: 0,
        QAAS_Target_Value: null,
        QAAS_Program_Value: null,
        QAAS_Value_Achievement_Pct: null,
        QAAS_Open_Target_Value: null,
        QAAS_Open_Opportunity_Value: null,

        TAP_Total_Projects: 0,
        TAP_Active_Projects: 0,
        TAP_Active_At_Risk: 0,
        TAP_Closed_Projects: 0,
        TAP_Planned_Projects: 0,
        TAP_Target_Benefit: null,
        TAP_Recorded_Benefit: null,
        TAP_Portfolio_Realization_Pct: null,
      },
    };
  }

  return {
    Hygiene_Supplemental: {
      TNI_Applicable_Accounts: Number(row.TNI_Applicable_Accounts ?? 0),
      TNI_Published_Accounts: Number(row.TNI_Published_Accounts ?? 0),
      TNI_Published_Pct: row.TNI_Published_Pct !== null && row.TNI_Published_Pct !== undefined ? Number(row.TNI_Published_Pct) : null,
      TNI_Target: row.TNI_Target !== null && row.TNI_Target !== undefined ? Number(row.TNI_Target) : null,
      TNI_RAG: (row.TNI_RAG as string) || null,

      MRO_Actual_Value: row.MRO_Actual_Value !== null && row.MRO_Actual_Value !== undefined ? Number(row.MRO_Actual_Value) : null,
      MRO_Actual_Display: (row.MRO_Actual_Display as string) || null,
      MRO_Numerator: row.MRO_Numerator !== null && row.MRO_Numerator !== undefined ? Number(row.MRO_Numerator) : null,
      MRO_Denominator: row.MRO_Denominator !== null && row.MRO_Denominator !== undefined ? Number(row.MRO_Denominator) : null,
      MRO_Target: row.MRO_Target !== null && row.MRO_Target !== undefined ? Number(row.MRO_Target) : null,
      MRO_RAG: (row.MRO_RAG as string) || null,

      TP_Loves_Ideas_Submissions: Number(row.TP_Loves_Ideas_Submissions ?? 0),
      TP_Loves_Ideas_Approved: row.TP_Loves_Ideas_Approved !== null && row.TP_Loves_Ideas_Approved !== undefined ? Number(row.TP_Loves_Ideas_Approved) : null,
      TP_Loves_Ideas_Implemented: row.TP_Loves_Ideas_Implemented !== null && row.TP_Loves_Ideas_Implemented !== undefined ? Number(row.TP_Loves_Ideas_Implemented) : null,
      TP_Loves_Ideas_Target: row.TP_Loves_Ideas_Target !== null && row.TP_Loves_Ideas_Target !== undefined ? Number(row.TP_Loves_Ideas_Target) : null,
      TP_Loves_Ideas_RAG: (row.TP_Loves_Ideas_RAG as string) || null,
    },
    Action_Snapshot: {
      Open_Actions: Number(row.Open_Actions ?? 0),
      Overdue_Actions: Number(row.Overdue_Actions ?? 0),
      High_Critical_Actions: Number(row.High_Critical_Actions ?? 0),
      Due_Next_7_Days: Number(row.Due_Next_7_Days ?? 0),
      Closure_Rate: row.Closure_Rate !== null && row.Closure_Rate !== undefined ? Number(row.Closure_Rate) : null,
      Closure_Rate_Display: (row.Closure_Rate_Display as string) || null,
      Closure_Rate_Target: row.Closure_Rate_Target !== null && row.Closure_Rate_Target !== undefined ? Number(row.Closure_Rate_Target) : null,
      Closure_Rate_RAG: (row.Closure_Rate_RAG as string) || null,
    },
    Value_Adds_Snapshot: {
      QAAS_Record_Count: Number(row.QAAS_Record_Count ?? 0),
      QAAS_Open_Opportunities: Number(row.QAAS_Open_Opportunities ?? 0),
      QAAS_Target_Value: row.QAAS_Target_Value !== null && row.QAAS_Target_Value !== undefined ? Number(row.QAAS_Target_Value) : null,
      QAAS_Program_Value: row.QAAS_Program_Value !== null && row.QAAS_Program_Value !== undefined ? Number(row.QAAS_Program_Value) : null,
      QAAS_Value_Achievement_Pct: row.QAAS_Value_Achievement_Pct !== null && row.QAAS_Value_Achievement_Pct !== undefined ? Number(row.QAAS_Value_Achievement_Pct) : null,
      QAAS_Open_Target_Value: row.QAAS_Open_Target_Value !== null && row.QAAS_Open_Target_Value !== undefined ? Number(row.QAAS_Open_Target_Value) : null,
      QAAS_Open_Opportunity_Value: row.QAAS_Open_Opportunity_Value !== null && row.QAAS_Open_Opportunity_Value !== undefined ? Number(row.QAAS_Open_Opportunity_Value) : null,

      TAP_Total_Projects: Number(row.TAP_Total_Projects ?? 0),
      TAP_Active_Projects: Number(row.TAP_Active_Projects ?? 0),
      TAP_Active_At_Risk: Number(row.TAP_Active_At_Risk ?? 0),
      TAP_Closed_Projects: Number(row.TAP_Closed_Projects ?? 0),
      TAP_Planned_Projects: Number(row.TAP_Planned_Projects ?? 0),
      TAP_Target_Benefit: row.TAP_Target_Benefit !== null && row.TAP_Target_Benefit !== undefined ? Number(row.TAP_Target_Benefit) : null,
      TAP_Recorded_Benefit: row.TAP_Recorded_Benefit !== null && row.TAP_Recorded_Benefit !== undefined ? Number(row.TAP_Recorded_Benefit) : null,
      TAP_Portfolio_Realization_Pct: row.TAP_Portfolio_Realization_Pct !== null && row.TAP_Portfolio_Realization_Pct !== undefined ? Number(row.TAP_Portfolio_Realization_Pct) : null,
    },
  };
}

export async function fetchScopedDashboardOverview(filters: ScopeFilters) {
  const bq = getBigQueryClient();
  const { projectId, dataset, location } = getBigQueryConfig();

  const params: Record<string, string> = {};
  const conditions: string[] = [];

  if (filters.vertical && filters.vertical.trim() !== '') {
    conditions.push('Vertical = @vertical');
    params.vertical = filters.vertical.trim();
  }
  if (filters.qaLeader && filters.qaLeader.trim() !== '') {
    conditions.push('QA_Leader = @qaLeader');
    params.qaLeader = filters.qaLeader.trim();
  }
  if (filters.srDirector && filters.srDirector.trim() !== '') {
    conditions.push('Sr_Director = @srDirector');
    params.srDirector = filters.srDirector.trim();
  }
  if (filters.accountId && filters.accountId.trim() !== '') {
    conditions.push('Account_ID = @accountId');
    params.accountId = filters.accountId.trim();
  }
  if (filters.site && filters.site.trim() !== '') {
    conditions.push('Site = @site');
    params.site = filters.site.trim();
  }
  if (filters.lob && filters.lob.trim() !== '') {
    conditions.push('LOB = @lob');
    params.lob = filters.lob.trim();
  }

  // If no filters are provided, query the pre-aggregated semantic overview view for 100% parity
  if (conditions.length === 0) {
    const overviewQuery = `SELECT * FROM \`${projectId}.${dataset}.vw_dashboard_overview\` LIMIT 1`;
    const suppQuery = getSupplementalQuery(projectId, dataset, '1=1');

    const [[overviewRows], [suppRows]] = await Promise.all([
      bq.query({ query: overviewQuery, location }),
      bq.query({ query: suppQuery, location }),
    ]);

    if (!overviewRows || overviewRows.length === 0) {
      throw new Error('Dashboard overview record not found');
    }

    const serialized = serializeBigQueryValue(overviewRows[0]) as Record<string, unknown>;
    const suppData = parseSupplementalRow(
      suppRows && suppRows[0] ? (serializeBigQueryValue(suppRows[0]) as Record<string, unknown>) : undefined
    );

    serialized.Scope = {
      vertical: null,
      qaLeader: null,
      srDirector: null,
      accountId: null,
      site: null,
      lob: null,
      accountCount: serialized.Total_Accounts,
    };

    serialized.Open_Actions = suppData.Action_Snapshot.Open_Actions;
    serialized.Overdue_Actions = suppData.Action_Snapshot.Overdue_Actions;
    serialized.High_Critical_Actions = suppData.Action_Snapshot.High_Critical_Actions;
    serialized.Hygiene_Supplemental = suppData.Hygiene_Supplemental;
    serialized.Action_Snapshot = suppData.Action_Snapshot;
    serialized.Value_Adds_Snapshot = suppData.Value_Adds_Snapshot;

    return serialized;
  }

  const whereClause = conditions.join(' AND ');

  // 1. Verify matching accounts
  const accountsQuery = `
    SELECT Account_ID FROM \`${projectId}.${dataset}.vw_account_master\`
    WHERE ${whereClause}
  `;
  const [accountRows] = await bq.query({ query: accountsQuery, params, location });
  const accountCount = accountRows ? accountRows.length : 0;

  const scopeObject = {
    vertical: filters.vertical || null,
    qaLeader: filters.qaLeader || null,
    srDirector: filters.srDirector || null,
    accountId: filters.accountId || null,
    site: filters.site || null,
    lob: filters.lob || null,
    accountCount,
  };

  // If no accounts match the filter combination (empty scope)
  if (accountCount === 0) {
    const reportingContext = await fetchReportingContext(bq, projectId, dataset, location);
    return {
      ...reportingContext,
      Total_Accounts: 0,
      DBU_Accounts: 0,
      IBU_Accounts: 0,
      Vertical_Count: 0,
      Accounts_With_Red_KPI: 0,
      Accounts_With_Amber_Only: 0,
      Accounts_All_Green_Or_NA: 0,
      Total_Red_KPI_Instances: 0,
      Total_Amber_KPI_Instances: 0,
      Enterprise_Client_Sentiment: null,
      Enterprise_Client_Sentiment_Display: null,
      Enterprise_Client_Sentiment_RAG: null,
      Client_Sentiment_Green_Accounts: 0,
      Client_Sentiment_Amber_Accounts: 0,
      Client_Sentiment_Red_Accounts: 0,
      Critical_Attention_Accounts: 0,
      High_Attention_Accounts: 0,
      Medium_Attention_Accounts: 0,
      Watch_Attention_Accounts: 0,
      Account_Mapped_QA_HC: 0,
      Active_Account_QA_HC: 0,
      B1_QA_Count: 0,
      B2_TL_Count: 0,
      C1_AM_Count: 0,
      C2_Manager_Count: 0,
      Required_QA: null,
      Actual_QA: null,
      Net_Staff_Over_Under: 0,
      Understaffed_Accounts: 0,
      Overstaffed_Accounts: 0,
      Exactly_Staffed_Accounts: 0,
      Open_Actions: 0,
      Overdue_Actions: 0,
      High_Critical_Actions: 0,
      Open_Escalations: 0,
      High_Critical_Escalations: 0,
      Client_Open_Escalations: 0,
      Open_CQM: 0,
      CQM_30_Plus: 0,
      Oldest_Open_CQM_Days: null,
      Open_ZT: 0,
      Client_Open_ZT: 0,
      Open_ZT_HR_Action: 0,
      Oldest_Open_ZT_Days: null,
      Billable_QA_FTE: 0,
      Billed_QA_FTE: 0,
      Billing_Coverage_Pct: null,
      Billed_Revenue: 0,
      Plan_Revenue: 0,
      Revenue_Achievement_Pct: null,
      QAAS_Record_Count: 0,
      QAAS_Open_Count: 0,
      QAAS_Target_Value: 0,
      QAAS_Revenue_Value: 0,
      QAAS_Achievement_Pct: null,
      TAP_Project_Count: 0,
      TAP_Active_Projects: 0,
      TAP_At_Risk_Projects: 0,
      TAP_Closed_Projects: 0,
      TAP_Target_Benefit: 0,
      TAP_Realized_Benefit: 0,
      TAP_Realization_Pct: null,
      Penalty_Exposure_Value: 0,
      Actual_Penalty_Paid_Value: 0,
      Reward_Opportunity_Value: 0,
      Actual_Reward_Earned_Value: 0,
      Net_Commercial_Impact: 0,
      Scope: scopeObject,
      KPI_Cards: buildZeroScopeKpiCards(),
      Attention_Bands: [],
      Top_Attention_Accounts: [],
      ...parseSupplementalRow(undefined),
    };
  }

  // 2. Fetch scoped summary, KPI cards, attention bands, top attention accounts, and supplemental metrics
  const suppQuery = getSupplementalQuery(projectId, dataset, whereClause);
  const summaryQuery = `
    WITH scoped_accounts AS (
      SELECT Account_ID FROM \`${projectId}.${dataset}.vw_account_master\`
      WHERE ${whereClause}
    ),
    acc_scoped AS (
      SELECT a.* FROM \`${projectId}.${dataset}.vw_account_360\` a
      JOIN scoped_accounts s ON a.Account_ID = s.Account_ID
    )
    SELECT
      COUNT(1) as Total_Accounts,
      COUNTIF(BU = 'DBU') as DBU_Accounts,
      COUNTIF(BU = 'IBU') as IBU_Accounts,
      COUNT(DISTINCT Vertical) as Vertical_Count,
      COUNTIF(Red_KPI_Count > 0) as Accounts_With_Red_KPI,
      COUNTIF(Red_KPI_Count = 0 AND Amber_KPI_Count > 0) as Accounts_With_Amber_Only,
      COUNTIF(Red_KPI_Count = 0 AND Amber_KPI_Count = 0) as Accounts_All_Green_Or_NA,
      SUM(Red_KPI_Count) as Total_Red_KPI_Instances,
      SUM(Amber_KPI_Count) as Total_Amber_KPI_Instances,
      AVG(Client_Sentiment) as Enterprise_Client_Sentiment,
      CASE
        WHEN AVG(Client_Sentiment) IS NULL THEN NULL
        ELSE CAST(ROUND(AVG(Client_Sentiment), 1) AS STRING)
      END as Enterprise_Client_Sentiment_Display,
      CASE
        WHEN AVG(Client_Sentiment) IS NULL THEN NULL
        WHEN AVG(Client_Sentiment) >= 4.2 THEN 'Green'
        WHEN AVG(Client_Sentiment) >= 3.6 THEN 'Amber'
        ELSE 'Red'
      END as Enterprise_Client_Sentiment_RAG,
      COUNTIF(Client_Sentiment_RAG = 'Green') as Client_Sentiment_Green_Accounts,
      COUNTIF(Client_Sentiment_RAG = 'Amber') as Client_Sentiment_Amber_Accounts,
      COUNTIF(Client_Sentiment_RAG = 'Red') as Client_Sentiment_Red_Accounts,
      COUNTIF(Attention_Band = 'CRITICAL') as Critical_Attention_Accounts,
      COUNTIF(Attention_Band = 'HIGH') as High_Attention_Accounts,
      COUNTIF(Attention_Band = 'MEDIUM') as Medium_Attention_Accounts,
      COUNTIF(Attention_Band = 'WATCH') as Watch_Attention_Accounts,
      SUM(Account_Mapped_QA_HC) as Account_Mapped_QA_HC,
      SUM(Active_Account_QA_HC) as Active_Account_QA_HC,
      SUM(B1_QA_Count) as B1_QA_Count,
      SUM(B2_TL_Count) as B2_TL_Count,
      SUM(C1_AM_Count) as C1_AM_Count,
      SUM(C2_Manager_Count) as C2_Manager_Count,
      SUM(Required_QA) as Required_QA,
      SUM(Actual_QA) as Actual_QA,
      SUM(Staff_Over_Under) as Net_Staff_Over_Under,
      COUNTIF(Staff_Over_Under < 0) as Understaffed_Accounts,
      COUNTIF(Staff_Over_Under > 0) as Overstaffed_Accounts,
      COUNTIF(Staff_Over_Under = 0) as Exactly_Staffed_Accounts,
      SUM(Open_Action_Count) as Open_Actions,
      SUM(Overdue_Action_Count) as Overdue_Actions,
      SUM(High_Critical_Action_Count) as High_Critical_Actions,
      SUM(Open_Escalation_Count) as Open_Escalations,
      SUM(High_Critical_Escalation_Count) as High_Critical_Escalations,
      SUM(Client_Open_Escalation_Count) as Client_Open_Escalations,
      SUM(Open_CQM_Count) as Open_CQM,
      SUM(CQM_30_Plus_Count) as CQM_30_Plus,
      MAX(Oldest_Open_CQM_Days) as Oldest_Open_CQM_Days,
      SUM(Open_ZT_Count) as Open_ZT,
      SUM(Client_Open_ZT_Count) as Client_Open_ZT,
      SUM(Open_ZT_HR_Action_Count) as Open_ZT_HR_Action,
      MAX(Oldest_Open_ZT_Days) as Oldest_Open_ZT_Days,
      SUM(Billable_QA_FTE) as Billable_QA_FTE,
      SUM(Billed_QA_FTE) as Billed_QA_FTE,
      SAFE_DIVIDE(SUM(Billed_QA_FTE), SUM(Billable_QA_FTE)) as Billing_Coverage_Pct,
      SUM(Billed_Revenue) as Billed_Revenue,
      SUM(Plan_Revenue) as Plan_Revenue,
      SAFE_DIVIDE(SUM(Billed_Revenue), SUM(Plan_Revenue)) as Revenue_Achievement_Pct,
      SUM(QAAS_Record_Count) as QAAS_Record_Count,
      SUM(QAAS_Open_Count) as QAAS_Open_Count,
      SUM(QAAS_Target_Value) as QAAS_Target_Value,
      SUM(QAAS_Revenue_Value) as QAAS_Revenue_Value,
      SAFE_DIVIDE(SUM(QAAS_Revenue_Value), SUM(QAAS_Target_Value)) as QAAS_Achievement_Pct,
      SUM(TAP_Project_Count) as TAP_Project_Count,
      SUM(TAP_Active_Projects) as TAP_Active_Projects,
      SUM(TAP_At_Risk_Projects) as TAP_At_Risk_Projects,
      SUM(TAP_Closed_Projects) as TAP_Closed_Projects,
      SUM(TAP_Target_Benefit) as TAP_Target_Benefit,
      SUM(TAP_Realized_Benefit) as TAP_Realized_Benefit,
      SAFE_DIVIDE(SUM(TAP_Realized_Benefit), SUM(TAP_Target_Benefit)) as TAP_Realization_Pct,
      SUM(Penalty_Exposure_Value) as Penalty_Exposure_Value,
      SUM(Actual_Penalty_Paid_Value) as Actual_Penalty_Paid_Value,
      SUM(Reward_Opportunity_Value) as Reward_Opportunity_Value,
      SUM(Actual_Reward_Earned_Value) as Actual_Reward_Earned_Value,
      SUM(Net_Commercial_Impact) as Net_Commercial_Impact
    FROM acc_scoped
  `;

  const kpiQuery = `
    WITH scoped_accounts AS (
      SELECT Account_ID FROM \`${projectId}.${dataset}.vw_account_master\`
      WHERE ${whereClause}
    ),
    metric_meta AS (
      SELECT 'M001' as Metric_ID, 1 as Display_Order, 'Enterprise' as Category, 1 as Category_Sort_Order, 'Client Sentiment' as Metric, 'SCORE' as Metric_Scale, 4.2 as Default_Target, 'Higher' as Direction UNION ALL
      SELECT 'M002', 2, 'Process Health', 2, 'SLA Achievement', 'DECIMAL_PERCENTAGE', 0.95, 'Higher' UNION ALL
      SELECT 'M003', 3, 'Process Health', 2, 'RNP Format', 'DECIMAL_PERCENTAGE', 0.95, 'Higher' UNION ALL
      SELECT 'M004', 4, 'Process Health', 2, 'EURA', 'DECIMAL_PERCENTAGE', 0.95, 'Higher' UNION ALL
      SELECT 'M005', 5, 'Process Health', 2, 'BEST QM', 'INTEGER_PERCENTAGE', 90.0, 'Higher' UNION ALL
      SELECT 'M006', 6, 'Hygiene', 3, 'Audit & Feedback', 'DECIMAL_PERCENTAGE', 0.95, 'Higher' UNION ALL
      SELECT 'M007', 7, 'Hygiene', 3, 'Hygiene Audits', 'DECIMAL_PERCENTAGE', 0.96, 'Higher' UNION ALL
      SELECT 'M008', 8, 'Hygiene', 3, 'Calibration', 'DECIMAL_PERCENTAGE', 0.95, 'Higher' UNION ALL
      SELECT 'M009', 9, 'Hygiene', 3, 'ATA Internal', 'INTEGER_PERCENTAGE', 95.0, 'Higher' UNION ALL
      SELECT 'M010', 10, 'Hygiene', 3, 'ATA External', 'INTEGER_PERCENTAGE', 94.0, 'Higher' UNION ALL
      SELECT 'M011', 11, 'QA Team', 4, 'QA Utilization', 'DECIMAL_PERCENTAGE', 0.90, 'Higher' UNION ALL
      SELECT 'M012', 12, 'QA Team', 4, 'QA Attrition', 'DECIMAL_PERCENTAGE', 0.10, 'Lower'
    ),
    kpi_base AS (
      SELECT
        k.Metric_ID,
        k.Account_ID,
        k.Actual_Value,
        k.Target_Value,
        k.Numerator_Value,
        k.Denominator_Value,
        k.Effective_RAG
      FROM \`${projectId}.${dataset}.vw_kpi_snapshot_official\` k
      JOIN scoped_accounts s ON k.Account_ID = s.Account_ID
    ),
    kpi_agg AS (
      SELECT
        m.Metric_ID,
        m.Display_Order,
        m.Category,
        m.Category_Sort_Order,
        m.Metric,
        m.Metric_Scale,
        m.Direction,
        
        -- Actual Value weighted or averaged
        CASE
          WHEN m.Metric_ID IN ('M003', 'M004', 'M006', 'M007', 'M011') AND SUM(k.Denominator_Value) > 0
            THEN SUM(k.Numerator_Value) / SUM(k.Denominator_Value)
          WHEN m.Metric_ID = 'M012' AND SUM(k.Denominator_Value) > 0
            THEN (SUM(k.Numerator_Value) / SUM(k.Denominator_Value)) * 12
          ELSE AVG(k.Actual_Value)
        END AS Actual_Value,

        COALESCE(AVG(k.Target_Value), m.Default_Target) AS Target_Value,

        (SELECT COUNT(DISTINCT Account_ID) FROM scoped_accounts) AS Accounts_In_Scope,
        COUNT(DISTINCT CASE WHEN k.Actual_Value IS NOT NULL THEN k.Account_ID END) AS Accounts_With_Data,
        COUNT(DISTINCT CASE WHEN k.Actual_Value IS NULL THEN k.Account_ID END) AS Accounts_Without_Data,
        COUNTIF(k.Effective_RAG = 'Green') AS Green_Account_Count,
        COUNTIF(k.Effective_RAG = 'Amber') AS Amber_Account_Count,
        COUNTIF(k.Effective_RAG = 'Red') AS Red_Account_Count
      FROM metric_meta m
      LEFT JOIN kpi_base k ON m.Metric_ID = k.Metric_ID
      GROUP BY m.Metric_ID, m.Display_Order, m.Category, m.Category_Sort_Order, m.Metric, m.Metric_Scale, m.Direction, m.Default_Target
    )
    SELECT
      Metric_ID,
      Display_Order,
      Category,
      Category_Sort_Order,
      Metric,
      Actual_Value,
      
      CASE
        WHEN Actual_Value IS NULL THEN NULL
        WHEN Metric_Scale = 'DECIMAL_PERCENTAGE' THEN CONCAT(CAST(ROUND(Actual_Value * 100, 1) AS STRING), '%')
        WHEN Metric_Scale = 'INTEGER_PERCENTAGE' THEN CAST(ROUND(Actual_Value, 1) AS STRING)
        WHEN Metric_Scale = 'SCORE' THEN CAST(ROUND(Actual_Value, 1) AS STRING)
        ELSE CAST(ROUND(Actual_Value, 1) AS STRING)
      END AS Actual_Display,

      Target_Value,

      CASE
        WHEN Target_Value IS NULL THEN NULL
        WHEN Metric_Scale = 'DECIMAL_PERCENTAGE' THEN CONCAT(CAST(ROUND(Target_Value * 100, 1) AS STRING), '%')
        WHEN Metric_Scale = 'INTEGER_PERCENTAGE' THEN CAST(ROUND(Target_Value, 1) AS STRING)
        WHEN Metric_Scale = 'SCORE' THEN CAST(ROUND(Target_Value, 1) AS STRING)
        ELSE CAST(ROUND(Target_Value, 1) AS STRING)
      END AS Target_Display,

      CASE
        WHEN Actual_Value IS NULL THEN NULL
        WHEN Metric_ID = 'M001' THEN
          CASE WHEN Actual_Value >= 4.2 THEN 'Green' WHEN Actual_Value >= 3.6 THEN 'Amber' ELSE 'Red' END
        WHEN Metric_ID = 'M002' THEN
          CASE WHEN Actual_Value >= Target_Value THEN 'Green' WHEN Actual_Value >= Target_Value - 0.05 THEN 'Amber' ELSE 'Red' END
        WHEN Metric_ID = 'M003' THEN
          CASE WHEN Actual_Value >= 0.95 THEN 'Green' WHEN Actual_Value >= 0.90 THEN 'Amber' ELSE 'Red' END
        WHEN Metric_ID = 'M004' THEN
          CASE WHEN Actual_Value >= 0.95 THEN 'Green' WHEN Actual_Value >= 0.90 THEN 'Amber' ELSE 'Red' END
        WHEN Metric_ID = 'M005' THEN
          CASE WHEN Actual_Value >= 90.0 THEN 'Green' WHEN Actual_Value >= 85.0 THEN 'Amber' ELSE 'Red' END
        WHEN Metric_ID = 'M006' THEN
          CASE WHEN Actual_Value >= 0.95 THEN 'Green' WHEN Actual_Value >= 0.90 THEN 'Amber' ELSE 'Red' END
        WHEN Metric_ID = 'M007' THEN
          CASE WHEN Actual_Value >= 0.96 THEN 'Green' WHEN Actual_Value >= 0.90 THEN 'Amber' ELSE 'Red' END
        WHEN Metric_ID = 'M008' THEN
          CASE WHEN Actual_Value >= 0.95 THEN 'Green' WHEN Actual_Value >= 0.90 THEN 'Amber' ELSE 'Red' END
        WHEN Metric_ID = 'M009' THEN
          CASE WHEN Actual_Value >= 95.0 THEN 'Green' WHEN Actual_Value >= 90.0 THEN 'Amber' ELSE 'Red' END
        WHEN Metric_ID = 'M010' THEN
          CASE WHEN Actual_Value >= 94.0 THEN 'Green' WHEN Actual_Value >= 90.0 THEN 'Amber' ELSE 'Red' END
        WHEN Metric_ID = 'M011' THEN
          CASE WHEN Actual_Value >= 0.90 THEN 'Green' WHEN Actual_Value >= 0.85 THEN 'Amber' ELSE 'Red' END
        WHEN Metric_ID = 'M012' THEN
          CASE WHEN Actual_Value <= 0.10 THEN 'Green' WHEN Actual_Value <= 0.15 THEN 'Amber' ELSE 'Red' END
        ELSE 'Green'
      END AS RAG,

      CASE
        WHEN Actual_Value IS NULL OR Target_Value IS NULL THEN NULL
        WHEN Direction = 'Lower' THEN (Target_Value - Actual_Value)
        ELSE (Actual_Value - Target_Value)
      END AS Favourable_Variance,

      Accounts_In_Scope,
      Accounts_With_Data,
      (Accounts_In_Scope - Accounts_With_Data) AS Accounts_Without_Data,
      SAFE_DIVIDE(Accounts_With_Data, Accounts_In_Scope) AS Data_Coverage_Pct,
      Green_Account_Count,
      Amber_Account_Count,
      Red_Account_Count
    FROM kpi_agg
    ORDER BY Display_Order
  `;

  const attentionBandsQuery = `
    WITH scoped_accounts AS (
      SELECT Account_ID FROM \`${projectId}.${dataset}.vw_account_master\`
      WHERE ${whereClause}
    ),
    acc_scoped AS (
      SELECT a.* FROM \`${projectId}.${dataset}.vw_account_360\` a
      JOIN scoped_accounts s ON a.Account_ID = s.Account_ID
    )
    SELECT
      Attention_Band,
      COUNT(1) as Account_Count,
      ROUND(AVG(Attention_Score), 1) as Avg_Attention_Score
    FROM acc_scoped
    WHERE Attention_Band IS NOT NULL
    GROUP BY Attention_Band
    ORDER BY
      CASE Attention_Band
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'WATCH' THEN 4
        ELSE 5
      END
  `;

  const topAttentionQuery = `
    WITH scoped_accounts AS (
      SELECT Account_ID FROM \`${projectId}.${dataset}.vw_account_master\`
      WHERE ${whereClause}
    )
    SELECT
      e.Attention_Rank,
      e.Account_ID,
      e.Account_Name,
      e.BU,
      e.Vertical,
      e.QA_Director,
      e.QA_Leader,
      e.Attention_Score,
      e.Attention_Band,
      e.Primary_Attention_Driver,
      e.Red_KPI_Count,
      e.Red_KPIs,
      e.Amber_KPI_Count,
      e.Client_Sentiment_Score,
      e.Client_Sentiment_RAG,
      e.Overdue_Action_Count,
      e.High_Critical_Action_Count,
      e.Open_Escalation_Count,
      e.High_Critical_Escalation_Count,
      e.Open_CQM_Count,
      e.Open_ZT_Count,
      e.Actual_Penalty_Paid_Value
    FROM \`${projectId}.${dataset}.vw_executive_attention\` e
    JOIN scoped_accounts s ON e.Account_ID = s.Account_ID
    ORDER BY e.Attention_Rank, e.Account_Name
    LIMIT 10
  `;

  const [summaryRows, kpiRows, bandRows, topAttRows, suppRows, reportingContext] = await Promise.all([
    bq.query({ query: summaryQuery, params, location }).then(([r]) => r),
    bq.query({ query: kpiQuery, params, location }).then(([r]) => r),
    bq.query({ query: attentionBandsQuery, params, location }).then(([r]) => r),
    bq.query({ query: topAttentionQuery, params, location }).then(([r]) => r),
    bq.query({ query: suppQuery, params, location }).then(([r]) => r),
    fetchReportingContext(bq, projectId, dataset, location),
  ]);

  const summary = (summaryRows && summaryRows[0]) ? (serializeBigQueryValue(summaryRows[0]) as Record<string, unknown>) : {};
  const kpis = (kpiRows || []).map((row) => serializeBigQueryValue(row));
  const bands = (bandRows || []).map((row) => serializeBigQueryValue(row));
  const topAtt = (topAttRows || []).map((row) => serializeBigQueryValue(row));
  const suppData = parseSupplementalRow(
    suppRows && suppRows[0] ? (serializeBigQueryValue(suppRows[0]) as Record<string, unknown>) : undefined
  );

  return {
    ...reportingContext,
    ...summary,
    Open_Actions: suppData.Action_Snapshot.Open_Actions,
    Overdue_Actions: suppData.Action_Snapshot.Overdue_Actions,
    High_Critical_Actions: suppData.Action_Snapshot.High_Critical_Actions,
    Scope: scopeObject,
    KPI_Cards: kpis,
    Attention_Bands: bands,
    Top_Attention_Accounts: topAtt,
    Hygiene_Supplemental: suppData.Hygiene_Supplemental,
    Action_Snapshot: suppData.Action_Snapshot,
    Value_Adds_Snapshot: suppData.Value_Adds_Snapshot,
  };
}
