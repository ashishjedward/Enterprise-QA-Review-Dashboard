import React, { useState, useRef, useLayoutEffect } from 'react';
import { DashboardDataProvider } from './context/DashboardDataContext';
import { FilterProvider, useFilters } from './context/FilterContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalFilterBar } from './components/layout/GlobalFilterBar';
import { MobileHeader } from './components/layout/MobileHeader';
import { MobileNavDrawer } from './components/layout/MobileNavDrawer';
import { MobileFilterBar } from './components/layout/MobileFilterBar';
import { useIsMobile } from './hooks/useIsMobile';
import { OverviewPage } from './pages/OverviewPage';
import { ProcessHealthPage } from './pages/ProcessHealthPage';
import { HygieneInputsPage } from './pages/HygieneInputsPage';
import { SlaDetailPage } from './pages/SlaDetailPage';
import { BestQmDetailPage } from './pages/BestQmDetailPage';
import { AccountDiagnosticPage } from './pages/AccountDiagnosticPage';
import { ActionsPage } from './pages/ActionsPage';
import { InsightsPage } from './pages/InsightsPage';
import { ValueAddsPage } from './pages/ValueAddsPage';
import { QATeamPage } from './pages/QATeamPage';
import { ReportsPage } from './pages/ReportsPage';
import { SentimentDrawer } from './components/drawers/SentimentDrawer';
import { HygieneDrawer } from './components/drawers/HygieneDrawer';
import { LeadershipAttentionDrawer } from './components/drawers/LeadershipAttentionDrawer';
import { AskGeminiDrawer } from './components/drawers/AskGeminiDrawer';
import { PageErrorBoundary } from './components/common/PageErrorBoundary';

const AppContent: React.FC = () => {
  const { activePage, navigateToPage } = useFilters();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isMobile = useIsMobile(768);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (isMobile) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    } else {
      mainScrollRef.current?.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    }
  }, [activePage, isMobile]);

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage />;
      case 'process-health':
        return <ProcessHealthPage />;
      case 'hygiene-inputs':
        return <HygieneInputsPage />;
      case 'sla-detail':
        return <SlaDetailPage />;
      case 'best-qm-detail':
        return <BestQmDetailPage />;
      case 'account-diagnostic':
        return <AccountDiagnosticPage />;
      case 'actions':
        return <ActionsPage />;
      case 'insights':
        return <InsightsPage />;
      case 'value-adds':
        return <ValueAddsPage />;
      case 'qa-team':
        return <QATeamPage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <OverviewPage />;
    }
  };

  // Mobile Application Shell (< 768px)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-[#0D9488] selection:text-white w-full max-w-none min-w-0 overflow-x-hidden">
        {/* Mobile-Only Header */}
        <MobileHeader onOpenNav={() => setIsMobileNavOpen(true)} />

        {/* Mobile Navigation Drawer (Overlay, Fixed) */}
        <MobileNavDrawer 
          isOpen={isMobileNavOpen} 
          onClose={() => setIsMobileNavOpen(false)} 
        />

        {/* Mobile Filter Bar & Bottom Sheet */}
        <MobileFilterBar />

        {/* Mobile Core Content Area */}
        <main className="flex-1 w-full max-w-none min-w-0 m-0 px-4 max-[340px]:px-3 py-3 overflow-x-hidden">
          <PageErrorBoundary
            activePage={activePage}
            onNavigateOverview={() => navigateToPage('overview')}
          >
            {renderCurrentPage()}
          </PageErrorBoundary>
        </main>

        {/* Global Interactive Drawers */}
        <SentimentDrawer />
        <HygieneDrawer />
        <LeadershipAttentionDrawer />
        <AskGeminiDrawer />
      </div>
    );
  }

  // Desktop Application Shell (>= 768px and >= 1024px)
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-[#0D9488] selection:text-white">
      {/* Persistent Enterprise Header */}
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main App Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Core Content Area */}
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto flex flex-col">
          {/* Persistent Global Filter Bar */}
          <GlobalFilterBar />

          {/* Page Routing Container with Safety Error Boundary */}
          <div className="p-3 sm:p-4.5 flex-1">
            <PageErrorBoundary
              activePage={activePage}
              onNavigateOverview={() => navigateToPage('overview')}
            >
              {renderCurrentPage()}
            </PageErrorBoundary>
          </div>
        </main>
      </div>

      {/* Global Interactive Drawers */}
      <SentimentDrawer />
      <HygieneDrawer />
      <LeadershipAttentionDrawer />
      <AskGeminiDrawer />
    </div>
  );
};

export default function App() {
  return (
    <DashboardDataProvider>
      <FilterProvider>
        <AppContent />
      </FilterProvider>
    </DashboardDataProvider>
  );
}
