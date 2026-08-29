import React from 'react';
import { TrendingUp, ArrowLeft, Zap, DollarSign, Award, CheckCircle2, ChevronRight } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { VALUE_ADDS_DATA } from '../data/dummyData';
import { StatusBadge } from '../components/common/StatusBadge';

export const ValueAddsPage: React.FC = () => {
  const { navigateToPage } = useFilters();

  const tapProjects = [
    { name: 'Speech Analytics Auto-Categorization', account: 'ApexFin Global', vertical: 'FinTech', savings: '$42,000 / yr', status: 'Deployed & Active' },
    { name: 'Automated HIPAA Compliance Scanner', account: 'MediCare Direct', vertical: 'Healthcare', savings: '$65,000 / yr', status: 'Pilot Phase 2' },
    { name: 'Omnichannel Chat Sentiment Trigger', account: 'NovaPay Solutions', vertical: 'FinTech', savings: '$38,000 / yr', status: 'Deployed & Active' },
    { name: 'Logistics Customs Tariff QA Bot', account: 'TransContinental Freight', vertical: 'Logistics', savings: '$50,000 / yr', status: 'In Validation' },
    { name: 'VIP Guest Escalation Prediction Model', account: 'Prestige Global Hospitality', vertical: 'Travel', savings: '$25,000 / yr', status: 'Deployed & Active' },
  ];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigateToPage('overview')}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Enterprise
          </button>
          <span>&gt;</span>
          <span className="font-bold text-slate-900">Value-adds & Transformation Program</span>
        </div>

        <button
          onClick={() => navigateToPage('overview')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>
      </div>

      {/* 3 Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {VALUE_ADDS_DATA.map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-slate-900">{item.metric}</span>
                <StatusBadge status={item.rag} size="xs" />
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900 font-mono">{item.currentValue}</span>
                <span className="text-xs font-bold text-emerald-700 font-mono">{item.trend}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">YTD Actualized:</span>
                <span className="font-bold text-slate-800 font-mono">{item.ytdValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan / Target:</span>
                <span className="font-bold text-slate-800 font-mono">{item.planTarget}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(item.progressPercent, 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active TAP Automation Projects */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Active TAP (Transformation & Automation Projects)
            </h3>
            <p className="text-xs text-slate-500">
              Ongoing automated audits, AI quality scoring models, and client cost-takeout deliveries.
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded font-mono border border-emerald-200">
            14 Active Pipelines
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Project Name</th>
                <th className="py-2.5 px-2">Account</th>
                <th className="py-2.5 px-2">Vertical</th>
                <th className="py-2.5 px-2">Projected Annual Savings</th>
                <th className="py-2.5 px-2">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tapProjects.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                  <td className="py-2.5 px-2 text-slate-800">{p.account}</td>
                  <td className="py-2.5 px-2 text-slate-600">{p.vertical}</td>
                  <td className="py-2.5 px-2 font-mono font-bold text-emerald-700">{p.savings}</td>
                  <td className="py-2.5 px-2">
                    <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
