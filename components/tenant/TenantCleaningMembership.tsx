'use client';
import { useState, type FormEvent } from 'react';
import { CLEANING_MEMBERSHIP, cleaningQuote, money } from '@/lib/cleaning/pricing';
import { useTenantRequestHeaders, useReadOnlyTenantPreview } from './TenantPreviewContext';

/** An invoice request cannot activate membership or grant a discount. */
export function TenantCleaningMembership({ accent }: { accent: string }) {
  const headers = useTenantRequestHeaders();
  const readOnly = useReadOnlyTenantPreview();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const example = cleaningQuote({ providerHourlyCents: 3000, cleanerHours: 3, member: true });
  async function requestInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || readOnly) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/tenant-sites/lead', { method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ name: form.get('name'), email: form.get('email'),
          path: window.location.pathname,
          membershipPlan: CLEANING_MEMBERSHIP.id,
          message: 'Request a $19 monthly Platinum Cleaning Membership invoice. Cleaning is charged separately. Benefits: 10% off eligible cleaning charges, capped at $50 per paid membership month. Cancel future renewal invoices before the next billing period by contacting 2Exclusive. No payment or membership activation has occurred through this form.' }) });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.error || 'Could not save your request.');
      setNotice('Your membership invoice request was received. Our team will confirm billing and activation with you. No payment was collected.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not save your request.'); }
    finally { setBusy(false); }
  }
  return <section className="mx-auto max-w-5xl px-5 py-14 sm:px-6">
    <h2 className="text-3xl font-black">Choose how you book cleaning</h2>
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <article className="rounded-2xl border bg-white p-6"><h3 className="text-2xl font-bold">Pay as you go</h3><p className="mt-3 text-3xl font-black">$0 membership</p><p className="mt-4 leading-7">Request a cleaning quote and pay the agreed price for each service. One-time and recurring cleaning are available without a paid membership.</p></article>
      <article className="rounded-2xl border border-slate-400 bg-white p-6"><h3 className="text-2xl font-bold">{CLEANING_MEMBERSHIP.name}</h3><p className="mt-3 text-3xl font-black">{money(CLEANING_MEMBERSHIP.monthlyPriceCents)} / month</p>
        <p className="mt-4 leading-7">Save 10% on eligible cleaning charges, up to $50 per paid membership month. Cleaning is billed separately. Provider payments and tips are not reduced.</p>
        <p className="mt-3 leading-7">Monthly invoices; no automatic card debit through this form. Cancel future renewal invoices before your next billing period by contacting 2Exclusive. Benefits begin after payment verification. Unused savings do not roll over. Taxes, tips, membership fees and separately priced extras are excluded from the discount.</p>
        <p className="mt-3 leading-7">Example: a {money(example.basePriceCents)} eligible cleaning becomes {money(example.customerPriceCents)}, saving {money(example.discountCents)} while you have savings available.</p>
        <p className="mt-3 leading-7">The monthly fee is recovered after $190 of eligible cleaning charges when the full 10% discount is available. Savings depend on actual use.</p>
        <form onSubmit={requestInvoice} className="mt-6 space-y-4">
          <label className="block font-bold">Your name<input name="name" required maxLength={160} autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-400 p-3" /></label>
          <label className="block font-bold">Invoice email<input name="email" type="email" required maxLength={240} autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-400 p-3" /></label>
          <label className="flex gap-3 leading-7"><input name="consent" type="checkbox" required className="mt-2" /><span>I understand the $19 monthly fee, separate cleaning charges, savings cap, and cancellation terms.</span></label>
          <button disabled={busy || readOnly} className="rounded-full px-6 py-3 font-bold text-white disabled:opacity-50" style={{ backgroundColor: accent }}>{busy ? 'Saving…' : 'Request membership invoice'}</button>
        </form>
      </article>
    </div>
    {notice ? <p role="status" className="mt-6 rounded-xl border p-4 leading-7">{notice}</p> : null}
  </section>;
}
