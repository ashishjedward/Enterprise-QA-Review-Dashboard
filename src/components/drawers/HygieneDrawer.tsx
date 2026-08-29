import React from 'react';
import { X, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

export const HygieneDrawer: React.FC = () => {
  const { activeDrawer, closeDrawer, navigateToPage, selectedAccount } = useFilters();

  if (activeDrawer !== 'hygiene') return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0D9488] shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1A2B4B] uppercase tracking-tight">
                Hygiene Inputs & Governance
              </h2>
              <p className="text-xs text-slate-500">
                Core hygiene KPI dimensions & operational governance
              </p>
            </div>
          </div>

          <button
            onClick={closeDrawer}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-600">
          <div className="bg-teal-50/50 border border-teal-200 rounded-xs p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              Hygiene Governance Framework
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
              Hygiene governance monitors audit sample compliance, hygiene accuracy, calibration attendance, ATA internal/external assessments, and Training Needs Identification (TNI) publication adherence across all in-scope accounts.
            </p>
          </div>

          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Core Hygiene Dimensions
            </span>
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                <div className="font-bold text-[#1A2B4B]">M006 — Audit & Feedback</div>
                <div className="text-[11px] text-slate-500">Audit achievement target (95%) and feedback cycle timeliness.</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                <div className="font-bold text-[#1A2B4B]">M007 — Hygiene Audits</div>
                <div className="text-[11px] text-slate-500">Hygiene & compliance audit accuracy target (96%).</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                <div className="font-bold text-[#1A2B4B]">M008 — Calibration Attendance</div>
                <div className="text-[11px] text-slate-500">Account calibration attendance rate target (95%).</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                <div className="font-bold text-[#1A2B4B]">M009 — ATA Internal Assessment</div>
                <div className="text-[11px] text-slate-500">Internal quality self-assessment score target (95).</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                <div className="font-bold text-[#1A2B4B]">M010 — ATA External Client Score</div>
                <div className="text-[11px] text-slate-500">External client MSA quality score target (94).</div>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs">
                <div className="font-bold text-[#1A2B4B]">TNI Published Adherence</div>
                <div className="text-[11px] text-slate-500">Operational governance dimension tracking publication status across applicable accounts.</div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                closeDrawer();
                navigateToPage('hygiene-inputs');
              }}
              className="w-full flex items-center justify-between p-3 bg-[#1A2B4B] text-white rounded-xs hover:bg-[#2A3B5B] transition-colors cursor-pointer font-bold text-xs"
            >
              <span>View Full Hygiene Diagnostic Matrix</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {selectedAccount ? `Selected Account: ${selectedAccount}` : 'Scope: Enterprise'}
          </span>
          <button
            onClick={closeDrawer}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
