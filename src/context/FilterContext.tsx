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
import { 
  ACCOUNTS_DATA, 
  ACTION_ITEMS_DATA, 
  TARGETS 
} from '../data/dummyData';
import { useDashboardData } from './DashboardDataContext';
import { AccountMetadata, DashboardScopeFilters } from '../types/api';

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

  // Filtered Accounts for legacy detail pages
  const filteredAccounts = useMemo(() => {
    return ACCOUNTS_DATA.filter((a) => {
      if (filters.vertical !== 'ALL' && a.vertical !== filters.vertical) return false;
      if (filters.qaLeader !== 'ALL' && a.qaLeader !== filters.qaLeader) return false;
      if (filters.srDirector !== 'ALL' && a.srDirector !== filters.srDirector) return false;
      if (filters.account !== 'ALL' && a.id !== filters.account && a.name !== filters.account) return false;
      if (filters.site !== 'ALL' && a.site !== filters.site) return false;
      if (filters.lob !== 'ALL' && a.lob !== filters.lob) return false;
      return true;
    });
  }, [filters]);

  // Filtered Actions for legacy detail pages
  const filteredActions = useMemo(() => {
    return ACTION_ITEMS_DATA.filter((action) => {
      if (filters.vertical !== 'ALL' && action.vertical !== filters.vertical) return false;
      if (filters.qaLeader !== 'ALL' && action.qaLeader !== filters.qaLeader) return false;
      if (filters.account !== 'ALL' && action.account !== filters.account) return false;
      return true;
    });
  }, [filters]);

  // Computed Aggregated Metrics for legacy detail pages
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
    const total = filteredAccounts.length || 1;
    
    const sumSla = filteredAccounts.reduce((acc, a) => acc + (a.slaScore || 0), 0);
    const sumSlaTarget = filteredAccounts.reduce((acc, a) => acc + (a.slaTarget || TARGETS.sla), 0);
    const avgSla = Math.round((sumSla / total) * 10) / 10;
    const avgSlaTarget = Math.round((sumSlaTarget / total) * 10) / 10;
    const slaVar = Math.round((avgSla - avgSlaTarget) * 10) / 10;
    const slaRag: RAGStatus = avgSla >= avgSlaTarget ? 'GREEN' : avgSla >= avgSlaTarget - 2.0 ? 'AMBER' : 'RED';

    const sumBestQm = filteredAccounts.reduce((acc, a) => acc + (a.bestQmScore || 0), 0);
    const sumBestQmTarget = filteredAccounts.reduce((acc, a) => acc + (a.bestQmTarget || TARGETS.bestQm), 0);
    const avgBestQm = Math.round((sumBestQm / total) * 10) / 10;
    const avgBestQmTarget = Math.round((sumBestQmTarget / total) * 10) / 10;
    const bestQmVar = Math.round((avgBestQm - avgBestQmTarget) * 10) / 10;
    const bestQmRag: RAGStatus = avgBestQm >= avgBestQmTarget ? 'GREEN' : avgBestQm >= avgBestQmTarget - 2.0 ? 'AMBER' : 'RED';

    const sumQaUtil = filteredAccounts.reduce((acc, a) => acc + (a.qaUtilization || 0), 0);
    const avgQaUtil = Math.round((sumQaUtil / total) * 10) / 10;
    const avgQaUtilTarget = TARGETS.qaUtilisation;
    const qaUtilRag: RAGStatus = avgQaUtil >= avgQaUtilTarget ? 'GREEN' : avgQaUtil >= avgQaUtilTarget - 5.0 ? 'AMBER' : 'RED';

    const sumHygiene = filteredAccounts.reduce((acc, a) => acc + (a.hygieneAuditScore || 0), 0);
    const avgHygiene = Math.round((sumHygiene / total) * 10) / 10;
    const avgHygieneTarget = TARGETS.auditAchievement;
    const hygieneRag: RAGStatus = avgHygiene >= avgHygieneTarget ? 'GREEN' : avgHygiene >= avgHygieneTarget - 3.0 ? 'AMBER' : 'RED';

    const sumRnp = filteredAccounts.reduce((acc, a) => acc + (a.rnpFormatScore || 0), 0);
    const avgRnp = Math.round((sumRnp / total) * 10) / 10;
    const avgRnpTarget = TARGETS.rnp;
    const rnpRag: RAGStatus = avgRnp >= avgRnpTarget ? 'GREEN' : avgRnp >= avgRnpTarget - 3.0 ? 'AMBER' : 'RED';

    const sumEura = filteredAccounts.reduce((acc, a) => acc + (a.euraScore || 0), 0);
    const avgEura = Math.round((sumEura / total) * 10) / 10;
    const avgEuraTarget = TARGETS.eura;
    const euraRag: RAGStatus = avgEura >= avgEuraTarget ? 'GREEN' : avgEura >= avgEuraTarget - 3.0 ? 'AMBER' : 'RED';

    const sumCqm = filteredAccounts.reduce((acc, a) => acc + (a.cqmScore || 0), 0);
    const avgCqm = Math.round((sumCqm / total) * 10) / 10;
    const avgCqmTarget = TARGETS.cqm;
    const cqmRag: RAGStatus = avgCqm >= avgCqmTarget ? 'GREEN' : avgCqm >= avgCqmTarget - 3.0 ? 'AMBER' : 'RED';

    const valDelivered = 1.42;
    const valDeliveredTarget = 1.25;
    const valDeliveredRag: RAGStatus = 'GREEN';

    const staffVarSum = filteredAccounts.reduce((acc, a) => acc + (a.staffVariance || 0), 0);
    const avgAttrition = Math.round((filteredAccounts.reduce((acc, a) => acc + (a.qaAttrition || 0), 0) / total) * 10) / 10;

    const red = filteredAccounts.filter((a) => a.clientSentiment === 'RED').length;
    const amber = filteredAccounts.filter((a) => a.clientSentiment === 'AMBER').length;
    const green = filteredAccounts.filter((a) => a.clientSentiment === 'GREEN').length;

    const redPct = Math.round((red / total) * 100);
    const amberPct = Math.round((amber / total) * 100);
    const greenPct = 100 - redPct - amberPct;

    const sentimentRag: RAGStatus = red > 0 ? 'RED' : amber > 0 ? 'AMBER' : 'GREEN';

    const highRisk = filteredAccounts.filter((a) => a.clientSentiment === 'RED' || a.slaRag === 'RED' || a.penaltyRisk).length;
    const penaltyAccs = filteredAccounts.filter((a) => a.penaltyRisk);

    const kpiPassConditions: boolean[] = [];
    filteredAccounts.forEach((acc) => {
      kpiPassConditions.push(acc.slaScore >= (acc.slaTarget || TARGETS.sla));
      kpiPassConditions.push(acc.bestQmScore >= (acc.bestQmTarget || TARGETS.bestQm));
      kpiPassConditions.push(acc.escalationsCount <= acc.escalationsTarget);
      kpiPassConditions.push(acc.clientSentiment !== 'RED');
      kpiPassConditions.push(!acc.penaltyRisk);
      kpiPassConditions.push(acc.calibrationScore >= 85.0);
      kpiPassConditions.push(acc.euraScore >= TARGETS.eura);
      kpiPassConditions.push(acc.cqmScore >= TARGETS.cqm);
      kpiPassConditions.push(acc.auditAchievement >= TARGETS.auditAchievement);
      kpiPassConditions.push(Boolean(acc.tniPublished));
      kpiPassConditions.push(acc.qaUtilization >= TARGETS.qaUtilisation);
      kpiPassConditions.push(acc.qaAttrition <= TARGETS.qaAttrition);
      kpiPassConditions.push(acc.overdueActionsCount === 0);
    });

    const calculatedTotalMetrics = kpiPassConditions.length;
    const calculatedOnTarget = kpiPassConditions.filter(Boolean).length;

    const dynamicInsights: InsightItem[] = [
      {
        id: 'ins-1',
        title: 'SLA performance improved across core accounts.',
        description: `Enterprise SLA reached ${avgSla}% against target ${avgSlaTarget}%.`,
        type: 'risk',
        tag: 'SLA & Penalties',
      },
      {
        id: 'ins-2',
        title: 'BEST QM tracking against operational baseline.',
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
      closureEffectiveness: 88.5,
      closureEffectivenessTarget: TARGETS.closureRate,
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
  }, [filteredAccounts]);

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    const directMatch = ACCOUNTS_DATA.find((a) => a.id === selectedAccountId || a.name === selectedAccountId);
    if (directMatch) return directMatch;

    // Fallback lookup from accountMetadata to prevent crash on new IDs (e.g. ACC001)
    if (accountMetadata) {
      const meta = accountMetadata.find((m) => m.Account_ID === selectedAccountId || m.Account === selectedAccountId);
      if (meta) {
        return {
          id: meta.Account_ID,
          name: meta.Account,
          vertical: meta.Vertical,
          qaLeader: meta.QA_Leader,
          srDirector: meta.Sr_Director,
          site: meta.Site,
          lob: meta.LOB,
          clientSentiment: 'GREEN' as RAGStatus,
          previousSentiment: 'GREEN' as RAGStatus,
          sentimentScore: 85,
          sentimentReason: 'Standard performance trajectory',
          actionRequired: 'Continue regular quality cycles',
          slaScore: 95.0,
          slaTarget: 95.0,
          slaPrevious: 94.5,
          slaRag: 'GREEN' as RAGStatus,
          penaltyRisk: false,
          bestQmScore: 91.0,
          bestQmTarget: 90.0,
          bestQmPrevious: 90.2,
          bestQmRag: 'GREEN' as RAGStatus,
          escalationsCount: 0,
          escalationsTarget: 1,
          euraScore: 96.0,
          cqmScore: 94.0,
          rnpFormatScore: 95.0,
          auditAchievement: 96.0,
          hygieneAuditScore: 97.0,
          calibrationScore: 98.0,
          tniPublished: true,
          ataInternal: 95.0,
          ataExternal: 95.0,
          mroScore: 92.0,
          tpLovesIdeasCount: 4,
          qaUtilization: 90.0,
          qaAttrition: 8.0,
          staffVariance: 0,
          openActionsCount: 0,
          overdueActionsCount: 0,
          topRisks: [],
          deteriorationAreas: [],
          recommendations: [],
          historicalSla: [],
          historicalBestQm: [],
          parameterBreakdown: [],
        } as AccountData;
      }
    }
    return null;
  }, [selectedAccountId, accountMetadata]);

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
