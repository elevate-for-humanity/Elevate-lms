'use client';

import { useState } from 'react';

export function CreateQuickBooksInvoice() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim().toLowerCase();
    const canonicalKey = String(form.get('canonicalKey') || '').trim();
    const amount = Number(form.get('amount'));
    try {
      const response = await fetch('/api/admin/billing/invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: `admin:${crypto.randomUUID()}`,
          customer: { externalKey: `email:${email}`, displayName: String(form.get('name') || '').trim(), email },
          dueDate: String(form.get('dueDate') || ''),
          memo: String(form.get('memo') || '').trim() || undefined,
          lines: [{ canonicalKey, name: String(form.get('itemName') || '').trim(), quantity: 1, unitAmountCents: Math.round(amount * 100) }],
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Invoice creation failed.');
      setMessage(result.invoice.paymentUrl ? 'Invoice created with a Pay Now link.' : 'Invoice created. QuickBooks online payments still need verification.');
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invoice creation failed.');
    } finally {
      setSaving(false);
    }
  }

  return <div>
    <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">{open ? 'Close' : 'Create QuickBooks invoice'}</button>
    {open ? <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
      <input name="name" required placeholder="Customer name" className="rounded-lg border px-3 py-2" />
      <input name="email" type="email" required placeholder="Customer email" className="rounded-lg border px-3 py-2" />
      <input name="canonicalKey" required pattern="[a-z0-9][a-z0-9_-]*" placeholder="Product key (example: barber-tuition)" className="rounded-lg border px-3 py-2" />
      <input name="itemName" required placeholder="Invoice item" className="rounded-lg border px-3 py-2" />
      <input name="amount" type="number" required min="1" step="0.01" placeholder="Amount" className="rounded-lg border px-3 py-2" />
      <input name="dueDate" type="date" required className="rounded-lg border px-3 py-2" />
      <input name="memo" placeholder="Memo (optional)" className="rounded-lg border px-3 py-2 sm:col-span-2" />
      <button disabled={saving} className="rounded-lg bg-brand-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50 sm:col-span-2">{saving ? 'Creating…' : 'Create invoice'}</button>
      {message ? <p className="text-sm text-slate-700 sm:col-span-2">{message}</p> : null}
    </form> : null}
  </div>;
}
