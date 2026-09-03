'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Something went wrong
        </h1>
        <p className="text-slate-600 mb-6">
          We couldn't load your application status right now. Your application was still received — please save your reference number.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full px-6 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-center"
          >
            Return Home
          </Link>
          <a
            href="tel:3173143757"
            className="w-full px-6 py-3 text-slate-600 text-sm hover:text-slate-900 transition-colors"
          >
            Call (317) 314-3757 for help
          </a>
        </div>
      </div>
    </div>
  );
}
