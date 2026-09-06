'use client';

import { useEffect, useState } from 'react';
import { AccountBillingShell } from '@/components/billing/AccountBillingShell';
import { Loader2, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function AccountPaymentMethodsPage() {
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<string | null>(null);

  useEffect(() => {
    setSetupStatus(new URLSearchParams(window.location.search).get('setup'));
  }, []);

  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/payment-method/setup', { method: 'POST' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || 'Secure payment setup did not open.');
      window.location.href = data.url;
    } catch {
      setSetupStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountBillingShell title="Payment methods">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {setupStatus === 'success' ? (
          <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-800">
            Your payment method was saved securely.
          </p>
        ) : null}
        {setupStatus && setupStatus !== 'success' && setupStatus !== 'cancelled' ? (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">
            The payment method could not be saved. Please try again.
          </p>
        ) : null}
        <CreditCard className="w-10 h-10 text-slate-400 mb-4" />
        <p className="text-slate-600 text-sm mb-4">
          Add or update your payment method securely with Stripe. Elevate never receives your card number.
        </p>
        <button
          type="button"
          onClick={openPortal}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Add or update payment method
        </button>
        <p className="mt-6 text-sm text-slate-500">
          Need a new plan?{' '}
          <Link href="/store/plans" className="text-brand-blue-600 font-semibold hover:underline">
            Compare plans
          </Link>
        </p>
      </div>
    </AccountBillingShell>
  );
}
