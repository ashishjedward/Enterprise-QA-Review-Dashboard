import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  AlertTriangle,
  Flame,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { RiskRadarRow, InsightsAttentionBand } from '../../types/api';
import { useFilters } from '../../context/FilterContext';

interface RiskRadarTableProps {
  rows: RiskRadarRow[];
}

export const RiskRadarTable: React.FC<RiskRadarTableProps> = ({ rows }) => {
  const { selectAccountAndNavigate } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBand, setSelectedBand] = useState<string>('ALL');
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<keyof RiskRadarRow>('attentionRank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Filter and sort logic
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (selectedBand !== 'ALL' && r.attentionBand !== selectedBand) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = r.accountName.toLowerCase().includes(query);
        const matchesId = r.accountId.toLowerCase().includes(query);
        const matchesVertical = r.vertical.toLowerCase().includes(query);
        const matchesLeader = r.qaLeader.toLowerCase().includes(query);
        const matchesDriver = r.primaryDriver.toLowerCase().includes(query);
        return matchesName || matchesId || matchesVertical || matchesLeader || matchesDriver;
      }
      return true;
    });
  }, [rows, selectedBand, searchTerm]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (Number(aVal) > Number(bVal) ? 1 : -1) : (Number(aVal) < Number(bVal) ? 1 : -1);
    });
  }, [filteredRows, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (field: keyof RiskRadarRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getBandBadge = (band: InsightsAttentionBand) => {
    switch (band) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-yellow-100 text-yellow-800 border border-yellow-200 whitespace-nowrap">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            WATCH
          </span>
        );
    }
  };

  const getSentimentBadge = (rag: string, score: number | null) => {
    if (score === null || rag === 'N/A') {
      return <span className="text-slate-400 font-mono text-xs">N/A</span>;
    }
    const color =
      rag === 'Red'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : rag === 'Amber'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border font-mono ${color}`}>
        {score.toFixed(1)}
      </span>
    );
  };

  const exportCsv = () => {
    const headers = [
      'Attention Rank',
      'Account ID',
      'Account Name',
      'Vertical',
      'QA Leader',
      'Sr Director',
      'Site',
      'LOB',
      'Attention Score',
      'Attention Band',
      'Primary Driver',
      'Red KPI Count',
      'Client Sentiment',
      'Open Escalations',
      'High/Critical Escalations',
      'Open ZT',
      'Open Actions',
      'Overdue Actions',
      'Active TAP At Risk',
    ];

    const csvData = sortedRows.map((r) => [
      r.attentionRank,
      r.accountId,
      `"${r.accountName.replace(/"/g, '""')}"`,
      `"${r.vertical}"`,
      `"${r.qaLeader}"`,
      `"${r.srDirector}"`,
      `"${r.site}"`,
      `"${r.lob}"`,
      r.attentionScore,
      r.attentionBand,
      `"${r.primaryDriver}"`,
      r.redKpiCount,
      r.clientSentiment ?? '',
      r.openEscalations,
      r.highCriticalEscalations,
      r.openZt,
      r.openActions,
      r.overdueActions,
      r.activeTapAtRisk,
    ]);

    const csvContent = [headers.join(','), ...csvData.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Risk_Radar_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-sky-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Enterprise Risk Radar Register
              </h2>
              <p className="text-xs text-slate-500">
                Displaying {filteredRows.length} of {rows.length} scoped accounts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search account, leader..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 w-48 sm:w-60"
              />
            </div>

            {/* Attention Band Filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-0.5">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'WATCH'] as const).map((band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => {
                    setSelectedBand(band);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                    selectedBand === band
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {band}
                </button>
              ))}
            </div>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
              <th
                onClick={() => handleSort('attentionRank')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Rank</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('accountName')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Account & Hierarchy</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('attentionScore')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Score & Band</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">Primary Driver</th>
              <th
                onClick={() => handleSort('redKpiCount')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Red KPIs</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">Sentiment</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Incidents (Esc / ZT)</th>
              <th
                onClick={() => handleSort('overdueActions')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Actions (Open / Ovd)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  No accounts match the specified criteria.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.accountId}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => selectAccountAndNavigate(row.accountId)}
                >
                  {/* Rank */}
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    #{row.attentionRank}
                  </td>

                  {/* Account */}
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                      {row.accountName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono">{row.accountId}</span>
                      <span>•</span>
                      <span>{row.vertical}</span>
                      <span>•</span>
                      <span>{row.qaLeader}</span>
                    </div>
                  </td>

                  {/* Score & Band */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {row.attentionScore}
                      </span>
                      {getBandBadge(row.attentionBand)}
                    </div>
                  </td>

                  {/* Primary Driver */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="text-xs text-slate-700 font-medium">
                      {row.primaryDriver}
                    </span>
                  </td>

                  {/* Red KPIs */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {row.redKpiCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                          {row.redKpiCount} Red
                        </span>
                        {row.redKpis.length > 0 && (
                          <span
                            className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]"
                            title={row.redKpis.join(', ')}
                          >
                            {row.redKpis.join(', ')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">0</span>
                    )}
                  </td>

                  {/* Sentiment */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {getSentimentBadge(row.clientSentimentRag, row.clientSentiment)}
                  </td>

                  {/* Incidents */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs">
                      {row.openEscalations > 0 ? (
                        <span className="text-rose-600 font-semibold">
                          {row.openEscalations} Esc ({row.highCriticalEscalations} HC)
                        </span>
                      ) : (
                        <span className="text-slate-400">0 Esc</span>
                      )}
                      <span>•</span>
                      {row.openZt > 0 ? (
                        <span className="text-rose-600 font-bold">
                          {row.openZt} ZT
                        </span>
                      ) : (
                        <span className="text-slate-400">0 ZT</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-slate-700">{row.openActions} Open</span>
                      <span>/</span>
                      <span
                        className={
                          row.overdueActions > 0
                            ? 'text-rose-600 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        {row.overdueActions} Ovd
                      </span>
                    </div>
                  </td>

                  {/* Action CTA */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectAccountAndNavigate(row.accountId);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 transition-colors cursor-pointer"
                    >
                      <span>360</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="ml-2">
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, sortedRows.length)} of {sortedRows.length} accounts
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
