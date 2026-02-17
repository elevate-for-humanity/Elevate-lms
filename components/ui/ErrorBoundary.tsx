'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  backHref?: string;
  backLabel?: string;
}

export function ErrorBoundaryUI({
  error,
  reset,
  title = 'Something Went Wrong',
  backHref,
  backLabel = 'Go Back',
}: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <AlertCircle className="h-20 w-20 text-brand-red-500 mx-auto mb-6" aria-hidden="true" />
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            We encountered an unexpected error. Our team has been notified.
          </p>
          {error.message && process.env.NODE_ENV === 'development' && (
            <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-brand-red-800 font-mono break-words">{error.message}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2"
            aria-label="Try loading the page again"
          >
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            Try Again
          </button>
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              {backLabel}
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <Home className="h-5 w-5" aria-hidden="true" />
              Go Home
            </Link>
          )}
        </div>

        <div className="text-sm text-gray-500">
          <p>If this problem persists, please contact support:</p>
          <a 
            href="mailto:support@elevateforhumanity.org" 
            className="text-brand-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            support@elevateforhumanity.org
          </a>
        </div>
      </div>
    </div>
  );
}
