import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application rendering:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetDatabase = () => {
    if (window.confirm('This will purge all local browser records and reset the seed database. Proceed?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = ROUTES.LOGIN;
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600">
              <AlertTriangle className="h-8 w-8 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Something went wrong
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                An unexpected rendering error occurred. The system logs have recorded this event.
              </p>
              {this.state.error && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] text-slate-400 font-mono text-left max-h-24 overflow-y-auto mt-2">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
              <Button 
                onClick={this.handleReload} 
                className="text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Application
              </Button>
              
              <Button 
                variant="outline" 
                onClick={this.handleResetDatabase} 
                className="text-xs font-semibold flex items-center justify-center gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <Database className="h-4 w-4" />
                Reset Database
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
