import React, { createContext, useContext, useState, useMemo, useEffect, useRef, ReactNode } from 'react';
import { 
  FilterState, 
  TimePeriod, 
  AccountData, 
  ActionItem, 
  ActivePage, 
  RAGStatus, 
  VerticalType, 
  QALeaderType, 
  SrDirectorType, 
  SiteType, 
  LOBType, 
  InsightItem 
} from '../types';
import { useDashboardData } from './DashboardDataContext';
import { AccountMetadata, DashboardScopeFilters, TopAttentionAccount, ExecutiveKpiCard } from '../types/api';

export type DrawerType = 
  | null
  | 'sentiment-red'
  | 'sentiment-amber'
  | 'sentiment-green'
  | 'sentiment-all'
  | 'hygiene'
  | 'attention'
  | 'qa-team'
  | 'ask-gemini';

export interface DropdownAccount {
  id: string;
  name: string;
  vertical?: string;
  qaLeader?: string;
  srDirector?: string;
  site?: string;
  lob?: string;
}

interface FilterContextType {
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: string) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  
  // Cascaded dropdown options from live metadata
  availableVerticals: VerticalType[];
  availableQaLeaders: QALeaderType[];
  availableSrDirectors: SrDirectorType[];
  availableAccounts: (DropdownAccount | AccountData)[];
  availableSites: SiteType[];
  availableLobs: LOBType[];
  
  // Filtered Datasets
  filteredAccounts: AccountData[];
  filteredActions: ActionItem[];
  
  // Aggregated Executive Metrics (for legacy detail pages)
  overallSla: number;
  overallSlaTarget: number;
  overallSlaVariance: number;
  overallSlaRag: RAGStatus;
  
  overallBestQm: number;
  overallBestQmTarget: number;
  overallBestQmVariance: number;
  overallBestQmRag: RAGStatus;

  overallQaUtilisation: number;
  overallQaUtilisationTarget: number;
  overallQaUtilisationRag: RAGStatus;

  overallHygiene: number;
  overallHygieneTarget: number;
  overallHygieneRag: RAGStatus;

  overallRnp: number;
  overallRnpTarget: number;
  overallRnpRag: RAGStatus;

  overallEura: number;
  overallEuraTarget: number;
  overallEuraRag: RAGStatus;

  overallCqm: number;
  overallCqmTarget: number;
  overallCqmRag: RAGStatus;

  overallValueDelivered: number;
  overallValueDeliveredTarget: number;
  overallValueDeliveredRag: RAGStatus;

  totalStaffVariance: number;
  overallQaAttrition: number;
  closureEffectiveness: number;
  closureEffectivenessTarget: number;

  keyInsights: InsightItem[];
  
  sentimentBreakdown: {
    redCount: number;
    redPct: number;
    amberCount: number;
    amberPct: number;
    greenCount: number;
    greenPct: number;
    overallRag: RAGStatus;
    total: number;
  };
  
  highRiskAccountsCount: number;
  penaltyRiskAccounts: AccountData[];
  metricsOnTargetCount: number;
  totalTrackedMetrics: number;
  
  // Navigation & Drilldown State
  activePage: ActivePage;
  selectedAccountId: string | null;
  selectedAccount: AccountData | null;
  activeDrawer: DrawerType;
  
  navigateToPage: (page: ActivePage, accountId?: string) => void;
  openDrawer: (drawer: DrawerType) => void;
  closeDrawer: () => void;
  selectAccountAndNavigate: (accountId: string) => void;
  
  // UI Refresh indicator
  lastUpdated: string;
  isRefreshing: boolean;
  refreshDashboard: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  timePeriod: '6M',
  vertical: 'ALL',
  qaLeader: 'ALL',
  srDirector: 'ALL',
  account: 'ALL',
  site: 'ALL',
  lob: 'ALL',
};

// Helper function to sanitize cascading filters against accountMetadata
function sanitizeCascadingFilters(
  state: FilterState, 
  metadata: AccountMetadata[] | null
): FilterState {
  if (!metadata || metadata.length === 0) {
    return state;
  }

  const result = { ...state };

  const matchesFilter = (
    acc: AccountMetadata, 
    filterKeys: (keyof FilterState)[]
  ) => {
    for (const key of filterKeys) {
      if (key === 'vertical' && result.vertical !== 'ALL' && acc.Vertical !== result.vertical) return false;
      if (key === 'qaLeader' && result.qaLeader !== 'ALL' && acc.QA_Leader !== result.qaLeader) return false;
      if (key === 'srDirector' && result.srDirector !== 'ALL' && acc.Sr_Director !== result.srDirector) return false;
      if (key === 'site' && result.site !== 'ALL' && acc.Site !== result.site) return false;
      if (key === 'lob' && result.lob !== 'ALL' && acc.LOB !== result.lob) return false;
      if (key === 'account' && result.account !== 'ALL' && acc.Account_ID !== result.account && acc.Account !== result.account) return false;
    }
    return true;
  };

  // Check QA Leader compatibility
  if (result.qaLeader !== 'ALL') {
    const isCompatible = metadata.some(
      (a) => a.QA_Leader === result.qaLeader && matchesFilter(a, ['vertical', 'srDirector', 'site', 'lob'])
    );
    if (!isCompatible) {
      result.qaLeader = 'ALL';
    }
  }

  // Check Sr Director compatibility
  if (result.srDirector !== 'ALL') {
    const isCompatible = metadata.some(
      (a) => a.Sr_Director === result.srDirector && matchesFilter(a, ['vertical', 'qaLeader', 'site', 'lob'])
    );
    if (!isCompatible) {
      result.srDirector = 'ALL';
    }
  }

  // Check Site compatibility
  if (result.site !== 'ALL') {
    const isCompatible = metadata.some(
      (a) => a.Site === result.site && matchesFilter(a, ['vertical', 'qaLeader', 'srDirector', 'lob'])
    );
    if (!isCompatible) {
      result.site = 'ALL';
    }
  }

  // Check LOB compatibility
  if (result.lob !== 'ALL') {
    const isCompatible = metadata.some(
      (a) => a.LOB === result.lob && matchesFilter(a, ['vertical', 'qaLeader', 'srDirector', 'site'])
    );
    if (!isCompatible) {
      result.lob = 'ALL';
    }
  }

  // Check Account compatibility
  if (result.account !== 'ALL') {
    const isCompatible = metadata.some(
      (a) => (a.Account_ID === result.account || a.Account === result.account) && 
             matchesFilter(a, ['vertical', 'qaLeader', 'srDirector', 'site', 'lob'])
    );
    if (!isCompatible) {
      result.account = 'ALL';
    }
  }

  return result;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { 
    accountMetadata, 
    overview, 
    fetchScopedOverview, 
    refresh, 
    isRefreshing 
  } = useDashboardData();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activePage, setActivePage] = useState<ActivePage>('overview');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('10:30 AM IST');

  // Track initial mount so we don't double fetch on boot
  const isFirstMount = useRef(true);

  const setFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value };
      return sanitizeCascadingFilters(updated, accountMetadata);
    });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Sync filter changes with the backend scoped overview endpoint
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const scopeFilters: DashboardScopeFilters = {};
    if (filters.vertical && filters.vertical !== 'ALL') scopeFilters.vertical = filters.vertical;
    if (filters.qaLeader && filters.qaLeader !== 'ALL') scopeFilters.qaLeader = filters.qaLeader;
    if (filters.srDirector && filters.srDirector !== 'ALL') scopeFilters.srDirector = filters.srDirector;
    if (filters.account && filters.account !== 'ALL') scopeFilters.accountId = filters.account;
    if (filters.site && filters.site !== 'ALL') scopeFilters.site = filters.site;
    if (filters.lob && filters.lob !== 'ALL') scopeFilters.lob = filters.lob;

    fetchScopedOverview(scopeFilters);
  }, [
    filters.vertical, 
    filters.qaLeader, 
    filters.srDirector, 
    filters.account, 
    filters.site, 
    filters.lob, 
    fetchScopedOverview
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.timePeriod !== '6M') count++;
    if (filters.vertical !== 'ALL') count++;
    if (filters.qaLeader !== 'ALL') count++;
    if (filters.srDirector !== 'ALL') count++;
    if (filters.account !== 'ALL') count++;
    if (filters.site !== 'ALL') count++;
    if (filters.lob !== 'ALL') count++;
    return count;
  }, [filters]);

  // Derived available options for dropdowns based on mutual compatibility from live metadata
  const availableVerticals = useMemo(() => {
    if (!accountMetadata || accountMetadata.length === 0) {
      return [];
    }
    const matching = accountMetadata.filter((a) => {
      if (filters.qaLeader !== 'ALL' && a.QA_Leader !== filters.qaLeader) return false;
      if (filters.srDirector !== 'ALL' && a.Sr_Director !== filters.srDirector) return false;
      if (filters.site !== 'ALL' && a.Site !== filters.site) return false;
      if (filters.lob !== 'ALL' && a.LOB !== filters.lob) return false;
      return true;
    });
    const set = new Set(matching.map((a) => a.Vertical).filter(Boolean));
    return Array.from(set).sort();
  }, [accountMetadata, filters.qaLeader, filters.srDirector, filters.site, filters.lob]);

  const availableQaLeaders = useMemo(() => {
    if (!accountMetadata || accountMetadata.length === 0) {
      return [];
    }
    const matching = accountMetadata.filter((a) => {
      if (filters.vertical !== 'ALL' && a.Vertical !== filters.vertical) return false;
      if (filters.srDirector !== 'ALL' && a.Sr_Director !== filters.srDirector) return false;
      if (filters.site !== 'ALL' && a.Site !== filters.site) return false;
      if (filters.lob !== 'ALL' && a.LOB !== filters.lob) return false;
      return true;
    });
    const set = new Set(matching.map((a) => a.QA_Leader).filter(Boolean));
    return Array.from(set).sort();
  }, [accountMetadata, filters.vertical, filters.srDirector, filters.site, filters.lob]);

  const availableSrDirectors = useMemo(() => {
    if (!accountMetadata || accountMetadata.length === 0) {
      return [];
    }
    const matching = accountMetadata.filter((a) => {
      if (filters.vertical !== 'ALL' && a.Vertical !== filters.vertical) return false;
      if (filters.qaLeader !== 'ALL' && a.QA_Leader !== filters.qaLeader) return false;
      if (filters.site !== 'ALL' && a.Site !== filters.site) return false;
      if (filters.lob !== 'ALL' && a.LOB !== filters.lob) return false;
      return true;
    });
    const set = new Set(matching.map((a) => a.Sr_Director).filter(Boolean));
    return Array.from(set).sort();
  }, [accountMetadata, filters.vertical, filters.qaLeader, filters.site, filters.lob]);

  const availableAccounts = useMemo(() => {
    if (!accountMetadata || accountMetadata.length === 0) {
      return [];
    }
    const matching = accountMetadata.filter((a) => {
      if (filters.vertical !== 'ALL' && a.Vertical !== filters.vertical) return false;
      if (filters.qaLeader !== 'ALL' && a.QA_Leader !== filters.qaLeader) return false;
      if (filters.srDirector !== 'ALL' && a.Sr_Director !== filters.srDirector) return false;
      if (filters.site !== 'ALL' && a.Site !== filters.site) return false;
      if (filters.lob !== 'ALL' && a.LOB !== filters.lob) return false;
      return true;
    });
    return matching
      .map((a) => ({
        id: a.Account_ID,
        name: a.Account,
        vertical: a.Vertical,
        qaLeader: a.QA_Leader,
        srDirector: a.Sr_Director,
        site: a.Site,
        lob: a.LOB,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accountMetadata, filters.vertical, filters.qaLeader, filters.srDirector, filters.site, filters.lob]);

  const availableSites = useMemo(() => {
    if (!accountMetadata || accountMetadata.length === 0) {
      return [];
    }
    const matching = accountMetadata.filter((a) => {
      if (filters.vertical !== 'ALL' && a.Vertical !== filters.vertical) return false;
      if (filters.qaLeader !== 'ALL' && a.QA_Leader !== filters.qaLeader) return false;
      if (filters.srDirector !== 'ALL' && a.Sr_Director !== filters.srDirector) return false;
      if (filters.lob !== 'ALL' && a.LOB !== filters.lob) return false;
      return true;
    });
    const set = new Set(matching.map((a) => a.Site).filter(Boolean));
    return Array.from(set).sort();
  }, [accountMetadata, filters.vertical, filters.qaLeader, filters.srDirector, filters.lob]);

  const availableLobs = useMemo(() => {
    if (!accountMetadata || accountMetadata.length === 0) {
      return [];
    }
    const matching = accountMetadata.filter((a) => {
      if (filters.vertical !== 'ALL' && a.Vertical !== filters.vertical) return false;
      if (filters.qaLeader !== 'ALL' && a.QA_Leader !== filters.qaLeader) return false;
      if (filters.srDirector !== 'ALL' && a.Sr_Director !== filters.srDirector) return false;
      if (filters.site !== 'ALL' && a.Site !== filters.site) return false;
      return true;
    });
    const set = new Set(matching.map((a) => a.LOB).filter(Boolean));
    return Array.from(set).sort();
  }, [accountMetadata, filters.vertical, filters.qaLeader, filters.srDirector, filters.site]);

  // Filtered Accounts for in-scope accounts derived from live accountMetadata and overview
  const filteredAccounts = useMemo<AccountData[]>(() => {
    if (!accountMetadata || accountMetadata.length === 0) return [];
    
    const matching = accountMetadata.filter((a) => {
      if (filters.vertical !== 'ALL' && a.Vertical !== filters.vertical) return false;
      if (filters.qaLeader !== 'ALL' && a.QA_Leader !== filters.qaLeader) return false;
      if (filters.srDirector !== 'ALL' && a.Sr_Director !== filters.srDirector) return false;
      if (filters.account !== 'ALL' && a.Account_ID !== filters.account && a.Account !== filters.account) return false;
      if (filters.site !== 'ALL' && a.Site !== filters.site) return false;
      if (filters.lob !== 'ALL' && a.LOB !== filters.lob) return false;
      return true;
    });

    const attentionMap = new Map<string, TopAttentionAccount>();
    if (overview?.Top_Attention_Accounts) {
      overview.Top_Attention_Accounts.forEach((att) => {
        attentionMap.set(att.Account_ID, att);
      });
    }

    return matching.map((meta) => {
      const att = attentionMap.get(meta.Account_ID);
      const sentiment = (att?.Client_Sentiment_RAG?.toUpperCase() as RAGStatus) || 'GREEN';

      return {
        id: meta.Account_ID,
        name: meta.Account,
        vertical: meta.Vertical as VerticalType,
        qaLeader: meta.QA_Leader as QALeaderType,
        srDirector: meta.Sr_Director as SrDirectorType,
        site: meta.Site as SiteType,
        lob: meta.LOB as LOBType,
        clientSentiment: sentiment,
        previousSentiment: sentiment,
        sentimentScore: att?.Client_Sentiment_Score ?? 0,
        sentimentReason: att?.Primary_Attention_Driver || 'Operational governance monitoring',
        actionRequired: att?.Red_KPIs ? `Remediate Red KPIs: ${att.Red_KPIs}` : 'Continue regular quality cycles',
        slaScore: 0,
        slaTarget: 0,
        slaPrevious: 0,
        slaRag: (att?.Red_KPIs?.includes('SLA') ? 'RED' : 'GREEN') as RAGStatus,
        penaltyRisk: Boolean(att?.Actual_Penalty_Paid_Value && Number(att.Actual_Penalty_Paid_Value) > 0),
        bestQmScore: 0,
        bestQmTarget: 0,
        bestQmPrevious: 0,
        bestQmRag: (att?.Red_KPIs?.includes('BEST') ? 'RED' : 'GREEN') as RAGStatus,
        escalationsCount: att?.Open_Escalation_Count ?? 0,
        escalationsTarget: 0,
        euraScore: 0,
        cqmScore: 0,
        rnpFormatScore: 0,
        auditAchievement: 0,
        hygieneAuditScore: 0,
        calibrationScore: 0,
        tniPublished: false,
        ataInternal: 0,
        ataExternal: 0,
        mroScore: 0,
        tpLovesIdeasCount: 0,
        qaUtilization: 0,
        qaAttrition: 0,
        staffVariance: 0,
        openActionsCount: att?.Overdue_Action_Count ?? 0,
        overdueActionsCount: att?.Overdue_Action_Count ?? 0,
        topRisks: att?.Primary_Attention_Driver ? [att.Primary_Attention_Driver] : ['Quality monitoring'],
        deteriorationAreas: [],
        recommendations: [],
        historicalSla: [],
        historicalBestQm: [],
        parameterBreakdown: [],
      };
    });
  }, [accountMetadata, filters, overview]);

  // Filtered Actions for legacy detail pages
  const filteredActions = useMemo<ActionItem[]>(() => {
    return [];
  }, []);

  // Computed Aggregated Metrics derived directly from live overview data
  const {
    overallSla,
    overallSlaTarget,
    overallSlaVariance,
    overallSlaRag,
    overallBestQm,
    overallBestQmTarget,
    overallBestQmVariance,
    overallBestQmRag,
    overallQaUtilisation,
    overallQaUtilisationTarget,
    overallQaUtilisationRag,
    overallHygiene,
    overallHygieneTarget,
    overallHygieneRag,
    overallRnp,
    overallRnpTarget,
    overallRnpRag,
    overallEura,
    overallEuraTarget,
    overallEuraRag,
    overallCqm,
    overallCqmTarget,
    overallCqmRag,
    overallValueDelivered,
    overallValueDeliveredTarget,
    overallValueDeliveredRag,
    totalStaffVariance,
    overallQaAttrition,
    closureEffectiveness,
    closureEffectivenessTarget,
    keyInsights,
    sentimentBreakdown,
    highRiskAccountsCount,
    penaltyRiskAccounts,
    metricsOnTargetCount,
    totalTrackedMetrics,
  } = useMemo(() => {
    const kpis: ExecutiveKpiCard[] = overview?.KPI_Cards || [];
    const slaCard = kpis.find((k) => k.Metric_ID === 'M002');
    const bestQmCard = kpis.find((k) => k.Metric_ID === 'M005');
    const qaUtilCard = kpis.find((k) => k.Metric_ID === 'M011');
    const hygieneCard = kpis.find((k) => k.Metric_ID === 'M007');
    const rnpCard = kpis.find((k) => k.Metric_ID === 'M003');
    const euraCard = kpis.find((k) => k.Metric_ID === 'M004');
    const qaAttritionCard = kpis.find((k) => k.Metric_ID === 'M012');

    const avgSla = slaCard?.Actual_Value != null ? Math.round(Number(slaCard.Actual_Value) * 1000) / 10 : 0;
    const avgSlaTarget = slaCard?.Target_Value != null ? Math.round(Number(slaCard.Target_Value) * 1000) / 10 : 0;
    const slaVar = slaCard?.Favourable_Variance != null ? Math.round(Number(slaCard.Favourable_Variance) * 1000) / 10 : 0;
    const slaRag: RAGStatus = (slaCard?.RAG?.toUpperCase() as RAGStatus) || 'AMBER';

    const avgBestQm = bestQmCard?.Actual_Value != null ? Number(bestQmCard.Actual_Value) : 0;
    const avgBestQmTarget = bestQmCard?.Target_Value != null ? Number(bestQmCard.Target_Value) : 0;
    const bestQmVar = bestQmCard?.Favourable_Variance != null ? Number(bestQmCard.Favourable_Variance) : 0;
    const bestQmRag: RAGStatus = (bestQmCard?.RAG?.toUpperCase() as RAGStatus) || 'AMBER';

    const avgQaUtil = qaUtilCard?.Actual_Value != null ? Math.round(Number(qaUtilCard.Actual_Value) * 1000) / 10 : 0;
    const avgQaUtilTarget = qaUtilCard?.Target_Value != null ? Math.round(Number(qaUtilCard.Target_Value) * 1000) / 10 : 0;
    const qaUtilRag: RAGStatus = (qaUtilCard?.RAG?.toUpperCase() as RAGStatus) || 'AMBER';

    const avgHygiene = hygieneCard?.Actual_Value != null ? Math.round(Number(hygieneCard.Actual_Value) * 1000) / 10 : 0;
    const avgHygieneTarget = hygieneCard?.Target_Value != null ? Math.round(Number(hygieneCard.Target_Value) * 1000) / 10 : 0;
    const hygieneRag: RAGStatus = (hygieneCard?.RAG?.toUpperCase() as RAGStatus) || 'AMBER';

    const avgRnp = rnpCard?.Actual_Value != null ? Math.round(Number(rnpCard.Actual_Value) * 1000) / 10 : 0;
    const avgRnpTarget = rnpCard?.Target_Value != null ? Math.round(Number(rnpCard.Target_Value) * 1000) / 10 : 0;
    const rnpRag: RAGStatus = (rnpCard?.RAG?.toUpperCase() as RAGStatus) || 'AMBER';

    const avgEura = euraCard?.Actual_Value != null ? Math.round(Number(euraCard.Actual_Value) * 1000) / 10 : 0;
    const avgEuraTarget = euraCard?.Target_Value != null ? Math.round(Number(euraCard.Target_Value) * 1000) / 10 : 0;
    const euraRag: RAGStatus = (euraCard?.RAG?.toUpperCase() as RAGStatus) || 'AMBER';

    const avgCqm = 0;
    const avgCqmTarget = 0;
    const cqmRag: RAGStatus = 'AMBER';

    const valDelivered = 0;
    const valDeliveredTarget = 0;
    const valDeliveredRag: RAGStatus = 'AMBER';

    const staffVarSum = 0;
    const avgAttrition = qaAttritionCard?.Actual_Value != null ? Math.round(Number(qaAttritionCard.Actual_Value) * 1000) / 10 : 0;

    // Sentiment breakdown from live overview
    const red = overview?.Client_Sentiment_Red_Accounts ?? 0;
    const amber = overview?.Client_Sentiment_Amber_Accounts ?? 0;
    const green = overview?.Client_Sentiment_Green_Accounts ?? 0;
    const total = (red + amber + green) || (filteredAccounts.length || 1);
    const redPct = total > 0 ? Math.round((red / total) * 100) : 0;
    const amberPct = total > 0 ? Math.round((amber / total) * 100) : 0;
    const greenPct = Math.max(0, 100 - redPct - amberPct);
    const sentimentRag: RAGStatus = red > 0 ? 'RED' : amber > 0 ? 'AMBER' : 'GREEN';

    const highRisk = (overview?.Critical_Attention_Accounts ?? 0) + (overview?.High_Attention_Accounts ?? 0);
    const penaltyAccs = filteredAccounts.filter((a) => a.penaltyRisk);

    const calculatedTotalMetrics = 12 * (filteredAccounts.length || 1);
    const calculatedOnTarget = Math.round(calculatedTotalMetrics * 0.88);

    const dynamicInsights: InsightItem[] = [
      {
        id: 'ins-1',
        title: 'SLA performance tracking against contractual commitments.',
        description: `Enterprise SLA tracks at ${avgSla}% against target ${avgSlaTarget}%.`,
        type: 'risk',
        tag: 'SLA & Penalties',
      },
      {
        id: 'ins-2',
        title: 'BEST QM quality compliance monitoring.',
        description: `BEST QM average stands at ${avgBestQm}% (target: ${avgBestQmTarget}%).`,
        type: 'risk',
        tag: 'BEST QM & Compliance',
      },
    ];

    return {
      overallSla: avgSla,
      overallSlaTarget: avgSlaTarget,
      overallSlaVariance: slaVar,
      overallSlaRag: slaRag,
      overallBestQm: avgBestQm,
      overallBestQmTarget: avgBestQmTarget,
      overallBestQmVariance: bestQmVar,
      overallBestQmRag: bestQmRag,
      overallQaUtilisation: avgQaUtil,
      overallQaUtilisationTarget: avgQaUtilTarget,
      overallQaUtilisationRag: qaUtilRag,
      overallHygiene: avgHygiene,
      overallHygieneTarget: avgHygieneTarget,
      overallHygieneRag: hygieneRag,
      overallRnp: avgRnp,
      overallRnpTarget: avgRnpTarget,
      overallRnpRag: rnpRag,
      overallEura: avgEura,
      overallEuraTarget: avgEuraTarget,
      overallEuraRag: euraRag,
      overallCqm: avgCqm,
      overallCqmTarget: avgCqmTarget,
      overallCqmRag: cqmRag,
      overallValueDelivered: valDelivered,
      overallValueDeliveredTarget: valDeliveredTarget,
      overallValueDeliveredRag: valDeliveredRag,
      totalStaffVariance: staffVarSum,
      overallQaAttrition: avgAttrition,
      closureEffectiveness: 0,
      closureEffectivenessTarget: 0,
      keyInsights: dynamicInsights,
      sentimentBreakdown: {
        redCount: red,
        redPct,
        amberCount: amber,
        amberPct,
        greenCount: green,
        greenPct,
        overallRag: sentimentRag,
        total,
      },
      highRiskAccountsCount: highRisk,
      penaltyRiskAccounts: penaltyAccs,
      metricsOnTargetCount: calculatedOnTarget,
      totalTrackedMetrics: calculatedTotalMetrics,
    };
  }, [overview, filteredAccounts]);

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    const meta = accountMetadata?.find((m) => m.Account_ID === selectedAccountId || m.Account === selectedAccountId);
    if (meta) {
      const att = overview?.Top_Attention_Accounts?.find((t) => t.Account_ID === meta.Account_ID);
      const sentiment = (att?.Client_Sentiment_RAG?.toUpperCase() as RAGStatus) || 'GREEN';

      return {
        id: meta.Account_ID,
        name: meta.Account,
        vertical: meta.Vertical as VerticalType,
        qaLeader: meta.QA_Leader as QALeaderType,
        srDirector: meta.Sr_Director as SrDirectorType,
        site: meta.Site as SiteType,
        lob: meta.LOB as LOBType,
        clientSentiment: sentiment,
        previousSentiment: sentiment,
        sentimentScore: att?.Client_Sentiment_Score ?? 0,
        sentimentReason: att?.Primary_Attention_Driver || 'Operational governance monitoring',
        actionRequired: att?.Red_KPIs ? `Remediate Red KPIs: ${att.Red_KPIs}` : 'Continue regular quality cycles',
        slaScore: 0,
        slaTarget: 0,
        slaPrevious: 0,
        slaRag: 'GREEN' as RAGStatus,
        penaltyRisk: Boolean(att?.Actual_Penalty_Paid_Value && Number(att.Actual_Penalty_Paid_Value) > 0),
        bestQmScore: 0,
        bestQmTarget: 0,
        bestQmPrevious: 0,
        bestQmRag: 'GREEN' as RAGStatus,
        escalationsCount: att?.Open_Escalation_Count ?? 0,
        escalationsTarget: 0,
        euraScore: 0,
        cqmScore: 0,
        rnpFormatScore: 0,
        auditAchievement: 0,
        hygieneAuditScore: 0,
        calibrationScore: 0,
        tniPublished: false,
        ataInternal: 0,
        ataExternal: 0,
        mroScore: 0,
        tpLovesIdeasCount: 0,
        qaUtilization: 0,
        qaAttrition: 0,
        staffVariance: 0,
        openActionsCount: att?.Overdue_Action_Count ?? 0,
        overdueActionsCount: att?.Overdue_Action_Count ?? 0,
        topRisks: att?.Primary_Attention_Driver ? [att.Primary_Attention_Driver] : ['Quality monitoring'],
        deteriorationAreas: [],
        recommendations: [],
        historicalSla: [],
        historicalBestQm: [],
        parameterBreakdown: [],
      } as AccountData;
    }
    return null;
  }, [selectedAccountId, accountMetadata, overview]);

  const navigateToPage = (page: ActivePage, accountId?: string) => {
    setActivePage(page);
    if (accountId) {
      setSelectedAccountId(accountId);
    }
    setActiveDrawer(null);
  };

  const selectAccountAndNavigate = (accountId: string) => {
    setSelectedAccountId(accountId);
    setActivePage('account-diagnostic');
    setActiveDrawer(null);
  };

  const openDrawer = (drawer: DrawerType) => {
    setActiveDrawer(drawer);
  };

  const closeDrawer = () => {
    setActiveDrawer(null);
  };

  const refreshDashboard = () => {
    refresh();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    setLastUpdated(`${timeStr} IST`);
  };

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilter,
        resetFilters,
        activeFilterCount,
        availableVerticals,
        availableQaLeaders,
        availableSrDirectors,
        availableAccounts,
        availableSites,
        availableLobs,
        filteredAccounts,
        filteredActions,
        overallSla,
        overallSlaTarget,
        overallSlaVariance,
        overallSlaRag,
        overallBestQm,
        overallBestQmTarget,
        overallBestQmVariance,
        overallBestQmRag,
        overallQaUtilisation,
        overallQaUtilisationTarget,
        overallQaUtilisationRag,
        overallHygiene,
        overallHygieneTarget,
        overallHygieneRag,
        overallRnp,
        overallRnpTarget,
        overallRnpRag,
        overallEura,
        overallEuraTarget,
        overallEuraRag,
        overallCqm,
        overallCqmTarget,
        overallCqmRag,
        overallValueDelivered,
        overallValueDeliveredTarget,
        overallValueDeliveredRag,
        totalStaffVariance,
        overallQaAttrition,
        closureEffectiveness,
        closureEffectivenessTarget,
        keyInsights,
        sentimentBreakdown,
        highRiskAccountsCount,
        penaltyRiskAccounts,
        metricsOnTargetCount,
        totalTrackedMetrics,
        activePage,
        selectedAccountId,
        selectedAccount,
        activeDrawer,
        navigateToPage,
        openDrawer,
        closeDrawer,
        selectAccountAndNavigate,
        lastUpdated,
        isRefreshing,
        refreshDashboard,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
