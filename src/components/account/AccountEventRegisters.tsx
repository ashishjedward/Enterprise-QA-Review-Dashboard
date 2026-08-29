import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Flame, 
  FileWarning, 
  ShieldCheck,
  Search,
  ChevronDown
} from 'lucide-react';
import { 
  Account360Action, 
  Account360Escalation, 
  Account360Cqm, 
  Account360Zt 
} from '../../types/api';
import { StatusBadge } from '../common/StatusBadge';

interface AccountEventRegistersProps {
  actions: {
    Open: Account360Action[];
    Closed: Account360Action[];
  };
  escalations: Account360Escalation[];
  cqm: Account360Cqm[];
  zt: Account360Zt[];
}

type TabType = 'actions' | 'escalations' | 'cqm' | 'zt';

export const AccountEventRegisters: React.FC<AccountEventRegistersProps> = ({
  actions,
  escalations,
  cqm,
  zt,
}) => {
  const allActions = [...(actions.Open || []), ...(actions.Closed || [])];
  const [activeTab, setActiveTab] = useState<TabType>('actions');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionStatusFilter, setActionStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

  const filteredActions = allActions.filter((a) => {
    if (actionStatusFilter === 'OPEN' && a.Status === 'Closed') return false;
    if (actionStatusFilter === 'CLOSED' && a.Status !== 'Closed') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.Action_ID && a.Action_ID.toLowerCase().includes(q)) ||
      (a.Action && a.Action.toLowerCase().includes(q)) ||
      (a.Owner && a.Owner.toLowerCase().includes(q)) ||
      (a.Category && a.Category.toLowerCase().includes(q))
    );
  });

  const filteredEscalations = escalations.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.Escalation_ID && e.Escalation_ID.toLowerCase().includes(q)) ||
      (e.Type && e.Type.toLowerCase().includes(q)) ||
      (e.RCA && e.RCA.toLowerCase().includes(q)) ||
      (e.Action_Taken && e.Action_Taken.toLowerCase().includes(q)) ||
      (e.Status && e.Status.toLowerCase().includes(q))
    );
  });

  const filteredCqm = cqm.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.CQM_ID && c.CQM_ID.toLowerCase().includes(q)) ||
      (c.Incident_ID && c.Incident_ID.toLowerCase().includes(q)) ||
      (c.Employee_Name && c.Employee_Name.toLowerCase().includes(q)) ||
      (c.Reason_for_CAP && c.Reason_for_CAP.toLowerCase().includes(q)) ||
      (c.Action_for_CAP && c.Action_for_CAP.toLowerCase().includes(q))
    );
  });

  const filteredZt = zt.filter((z) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (z.ZT_ID && z.ZT_ID.toLowerCase().includes(q)) ||
      (z.Interaction_ID && z.Interaction_ID.toLowerCase().includes(q)) ||
      (z.ZTP_Reason && z.ZTP_Reason.toLowerCase().includes(q)) ||
      (z.Action_Proposed && z.Action_Proposed.toLowerCase().includes(q)) ||
      (z.Employee_Name && z.Employee_Name.toLowerCase().includes(q)) ||
      (z.Auditor_Name && z.Auditor_Name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Account Event Registers & Lineage Records
          </h2>
          <p className="text-xs text-slate-500">
            Granular event registers across operational CAPA, escalations, CQM incidents, and zero tolerance audits.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 w-48 text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mt-3 mb-4">
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'actions'
              ? 'bg-[#1A2B4B] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Corrective Actions ({allActions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('escalations')}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'escalations'
              ? 'bg-[#1A2B4B] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Escalations ({escalations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cqm')}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'cqm'
              ? 'bg-[#1A2B4B] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <FileWarning className="w-3.5 h-3.5" />
          <span>CQM Quality Feedback ({cqm.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('zt')}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'zt'
              ? 'bg-[#1A2B4B] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero Tolerance ({zt.length})</span>
        </button>
      </div>

      {/* 1. Actions Table */}
      {activeTab === 'actions' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
              <div className="inline-flex rounded border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button
                  onClick={() => setActionStatusFilter('ALL')}
                  className={`px-2 py-0.5 rounded font-medium ${actionStatusFilter === 'ALL' ? 'bg-white shadow-xs font-bold text-slate-800' : 'text-slate-600'}`}
                >
                  All ({allActions.length})
                </button>
                <button
                  onClick={() => setActionStatusFilter('OPEN')}
                  className={`px-2 py-0.5 rounded font-medium ${actionStatusFilter === 'OPEN' ? 'bg-white shadow-xs font-bold text-amber-800' : 'text-slate-600'}`}
                >
                  Open ({actions.Open?.length || 0})
                </button>
                <button
                  onClick={() => setActionStatusFilter('CLOSED')}
                  className={`px-2 py-0.5 rounded font-medium ${actionStatusFilter === 'CLOSED' ? 'bg-white shadow-xs font-bold text-emerald-800' : 'text-slate-600'}`}
                >
                  Closed ({actions.Closed?.length || 0})
                </button>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Showing {filteredActions.length} of {allActions.length}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Action ID</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Action Item Description</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Closure Date / Days</th>
                  <th className="py-2.5 px-3">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      No corrective action records found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredActions.map((item, idx) => (
                    <tr key={item.Action_ID || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {item.Action_ID || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">
                        <div>{item.Action || 'N/A'}</div>
                        {item.Remarks && (
                          <div className="text-[11px] text-slate-500 mt-0.5 italic">{item.Remarks}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.Priority === 'High' || item.Priority === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : item.Priority === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : item.Priority === 'Low'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.Priority || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{item.Owner || 'N/A'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.Overdue_Flag
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : item.Status === 'Closed' || (!item.Is_Active && !item.Overdue_Flag)
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : item.Is_Active || item.Status === 'Open' || item.Status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {item.Status || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {item.Due_Date ? item.Due_Date.substring(0, 10) : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {item.Closure_Date ? item.Closure_Date.substring(0, 10) : item.Days_Open !== null && item.Days_Open !== undefined ? `${item.Days_Open}d open` : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {item.Category || item.Risk_Type || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Escalations Table */}
      {activeTab === 'escalations' && (
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Escalation ID</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Ageing (Days)</th>
                <th className="py-2.5 px-3 min-w-[200px]">RCA / Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEscalations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                    No escalation records found for this account.
                  </td>
                </tr>
              ) : (
                filteredEscalations.map((esc, idx) => (
                  <tr key={esc.Escalation_ID || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {esc.Escalation_ID || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        esc.Is_Client_Sourced || esc.Source?.toLowerCase().includes('client')
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {esc.Source || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        esc.Criticality === 'High' || esc.Criticality === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : esc.Criticality === 'Medium' || esc.Criticality === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : esc.Criticality === 'Low'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {esc.Criticality || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium whitespace-nowrap">{esc.Type || 'N/A'}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        esc.Is_Closed || esc.Status === 'Closed' || esc.Status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : esc.Is_Open || esc.Status === 'Open'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {esc.Status || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {esc.Escalation_Date ? esc.Escalation_Date.substring(0, 10) : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {esc.Days_Open !== null && esc.Days_Open !== undefined ? `${esc.Days_Open}d` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div className="font-medium">{esc.RCA || 'N/A'}</div>
                      {esc.Action_Taken && (
                        <div className="text-[11px] text-slate-500 mt-0.5">Action: {esc.Action_Taken}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. CQM Table */}
      {activeTab === 'cqm' && (
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">CQM ID</th>
                <th className="py-2.5 px-3">Incident ID</th>
                <th className="py-2.5 px-3">Incident Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Ageing (Days)</th>
                <th className="py-2.5 px-3">Employee / Role</th>
                <th className="py-2.5 px-3 min-w-[200px]">Reason & Action for CAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCqm.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                    No Customer Quality Management (CQM) incidents found for this account.
                  </td>
                </tr>
              ) : (
                filteredCqm.map((item, idx) => (
                  <tr key={item.CQM_ID || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {item.CQM_ID || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.Incident_ID || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.Incident_Date ? item.Incident_Date.substring(0, 10) : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.Is_Closed || item.Status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : item.Is_Open || item.Status === 'Open'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {item.Status || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                      <span className={item.Ageing_Days && item.Ageing_Days > 30 ? 'text-rose-700 font-bold' : ''}>
                        {item.Ageing_Days !== null && item.Ageing_Days !== undefined ? `${item.Ageing_Days}d` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      <div className="font-medium">{item.Employee_Name || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">{item.Designation || 'N/A'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div className="font-medium text-slate-900">{item.Reason_for_CAP || 'N/A'}</div>
                      {item.Action_for_CAP && (
                        <div className="text-[11px] text-slate-500 mt-0.5">CAPA: {item.Action_for_CAP}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Zero Tolerance Table */}
      {activeTab === 'zt' && (
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">ZT ID</th>
                <th className="py-2.5 px-3">Interaction ID</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">HR Action Req</th>
                <th className="py-2.5 px-3">Closure Status</th>
                <th className="py-2.5 px-3">Auditor / Employee</th>
                <th className="py-2.5 px-3 min-w-[200px]">ZTP Reason & Action Proposed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredZt.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                    No Zero Tolerance (ZT) audit records found for this account.
                  </td>
                </tr>
              ) : (
                filteredZt.map((item, idx) => (
                  <tr key={item.ZT_ID || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {item.ZT_ID || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.Interaction_ID || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.Source?.toLowerCase().includes('client')
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {item.Source || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.Requires_HR_Action
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.Requires_HR_Action ? 'Yes (HR Action)' : 'No'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.Is_Closed || item.Closure_Status === 'Closed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : item.Is_Open || item.Closure_Status === 'Open'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {item.Closure_Status || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      <div className="font-medium">{item.Employee_Name || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.Auditor_Name ? `Auditor: ${item.Auditor_Name}` : 'Auditor: N/A'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div className="font-medium text-slate-900">{item.ZTP_Reason || 'N/A'}</div>
                      {item.Action_Proposed && (
                        <div className="text-[11px] text-slate-500 mt-0.5">Proposed: {item.Action_Proposed}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
