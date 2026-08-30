import React from 'react';
import { Filter, RotateCcw, ChevronDown } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import { TimePeriod } from '../../types';

export const GlobalFilterBar: React.FC = () => {
  const {
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
  } = useFilters();

  const { overview } = useDashboardData();

  const timePeriods: TimePeriod[] = ['3M', '6M', 'YTD', '12M'];
  const scopedAccountCount = overview?.Total_Accounts !== undefined ? overview.Total_Accounts : availableAccounts.length;

  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-5 py-1.5 shadow-xs sticky top-0 z-20">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Time Period Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xs border border-slate-200 mr-0.5">
            {timePeriods.map((period) => (
              <button
                key={period}
                onClick={() => setFilter('timePeriod', period)}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-xs transition-all cursor-pointer ${
                  filters.timePeriod === period
                    ? 'bg-white text-[#1A2B4B] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          <div className="h-3.5 w-px bg-slate-200 hidden sm:block mx-0.5" />

          {/* Vertical Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={filters.vertical}
              onChange={(e) => setFilter('vertical', e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-white border border-slate-200 text-[#1A2B4B] text-[11px] font-medium rounded-xs pl-2 pr-6 py-1 cursor-pointer focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-colors"
            >
              <option value="ALL">Vertical: All ({availableVerticals.length})</option>
              {availableVerticals.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
          </div>

          {/* QA Leader Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={filters.qaLeader}
              onChange={(e) => setFilter('qaLeader', e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-white border border-slate-200 text-[#1A2B4B] text-[11px] font-medium rounded-xs pl-2 pr-6 py-1 cursor-pointer focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-colors"
            >
              <option value="ALL">QA Leader: All ({availableQaLeaders.length})</option>
              {availableQaLeaders.map((leader) => (
                <option key={leader} value={leader}>
                  {leader}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
          </div>

          {/* Sr Director Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={filters.srDirector}
              onChange={(e) => setFilter('srDirector', e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-white border border-slate-200 text-[#1A2B4B] text-[11px] font-medium rounded-xs pl-2 pr-6 py-1 cursor-pointer focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-colors"
            >
              <option value="ALL">Sr Director: All ({availableSrDirectors.length})</option>
              {availableSrDirectors.map((director) => (
                <option key={director} value={director}>
                  {director}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
          </div>

          {/* Account Dropdown (Cascaded, Value = Account_ID, Label = Account Name) */}
          <div className="relative inline-flex items-center">
            <select
              value={filters.account}
              onChange={(e) => setFilter('account', e.target.value)}
              className={`appearance-none border text-[11px] font-medium rounded-xs pl-2 pr-6 py-1 cursor-pointer focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-colors max-w-[160px] truncate ${
                filters.account !== 'ALL'
                  ? 'bg-teal-50 text-[#0D9488] border-teal-300 font-bold'
                  : 'bg-slate-50 hover:bg-white border-slate-200 text-[#1A2B4B]'
              }`}
            >
              <option value="ALL">Account: All ({availableAccounts.length})</option>
              {availableAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
          </div>

          {/* Site Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={filters.site}
              onChange={(e) => setFilter('site', e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-white border border-slate-200 text-[#1A2B4B] text-[11px] font-medium rounded-xs pl-2 pr-6 py-1 cursor-pointer focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-colors"
            >
              <option value="ALL">Site: All ({availableSites.length})</option>
              {availableSites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
          </div>

          {/* LOB Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={filters.lob}
              onChange={(e) => setFilter('lob', e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-white border border-slate-200 text-[#1A2B4B] text-[11px] font-medium rounded-xs pl-2 pr-6 py-1 cursor-pointer focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] transition-colors"
            >
              <option value="ALL">LOB: All ({availableLobs.length})</option>
              {availableLobs.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
          </div>
        </div>

        {/* Right: Reset & Scope Summary */}
        <div className="flex items-center gap-2.5">
          <div className="text-[10.5px] text-slate-500 hidden xl:flex items-center gap-1 font-mono">
            <span>Scope:</span>
            <span className="font-bold text-[#1A2B4B]">
              {scopedAccountCount} {scopedAccountCount === 1 ? 'Account' : 'Accounts'}
            </span>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xs hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5 text-rose-600" />
              <span>Reset ({activeFilterCount})</span>
            </button>
          )}

          {activeFilterCount === 0 && (
            <div className="flex items-center gap-1 text-[10.5px] text-slate-400 font-medium">
              <Filter className="w-2.5 h-2.5" />
              <span>Scope: Default</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
