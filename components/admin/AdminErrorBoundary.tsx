'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Failed to load</h2>
        <p className="text-sm text-slate-700 mb-4">An unexpected error occurred.</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    </div>
  );
}
