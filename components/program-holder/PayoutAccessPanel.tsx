'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { UploadedW9Review } from './UploadedW9Review';
import type { UploadedW9Status } from '@/lib/program-holder/document-review';

type Status = {
  uploadedW9: UploadedW9Status;
  provider: 'paypal' | 'quickbooks' | 'branch' | null;
  destination: string | null;
  recipientEmail: string | null;
  transfersEnabled: boolean;
  payoutsEnabled: boolean;
  providerConfigured: boolean;
  quickbooksInvitationAvailable: boolean;
  verificationStatus: string;
  onboardingReady: boolean;
  missingRequirements: string[];
};

export function PayoutAccessPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(false);
  const [email, setEmail] = useState('');

  async function readResponse(response: Response) {
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Your session or connection changed. Reload and try again.');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Payout setup could not load.');
    return data;
  }
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/program-holder/payouts', { cache: 'no-store' });
      if (response.status === 403) { setPreview(true); return; }
      const data = await readResponse(response);
      setPreview(false); setStatus(data); setEmail(data.recipientEmail || '');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load payout setup.'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function act(body: Record<string, unknown>) {
    setBusy(true); setError(''); setMessage('');
    try {
      const data = await readResponse(await fetch('/api/program-holder/payouts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
      if (data.url) { window.location.assign(data.url); return; }
      setMessage(data.message || 'PayPal email saved for Elevate review. This does not confirm a bank account or send a payment.');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to continue.'); }
    finally { setBusy(false); }
  }
  const verified = Boolean(status?.payoutsEnabled && status?.transfersEnabled && status?.verificationStatus === 'active');
  const lockedProvider = verified ? status?.provider : null;
  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[.16em] text-blue-700">Program Holder banking and payments</p>
      <h2 className="text-2xl font-black">QuickBooks and PayPal setup</h2>
      <p className="text-sm text-slate-600">Enter bank details only on the provider’s secure website. Elevate does not store bank account, routing, or debit-card numbers. QuickBooks supports contractor direct deposit and payment records. PayPal receives payments to your confirmed PayPal email; link a bank within PayPal to withdraw funds.</p>
      {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-900"><p>{error}</p><button type="button" disabled={busy} onClick={() => void load()} className="mt-2 min-h-11 font-bold underline">Retry setup status</button></div>}
      {message && <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm">{message}</p>}
      {preview ? <p className="rounded-xl bg-blue-50 p-4">Administrator preview is read only. The Program Holder completes their own banking setup.</p> : status ? <>
        <UploadedW9Review status={status.uploadedW9} />
        <p className="text-sm">Current method: <strong>{status.provider === 'paypal' ? 'PayPal' : status.provider === 'quickbooks' ? 'QuickBooks' : 'Choose QuickBooks or PayPal'}</strong>. {verified ? 'Elevate has confirmed this payout setup.' : status.verificationStatus === 'pending' ? 'Destination saved; Elevate review is pending.' : 'Banking setup is incomplete.'}</p>
        {status.destination && <p className="text-sm">Saved destination: {status.destination}</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-3 rounded-xl border border-blue-200 p-4">
            <h3 className="text-lg font-black">QuickBooks direct deposit</h3>
            <p className="text-sm">Use your personal Intuit contractor invitation to complete QuickBooks tax and banking setup. Review the uploaded W-9 status above first. Elevate must issue the invitation from its QuickBooks contractor account.</p>
            <button type="button" disabled={busy || Boolean(lockedProvider && lockedProvider !== 'quickbooks')} onClick={() => void act({ provider: 'quickbooks', action: status.quickbooksInvitationAvailable ? 'onboard' : 'request_quickbooks' })} className="min-h-11 rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50">{status.quickbooksInvitationAvailable ? 'Open my QuickBooks invitation' : 'Request QuickBooks bank setup'}</button>
          </section>
          <section className="space-y-3 rounded-xl border border-blue-200 p-4">
            <h3 className="text-lg font-black">PayPal payouts</h3>
            <form className="space-y-3" onSubmit={event => { event.preventDefault(); void act({ provider: 'paypal', action: 'save_paypal', email, confirm: true }); }}>
              <label className="block text-sm font-bold">Your PayPal email<input type="email" maxLength={254} autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy || verified} className="mt-1 min-h-11 w-full min-w-0 rounded-lg border px-3 font-normal" /></label>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" required disabled={busy || verified} className="mt-1" />I control this email and want approved payments delivered to this PayPal account.</label>
              <button disabled={busy || verified} className="min-h-11 rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50">Save PayPal destination</button>
            </form>
            <a href="https://www.paypal.com/myaccount/money" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold text-blue-800 underline">Link or manage a bank in PayPal</a>
          </section>
        </div>
        <p className="text-sm text-slate-600">Saving a destination does not verify banking or release money. Payments still require your agreement, completion records, and Elevate’s approval. Verified destinations can be changed through <Link href="/program-holder/inbox" className="font-bold text-blue-700 underline">Office Mail</Link>.</p>
        {!status.onboardingReady && <div className="rounded-xl bg-amber-50 p-4 text-sm"><p className="font-bold">Payment release requirements remain outstanding:</p><ul className="mt-2 list-inside list-disc">{status.missingRequirements.map(item => <li key={item}>{item}</li>)}</ul></div>}
      </> : busy && <p role="status">Loading banking setup…</p>}
    </section>
  );
}
