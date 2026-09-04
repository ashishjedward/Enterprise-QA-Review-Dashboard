import React, { useEffect } from 'react';
import { 
  X, 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  ListChecks, 
  Lightbulb, 
  FileText, 
  Sparkles, 
  Settings,
  Shield
} from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import { ActivePage } from '../../types';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: ActivePage;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  const { activePage, navigateToPage, openDrawer } = useFilters();
  const { overview } = useDashboardData();

  const overdueActionCount = overview?.Overdue_Actions ?? overview?.Action_Snapshot?.Overdue_Actions ?? 0;
  const redSentimentCount = overview?.Client_Sentiment_Red_Accounts ?? 0;

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
      badge: overdueActionCount > 0 ? overdueActionCount : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    { 
      id: 'insights', 
      label: 'Insights', 
      icon: Lightbulb,
      badge: redSentimentCount > 0 ? `${redSentimentCount} Alert` : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Dark backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Overlay Navigation Drawer */}
      <aside 
        className="fixed top-0 left-0 h-[100dvh] w-[min(84vw,320px)] bg-[#1A2B4B] text-white flex flex-col justify-between shadow-2xl z-50 border-r border-white/10 animate-in slide-in-from-left duration-200"
        aria-label="Mobile navigation"
      >
        {/* Top brand & Close header */}
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-[#0D9488] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              QA
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-teal-400 font-bold leading-tight">
                Enterprise
              </div>
              <div className="text-sm font-bold text-white tracking-tight leading-tight">
                Governance Cockpit
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="w-11 h-11 flex items-center justify-center rounded-xs text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items list */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
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
                  onClose();
                }}
                className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xs text-sm font-medium transition-all text-left relative cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white font-bold shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isActive && (
                    <div className="w-1 h-5 bg-[#0D9488] rounded-full absolute left-1" />
                  )}
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0D9488]' : 'text-white/60'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-xs font-bold font-mono shrink-0 ml-2 ${item.badgeColor || 'bg-white/20 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Ask Gemini shortcut */}
          <button
            onClick={() => {
              openDrawer('ask-gemini');
              onClose();
            }}
            className="w-full min-h-[44px] mt-2 flex items-center justify-between px-3 py-2.5 rounded-xs text-sm font-bold text-teal-300 bg-teal-950/60 border border-teal-700/50 hover:bg-teal-900/50 active:bg-teal-900/80 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[#0D9488] shrink-0" />
              <span>Ask Gemini</span>
            </div>
            <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded-xs font-mono font-bold">AI</span>
          </button>
        </div>

        {/* Bottom / Settings info */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <button
            onClick={() => {
              alert('Enterprise QA Governance v3.4.2\nTheme: Deep Navy & Teal Precision');
              onClose();
            }}
            className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xs text-sm text-white/70 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-white/50 shrink-0" />
            <span>Settings</span>
          </button>

          <div className="px-3 py-1 text-[10px] text-white/40 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-teal-400" /> ENTERPRISE QA
            </span>
            <span>v3.4.2</span>
          </div>
        </div>
      </aside>
    </div>
  );
};
