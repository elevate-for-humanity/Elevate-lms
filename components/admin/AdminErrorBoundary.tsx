'use client';

import { useEffect } from 'react';
import { installChunkRecovery } from '@/lib/browser/chunk-recovery-bootstrap';
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

    const notify = () =>
      new CustomEvent('elevate:chunk-error', {
        detail: `${error.message ?? ''} ${error.digest ?? ''}`,
        cancelable: true,
      });
    // The head bootstrap owns automatic recovery. A second per-asset fence can
    // race that navigation and send Course Builder back to the old dashboard.
    if (!window.dispatchEvent(notify())) return;

    // A root-layout failure can render global-error without the head script.
    // Install the same bounded handler only when no existing owner acknowledged.
    const cleanup = installChunkRecovery(window);
    window.dispatchEvent(notify());
    return cleanup;
  }, [error, staleDeploymentAsset]);

  return (
    <div role="alert" className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          {staleDeploymentAsset
            ? 'Refreshing the latest admin version'
            : 'Dashboard records could not load'}
        </h2>
        <p className="text-sm text-slate-700 mb-4">
          {staleDeploymentAsset
            ? 'A new version was deployed. This page is reconnecting automatically.'
            : 'Your records could not be loaded. Try again to reconnect.'}
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
          className="inline-flex min-h-12 items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700"
        >
          <RefreshCw className="w-4 h-4" /> {staleDeploymentAsset ? 'Refresh now' : 'Try again'}
        </button>
      </div>
    </div>
  );
}
