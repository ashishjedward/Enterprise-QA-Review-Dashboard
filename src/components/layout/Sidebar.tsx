import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  ListChecks, 
  Lightbulb, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sparkles
} from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { ActivePage } from '../../types';

interface NavItem {
  id: ActivePage;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen, onClose }) => {
  const { activePage, navigateToPage, filteredActions, sentimentBreakdown, openDrawer } = useFilters();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'process-health', label: 'Process Health', icon: Activity },
    { id: 'value-adds', label: 'Value-adds', icon: TrendingUp },
    { id: 'hygiene-inputs', label: 'Hygiene Inputs', icon: CheckCircle2 },
    { id: 'qa-team', label: 'QA Team', icon: Users },
    { 
      id: 'actions', 
      label: 'Actions', 
      icon: ListChecks,
      badge: filteredActions.filter((a) => a.status === 'Overdue').length || undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    { 
      id: 'insights', 
      label: 'Insights', 
      icon: Lightbulb,
      badge: sentimentBreakdown.redCount > 0 ? `${sentimentBreakdown.redCount} Alert` : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <aside
      className={`bg-[#1A2B4B] text-white flex flex-col justify-between transition-all duration-200 shrink-0 select-none z-20 ${
        collapsed ? 'w-14' : 'w-44'
      }`}
    >
      {/* Brand Header & Navigation Links */}
      <div className="p-2.5 flex flex-col">
        {/* Brand Block */}
        <div className="mb-3.5 px-1 flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-[#0D9488] rounded-xs flex items-center justify-center text-white font-bold text-[11px] shrink-0 shadow-xs">
                QA
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-[8px] uppercase tracking-widest text-teal-400 font-bold leading-tight">
                  Enterprise
                </div>
                <div className="text-[11px] font-bold text-white tracking-tight leading-tight">
                  Governance
                </div>
              </div>
            </div>
          ) : (
            <div className="h-6 w-6 bg-[#0D9488] rounded-xs flex items-center justify-center text-white font-bold text-[11px] mx-auto shadow-xs">
              QA
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-xs transition-colors cursor-pointer hidden md:flex items-center justify-center"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id || (
              item.id === 'process-health' && (activePage === 'sla-detail' || activePage === 'best-qm-detail')
            );

            return (
              <button
                key={item.id}
                onClick={() => {
                  navigateToPage(item.id);
                  if (onClose) onClose();
                }}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-xs text-xs transition-all text-left relative cursor-pointer group ${
                  isActive
                    ? 'bg-white/10 text-white font-medium shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="w-1 h-3.5 bg-[#0D9488] rounded-full absolute left-0.5" />
                )}

                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#0D9488]' : 'text-white/50 group-hover:text-white'}`} />
                
                {!collapsed && (
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate text-xs">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`text-[9px] px-1 py-0.2 rounded-xs font-bold shrink-0 ml-1 ${item.badgeColor || 'bg-white/20 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {collapsed && item.badge !== undefined && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
            );
          })}

          {/* Ask Gemini Shortcut */}
          <button
            onClick={() => {
              openDrawer('ask-gemini');
              if (onClose) onClose();
            }}
            title={collapsed ? 'Ask Gemini Assistant' : undefined}
            className="w-full mt-1.5 flex items-center space-x-2 px-2 py-1.5 rounded-xs text-xs font-medium text-teal-300 bg-teal-950/40 border border-teal-800/40 hover:bg-teal-900/40 transition-colors text-left cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
            {!collapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="truncate font-semibold text-xs">Ask Gemini</span>
                <span className="text-[8px] bg-teal-500/20 text-teal-300 px-1 rounded-xs font-mono font-bold">AI</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Footer / Settings */}
      <div className="p-2.5 border-t border-white/10 flex flex-col space-y-1">
        <button
          onClick={() => alert('Enterprise QA Governance v3.4.2\nDesign: Geometric Balance (Dense Enterprise Cockpit)\nTheme: Deep Navy & Teal Precision')}
          className="flex items-center space-x-2 px-2 py-1 rounded-xs text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors w-full cursor-pointer"
          title={collapsed ? 'Settings & System Info' : undefined}
        >
          <Settings className="w-3.5 h-3.5 text-white/40 shrink-0" />
          {!collapsed && <span className="truncate text-xs">Settings</span>}
        </button>

        {!collapsed && (
          <div className="px-2 py-0.5 text-[8px] text-white/40 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-teal-400" /> LOCAL PROTOTYPE
            </span>
            <span>v3.4.2</span>
          </div>
        )}
      </div>
    </aside>
  );
};
