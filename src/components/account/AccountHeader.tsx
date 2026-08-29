import React from 'react';
import { 
  Building, 
  Layers, 
  MapPin, 
  User, 
  Briefcase, 
  ShieldAlert, 
  Target,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Account360Header as HeaderType, Account360Risk, Account360Kpi, ReportingContext } from '../../types/api';
import { StatusBadge } from '../common/StatusBadge';

interface AccountHeaderProps {
  header: HeaderType;
  risk: Account360Risk;
  reporting: ReportingContext;
  sentimentKpi?: Account360Kpi;
}

export const AccountHeader: React.FC<AccountHeaderProps> = ({
  header,
  risk,
  reporting,
  sentimentKpi,
}) => {
  const initials = header.Account_Name
    ? header.Account_Name.substring(0, 2).toUpperCase()
    : header.Account_ID.substring(0, 2);

  const formatSlaTarget = (target: number | null | undefined) => {
    if (target === null || target === undefined) return 'N/A';
    if (target <= 1) return `${(target * 100).toFixed(0)}%`;
    return `${target}%`;
  };

  const getAttentionBandStyle = (band: string | null | undefined) => {
    const b = (band || '').toUpperCase();
    if (b === 'CRITICAL') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (b === 'HIGH') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (b === 'MEDIUM' || b === 'MODERATE') return 'bg-sky-100 text-sky-800 border-sky-200';
    if (b === 'WATCH') return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left identity & hierarchy */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded bg-[#1A2B4B] flex items-center justify-center text-white shrink-0 font-bold text-sm shadow-xs">
            {initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {header.Account_Name}
              </h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {header.Account_ID}
              </span>
              
              {/* Account Structural Profile */}
              {header.Risk_Profile && (
                <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium border border-slate-200">
                  Account Structural Profile: <strong className="text-slate-900">{header.Risk_Profile}</strong>
                </span>
              )}

              {/* Monthly Governance Priority */}
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold border ${getAttentionBandStyle(risk.Attention_Band)}`}>
                Monthly Governance Priority: {risk.Attention_Band || 'N/A'}
              </span>

              {/* SLA Target */}
              {header.SLA_Target !== null && (
                <span className="text-[11px] px-2 py-0.5 bg-sky-50 text-sky-800 rounded font-medium border border-sky-200 flex items-center gap-1">
                  <Target className="w-3 h-3 text-sky-600" />
                  SLA Target: <strong>{formatSlaTarget(header.SLA_Target)}</strong>
                </span>
              )}
            </div>

            {/* Account hierarchy metadata */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 mt-2">
              {header.BU && (
                <span className="inline-flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  BU: <strong className="text-slate-800">{header.BU}</strong>
                </span>
              )}
              {header.Vertical && (
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-400" />
                  Vertical: <strong className="text-slate-800">{header.Vertical}</strong>
                </span>
              )}
              {header.Site && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Site: <strong className="text-slate-800">{header.Site}</strong>
                </span>
              )}
              {header.LOB && (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  LOB: <strong className="text-slate-800">{header.LOB}</strong>
                </span>
              )}
              {header.Process && (
                <span>
                  Process: <strong className="text-slate-800">{header.Process}</strong>
                </span>
              )}
              {header.Sub_LOB && (
                <span>
                  Sub-LOB: <strong className="text-slate-800">{header.Sub_LOB}</strong>
                </span>
              )}
            </div>

            {/* Leadership Line */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
              {header.QA_Leader && (
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  QA Leader: <strong className="text-slate-800">{header.QA_Leader}</strong>
                </span>
              )}
              {header.QA_Director && (
                <span>
                  QA Director: <strong className="text-slate-800">{header.QA_Director}</strong>
                </span>
              )}
              {header.Sr_Director && (
                <span>
                  Sr Director: <strong className="text-slate-800">{header.Sr_Director}</strong>
                </span>
              )}
              {header.QA_VP && (
                <span>
                  QA VP: <strong className="text-slate-800">{header.QA_VP}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side summary metric widgets */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
          {/* Governance Attention Score */}
          <div className="bg-slate-50 px-3 py-2.5 rounded border border-slate-200 min-w-[130px]">
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>Attention Score</span>
              {risk.Attention_Rank !== null && (
                <span className="text-[10px] font-mono font-semibold text-slate-500">
                  Rank #{risk.Attention_Rank}
                </span>
              )}
            </div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
              {risk.Attention_Score ?? 'N/A'}
            </div>
          </div>

          {/* Client Sentiment Score (M001) */}
          <div className="bg-slate-50 px-3 py-2.5 rounded border border-slate-200 min-w-[130px]">
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>Client Sentiment</span>
              <StatusBadge status={sentimentKpi?.RAG} size="xs" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5 flex items-baseline justify-between">
              <span>{sentimentKpi?.Actual_Display || 'N/A'}</span>
              <span className="text-[11px] font-normal text-slate-500 font-mono">
                Tgt: {sentimentKpi?.Target_Display || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Attention Driver Banner */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2 bg-amber-50/60 p-2.5 rounded border border-amber-200/80 text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Primary Governance Driver: {risk.Primary_Attention_Driver || 'N/A'}</span>
          </div>
          {(risk.Red_KPI_Count > 0 || risk.Amber_KPI_Count > 0) && (
            <div className="text-amber-800 text-[11px] flex flex-wrap gap-x-3">
              {risk.Red_KPI_Count > 0 && risk.Red_KPIs && (
                <span>Red KPIs ({risk.Red_KPI_Count}): <strong className="text-rose-900">{risk.Red_KPIs}</strong></span>
              )}
              {risk.Amber_KPI_Count > 0 && risk.Amber_KPIs && (
                <span>Amber KPIs ({risk.Amber_KPI_Count}): <strong className="text-amber-900">{risk.Amber_KPIs}</strong></span>
              )}
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0 self-end md:self-auto font-medium">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Closed Cycle: <strong className="text-slate-800">{reporting?.Official_Reporting_Month || header?.Official_Reporting_Month || 'N/A'}</strong></span>
        </div>
      </div>
    </div>
  );
};
