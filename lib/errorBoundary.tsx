import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree
 * Logs errors and displays a fallback UI instead of crashing the whole app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Here you could send error to tracking service (e.g., Sentry)
    // sendToErrorTracking(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-800 rounded-lg p-8 border border-red-500/50">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2 text-red-400">משהו השתבש</h1>
                <p className="text-gray-300 mb-4">
                  אירעה שגיאה בלתי צפויה. אנחנו מתנצלים על אי הנוחות.
                </p>

                {this.state.error && (
                  <div className="bg-gray-900/50 rounded-lg p-4 mb-4 border border-gray-700">
                    <p className="font-semibold text-red-300 mb-2">הודעת שגיאה:</p>
                    <pre className="text-sm text-gray-400 whitespace-pre-wrap overflow-x-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
                      פרטים טכניים (Development)
                    </summary>
                    <pre className="text-xs text-gray-500 bg-gray-900/50 rounded p-3 overflow-x-auto border border-gray-700">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    נסה שוב
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    טען מחדש את הדף
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper
 * Usage: <ErrorBoundaryWrapper>...</ErrorBoundaryWrapper>
 */
export const ErrorBoundaryWrapper: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
};
