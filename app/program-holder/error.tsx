"use client";

import React from 'react';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-brand-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-black mb-2">
          Something went wrong
        </h1>
        <p className="text-black mb-6">
          An unexpected error occurred. Please try again.
        </p>
        {error.message && process.env.NODE_ENV === 'development' && (
          <pre className="text-xs text-left bg-brand-red-50 p-3 rounded mb-4 overflow-auto">
            <code>{error.message}</code>
          </pre>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/program-holder/dashboard"
            className="px-6 py-3 bg-white hover:bg-slate-50 text-black font-semibold rounded-lg border-2 border-slate-300 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-slate-400 mt-4">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
