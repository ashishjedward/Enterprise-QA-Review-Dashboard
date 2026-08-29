import React, { useState, useRef, useEffect } from 'react';
import { Menu, Sparkles, MoreVertical, RefreshCw, Download, Clock } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

interface MobileHeaderProps {
  onOpenNav: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenNav }) => {
  const { lastUpdated, isRefreshing, refreshDashboard, openDrawer, navigateToPage, activePage } = useFilters();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close three-dot menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="h-[60px] bg-[#1A2B4B] text-white border-b border-slate-700/60 sticky top-0 z-30 px-3 flex items-center justify-between shadow-sm select-none">
      {/* LEFT: Hamburger button */}
      <button
        onClick={onOpenNav}
        aria-label="Open navigation menu"
        className="w-11 h-11 flex items-center justify-center rounded-xs text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* CENTER / MAIN: Enterprise QA Title */}
      <div className="flex items-center gap-2 flex-1 justify-center px-1 min-w-0">
        <div className="w-7 h-7 rounded-xs bg-[#0D9488] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
          QA
        </div>
        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
          Enterprise QA
        </h1>
      </div>

      {/* RIGHT: Ask Gemini icon + Three-dot menu */}
      <div className="flex items-center gap-1">
        {/* Ask Gemini icon button */}
        <button
          onClick={() => openDrawer('ask-gemini')}
          aria-label="Open Gemini Assistant"
          title="Ask Gemini"
          className="w-11 h-11 flex items-center justify-center rounded-xs text-teal-300 hover:text-teal-200 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-[#0D9488]" />
        </button>

        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="More options"
            className="w-11 h-11 flex items-center justify-center rounded-xs text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white rounded-xs shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800 animate-in fade-in duration-100 divide-y divide-slate-100">
              <div className="px-3.5 py-2 text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Updated: <strong className="text-slate-700">{lastUpdated}</strong></span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    refreshDashboard();
                    setIsMenuOpen(false);
                  }}
                  disabled={isRefreshing}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-[#0D9488] ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    navigateToPage('reports');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activePage === 'reports' ? 'text-[#0D9488] bg-teal-50/50 font-bold' : 'text-slate-700'
                  }`}
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Export Pack</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
