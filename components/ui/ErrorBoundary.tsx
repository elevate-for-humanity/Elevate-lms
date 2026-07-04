'use client';

import { Component, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  backHref?: string;
  backLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — React class component that catches JavaScript errors
 * in child component tree and displays a fallback UI.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging - in production this is captured by Sentry
    console.error('[ErrorBoundary] Caught error:', error.message, errorInfo.componentStack);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-center max-w-2xl">
            <div className="mb-8">
              <AlertCircle className="h-20 w-20 text-brand-red-500 mx-auto mb-6" aria-hidden="true" />
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                {this.props.title || 'Something Went Wrong'}
              </h1>
              <p className="text-lg text-slate-700 mb-6">
                We encountered an unexpected error. Our team has been notified.
              </p>
              {this.state.error.message && process.env.NODE_ENV === 'development' && (
                <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-brand-red-800 font-mono break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={this.resetError}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="h-5 w-5" aria-hidden="true" />
                Try Again
              </button>
              {this.props.backHref ? (
                <Link
                  href={this.props.backHref}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition font-semibold"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  {this.props.backLabel || 'Go Back'}
                </Link>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition font-semibold"
                >
                  <Home className="h-5 w-5" aria-hidden="true" />
                  Go Home
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
