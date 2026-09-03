'use client';

import { useEffect } from 'react';

export default function HostShopPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[host-shop] portal boundary failed', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-10">
      <section role="alert" className="mx-auto max-w-2xl rounded-3xl border border-red-300 bg-white p-6 shadow-lg sm:p-8">
        <p className="text-xs font-black uppercase tracking-widest text-red-700">Host Shop portal recovery</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">The dashboard connection was interrupted</h1>
        <p className="mt-3 font-medium leading-7 text-slate-700">Your account and records are still protected. Retry the live dashboard request. If the installed app has an old session, sign in again through the secure Host Shop login.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="min-h-12 rounded-xl bg-blue-800 px-5 py-3 font-black text-white">Retry dashboard</button>
          <a href="/host-shop/login?redirect=/host-shop/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900">Open secure login</a>
        </div>
      </section>
    </main>
  );
}
