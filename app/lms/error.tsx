'use client';

import { logger } from '@/lib/logger';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw, BookOpen } from 'lucide-react';

export default function LMSError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('LMS error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <AlertCircle className="h-16 w-16 text-brand-red-600 mx-auto mb-6" />

        <h1 className="text-2xl font-bold text-black mb-4">
          LMS Loading Error
        </h1>

        <p className="text-black mb-6">
          We couldn't load your learning content. Your progress is saved.
        </p>

        {error.message && process.env.NODE_ENV === 'development' && (
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
            Reload Course
          </button>

          <Link
            href="/lms/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-black rounded-lg hover:bg-gray-200 transition font-semibold"
          >
            <BookOpen className="h-5 w-5" />
            Back to Courses
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-black rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-black">
            Technical issues?{' '}
            <a href="/contact" className="text-brand-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
