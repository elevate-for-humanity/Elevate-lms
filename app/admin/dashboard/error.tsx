'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl border border-brand-red-200 p-8 text-center">
        <div className="w-12 h-12 bg-brand-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-brand-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Error</h2>
        <p className="text-sm text-gray-500 mb-1">
          Failed to load dashboard data. This may be a temporary database issue.
        </p>
        <p className="text-xs text-gray-400 mb-6 font-mono">
          {error.digest || 'ERR_DASHBOARD_LOAD'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}
