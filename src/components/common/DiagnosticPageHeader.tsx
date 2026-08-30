import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

export interface DiagnosticPageHeaderProps {
  title: string;
  breadcrumbLabel?: string;
  description?: string;
  contextBadges?: React.ReactNode;
  primaryActions?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  onBackToOverview?: () => void;
  backLabel?: string;
}

export const DiagnosticPageHeader: React.FC<DiagnosticPageHeaderProps> = ({
  title,
  breadcrumbLabel,
  description,
  contextBadges,
  primaryActions,
  secondaryActions,
  onBackToOverview,
  backLabel = 'Back to Overview',
}) => {
  const { navigateToPage } = useFilters();

  const handleBack = () => {
    if (onBackToOverview) {
      onBackToOverview();
    } else {
      navigateToPage('overview');
    }
  };

  const displayBreadcrumb = breadcrumbLabel || title;

  return (
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 pb-3 border-b border-slate-200">
      {/* Left Column: Breadcrumb, Title + Badges, Description */}
      <div className="flex-1 min-w-0">
        {/* Standard Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 flex-wrap">
          <button
            type="button"
            onClick={handleBack}
            className="text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
          >
            Enterprise
          </button>
          <span className="text-slate-400 select-none">&gt;</span>
          <span className="font-semibold text-[#1A2B4B] truncate">
            {displayBreadcrumb}
          </span>
        </nav>

        {/* Title and Context Badges Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1A2B4B]">
            {title}
          </h1>
          {contextBadges && (
            <div className="flex flex-wrap items-center gap-1.5">
              {contextBadges}
            </div>
          )}
        </div>

        {/* Optional Description */}
        {description && (
          <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-4xl">
            {description}
          </p>
        )}
      </div>

      {/* Right Column: Actions (Secondary Actions, Primary Actions, Back to Overview) */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap lg:self-start lg:pt-0.5">
        {secondaryActions}
        {primaryActions}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>{backLabel}</span>
        </button>
      </div>
    </div>
  );
};
