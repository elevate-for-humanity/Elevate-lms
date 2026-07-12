'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MarketingErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to console for debugging
    console.error('[Marketing Error]', error.message, error.stack);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
      <div className="max-w-2xl w-full bg-slate-800/50 border border-white/10 rounded-2xl p-8 md:p-12 text-center">
        <div className="mb-8">
          <AlertTriangle className="h-20 w-20 text-amber-500 mx-auto mb-6" />
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Page Error
          </h1>
          <p className="text-lg text-slate-400 mb-6">
            We encountered an error loading this page. Our team has been notified.
          </p>
          
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs font-mono text-red-400 break-words">{error.message}</p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-slate-400 cursor-pointer">Stack Trace</summary>
                  <pre className="text-xs text-slate-500 mt-2 overflow-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-500 hover:to-purple-500 transition-all font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all font-medium"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        {error.digest && (
          <p className="mt-6 text-xs text-slate-500">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
