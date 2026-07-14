'use client';

/**
 * Global error handler for ChunkLoadError and dynamic import failures.
 * This component catches chunk loading errors and provides a recovery mechanism.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ChunkErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleChunkError = (event: CustomEvent<{ error: Error; chunkId?: string }>) => {
      console.error('[ChunkErrorHandler] Chunk load error detected:', event.detail);
    };

    // Listen for Next.js chunk errors
    window.addEventListener('chunkError', handleChunkError as EventListener);

    return () => {
      window.removeEventListener('chunkError', handleChunkError as EventListener);
    };
  }, []);

  return null;
}

interface ChunkErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export function ChunkErrorFallback({ error, reset }: ChunkErrorFallbackProps) {
  const isChunkError = 
    error.message?.includes('Loading chunk') ||
    error.message?.includes('ChunkLoadError') ||
    error.message?.includes('dynamically imported module') ||
    error.message?.includes('Failed to fetch');

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">
          {isChunkError ? 'Page Update in Progress' : 'Something Went Wrong'}
        </h2>
        <p className="text-slate-700 mb-6">
          {isChunkError 
            ? 'The application is being updated. Please refresh the page to load the latest version.'
            : 'An unexpected error occurred. Please try again or return home.'}
        </p>
        {isChunkError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-amber-800">
              <strong>Tip:</strong> This can happen after a deployment. Refreshing will load the newest version.
            </p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg transition font-semibold text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChunkErrorHandler;
