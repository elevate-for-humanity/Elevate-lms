'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw, LogOut } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <AlertCircle className="h-16 w-16 text-brand-red-600 mx-auto mb-6" />

        <h1 className="text-2xl font-bold text-black mb-4">
          Dashboard Error
        </h1>

        <p className="text-black mb-6">
          We couldn't load your dashboard. This might be a temporary issue.
        </p>

        {error.message && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-brand-red-800 font-mono break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition font-semibold"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>

          <Link
            href="/api/auth/signout"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-black rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            <LogOut className="h-5 w-5" />
            Sign Out & Try Again
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-black">
            Need help?{' '}
            <a href="mailto:info@elevateforhumanity.org" className="text-brand-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
