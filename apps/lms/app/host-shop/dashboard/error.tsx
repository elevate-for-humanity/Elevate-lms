'use client';

import { useEffect } from 'react';

export default function HostShopDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[host-shop/dashboard] workspace render failed', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-3 py-8 sm:px-6">
      <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950 shadow-sm">
        <h1 className="text-xl font-black">This workspace did not finish loading</h1>
        <p className="mt-2 font-medium leading-6">
          Your account has not been signed out. Retry the secure request, or return to the dashboard if the connection was interrupted.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">
            Retry workspace
          </button>
          <a href="/host-shop/dashboard" className="inline-flex min-h-11 items-center rounded-xl border border-amber-400 bg-white px-5 py-3 font-black">
            Return to dashboard
          </a>
        </div>
      </section>
    </main>
  );
}
