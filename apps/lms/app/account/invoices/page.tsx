'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AccountBillingShell } from '@/components/billing/AccountBillingShell';
import { Loader2 } from 'lucide-react';

export default function AccountInvoicesPage() {
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
    <AccountBillingShell title="Invoices">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <Link href="/billing" className="font-semibold text-brand-blue-700 hover:underline">
          View invoices and payment history
        </Link>
        <p className="mt-4 mb-4 text-sm text-slate-600">Older Stripe billing records are available in the Stripe portal.</p>
        <button
          type="button"
          onClick={openPortal}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Open Stripe portal
        </button>
      </div>
    </AccountBillingShell>
  );
}
