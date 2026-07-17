'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function ProgramError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('=== PROGRAM PAGE ERROR ===');
    console.error('Message:', error.message);
    console.error('Name:', error.name);
    console.error('Stack:', error.stack);
    console.error('Digest:', error.digest);
    console.error('===========================');
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4 max-w-2xl">
        <div className="mb-8">
          <AlertCircle className="h-20 w-20 text-brand-red-500 mx-auto mb-6" />
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Program Page Error
          </h1>
          <p className="text-lg text-slate-700 mb-6">
            We encountered an error loading this program page.
          </p>
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-brand-red-800 font-mono">{error.message}</p>
            {error.stack && (
              <pre className="text-xs text-brand-red-700 mt-2 overflow-auto max-h-40">
                {error.stack}
              </pre>
            )}
          </div>
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
            href="/programs"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-900 rounded-lg hover:bg-white transition font-semibold"
          >
            View All Programs
          </Link>
        </div>
      </div>
    </div>
  );
}
