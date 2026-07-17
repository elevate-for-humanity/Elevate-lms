'use client';

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
        <p className="text-slate-600 text-sm mb-4">
          Invoices and payment history are managed through Stripe Customer Portal.
        </p>
        <button
          type="button"
          onClick={openPortal}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Open billing portal
        </button>
      </div>
    </AccountBillingShell>
  );
}
