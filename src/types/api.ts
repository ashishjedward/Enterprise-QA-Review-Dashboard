export interface HealthResponse {
  status: string;
  bigquery: string;
}

export interface ExecutiveKpiCard {
  Metric_ID: string;
  Display_Order: number;
  Category: string;
  Category_Sort_Order: number;
  Metric: string;
  Actual_Value: number | null;
  Actual_Display: string | null;
  Target_Value: number | null;
  Target_Display?: string | null;
  RAG: string | null;
  Favourable_Variance: number | null;
  Accounts_In_Scope: number;
  Accounts_With_Data: number;
  Accounts_Without_Data: number;
  Data_Coverage_Pct: number;
  Green_Account_Count: number;
  Amber_Account_Count: number;
  Red_Account_Count: number;
  Trend_6M?: number[];
}

export interface AttentionBand {
  Attention_Band: string;
  Account_Count: number;
  Avg_Attention_Score: number;
}

export interface TopAttentionAccount {
  Attention_Rank: number;
  Account_ID: string;
  Account_Name: string;
  Account?: string;
  BU: string;
  Vertical: string;
  QA_Director: string;
  QA_Leader: string;
  Site?: string;
  Attention_Score: number;
  Attention_Band: string;
  Priority?: string;
  Primary_Attention_Driver: string;
  Key_Issue?: string;
  Red_KPI_Count: number;
  Red_KPIs: string | null;
  Amber_KPI_Count: number;
  Critical_Issues_Count?: number;
  Client_Sentiment_Score: number;
  Client_Sentiment_RAG: string;
  Overdue_Action_Count: number;
  High_Critical_Action_Count: number;
  Open_Escalation_Count: number;
  High_Critical_Escalation_Count: number;
  Open_CQM_Count: number;
  Open_ZT_Count: number;
  Actual_Penalty_Paid_Value: number;
}

export interface DashboardScopeFilters {
  vertical?: string;
  qaLeader?: string;
  srDirector?: string;
  accountId?: string;
  site?: string;
  lob?: string;
}

export interface DashboardScopeInfo {
  vertical: string | null;
  qaLeader: string | null;
  srDirector: string | null;
  accountId: string | null;
  site: string | null;
  lob: string | null;
  accountCount: number;
}

export interface HygieneSupplemental {
  TNI_Applicable_Accounts: number;
  TNI_Published_Accounts: number;
  TNI_Published_Pct: number | null;
  TNI_Target: number | null;
  TNI_RAG: string | null;

  MRO_Actual_Value: number | null;
  MRO_Actual_Display: string | null;
  MRO_Numerator: number | null;
  MRO_Denominator: number | null;
  MRO_Target: number | null;
  MRO_RAG: string | null;

  TP_Loves_Ideas_Submissions: number;
  TP_Loves_Ideas_Approved: number | null;
  TP_Loves_Ideas_Implemented: number | null;
  TP_Loves_Ideas_Target: number | null;
  TP_Loves_Ideas_RAG: string | null;
}

export interface ActionSnapshot {
  Open_Actions: number;
  Overdue_Actions: number;
  High_Critical_Actions: number;
  Due_Next_7_Days: number;
  Due_Next_7_Days_Actions?: number;
  Total_Actions?: number;
  Closure_Rate: number | null;
  Closure_Rate_Pct?: number | null;
  Closure_Rate_Display: string | null;
  Closure_Rate_Target: number | null;
  Closure_Rate_RAG: string | null;
}

export interface DashboardOverviewData {
  Total_Accounts: number;
  DBU_Accounts: number;
  IBU_Accounts: number;
  Official_Reporting_Month: string;
  Live_Reporting_Month: string;
  Scope?: DashboardScopeInfo;
  KPI_Cards: ExecutiveKpiCard[];
  Attention_Bands: AttentionBand[];
  Top_Attention_Accounts: TopAttentionAccount[];
  Hygiene_Supplemental?: HygieneSupplemental;
  Action_Snapshot?: ActionSnapshot;
  Client_Sentiment_Red_Accounts?: number;
  Client_Sentiment_Amber_Accounts?: number;
  Client_Sentiment_Green_Accounts?: number;
  Enterprise_Client_Sentiment?: number | null;
  Enterprise_Client_Sentiment_Display?: string | null;
  Enterprise_Client_Sentiment_RAG?: string | null;
  Accounts_With_Red_KPI?: number;
  Critical_Attention_Accounts?: number;
  High_Attention_Accounts?: number;
  Total_Actions?: number;
  Open_Actions?: number;
  Overdue_Actions?: number;
  Action_Closure_Rate_Pct?: number | null;
  Billed_Revenue?: number | null;
  Target_Revenue?: number | null;
  Revenue_Achievement_Pct?: number | null;
  Staff_Variance?: number | null;
  Net_Staff_Over_Under?: number | null;
  Hygiene_Inputs?: {
    Audits_Completed_Achievement_Pct?: number | null;
    Hygiene_Audits_Compliance_Pct?: number | null;
    TNI_Published_Pct?: number | null;
    ATA_Calibration_Variance_Pct?: number | null;
  };
  [key: string]: unknown;
}

export interface DashboardOverviewResponse {
  data: DashboardOverviewData;
}

export interface AccountMetadata {
  Account_ID: string;
  Account: string;
  BU: string;
  Vertical: string;
  QA_VP: string;
  Sr_Director: string;
  QA_Director: string;
  QA_Leader: string;
  Site: string;
  LOB: string;
  Process: string;
}

export interface AccountMetadataResponse {
  data: AccountMetadata[];
}

export interface ApiErrorResponse {
  error?: string | {
    message?: string;
  };
  message?: string;
}

// ----------------------------------------------------
// ACCOUNT 360 CONTRACT TYPES
// ----------------------------------------------------

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

export interface ReportingContext {
  Latest_Available_Month: string;
  Latest_Closed_Month: string;
  Official_Reporting_Month: string;
  Current_Open_Month: string;
  Live_Reporting_Month: string;
  Current_Submission_Deadline: string;
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

export interface Account360Response {
  data: Account360Data;
}

export interface ProcessHealthKpiCell {
  Actual_Value: number | null;
  Actual_Display: string | null;
  Target_Value: number | null;
  Target_Display: string | null;
  RAG: string | null;
  Data_Presence_Status: string | null;
}

export interface ProcessHealthMatrixRow {
  Account_ID: string;
  Account_Name: string;
  Vertical: string;
  QA_Leader: string;
  SLA: ProcessHealthKpiCell;
  BEST_QM: ProcessHealthKpiCell;
  EURA: ProcessHealthKpiCell;
  RNP_Format: ProcessHealthKpiCell;
  Open_Escalations: number;
  High_Critical_Escalations: number;
  Open_CQM: number;
  CQM_30_Plus: number;
}

export interface ProcessHealthMatrixData {
  Scope: DashboardScopeInfo;
  Reporting_Context: ReportingContext;
  Rows: ProcessHealthMatrixRow[];
}

export interface ProcessHealthMatrixResponse {
  data: ProcessHealthMatrixData;
}

// ----------------------------------------------------
// SLA Diagnostic Interfaces
// ----------------------------------------------------
export type SlaTimePeriod = '3M' | '6M' | 'YTD' | '12M';

export interface SlaScope {
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

export interface SlaComparison {
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
  byVertical: SlaComparison[];
  byQaLeader: SlaComparison[];
  bySrDirector: SlaComparison[];
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
  Scope: SlaScope;
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

// ----------------------------------------------------
// HYGIENE DIAGNOSTIC TYPES
// ----------------------------------------------------

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
  targetValue: number;
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
  targetValue: number;
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

// ----------------------------------------------------
// QA Team Diagnostic Live Types
// ----------------------------------------------------
export type QaTeamTimePeriod = '3M' | '6M' | 'YTD' | '12M';

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

export interface QaTeamDiagnosticResponse {
  data: QaTeamDiagnosticData;
}

// ----------------------------------------------------
// ACTIONS & CLOSURE MANAGEMENT DIAGNOSTIC TYPES
// ----------------------------------------------------
export type ActionsTimePeriod = '3M' | '6M' | 'YTD' | '12M';

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

export interface ActionsDiagnosticResponse {
  data: ActionsDiagnosticData;
}





