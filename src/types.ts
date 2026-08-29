export type TimePeriod = '3M' | '6M' | 'YTD' | '12M';

export type RAGStatus = 'RED' | 'AMBER' | 'GREEN' | 'Red' | 'Amber' | 'Green';

export type VerticalType = string;
export type QALeaderType = string;
export type SrDirectorType = string;
export type SiteType = string;
export type LOBType = string;

export interface FilterState {
  timePeriod: TimePeriod;
  vertical: string; // 'ALL' or specific vertical
  qaLeader: string; // 'ALL' or specific QA leader
  srDirector: string; // 'ALL' or specific Sr Director
  account: string; // 'ALL' or specific Account
  site: string; // 'ALL' or specific Site
  lob: string; // 'ALL' or specific LOB
}

export interface MetricTrendPoint {
  month: string;
  value: number;
  target?: number;
  isProjected?: boolean;
}

export interface AccountData {
  id: string;
  name: string;
  vertical: VerticalType;
  qaLeader: QALeaderType;
  srDirector: SrDirectorType;
  site: SiteType;
  lob: LOBType;
  clientSentiment: RAGStatus;
  previousSentiment: RAGStatus;
  sentimentScore: number; // 0 - 100
  sentimentReason: string;
  actionRequired: string;
  
  slaScore: number; // e.g. 94.2
  slaTarget: number; // e.g. 95.0
  slaPrevious: number;
  slaRag: RAGStatus;
  penaltyRisk: boolean;
  penaltyAmount?: string;
  
  bestQmScore: number; // e.g. 88.5
  bestQmTarget: number; // e.g. 90.0
  bestQmPrevious: number;
  bestQmRag: RAGStatus;
  
  escalationsCount: number; // e.g. 2
  escalationsTarget: number;
  euraScore: number; // e.g. 91.5
  cqmScore: number; // e.g. 94.0
  rnpFormatScore: number; // e.g. 98.2
  
  auditAchievement: number; // %
  hygieneAuditScore: number; // %
  calibrationScore: number; // %
  tniPublished: boolean;
  ataInternal: number; // %
  ataExternal: number; // %
  mroScore: number; // %
  tpLovesIdeasCount: number;
  
  qaUtilization: number; // %
  qaAttrition: number; // %
  staffVariance: number; // FTE +/-
  
  openActionsCount: number;
  overdueActionsCount: number;
  
  topRisks: string[];
  deteriorationAreas: { area: string; delta: string; rag: RAGStatus }[];
  recommendations: string[];
  
  historicalSla: MetricTrendPoint[];
  historicalBestQm: MetricTrendPoint[];
  
  parameterBreakdown: {
    parameter: string;
    score: number;
    target: number;
    rag: RAGStatus;
    weightage: number;
  }[];
}

export interface ActionItem {
  id: string;
  title: string;
  account: string;
  vertical: VerticalType;
  qaLeader: QALeaderType;
  owner: string;
  dueDate: string;
  status: 'Open' | 'Overdue' | 'Due Soon' | 'Closed';
  priority: 'High' | 'Medium' | 'Low';
  rootCause: string;
  impactArea: string;
  actionType: 'Process' | 'People' | 'Technology' | 'Training';
}

export interface ProcessMetricSummary {
  name: string;
  code: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  variance: number;
  rag: RAGStatus;
  trend: number[];
  drilldownAvailable: boolean;
  detailRoute?: string;
}

export interface HygieneMetricSummary {
  name: string;
  shortLabel?: string;
  currentValue: string;
  suffix?: string;
  trendDirection: 'up' | 'down' | 'stable';
  rag: RAGStatus;
  target?: string;
  targetValue?: string;
  details: string;
}

export interface ValueAddSummary {
  metric: string;
  currentValue: string;
  ytdValue: string;
  trend: string;
  planTarget: string;
  rag: RAGStatus;
  progressPercent: number;
}

export interface InsightItem {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'risk' | 'neutral' | 'action';
  relatedVertical?: VerticalType;
  relatedAccount?: string;
  tag: string;
}

export type ActivePage = 
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
