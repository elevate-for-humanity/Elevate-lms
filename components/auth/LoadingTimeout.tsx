'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LoadingTimeoutProps {
  timeout?: number; // milliseconds
  message?: string;
}

export function LoadingTimeout({
  timeout = 10000, // 10 seconds default
  message = "This is taking longer than expected..."
}: LoadingTimeoutProps) {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  if (!showTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto mb-4"></div>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-6" />

        <h2 className="text-2xl font-bold text-black mb-4">
          Loading Timeout
        </h2>

        <p className="text-black mb-6">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold"
          >
            <RefreshCw className="h-5 w-5" />
            Reload Page
          </button>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition font-semibold"
          >
            Sign In Again
          </Link>

          <Link
            href="/"
            className="text-brand-blue-600 hover:underline text-sm"
          >
            Go to Homepage
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Still having issues?{' '}
            <a href="/contact" className="text-brand-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
