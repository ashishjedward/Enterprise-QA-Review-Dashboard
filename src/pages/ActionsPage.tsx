import React, { useState } from 'react';
import { 
  ListChecks, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Filter, 
  Search,
  ChevronRight, 
  ArrowLeft, 
  Calendar, 
  UserCheck
} from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { ACCOUNTS_DATA } from '../data/dummyData';
import { ActionItem } from '../types';

export const ActionsPage: React.FC = () => {
  const { filteredActions, navigateToPage, selectAccountAndNavigate } = useFilters();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Overdue' | 'Due Soon' | 'Open' | 'Closed'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const overdueCount = filteredActions.filter((a) => a.status === 'Overdue').length;
  const dueSoonCount = filteredActions.filter((a) => a.status === 'Due Soon').length;
  const openCount = filteredActions.filter((a) => a.status === 'Open').length;
  const closedCount = filteredActions.filter((a) => a.status === 'Closed').length;

  const displayedActions = filteredActions.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.account.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.owner.toLowerCase().includes(q) ||
        item.impactArea.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getAccountId = (accountName: string) => {
    const acc = ACCOUNTS_DATA.find((a) => a.name.toLowerCase() === accountName.toLowerCase() || a.id === accountName);
    return acc ? acc.id : accountName;
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => navigateToPage('overview')}
            className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            Enterprise
          </button>
          <span>&gt;</span>
          <span className="font-bold text-slate-900">Action & Closure Management</span>
        </div>

        <button
          onClick={() => navigateToPage('overview')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 rounded-md border cursor-pointer transition-colors flex flex-col justify-between ${
            statusFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-xs font-semibold">Total Actions</span>
          <div className="text-2xl font-black font-mono mt-1">{filteredActions.length}</div>
          <span className="text-[10px] opacity-80 mt-1">Across all filtered accounts</span>
        </div>

        <div
          onClick={() => setStatusFilter('Overdue')}
          className={`p-3 rounded-md border cursor-pointer transition-colors flex flex-col justify-between ${
            statusFilter === 'Overdue' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-rose-200 bg-rose-50/20 hover:bg-rose-50'
          }`}
        >
          <span className={`text-xs font-bold ${statusFilter === 'Overdue' ? 'text-white' : 'text-rose-800'}`}>
            Overdue Actions
          </span>
          <div className={`text-2xl font-black font-mono mt-1 ${statusFilter === 'Overdue' ? 'text-white' : 'text-rose-900'}`}>
            {overdueCount}
          </div>
          <span className={`text-[10px] ${statusFilter === 'Overdue' ? 'text-rose-100' : 'text-rose-700'}`}>
            Immediate intervention needed
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('Due Soon')}
          className={`p-3 rounded-md border cursor-pointer transition-colors flex flex-col justify-between ${
            statusFilter === 'Due Soon' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-amber-200 bg-amber-50/20 hover:bg-amber-50'
          }`}
        >
          <span className={`text-xs font-bold ${statusFilter === 'Due Soon' ? 'text-white' : 'text-amber-800'}`}>
            Due Next 7 Days
          </span>
          <div className={`text-2xl font-black font-mono mt-1 ${statusFilter === 'Due Soon' ? 'text-white' : 'text-amber-900'}`}>
            {dueSoonCount}
          </div>
          <span className={`text-[10px] ${statusFilter === 'Due Soon' ? 'text-amber-100' : 'text-amber-700'}`}>
            Under active execution
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('Open')}
          className={`p-3 rounded-md border cursor-pointer transition-colors flex flex-col justify-between ${
            statusFilter === 'Open' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className={`text-xs font-semibold ${statusFilter === 'Open' ? 'text-white' : 'text-slate-700'}`}>
            On-Track Open
          </span>
          <div className={`text-2xl font-black font-mono mt-1 ${statusFilter === 'Open' ? 'text-white' : 'text-slate-900'}`}>
            {openCount}
          </div>
          <span className={`text-[10px] ${statusFilter === 'Open' ? 'text-sky-100' : 'text-slate-500'}`}>
            Target date within timeline
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Pill Filter */}
          <span className="text-xs font-semibold text-slate-500 mr-1">Priority:</span>
          {(['ALL', 'High', 'Medium', 'Low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
                priorityFilter === p ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search account, action, owner..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Actions Table */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Account</th>
                <th className="py-2.5 px-2">Action Title</th>
                <th className="py-2.5 px-2">Owner</th>
                <th className="py-2.5 px-2">Action Type</th>
                <th className="py-2.5 px-2">Due Date</th>
                <th className="py-2.5 px-2">Priority</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-3">Impact Area & Root Cause</th>
                <th className="py-2.5 px-2 text-right">Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedActions.map((act) => {
                const accId = getAccountId(act.account);
                return (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => selectAccountAndNavigate(accId)}
                        className="font-bold text-slate-900 hover:text-sky-700 text-left cursor-pointer"
                      >
                        {act.account}
                      </button>
                    </td>
                    <td className="py-2.5 px-2 font-medium text-slate-800 max-w-sm">
                      {act.title}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="font-semibold text-slate-900">{act.owner}</div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-500">
                      {act.actionType}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-700 whitespace-nowrap">
                      {act.dueDate}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        act.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {act.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <StatusBadge status={act.status} size="xs" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      <div>{act.impactArea}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{act.rootCause}</div>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={() => selectAccountAndNavigate(accId)}
                        className="text-sky-700 font-semibold text-[11px] hover:underline flex items-center justify-end gap-0.5 cursor-pointer"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {displayedActions.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No actions match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
