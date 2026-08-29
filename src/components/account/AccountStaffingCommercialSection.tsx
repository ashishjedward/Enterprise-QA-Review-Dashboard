import React from 'react';
import { Users, Briefcase, Award, TrendingUp } from 'lucide-react';
import { Account360QaTeam, Account360Commercial } from '../../types/api';
import { StatusBadge } from '../common/StatusBadge';

interface AccountStaffingCommercialSectionProps {
  qaTeam: Account360QaTeam;
  commercial: Account360Commercial;
  utilizationTarget?: string | null;
  attritionTarget?: string | null;
}

export const AccountStaffingCommercialSection: React.FC<AccountStaffingCommercialSectionProps> = ({
  qaTeam,
  commercial,
  utilizationTarget,
  attritionTarget,
}) => {
  const formatPct = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'N/A';
    if (val <= 1) return `${(val * 100).toFixed(1)}%`;
    return `${val.toFixed(1)}%`;
  };

  const formatRawNumber = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'N/A';
    return val.toLocaleString('en-US');
  };

  const mappedHc = qaTeam.Mapped_QA_HC ?? qaTeam.Account_Mapped_QA_HC ?? null;
  const activeHc = qaTeam.Active_QA_HC ?? qaTeam.Active_Account_QA_HC ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* QA Team & Staffing Capacity Card */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-700" />
                QA Organization & Capacity Health
              </h2>
              <p className="text-xs text-slate-500">
                Staffing allocations, hierarchy distribution, and operational productivity.
              </p>
            </div>
            <StatusBadge status={qaTeam.Staffing_RAG} size="xs" />
          </div>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Total QA Headcount</div>
              <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                {mappedHc !== null ? mappedHc : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Active: <span className="font-mono font-semibold text-slate-700">{activeHc !== null ? activeHc : 'N/A'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                <span>QA Utilization</span>
                <StatusBadge status={qaTeam.QA_Utilization_RAG} size="xs" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                {formatPct(qaTeam.QA_Utilization)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                Target: {utilizationTarget || 'N/A'}
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                <span>QA Attrition</span>
                <StatusBadge status={qaTeam.QA_Attrition_RAG} size="xs" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                {formatPct(qaTeam.QA_Attrition)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                Target: {attritionTarget || 'N/A'}
              </div>
            </div>
          </div>

          {/* Hierarchy Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="text-[11px] font-bold text-slate-700 mb-1">Hierarchy Distribution</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">B1 (QA)</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{qaTeam.B1_QA_Count ?? 'N/A'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">B2 (TL)</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{qaTeam.B2_TL_Count ?? 'N/A'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">C1 (AM)</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{qaTeam.C1_AM_Count ?? 'N/A'}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">C2 (Mgr)</div>
                <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{qaTeam.C2_Manager_Count ?? 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Staffing Over/Under Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Net Staffing Over / Under:</span>
          <span className="font-mono font-bold text-slate-800">
            {qaTeam.Net_Staff_Over_Under !== null && qaTeam.Net_Staff_Over_Under !== undefined
              ? `${qaTeam.Net_Staff_Over_Under > 0 ? `+${qaTeam.Net_Staff_Over_Under}` : qaTeam.Net_Staff_Over_Under} FTEs` 
              : 'N/A'}
          </span>
        </div>
      </div>

      {/* Commercial & Value Realization Card */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-700" />
                Commercial Delivery & Value Add Initiatives
              </h2>
              <p className="text-xs text-slate-500">
                Billing realization, QaaS engagements, and TAP transformational projects.
              </p>
            </div>
            <StatusBadge status={commercial.Billing_RAG} size="xs" />
          </div>

          {/* Billing & FTE Delivery */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Billable vs Billed FTE</div>
              <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                {commercial.Billed_QA_FTE ?? 'N/A'} <span className="text-xs font-normal text-slate-400">/ {commercial.Billable_QA_FTE ?? 'N/A'}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Coverage: <span className="font-mono font-semibold text-slate-700">{formatPct(commercial.Billing_Coverage_Pct)}</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                <span>Revenue Performance</span>
                <StatusBadge status={commercial.Billing_RAG} size="xs" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                {formatRawNumber(commercial.Billed_Revenue)} <span className="text-xs font-normal text-slate-400">/ {formatRawNumber(commercial.Plan_Revenue)}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Achievement: <span className="font-mono font-semibold text-slate-700">{formatPct(commercial.Revenue_Achievement_Pct)}</span>
              </div>
            </div>
          </div>

          {/* QaaS & TAP Projects */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-600" />
                  QaaS Engagements
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {commercial.QAAS_Record_Count !== null && commercial.QAAS_Record_Count !== undefined ? `${commercial.QAAS_Record_Count} Total` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px] pt-1">
                <span>Target Value:</span>
                <span className="font-mono font-semibold text-slate-700">{formatRawNumber(commercial.QAAS_Target_Value)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Delivered Revenue:</span>
                <span className="font-mono font-bold text-slate-900">{formatRawNumber(commercial.QAAS_Revenue_Value)}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                  TAP Transformational
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {commercial.TAP_Project_Count !== null && commercial.TAP_Project_Count !== undefined ? `${commercial.TAP_Project_Count} Projects` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px] pt-1">
                <span>Target Benefit:</span>
                <span className="font-mono font-semibold text-slate-700">{formatRawNumber(commercial.TAP_Target_Benefit)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Realized Benefit:</span>
                <span className="font-mono font-bold text-slate-900">{formatRawNumber(commercial.TAP_Realized_Benefit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Impact Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Net Commercial Impact:</span>
          <span className="font-mono font-bold text-slate-800">
            {formatRawNumber(commercial.Net_Commercial_Impact)}
          </span>
        </div>
      </div>
    </div>
  );
};
