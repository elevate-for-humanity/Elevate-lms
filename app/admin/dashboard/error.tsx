'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function isChunkLoadError(error: Error & { digest?: string }): boolean {
  const text = `${error.message ?? ''} ${error.digest ?? ''}`.toLowerCase();
  return (
    text.includes('chunk') ||
    text.includes('dynamically imported module') ||
    text.includes('loading css chunk')
  );
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!isChunkLoadError(error)) return;
    const key = 'admin-dashboard-chunk-reload';
    if (typeof window === 'undefined' || sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    window.location.reload();
  }, [error]);

  const chunkHint = isChunkLoadError(error);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl border border-brand-red-200 p-8 text-center">
        <div className="w-12 h-12 bg-brand-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-brand-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Dashboard Error</h2>
        <p className="text-sm text-slate-700 mb-1">
          Failed to load dashboard data. This may be a temporary database issue or missing runtime
          secrets (Supabase service role).
        </p>
        <p className="text-xs text-slate-500 mb-4">
          {chunkHint
            ? 'Stale JavaScript after a deploy often causes this — a hard refresh (Ctrl+Shift+R) usually fixes it.'
            : 'Try a hard refresh first. If it persists, open Dev Studio → System health or confirm '}
          {!chunkHint && (
            <>
              <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> is set in Northflank.
            </>
          )}
        </p>
        <p className="text-xs text-slate-700 mb-6 font-mono break-all">
          {error.digest || error.message || 'ERR_DASHBOARD_LOAD'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link
            href="/admin/operations"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Operations hub
          </Link>
        </div>
      </div>
    </div>
  );
}
