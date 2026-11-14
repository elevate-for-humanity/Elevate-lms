'use client';
import { useState } from 'react';

interface CheckoutFlowProps {
  courseId: string;
  courseName: string;
  price: number;
  userId: string;
  onSuccess: (enrollmentId: string) => void;
}

/** Provider-neutral enrollment checkout. Card details are collected only on the QuickBooks-hosted page. */
export default function CheckoutFlow({ courseId, courseName, price }: CheckoutFlowProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function checkout() {
    setBusy(true);
    setError('');
    const response = await fetch('/api/programs/enroll/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ program_id: courseId, funding_source: 'self_pay' }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.checkoutUrl) {
      setError(body.error || 'Checkout is unavailable.');
      setBusy(false);
      return;
    }
    window.location.assign(body.checkoutUrl);
  }
  return (
    <section className="rounded-2xl border bg-white p-6">
      <h2 className="text-2xl font-bold">Review enrollment</h2>
      <p className="mt-2">{courseName}</p>
      <p className="mt-1 text-xl font-black">${price.toFixed(2)}</p>
      {error ? <p className="mt-3 font-bold text-red-700">{error}</p> : null}
      <button
        onClick={() => void checkout()}
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-brand-blue-700 px-5 py-3 font-black text-white disabled:opacity-60"
      >
        {busy ? 'Opening QuickBooks…' : 'Continue to secure payment'}
      </button>
      <p className="mt-3 text-xs text-slate-500">
        Card and bank details are entered on the QuickBooks payment page.
      </p>
    </section>
  );
}
