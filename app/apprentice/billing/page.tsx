'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Loader2, AlertTriangle } from 'lucide-react';

export default function ApprenticeBillingPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function redirect() {
      try {
        const res = await fetch('/api/billing/portal', { method: 'POST' });
        const data = await res.json();
        if (!res.ok || !data.url) {
          setError(data.error ?? 'Could not open billing portal');
          return;
        }
        window.location.href = data.url;
      } catch {
        setError('Could not connect to billing service');
      }
    }
    redirect();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Billing Portal Unavailable</h1>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <a
            href="/apprentice"
            className="inline-block bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-7 h-7 text-violet-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Opening Billing Portal…</h1>
        <p className="text-slate-500 text-sm mb-4">You&apos;ll be redirected to Stripe to manage your payment method and view invoices.</p>
        <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
      </div>
    </div>
  );
}
