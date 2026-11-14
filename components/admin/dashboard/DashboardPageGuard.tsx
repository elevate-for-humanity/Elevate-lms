'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Catches client-side render / chunk-load failures in the dashboard tree so the
 * route error boundary (ERR_DASHBOARD_LOAD) is not shown for recoverable issues.
 */
export class DashboardPageGuard extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    const message = error.message || 'Dashboard panel failed to load';
    const isChunk =
      /chunk|loading chunk|failed to fetch dynamically imported module/i.test(message);
    return {
      hasError: true,
      message: isChunk
        ? 'A dashboard script failed to load (often after a deploy). Hard refresh usually fixes this.'
        : message,
    };
  }

  componentDidCatch(error: Error) {
    console.error('[admin dashboard guard]', error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  private handleHardRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-900">Part of the dashboard could not load</p>
              <p className="text-sm text-amber-800 mt-1">{this.state.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white border border-amber-200 text-amber-900 hover:bg-amber-100"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
                <button
                  type="button"
                  onClick={this.handleHardRefresh}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-700 text-white hover:bg-amber-800"
                >
                  Hard refresh
                </button>
                <Link
                  href="/operations"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-amber-200 text-amber-900 hover:bg-amber-100"
                >
                  Operations hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
