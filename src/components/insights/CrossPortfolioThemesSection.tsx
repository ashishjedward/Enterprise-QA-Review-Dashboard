import React from 'react';
import {
  Layers,
  ArrowRight,
  TrendingDown,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { CrossPortfolioTheme } from '../../types/api';
import { useFilters } from '../../context/FilterContext';

interface CrossPortfolioThemesSectionProps {
  themes: CrossPortfolioTheme[];
}

export const CrossPortfolioThemesSection: React.FC<CrossPortfolioThemesSectionProps> = ({
  themes,
}) => {
  const { navigateToPage, selectAccountAndNavigate } = useFilters();

  if (!themes || themes.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5 text-center text-slate-500 shadow-xs">
        <p className="text-xs">No cross-portfolio KPI risk concentrations detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Cross-Portfolio Themes & Risk Concentrations
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Aggregated by Red KPI Account Volume in Scoped Population
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <div
            key={theme.themeId}
            className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              {/* Category & Affected Percentage Badge */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {theme.category}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {theme.affectedAccountCount} Accounts ({theme.affectedAccountPct.toFixed(1)}%)
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                {theme.title}
              </h3>

              {/* Summary */}
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {theme.summary}
              </p>

              {/* Top Affected Accounts Chips */}
              {theme.topAccounts.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Highest Deficit Accounts
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {theme.topAccounts.map((acc) => (
                      <button
                        key={acc.accountId}
                        type="button"
                        onClick={() => selectAccountAndNavigate(acc.accountId)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-800 transition-colors cursor-pointer"
                      >
                        <span className="font-semibold">{acc.accountName}</span>
                        <span className="text-rose-600 font-bold font-mono">({acc.actual})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom link to owning Diagnostic page */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Owning Module</span>
              <button
                type="button"
                onClick={() => navigateToPage(theme.navigationTarget.page as any)}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Open Diagnostic</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
