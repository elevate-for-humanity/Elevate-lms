'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function isStaleDeploymentAsset(error: Error & { digest?: string }): boolean {
  const text = `${error.message ?? ''} ${error.digest ?? ''}`.toLowerCase();
  return (
    text.includes('chunkloaderror') ||
    text.includes('loading chunk') ||
    text.includes('loading css chunk') ||
    text.includes('dynamically imported module')
  );
}

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const staleDeploymentAsset = isStaleDeploymentAsset(error);

  useEffect(() => {
    if (!staleDeploymentAsset || typeof window === 'undefined') return;

    const assetMatch = error.message?.match(/(?:chunks?\/|chunk\s+)([^\s)]+)/i);
    const assetKey = assetMatch?.[1] ?? error.digest ?? 'unknown';
    const recoveryKey = `admin-stale-asset-recovery:${assetKey}`;

    if (sessionStorage.getItem(recoveryKey) === '1') return;
    sessionStorage.setItem(recoveryKey, '1');

    const url = new URL(window.location.href);
    url.searchParams.set('__recover', Date.now().toString());
    window.location.replace(url.toString());
  }, [error, staleDeploymentAsset]);

  return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          {staleDeploymentAsset ? 'Refreshing the latest admin version' : 'Failed to load'}
        </h2>
        <p className="text-sm text-slate-700 mb-4">
          {staleDeploymentAsset
            ? 'A new version was deployed. This page is reconnecting automatically.'
            : 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => {
            if (staleDeploymentAsset) {
              const url = new URL(window.location.href);
              url.searchParams.set('__recover', Date.now().toString());
              window.location.replace(url.toString());
              return;
            }
            reset();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700"
        >
          <RefreshCw className="w-4 h-4" /> {staleDeploymentAsset ? 'Refresh now' : 'Retry'}
        </button>
      </div>
    </div>
  );
}
