import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileWarning, 
  Flame, 
  ShieldCheck 
} from 'lucide-react';
import { Account360Risk } from '../../types/api';

interface AccountGovernanceSectionProps {
  risk: Account360Risk;
}

export const AccountGovernanceSection: React.FC<AccountGovernanceSectionProps> = ({ risk }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            Monthly Governance & Operational Risk Diagnostics
          </h2>
          <p className="text-xs text-slate-500">
            Real-time multi-dimensional compliance, event exposure, and leadership governance signals.
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
          Priority: {risk.Attention_Band || 'N/A'} (Score: {risk.Attention_Score ?? 'N/A'})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Action Items Health */}
        <div className="p-3 bg-slate-50/70 rounded-md border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                Corrective Actions (CAPA)
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                risk.Overdue_Actions > 0 
                  ? 'bg-rose-100 text-rose-800' 
                  : risk.Open_Actions > 0 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-emerald-100 text-emerald-800'
              }`}>
                {risk.Open_Actions} Open
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-600 mt-2">
              <div className="flex justify-between">
                <span>Overdue Actions:</span>
                <span className={`font-mono font-bold ${risk.Overdue_Actions > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                  {risk.Overdue_Actions}
                </span>
              </div>
              <div className="flex justify-between">
                <span>High/Critical Priority:</span>
                <span className={`font-mono font-bold ${risk.High_Critical_Actions > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                  {risk.High_Critical_Actions}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
            {risk.Overdue_Actions > 0 ? `${risk.Overdue_Actions} Overdue Action${risk.Overdue_Actions > 1 ? 's' : ''}` : '0 Overdue Actions'}
          </div>
        </div>

        {/* 2. Escalations Health */}
        <div className="p-3 bg-slate-50/70 rounded-md border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-slate-600" />
                Escalation Register
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                risk.High_Critical_Escalations > 0 
                  ? 'bg-rose-100 text-rose-800' 
                  : risk.Open_Escalations > 0 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-emerald-100 text-emerald-800'
              }`}>
                {risk.Open_Escalations} Open
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-600 mt-2">
              <div className="flex justify-between">
                <span>High / Critical Severity:</span>
                <span className={`font-mono font-bold ${risk.High_Critical_Escalations > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                  {risk.High_Critical_Escalations}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Client-Sourced Open:</span>
                <span className={`font-mono font-bold ${risk.Client_Open_Escalations > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                  {risk.Client_Open_Escalations}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
            {risk.Open_Escalations > 0 ? `${risk.Open_Escalations} Open Escalation${risk.Open_Escalations > 1 ? 's' : ''}` : '0 Open Escalations'}
          </div>
        </div>

        {/* 3. CQM Non-Compliance */}
        <div className="p-3 bg-slate-50/70 rounded-md border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
              <span className="flex items-center gap-1">
                <FileWarning className="w-3.5 h-3.5 text-slate-600" />
                CQM Quality Feedback
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                risk.CQM_30_Plus > 0 
                  ? 'bg-rose-100 text-rose-800' 
                  : risk.Open_CQM > 0 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-emerald-100 text-emerald-800'
              }`}>
                {risk.Open_CQM} Open
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-600 mt-2">
              <div className="flex justify-between">
                <span>Aging 30+ Days:</span>
                <span className={`font-mono font-bold ${risk.CQM_30_Plus > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                  {risk.CQM_30_Plus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Oldest Open Incident:</span>
                <span className="font-mono font-bold text-slate-700">
                  {risk.Oldest_Open_CQM_Days !== null ? `${risk.Oldest_Open_CQM_Days} days` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
            {risk.Open_CQM > 0 ? `${risk.Open_CQM} Open Incident${risk.Open_CQM > 1 ? 's' : ''}` : '0 Open Incidents'}
          </div>
        </div>

        {/* 4. Zero Tolerance (ZT) */}
        <div className="p-3 bg-slate-50/70 rounded-md border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                Zero Tolerance (ZT)
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                risk.Open_ZT > 0 
                  ? 'bg-rose-100 text-rose-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {risk.Open_ZT} Open
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-600 mt-2">
              <div className="flex justify-between">
                <span>Requires HR Action:</span>
                <span className={`font-mono font-bold ${risk.Open_ZT_HR_Action > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                  {risk.Open_ZT_HR_Action}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Client-Identified Open:</span>
                <span className={`font-mono font-bold ${risk.Client_Open_ZT > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                  {risk.Client_Open_ZT}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Oldest Open:</span>
            <span className="font-mono text-slate-700 font-bold">
              {risk.Oldest_Open_ZT_Days !== null && risk.Oldest_Open_ZT_Days !== undefined ? `${risk.Oldest_Open_ZT_Days}d` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
