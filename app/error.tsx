'use client';
import { logger } from '@/lib/logger';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development, send to monitoring in production
    logger.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4 max-w-2xl">
        <div className="mb-8">
          <AlertCircle className="h-20 w-20 text-brand-red-500 mx-auto mb-6" />
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Something Went Wrong
          </h1>
          <p className="text-lg text-slate-700 mb-6">
            We encountered an unexpected error. Our team has been notified.
          </p>
          {/* Always show error details for debugging */}
          {error.message && (
            <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6">
              <p className="text-xs font-semibold text-brand-red-800 mb-1">Error:</p>
              <p className="text-sm text-brand-red-800 font-mono break-words">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-brand-red-600 mt-1">Error ID: {error.digest}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-900 rounded-lg hover:bg-white transition font-semibold"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
        </div>

        <div className="text-sm text-slate-700">
          <p>If this problem persists, please contact support:</p>
          <a href="/contact" className="text-brand-blue-600 hover:underline">
            our contact form
          </a>
        </div>
      </div>
    </div>
  );
}
