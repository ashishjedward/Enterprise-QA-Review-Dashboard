import React, { useState } from 'react';
import { FileText, Download, Printer, CheckCircle, ArrowLeft, Calendar, ShieldCheck, Share2 } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const ReportsPage: React.FC = () => {
  const { navigateToPage, overallSla, overallBestQm, sentimentBreakdown, filteredAccounts, filters } = useFilters();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = (type: string) => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

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
          <span className="font-bold text-slate-900">Executive QA Governance Packs & Reports</span>
        </div>

        <button
          onClick={() => navigateToPage('overview')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-700" />
            <h1 className="text-base font-bold text-slate-900">
              Enterprise QA Review Pack &bull; {filters.timePeriod}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official executive summary prepared for VP/Director Quarterly Operational Reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('PDF')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Executive PDF</span>
          </button>
          <button
            onClick={() => handleExport('CSV')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Executive Governance Pack successfully prepared and compiled for local export.</span>
        </div>
      )}

      {/* Executive Report Preview Card */}
      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-xs space-y-6">
        {/* Pack Meta */}
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">Confidential &bull; QA Leadership Report</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">Enterprise Quality & Operational Governance Summary</div>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            Generated: August 2026<br />Scope: {filters.vertical} &bull; {filters.timePeriod}
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
            1. Core Executive Indicators
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500">Enterprise SLA:</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{overallSla}%</div>
              <span className="text-[10px] text-slate-500">Target: 95.0%</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500">BEST QM Score:</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{overallBestQm}%</div>
              <span className="text-[10px] text-slate-500">Benchmark: 90.0%</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500">Client Sentiment:</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{sentimentBreakdown.greenCount} Green / {sentimentBreakdown.redCount} Red</div>
              <span className="text-[10px] text-slate-500">Overall: {sentimentBreakdown.overallRag}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500">Value-adds (YTD):</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">$1.42M</div>
              <span className="text-[10px] text-emerald-700 font-semibold">105% of Target</span>
            </div>
          </div>
        </div>

        {/* Portfolio Table */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
            2. Account Performance Register
          </h3>
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-2">Account</th>
                  <th className="p-2">Vertical</th>
                  <th className="p-2">QA Lead</th>
                  <th className="p-2 text-right">SLA</th>
                  <th className="p-2 text-right">BEST QM</th>
                  <th className="p-2">Sentiment</th>
                  <th className="p-2">Risk Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((a) => (
                  <tr key={a.id}>
                    <td className="p-2 font-bold text-slate-900">{a.name}</td>
                    <td className="p-2 text-slate-600">{a.vertical}</td>
                    <td className="p-2 text-slate-700">{a.qaLeader}</td>
                    <td className="p-2 text-right font-mono font-bold">{a.slaScore}%</td>
                    <td className="p-2 text-right font-mono font-bold">{a.bestQmScore}%</td>
                    <td className="p-2">
                      <StatusBadge status={a.clientSentiment} size="xs" />
                    </td>
                    <td className="p-2 text-slate-600 text-[11px] truncate max-w-xs">
                      {a.topRisks?.[0] || 'Operational monitoring'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
