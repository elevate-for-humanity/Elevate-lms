'use client';

import { useEffect } from 'react';
import { captureError } from '@/lib/monitoring/index';

export default function LmsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, {
      surface: 'lms-root-error-boundary',
      digest: error.digest,
      pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
  }, [error]);

  return (
    <main className="flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-slate-50 px-4 py-10">
      <section
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        role="alert"
        aria-live="assertive"
      >
        <p className="text-sm font-bold uppercase tracking-wide text-red-700">Workspace unavailable</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">We could not load this portal screen.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Your session has not been discarded. Retry the screen. If the problem continues, sign out and sign back in before contacting support.
        </p>
        {error.digest && (
          <p className="mt-3 break-all text-xs text-slate-500">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-lg bg-brand-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <a
            href="/lms/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2"
          >
            Return to dashboard
          </a>
        </div>
      </section>
    </main>
  );
}
