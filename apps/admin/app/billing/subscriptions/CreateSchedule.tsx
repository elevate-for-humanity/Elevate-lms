'use client';

import { useState } from 'react';

export function CreateSchedule() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') || '')
      .trim()
      .toLowerCase();
    const remaining = String(data.get('remaining') || '').trim();
    const response = await fetch('/api/admin/billing/schedules', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customerExternalKey: `email:${email}`,
        customerName: String(data.get('name') || '').trim(),
        customerEmail: email,
        canonicalProductKey: String(data.get('key') || '').trim(),
        productName: String(data.get('product') || '').trim(),
        amountCents: Math.round(Number(data.get('amount')) * 100),
        cadence: String(data.get('cadence')),
        nextInvoiceDate: String(data.get('date')),
        remainingInvoices: remaining ? Number(remaining) : null,
        legacyStripeSubscriptionId: String(data.get('stripeId') || '').trim() || undefined,
      }),
    });
    const result = await response.json();
    setMessage(
      response.ok
        ? 'QuickBooks invoice schedule saved.'
        : result.error || 'Schedule could not be saved.',
    );
    setSaving(false);
    if (response.ok) event.currentTarget.reset();
  }
  return (
    <div>
      <button
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white"
      >
        {open ? 'Close' : 'Create schedule'}
      </button>
      {open ? (
        <form
          onSubmit={submit}
          className="mt-4 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2"
        >
          <input
            name="name"
            required
            placeholder="Customer name"
            className="rounded-lg border px-3 py-2"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Customer email"
            className="rounded-lg border px-3 py-2"
          />
          <input
            name="key"
            required
            pattern="[a-z0-9][a-z0-9_-]*"
            placeholder="Canonical product key"
            className="rounded-lg border px-3 py-2"
          />
          <input
            name="product"
            required
            placeholder="Product or class"
            className="rounded-lg border px-3 py-2"
          />
          <input
            name="amount"
            type="number"
            min="1"
            step="0.01"
            required
            placeholder="Amount per invoice"
            className="rounded-lg border px-3 py-2"
          />
          <select name="cadence" className="rounded-lg border px-3 py-2">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
          <input name="date" type="date" required className="rounded-lg border px-3 py-2" />
          <input
            name="remaining"
            type="number"
            min="1"
            max="520"
            placeholder="Number of invoices (blank = ongoing)"
            className="rounded-lg border px-3 py-2"
          />
          <input
            name="stripeId"
            placeholder="Old Stripe subscription ID (optional)"
            className="rounded-lg border px-3 py-2 sm:col-span-2"
          />
          <button
            disabled={saving}
            className="rounded-lg bg-brand-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50 sm:col-span-2"
          >
            {saving ? 'Saving…' : 'Save schedule'}
          </button>
          {message ? <p className="text-sm sm:col-span-2">{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
