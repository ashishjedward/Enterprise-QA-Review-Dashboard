import { BigQuery } from '@google-cloud/bigquery';
import { getBigQueryClient, getBigQueryConfig, serializeBigQueryValue } from './bigquery';
import { BUSINESS_TIMEZONE, fetchReportingContext, ReportingContext } from './scopedOverview';

export interface Account360Header {
  Account_ID: string;
  Account_Name: string;
  BU: string | null;
  Vertical: string | null;
  COO: string | null;
  Vertical_Head: string | null;
  QA_VP: string | null;
  Sr_Director: string | null;
  QA_Director: string | null;
  QA_Leader: string | null;
  Site: string | null;
  LOB: string | null;
  Process: string | null;
  Sub_LOB: string | null;
  Risk_Profile: string | null;
  SLA_Target: number | null;
  Official_Reporting_Month: string | null;
}

export interface Account360Kpi {
  Metric_ID: string;
  Display_Order: number;
  Category: string;
  Category_Sort_Order?: number;
  Metric: string;
  Unit?: string | null;
  Metric_Scale?: string | null;
  Actual_Value: number | null;
  Actual_Display: string | null;
  Target_Value: number | null;
  Target_Display: string | null;
  Raw_Variance: number | null;
  Favourable_Variance: number | null;
  Variance: number | null;
  RAG: string | null;
  Data_Presence_Status: string;
  Data_Coverage_Pct?: number | null;
  Is_Higher_Better?: boolean | null;
}

export interface Account360Risk {
  Attention_Score: number;
  Attention_Band: string;
  Attention_Rank: number | null;
  Primary_Attention_Driver: string;
  Red_KPI_Count: number;
  Red_KPIs: string | null;
  Amber_KPI_Count: number;
  Amber_KPIs: string | null;
  Green_KPI_Count: number;
  KPIs_With_Data: number;
  KPIs_Without_Data: number;
  Open_Actions: number;
  Overdue_Actions: number;
  High_Critical_Actions: number;
  Open_Escalations: number;
  High_Critical_Escalations: number;
  Client_Open_Escalations: number;
  Open_CQM: number;
  CQM_30_Plus: number;
  Avg_Open_CQM_Ageing: number | null;
  Oldest_Open_CQM_Days: number | null;
  Open_ZT: number;
  Client_Open_ZT: number;
  Open_ZT_HR_Action: number;
  Oldest_Open_ZT_Days: number | null;
  Penalty_Exposure_Value: number;
  Actual_Penalty_Paid_Value: number;
  Reward_Opportunity_Value: number;
  Actual_Reward_Earned_Value: number;
  Net_Commercial_Impact: number;
}

export interface Account360Action {
  Action_ID: string;
  Account_ID: string;
  Account_Name: string;
  Action: string;
  Category: string | null;
  Risk_Type: string | null;
  Source: string | null;
  Priority: string;
  Owner: string | null;
  Status: string;
  Created_Date: string | null;
  Open_Date: string | null;
  Due_Date: string | null;
  Closure_Date: string | null;
  Closed_Date: string | null;
  Ageing_Days: number | null;
  Days_Open: number | null;
  Overdue_Flag: boolean;
  Remarks: string | null;
  Closure_Effectiveness: string | null;
  Evidence: string | null;
  Is_Active: boolean;
  Is_High_Priority: boolean;
}

export interface Account360Actions {
  Open: Account360Action[];
  Closed: Account360Action[];
}

export interface Account360Escalation {
  Escalation_ID: string;
  Account_ID: string;
  Account_Name: string;
  Type: string | null;
  Escalation_Type: string | null;
  Criticality: string | null;
  Severity: string | null;
  Source: string | null;
  Status: string;
  Escalation_Date: string | null;
  Resolved_Date: string | null;
  Days_Open: number | null;
  RCA: string | null;
  Action_Taken: string | null;
  Is_Open: boolean;
  Is_Closed: boolean;
  Is_Proven: boolean;
  Is_High_Critical: boolean;
  Is_Client_Sourced: boolean;
  Call_Chat_Incident_ID: string | null;
  Content_of_Escalation: string | null;
  Remarks: string | null;
}

export interface Account360Cqm {
  CQM_ID: string;
  Incident_ID: string;
  Account_ID: string;
  Account_Name: string;
  Incident_Date: string | null;
  Feedback_Date: string | null;
  Feedback_Turnaround_Days: number | null;
  Reason_for_CAP: string | null;
  Action_for_CAP: string | null;
  Status: string;
  Ageing_Days: number | null;
  Employee_ID: string | null;
  Employee_Name: string | null;
  Designation: string | null;
  Incident_Chat_Call_ID: string | null;
  Data_Shared_By: string | null;
  Is_Open: boolean;
  Is_Closed: boolean;
  Remarks: string | null;
}

export interface Account360Zt {
  ZT_ID: string;
  Account_ID: string;
  Account_Name: string;
  Interaction_Date: string | null;
  Audit_Date: string | null;
  Audit_Turnaround_Days: number | null;
  Interaction_ID: string | null;
  ZTP_Reason: string | null;
  Action_Proposed: string | null;
  Closure_Status: string | null;
  Closure_Date: string | null;
  End_to_End_Closure_Days: number | null;
  Auditor_Name: string | null;
  EMP_ID: string | null;
  Employee_Name: string | null;
  Source: string | null;
  Call_Chat_Remarks: string | null;
  Action_to_Close_HR_Email: string | null;
  Is_Open: boolean;
  Is_Closed: boolean;
  Is_Client_Identified: boolean;
  Requires_HR_Action: boolean;
  Remarks: string | null;
}

export interface Account360QaTeam {
  Account_Mapped_QA_HC: number;
  Active_Account_QA_HC: number;
  Mapped_QA_HC: number;
  Active_QA_HC: number;
  B1_QA_Count: number;
  B2_TL_Count: number;
  C1_AM_Count: number;
  C2_Manager_Count: number;
  Required_QA: number | null;
  Actual_QA: number | null;
  Net_Staff_Over_Under: number | null;
  Staff_Over_Under: number | null;
  Staffing_RAG: string | null;
  QA_Utilization: number | null;
  QA_Utilization_RAG: string | null;
  QA_Attrition: number | null;
  QA_Attrition_RAG: string | null;
}

export interface Account360Commercial {
  Billable_QA_FTE: number | null;
  Billed_QA_FTE: number | null;
  Billing_Coverage_Pct: number | null;
  Billed_Revenue: number | null;
  Plan_Revenue: number | null;
  Revenue_Achievement_Pct: number | null;
  Billing_RAG: string | null;
  QAAS_Record_Count: number;
  QAAS_Open_Count: number;
  QAAS_Target_Value: number | null;
  QAAS_Revenue_Value: number | null;
  QAAS_Achievement_Pct: number | null;
  TAP_Project_Count: number;
  TAP_Active_Projects: number;
  TAP_At_Risk_Projects: number;
  TAP_Closed_Projects: number;
  TAP_Target_Benefit: number | null;
  TAP_Realized_Benefit: number | null;
  TAP_Realization_Pct: number | null;
  Penalty_Exposure_Value: number;
  Actual_Penalty_Paid_Value: number;
  Reward_Opportunity_Value: number;
  Actual_Reward_Earned_Value: number;
  Net_Commercial_Impact: number;
}

export interface Account360Data {
  Header: Account360Header;
  Reporting_Context: ReportingContext;
  KPIs: Account360Kpi[];
  Risk: Account360Risk;
  Actions: Account360Actions;
  Escalations: Account360Escalation[];
  CQM: Account360Cqm[];
  ZT: Account360Zt[];
  QA_Team: Account360QaTeam;
  Commercial: Account360Commercial;
}

export async function fetchAccount360(accountId: string): Promise<Account360Data | null> {
  const bq = getBigQueryClient();
  const { projectId, dataset, location } = getBigQueryConfig();

  // 1. First fetch base account row from vw_account_360 using parameterized query
  const accountQuery = `
    SELECT *
    FROM \`${projectId}.${dataset}.vw_account_360\`
    WHERE Account_ID = @accountId
    LIMIT 1
  `;

  const [accRows] = await bq.query({
    query: accountQuery,
    params: { accountId },
    types: { accountId: 'STRING' },
    location,
  });

  if (!accRows || accRows.length === 0) {
    return null;
  }

  const accRow = serializeBigQueryValue(accRows[0]) as Record<string, any>;

  // 2. Fetch parallel child datasets: Reporting Context, KPIs, Actions, Escalations, CQM, ZT
  const kpiQuery = `
    SELECT
      s.Metric_ID,
      s.Display_Order,
      s.Category,
      s.Category_Sort_Order,
      s.Metric,
      s.Unit,
      s.Metric_Scale,
      s.Actual_Value,
      s.Actual_Display,
      s.Target_Value,
      s.Target_Display,
      s.Raw_Variance,
      s.Favourable_Variance,
      s.Raw_Variance AS Variance,
      s.Effective_RAG AS RAG,
      s.Data_Presence_Status,
      CAST(NULL AS FLOAT64) AS Data_Coverage_Pct,
      s.Is_Higher_Better
    FROM \`${projectId}.${dataset}.vw_kpi_snapshot_official\` s
    WHERE s.Account_ID = @accountId
    ORDER BY s.Display_Order ASC
  `;

  const actionsQuery = `
    SELECT
      a.Action_ID,
      a.Account_ID,
      a.Account_Name,
      a.Action,
      a.Risk_Type AS Category,
      a.Risk_Type,
      a.Source,
      a.Priority,
      a.Owner,
      a.Status,
      FORMAT_DATE('%Y-%m-%d', a.Open_Date) AS Created_Date,
      FORMAT_DATE('%Y-%m-%d', a.Open_Date) AS Open_Date,
      FORMAT_DATE('%Y-%m-%d', a.Due_Date) AS Due_Date,
      FORMAT_DATE('%Y-%m-%d', a.Closed_Date) AS Closure_Date,
      FORMAT_DATE('%Y-%m-%d', a.Closed_Date) AS Closed_Date,
      a.Days_Open AS Ageing_Days,
      a.Days_Open,
      (a.Overdue_Flag IS TRUE OR (a.Due_Date IS NOT NULL AND a.Due_Date < CURRENT_DATE('${BUSINESS_TIMEZONE}'))) AS Overdue_Flag,
      a.Remarks,
      a.Closure_Effectiveness,
      a.Evidence,
      a.Is_Active,
      a.Is_High_Priority
    FROM \`${projectId}.${dataset}.vw_action_register\` a
    WHERE a.Account_ID = @accountId
    ORDER BY
      CASE WHEN UPPER(a.Status) NOT IN ('CLOSED', 'COMPLETED', 'DONE', 'RESOLVED') THEN 0 ELSE 1 END,
      CASE WHEN (a.Overdue_Flag IS TRUE OR (a.Due_Date IS NOT NULL AND a.Due_Date < CURRENT_DATE('${BUSINESS_TIMEZONE}'))) THEN 0 ELSE 1 END,
      a.Due_Date ASC
  `;

  const escalationsQuery = `
    SELECT
      e.Escalation_ID,
      e.Account_ID,
      e.Account_Name,
      e.Escalation_Type AS Type,
      e.Escalation_Type,
      e.Criticality,
      e.Criticality AS Severity,
      e.Source,
      e.Status,
      FORMAT_DATE('%Y-%m-%d', e.Escalation_Date) AS Escalation_Date,
      FORMAT_DATE('%Y-%m-%d', e.Resolved_Date) AS Resolved_Date,
      e.Days_Open,
      e.RCA,
      e.Action_Taken,
      e.Is_Open,
      e.Is_Closed,
      e.Is_Proven,
      e.Is_High_Critical,
      e.Is_Client_Sourced,
      e.Call_Chat_Incident_ID,
      e.Content_of_Escalation,
      e.Action_Taken AS Remarks
    FROM \`${projectId}.${dataset}.vw_escalations\` e
    WHERE e.Account_ID = @accountId
    ORDER BY
      CASE WHEN e.Is_Open THEN 0 ELSE 1 END,
      e.Escalation_Date DESC
  `;

  const cqmQuery = `
    SELECT
      c.Incident_ID AS CQM_ID,
      c.Incident_ID,
      c.Account_ID,
      c.Account_Name,
      FORMAT_DATE('%Y-%m-%d', c.Incident_Date) AS Incident_Date,
      FORMAT_DATE('%Y-%m-%d', c.Feedback_Date) AS Feedback_Date,
      c.Feedback_Turnaround_Days,
      c.Reason_for_CAP,
      c.Action_for_CAP,
      c.Status,
      c.Ageing_Days,
      c.Employee_ID,
      c.Employee_Name,
      c.Designation,
      c.Incident_Chat_Call_ID,
      c.Data_Shared_By,
      c.Is_Open,
      c.Is_Closed,
      c.Action_for_CAP AS Remarks
    FROM \`${projectId}.${dataset}.vw_cqm_tracker\` c
    WHERE c.Account_ID = @accountId
    ORDER BY
      CASE WHEN c.Is_Open THEN 0 ELSE 1 END,
      c.Ageing_Days DESC,
      c.Incident_Date DESC
  `;

  const ztQuery = `
    SELECT
      z.ZT_ID,
      z.Account_ID,
      z.Account_Name,
      FORMAT_DATE('%Y-%m-%d', z.Interaction_Date) AS Interaction_Date,
      FORMAT_DATE('%Y-%m-%d', z.Audit_Date) AS Audit_Date,
      z.Audit_Turnaround_Days,
      z.Interaction_ID,
      z.ZTP_Reason,
      z.Action_Proposed,
      z.Closure_Status,
      FORMAT_DATE('%Y-%m-%d', z.Closure_Date) AS Closure_Date,
      z.End_to_End_Closure_Days,
      z.Auditor_Name,
      z.EMP_ID,
      z.Employee_Name,
      z.Source,
      z.Call_Chat_Remarks,
      z.Action_to_Close_HR_Email,
      z.Is_Open,
      z.Is_Closed,
      z.Is_Client_Identified,
      z.Requires_HR_Action,
      z.Call_Chat_Remarks AS Remarks
    FROM \`${projectId}.${dataset}.vw_zt_tracker\` z
    WHERE z.Account_ID = @accountId
    ORDER BY
      CASE WHEN z.Is_Open THEN 0 ELSE 1 END,
      z.Interaction_Date DESC
  `;

  const [
    reportingContext,
    [kpiRows],
    [actionRows],
    [escalationRows],
    [cqmRows],
    [ztRows],
  ] = await Promise.all([
    fetchReportingContext(bq, projectId, dataset, location),
    bq.query({ query: kpiQuery, params: { accountId }, types: { accountId: 'STRING' }, location }),
    bq.query({ query: actionsQuery, params: { accountId }, types: { accountId: 'STRING' }, location }),
    bq.query({ query: escalationsQuery, params: { accountId }, types: { accountId: 'STRING' }, location }),
    bq.query({ query: cqmQuery, params: { accountId }, types: { accountId: 'STRING' }, location }),
    bq.query({ query: ztQuery, params: { accountId }, types: { accountId: 'STRING' }, location }),
  ]);

  const serializedKpis = (kpiRows || []).map((row) => serializeBigQueryValue(row)) as Account360Kpi[];
  const serializedActions = (actionRows || []).map((row) => serializeBigQueryValue(row)) as Account360Action[];
  const serializedEscalations = (escalationRows || []).map((row) => serializeBigQueryValue(row)) as Account360Escalation[];
  const serializedCqm = (cqmRows || []).map((row) => serializeBigQueryValue(row)) as Account360Cqm[];
  const serializedZt = (ztRows || []).map((row) => serializeBigQueryValue(row)) as Account360Zt[];

  const openActions = serializedActions.filter((a) => {
    const s = String(a.Status || '').toUpperCase();
    return !['CLOSED', 'COMPLETED', 'DONE', 'RESOLVED'].includes(s);
  });

  const closedActions = serializedActions.filter((a) => {
    const s = String(a.Status || '').toUpperCase();
    return ['CLOSED', 'COMPLETED', 'DONE', 'RESOLVED'].includes(s);
  });

  const header: Account360Header = {
    Account_ID: accRow.Account_ID,
    Account_Name: accRow.Account_Name,
    BU: accRow.BU,
    Vertical: accRow.Vertical,
    COO: accRow.COO,
    Vertical_Head: accRow.Vertical_Head,
    QA_VP: accRow.QA_VP,
    Sr_Director: accRow.Sr_Director,
    QA_Director: accRow.QA_Director,
    QA_Leader: accRow.QA_Leader,
    Site: accRow.Site,
    LOB: accRow.LOB,
    Process: accRow.Process,
    Sub_LOB: accRow.Sub_LOB,
    Risk_Profile: accRow.Risk_Profile,
    SLA_Target: accRow.SLA_Target,
    Official_Reporting_Month: accRow.Official_Reporting_Month || reportingContext.Official_Reporting_Month,
  };

  const risk: Account360Risk = {
    Attention_Score: accRow.Attention_Score ?? 0,
    Attention_Band: accRow.Attention_Band ?? 'WATCH',
    Attention_Rank: accRow.Attention_Rank ?? null,
    Primary_Attention_Driver: accRow.Primary_Attention_Driver ?? 'Routine monitoring',
    Red_KPI_Count: accRow.Red_KPI_Count ?? 0,
    Red_KPIs: accRow.Red_KPIs ?? null,
    Amber_KPI_Count: accRow.Amber_KPI_Count ?? 0,
    Amber_KPIs: accRow.Amber_KPIs ?? null,
    Green_KPI_Count: accRow.Green_KPI_Count ?? 0,
    KPIs_With_Data: accRow.KPIs_With_Data ?? 0,
    KPIs_Without_Data: accRow.KPIs_Without_Data ?? 0,
    Open_Actions: accRow.Open_Action_Count ?? openActions.length,
    Overdue_Actions: accRow.Overdue_Action_Count ?? openActions.filter((a) => a.Overdue_Flag).length,
    High_Critical_Actions: accRow.High_Critical_Action_Count ?? openActions.filter((a) => a.Is_High_Priority).length,
    Open_Escalations: accRow.Open_Escalation_Count ?? serializedEscalations.filter((e) => e.Is_Open).length,
    High_Critical_Escalations: accRow.High_Critical_Escalation_Count ?? serializedEscalations.filter((e) => e.Is_Open && e.Is_High_Critical).length,
    Client_Open_Escalations: accRow.Client_Open_Escalation_Count ?? serializedEscalations.filter((e) => e.Is_Open && e.Is_Client_Sourced).length,
    Open_CQM: accRow.Open_CQM_Count ?? serializedCqm.filter((c) => c.Is_Open).length,
    CQM_30_Plus: accRow.CQM_30_Plus_Count ?? serializedCqm.filter((c) => c.Is_Open && (c.Ageing_Days || 0) >= 30).length,
    Avg_Open_CQM_Ageing: accRow.Avg_Open_CQM_Ageing ?? null,
    Oldest_Open_CQM_Days: accRow.Oldest_Open_CQM_Days ?? null,
    Open_ZT: accRow.Open_ZT_Count ?? serializedZt.filter((z) => z.Is_Open).length,
    Client_Open_ZT: accRow.Client_Open_ZT_Count ?? serializedZt.filter((z) => z.Is_Open && z.Is_Client_Identified).length,
    Open_ZT_HR_Action: accRow.Open_ZT_HR_Action_Count ?? serializedZt.filter((z) => z.Is_Open && z.Requires_HR_Action).length,
    Oldest_Open_ZT_Days: accRow.Oldest_Open_ZT_Days ?? null,
    Penalty_Exposure_Value: accRow.Penalty_Exposure_Value ?? 0,
    Actual_Penalty_Paid_Value: accRow.Actual_Penalty_Paid_Value ?? 0,
    Reward_Opportunity_Value: accRow.Reward_Opportunity_Value ?? 0,
    Actual_Reward_Earned_Value: accRow.Actual_Reward_Earned_Value ?? 0,
    Net_Commercial_Impact: accRow.Net_Commercial_Impact ?? 0,
  };

  const qaTeam: Account360QaTeam = {
    Account_Mapped_QA_HC: accRow.Account_Mapped_QA_HC ?? 0,
    Active_Account_QA_HC: accRow.Active_Account_QA_HC ?? 0,
    Mapped_QA_HC: accRow.Account_Mapped_QA_HC ?? 0,
    Active_QA_HC: accRow.Active_Account_QA_HC ?? 0,
    B1_QA_Count: accRow.B1_QA_Count ?? 0,
    B2_TL_Count: accRow.B2_TL_Count ?? 0,
    C1_AM_Count: accRow.C1_AM_Count ?? 0,
    C2_Manager_Count: accRow.C2_Manager_Count ?? 0,
    Required_QA: accRow.Required_QA ?? null,
    Actual_QA: accRow.Actual_QA ?? null,
    Net_Staff_Over_Under: accRow.Staff_Over_Under ?? null,
    Staff_Over_Under: accRow.Staff_Over_Under ?? null,
    Staffing_RAG: accRow.Staffing_RAG ?? null,
    QA_Utilization: accRow.QA_Utilization ?? null,
    QA_Utilization_RAG: accRow.QA_Utilization_RAG ?? null,
    QA_Attrition: accRow.QA_Attrition ?? null,
    QA_Attrition_RAG: accRow.QA_Attrition_RAG ?? null,
  };

  const commercial: Account360Commercial = {
    Billable_QA_FTE: accRow.Billable_QA_FTE ?? null,
    Billed_QA_FTE: accRow.Billed_QA_FTE ?? null,
    Billing_Coverage_Pct: accRow.Billing_Coverage_Pct ?? null,
    Billed_Revenue: accRow.Billed_Revenue ?? null,
    Plan_Revenue: accRow.Plan_Revenue ?? null,
    Revenue_Achievement_Pct: accRow.Revenue_Achievement_Pct ?? null,
    Billing_RAG: accRow.Billing_RAG ?? null,
    QAAS_Record_Count: accRow.QAAS_Record_Count ?? 0,
    QAAS_Open_Count: accRow.QAAS_Open_Count ?? 0,
    QAAS_Target_Value: accRow.QAAS_Target_Value ?? null,
    QAAS_Revenue_Value: accRow.QAAS_Revenue_Value ?? null,
    QAAS_Achievement_Pct: accRow.QAAS_Achievement_Pct ?? null,
    TAP_Project_Count: accRow.TAP_Project_Count ?? 0,
    TAP_Active_Projects: accRow.TAP_Active_Projects ?? 0,
    TAP_At_Risk_Projects: accRow.TAP_At_Risk_Projects ?? 0,
    TAP_Closed_Projects: accRow.TAP_Closed_Projects ?? 0,
    TAP_Target_Benefit: accRow.TAP_Target_Benefit ?? null,
    TAP_Realized_Benefit: accRow.TAP_Realized_Benefit ?? null,
    TAP_Realization_Pct: accRow.TAP_Realization_Pct ?? null,
    Penalty_Exposure_Value: accRow.Penalty_Exposure_Value ?? 0,
    Actual_Penalty_Paid_Value: accRow.Actual_Penalty_Paid_Value ?? 0,
    Reward_Opportunity_Value: accRow.Reward_Opportunity_Value ?? 0,
    Actual_Reward_Earned_Value: accRow.Actual_Reward_Earned_Value ?? 0,
    Net_Commercial_Impact: accRow.Net_Commercial_Impact ?? 0,
  };

  return {
    Header: header,
    Reporting_Context: reportingContext,
    KPIs: serializedKpis,
    Risk: risk,
    Actions: {
      Open: openActions,
      Closed: closedActions,
    },
    Escalations: serializedEscalations,
    CQM: serializedCqm,
    ZT: serializedZt,
    QA_Team: qaTeam,
    Commercial: commercial,
  };
}
