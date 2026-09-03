'use client';

import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
      <div className="text-center px-4 max-w-lg">
        <AlertCircle className="h-16 w-16 text-brand-red-500 mx-auto mb-4" />
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">Something went wrong</h2>
        <p className="text-slate-700 mb-6">
          An unexpected error occurred. Please try again or return home.
        </p>
        {error.message && process.env.NODE_ENV === 'development' && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-3 mb-6 text-left">
            <p className="text-sm text-brand-red-800 font-mono break-all">{error.message}</p>
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
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition font-semibold text-sm"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
