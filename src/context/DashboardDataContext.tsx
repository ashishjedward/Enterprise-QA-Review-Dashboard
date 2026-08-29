import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  DashboardOverviewData,
  AccountMetadata,
  HealthResponse,
  DashboardScopeFilters,
} from '../types/api';
import {
  getScopedDashboardOverview,
  getAccountMetadata,
  getHealth,
} from '../services/api';

export interface DashboardDataContextValue {
  overview: DashboardOverviewData | null;
  accountMetadata: AccountMetadata[] | null;
  health: HealthResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  refresh: () => Promise<void>;
  fetchScopedOverview: (filters?: DashboardScopeFilters, isManualRefresh?: boolean) => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextValue | undefined>(undefined);

interface DashboardDataProviderProps {
  children: ReactNode;
}

export const DashboardDataProvider: React.FC<DashboardDataProviderProps> = ({ children }) => {
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [accountMetadata, setAccountMetadata] = useState<AccountMetadata[] | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Store active filters ref so manual refresh re-fetches the current active scope
  const activeFiltersRef = useRef<DashboardScopeFilters | undefined>(undefined);
  const overviewRef = useRef<DashboardOverviewData | null>(null);
  overviewRef.current = overview;

  const fetchScopedOverview = useCallback(async (filters?: DashboardScopeFilters, isManualRefresh = false) => {
    activeFiltersRef.current = filters;

    // If initial load and no overview exists yet, use full-page loading; otherwise, subtle refresh
    if (!overviewRef.current && !isManualRefresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const res = await getScopedDashboardOverview(filters);
      if (res?.data) {
        setOverview(res.data);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      const msg = (err as Error)?.message || 'Failed to load dashboard data';
      setError(msg);
      // Keep previous overview data intact on error so the dashboard does not crash or blank
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const initData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [overviewRes, accountMetaRes, healthRes] = await Promise.all([
        getScopedDashboardOverview(),
        getAccountMetadata(),
        getHealth().catch(() => ({ status: 'unknown', bigquery: 'unreachable' })),
      ]);

      if (overviewRes?.data) {
        setOverview(overviewRes.data);
      }
      if (accountMetaRes?.data) {
        setAccountMetadata(accountMetaRes.data);
      }
      if (healthRes) {
        setHealth(healthRes);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      const msg = (err as Error)?.message || 'Failed to initialize dashboard data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  const refresh = useCallback(async () => {
    await fetchScopedOverview(activeFiltersRef.current, true);
  }, [fetchScopedOverview]);

  const value: DashboardDataContextValue = {
    overview,
    accountMetadata,
    health,
    isLoading,
    isRefreshing,
    error,
    lastRefreshed,
    refresh,
    fetchScopedOverview,
  };

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
};

export function useDashboardData(): DashboardDataContextValue {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
}
