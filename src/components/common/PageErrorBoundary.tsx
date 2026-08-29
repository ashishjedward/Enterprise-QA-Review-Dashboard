import React from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  activePage: string;
  onNavigateOverview: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class PageErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('PageErrorBoundary caught an uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  override componentDidUpdate(prevProps: Props): void {
    if (prevProps.activePage !== this.props.activePage && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReturnOverview = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onNavigateOverview();
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-8 p-6 bg-white border border-rose-200 rounded-md shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-900">Page could not be rendered</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                An unexpected exception was encountered while evaluating this page.
              </p>

              {this.state.error && (
                <div className="mt-3 p-3 bg-slate-900 text-rose-300 font-mono text-xs rounded border border-slate-800 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.message || 'Unknown runtime error'}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={this.handleReturnOverview}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A2B4B] hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Return to Overview</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
