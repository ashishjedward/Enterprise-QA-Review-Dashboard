import React, { useState, useEffect } from 'react';
import { Filter, RotateCcw, X, ChevronDown } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import { TimePeriod } from '../../types';

export const MobileFilterBar: React.FC = () => {
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

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const timePeriods: TimePeriod[] = ['3M', '6M', 'YTD', '12M'];
  const scopedAccountCount = overview?.Total_Accounts !== undefined ? overview.Total_Accounts : availableAccounts.length;

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (isFilterSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFilterSheetOpen]);

  return (
    <div className="bg-white border-b border-slate-200 px-4 max-[340px]:px-3 py-2 sticky top-[60px] z-20 shadow-xs select-none">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Time Period Selector Pill / Dropdown */}
        <div className="relative">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xs border border-slate-200">
            {timePeriods.map((period) => (
              <button
                key={period}
                onClick={() => setFilter('timePeriod', period)}
                className={`min-h-[38px] px-2.5 max-[340px]:px-2 py-1 text-xs font-bold rounded-xs transition-all cursor-pointer ${
                  filters.timePeriod === period
                    ? 'bg-white text-[#1A2B4B] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 active:bg-slate-200/50'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Right: [ Filters (X) ] trigger button */}
        <button
          onClick={() => setIsFilterSheetOpen(true)}
          className={`min-h-[40px] px-3.5 max-[340px]:px-2.5 py-1.5 rounded-xs text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
            activeFilterCount > 0
              ? 'bg-teal-50 text-[#0D9488] border-teal-300 shadow-xs'
              : 'bg-slate-50 text-[#1A2B4B] border-slate-200 hover:bg-white'
          }`}
        >
          <Filter className={`w-3.5 h-3.5 ${activeFilterCount > 0 ? 'text-[#0D9488]' : 'text-slate-500'}`} />
          <span>Filters ({activeFilterCount})</span>
        </button>
      </div>

      {/* Filter Bottom Sheet Modal */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full bg-white rounded-t-lg shadow-2xl max-h-[85vh] flex flex-col justify-between animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xs bg-[#1A2B4B] flex items-center justify-center text-white shrink-0">
                  <Filter className="w-4 h-4 text-[#0D9488]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A2B4B]">Dashboard Filters</h3>
                  <p className="text-xs text-slate-500">
                    Scope: <strong className="text-slate-800">{scopedAccountCount}</strong> matching {scopedAccountCount === 1 ? 'account' : 'accounts'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFilterSheetOpen(false)}
                aria-label="Close filters"
                className="w-10 h-10 flex items-center justify-center rounded-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cascading Filter Controls List */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 divide-y divide-slate-100">
              {/* Vertical */}
              <div className="pt-2 first:pt-0">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Vertical
                </label>
                <div className="relative">
                  <select
                    value={filters.vertical}
                    onChange={(e) => setFilter('vertical', e.target.value)}
                    className="w-full min-h-[44px] appearance-none bg-slate-50 border border-slate-300 text-[#1A2B4B] text-sm font-medium rounded-xs px-3 py-2 pr-8 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  >
                    <option value="ALL">All Verticals ({availableVerticals.length})</option>
                    {availableVerticals.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* QA Leader */}
              <div className="pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  QA Leader
                </label>
                <div className="relative">
                  <select
                    value={filters.qaLeader}
                    onChange={(e) => setFilter('qaLeader', e.target.value)}
                    className="w-full min-h-[44px] appearance-none bg-slate-50 border border-slate-300 text-[#1A2B4B] text-sm font-medium rounded-xs px-3 py-2 pr-8 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  >
                    <option value="ALL">All QA Leaders ({availableQaLeaders.length})</option>
                    {availableQaLeaders.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Sr Director */}
              <div className="pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Sr Director
                </label>
                <div className="relative">
                  <select
                    value={filters.srDirector}
                    onChange={(e) => setFilter('srDirector', e.target.value)}
                    className="w-full min-h-[44px] appearance-none bg-slate-50 border border-slate-300 text-[#1A2B4B] text-sm font-medium rounded-xs px-3 py-2 pr-8 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  >
                    <option value="ALL">All Sr Directors ({availableSrDirectors.length})</option>
                    {availableSrDirectors.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Account (Cascaded, Value = Account_ID, Label = Account Name) */}
              <div className="pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Account
                </label>
                <div className="relative">
                  <select
                    value={filters.account}
                    onChange={(e) => setFilter('account', e.target.value)}
                    className={`w-full min-h-[44px] appearance-none border text-sm font-medium rounded-xs px-3 py-2 pr-8 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] ${
                      filters.account !== 'ALL'
                        ? 'bg-teal-50 text-[#0D9488] border-teal-400 font-bold'
                        : 'bg-slate-50 border-slate-300 text-[#1A2B4B]'
                    }`}
                  >
                    <option value="ALL">All Accounts ({availableAccounts.length})</option>
                    {availableAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Site */}
              <div className="pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Delivery Site
                </label>
                <div className="relative">
                  <select
                    value={filters.site}
                    onChange={(e) => setFilter('site', e.target.value)}
                    className="w-full min-h-[44px] appearance-none bg-slate-50 border border-slate-300 text-[#1A2B4B] text-sm font-medium rounded-xs px-3 py-2 pr-8 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  >
                    <option value="ALL">All Delivery Sites ({availableSites.length})</option>
                    {availableSites.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* LOB */}
              <div className="pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Line of Business (LOB)
                </label>
                <div className="relative">
                  <select
                    value={filters.lob}
                    onChange={(e) => setFilter('lob', e.target.value)}
                    className="w-full min-h-[44px] appearance-none bg-slate-50 border border-slate-300 text-[#1A2B4B] text-sm font-medium rounded-xs px-3 py-2 pr-8 focus:outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]"
                  >
                    <option value="ALL">All Lines of Business ({availableLobs.length})</option>
                    {availableLobs.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Sheet Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    resetFilters();
                    setIsFilterSheetOpen(false);
                  }}
                  className="flex-1 min-h-[44px] border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs py-2.5 rounded-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reset ({activeFilterCount})</span>
                </button>
              )}
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 min-h-[44px] bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span>Apply & View Scope</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
