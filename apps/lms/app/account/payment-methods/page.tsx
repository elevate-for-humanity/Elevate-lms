'use client';

import { useState } from 'react';
import { AccountBillingShell } from '@/components/billing/AccountBillingShell';
import { Loader2, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function AccountPaymentMethodsPage() {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/license/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountBillingShell title="Payment methods">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <CreditCard className="w-10 h-10 text-slate-400 mb-4" />
        <p className="text-slate-600 text-sm mb-4">
          Update cards and default payment method in the secure Stripe portal.
        </p>
        <button
          type="button"
          onClick={openPortal}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Manage payment methods
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
