import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Building, 
  RefreshCw, 
  AlertTriangle, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { getAccount360 } from '../services/api';
import { Account360Data } from '../types/api';
import { AccountHeader } from '../components/account/AccountHeader';
import { AccountKpiGrid } from '../components/account/AccountKpiGrid';
import { AccountGovernanceSection } from '../components/account/AccountGovernanceSection';
import { AccountStaffingCommercialSection } from '../components/account/AccountStaffingCommercialSection';
import { AccountEventRegisters } from '../components/account/AccountEventRegisters';

export const AccountDiagnosticPage: React.FC = () => {
  const { 
    selectedAccountId, 
    navigateToPage, 
    selectAccountAndNavigate, 
    availableAccounts, 
    filters,
    setFilter
  } = useFilters();
  const { accountMetadata } = useDashboardData();

  const [accountData, setAccountData] = useState<Account360Data | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Determine effective account ID: if filters.account is a specific Account_ID and not 'ALL', global filter wins. Otherwise selectedAccountId.
  const effectiveAccountId = (filters.account && filters.account !== 'ALL')
    ? filters.account
    : (selectedAccountId || null);

  // Build sorted list of available accounts for dropdown selector
  const accountOptions = React.useMemo(() => {
    if (availableAccounts && availableAccounts.length > 0) {
      return availableAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        vertical: a.vertical,
      }));
    }
    if (accountMetadata && accountMetadata.length > 0) {
      return accountMetadata
        .map((a) => ({
          id: a.Account_ID,
          name: a.Account,
          vertical: a.Vertical,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }, [availableAccounts, accountMetadata]);

  // Synchronize account switch across page state and persistent global filter
  const handleAccountSelect = (newAccountId: string) => {
    if (!newAccountId) return;
    setFilter('account', newAccountId);
    selectAccountAndNavigate(newAccountId);
  };

  // Fetch live Account 360 data when effectiveAccountId changes
  useEffect(() => {
    if (!effectiveAccountId) {
      setAccountData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);
    setAccountData(null);

    getAccount360(effectiveAccountId)
      .then((res) => {
        if (!isCancelled) {
          if (res && res.data) {
            setAccountData(res.data);
            setError(null);
          } else {
            setError(`Account ${effectiveAccountId} data could not be retrieved.`);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load Account 360:', err);
          setError(err?.message || `Failed to load Account 360 data for ${effectiveAccountId}.`);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [effectiveAccountId]);

  // State 1: No Account Selected
  if (!effectiveAccountId) {
    return (
      <div className="p-8 text-center bg-white rounded-md border border-slate-200 shadow-xs max-w-2xl mx-auto my-12">
        <Building className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Select an Account to View Account 360</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Please choose an account from the directory below or return to the enterprise overview.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                handleAccountSelect(e.target.value);
              }
            }}
            className="text-xs bg-white border border-slate-300 rounded px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer min-w-[240px]"
          >
            <option value="">-- Select an Account --</option>
            {accountOptions.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.vertical ? `${acc.vertical} - ` : ''}{acc.id})
              </option>
            ))}
          </select>

          <button
            onClick={() => navigateToPage('overview')}
            className="px-4 py-2 bg-[#1A2B4B] text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Return to Overview
          </button>
        </div>
      </div>
    );
  }

  // State 2: Loading
  if (loading && !accountData) {
    return (
      <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
        {/* Top Breadcrumb skeleton */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              onClick={() => navigateToPage('overview')}
              className="hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-slate-800">Account 360</span>
          </div>
        </div>

        {/* Loading card */}
        <div className="p-12 text-center bg-white rounded-md border border-slate-200 shadow-xs max-w-xl mx-auto my-12">
          <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-3" />
          <h2 className="text-sm font-bold text-slate-800">Loading Account 360 Diagnostics...</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Fetching live telemetry for {effectiveAccountId}
          </p>
        </div>
      </div>
    );
  }

  // State 3: Error / 404
  if (error || !accountData) {
    return (
      <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              onClick={() => navigateToPage('overview')}
              className="hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-slate-800">Account 360</span>
          </div>
        </div>

        <div className="p-8 text-center bg-white rounded-md border border-rose-200 shadow-xs max-w-2xl mx-auto my-10">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Account Diagnostic Telemetry Unavailable</h2>
          <p className="text-xs text-slate-600 mt-1 mb-5">
            {error || `Unable to load diagnostic information for account ${effectiveAccountId}.`}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <select
              value={effectiveAccountId}
              onChange={(e) => {
                if (e.target.value) {
                  handleAccountSelect(e.target.value);
                }
              }}
              className="text-xs bg-white border border-slate-300 rounded px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer min-w-[240px]"
            >
              <option value="">-- Switch Account --</option>
              {accountOptions.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.vertical ? `${acc.vertical} - ` : ''}{acc.id})
                </option>
              ))}
            </select>

            <button
              onClick={() => navigateToPage('overview')}
              className="px-4 py-2 bg-[#1A2B4B] text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Return to Overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Success - Render full Account 360 Diagnostic Page
  const sentimentKpi = accountData.KPIs.find((k) => k.Metric_ID === 'M001');
  const m011Kpi = accountData.KPIs.find((k) => k.Metric_ID === 'M011');
  const m012Kpi = accountData.KPIs.find((k) => k.Metric_ID === 'M012');

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Top Breadcrumb & Account Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigateToPage('overview')}
            className="hover:text-slate-800 flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Enterprise Overview</span>
          </button>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span>{accountData.Header.Vertical || 'Vertical'}</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-900">
            {accountData.Header.Account_Name} ({accountData.Header.Account_ID})
          </span>
        </div>

        {/* Right Switcher Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label htmlFor="quick-account-switcher" className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Switch Account:
          </label>
          <select
            id="quick-account-switcher"
            value={effectiveAccountId}
            onChange={(e) => {
              if (e.target.value) {
                handleAccountSelect(e.target.value);
              }
            }}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer max-w-[260px] truncate"
          >
            {accountOptions.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.vertical ? `${acc.vertical} - ` : ''}{acc.id})
              </option>
            ))}
          </select>

          <button
            onClick={() => navigateToPage('overview')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            Back to Overview
          </button>
        </div>
      </div>

      {/* 1. Account Identity Header */}
      <AccountHeader
        header={accountData.Header}
        risk={accountData.Risk}
        reporting={accountData.Reporting_Context}
        sentimentKpi={sentimentKpi}
      />

      {/* 2. 12 Official KPIs Health Diagnostic Grid */}
      <AccountKpiGrid kpis={accountData.KPIs} />

      {/* 3. Monthly Governance & Risk Signals */}
      <AccountGovernanceSection risk={accountData.Risk} />

      {/* 4. QA Team Capacity & Commercial Realization */}
      <AccountStaffingCommercialSection
        qaTeam={accountData.QA_Team}
        commercial={accountData.Commercial}
        utilizationTarget={m011Kpi?.Target_Display}
        attritionTarget={m012Kpi?.Target_Display}
      />

      {/* 5. Event Registers (Actions, Escalations, CQM, ZT) */}
      <AccountEventRegisters
        actions={accountData.Actions}
        escalations={accountData.Escalations}
        cqm={accountData.CQM}
        zt={accountData.ZT}
      />
    </div>
  );
};
