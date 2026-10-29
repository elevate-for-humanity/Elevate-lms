'use client';
import { useCallback, useEffect, useState } from 'react';
import { UploadedW9Review } from '@/components/program-holder/UploadedW9Review';
import type { UploadedW9Status } from '@/lib/program-holder/document-review';

type Banking = { uploadedW9: UploadedW9Status; invitationUrl: string; payout: { payout_provider: string; provider_recipient_id: string | null; paypal_recipient_email: string | null; verification_status: string } | null };
export function ProgramHolderBankingReview({ holderId }: { holderId: string }) {
  const [data, setData] = useState<Banking | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const endpoint = `/api/admin/program-holders/${holderId}/banking`;
  const load = useCallback(async () => {
    try { const r = await fetch(endpoint, { cache: 'no-store' }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setData(d); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to load banking review.'); }
  }, [endpoint]);
  useEffect(() => { void load(); }, [load]);
  async function submit(body: Record<string, unknown>) {
    setBusy(true); setMessage('');
    try { const r = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setMessage('Banking setup review saved. No payment was sent.'); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to save banking review.'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-black">QuickBooks and PayPal banking review</h2>
    <p className="text-sm">Review the existing uploaded W-9 below. In QuickBooks, open Payroll → Contractors and reconcile the contractor’s tax information and bank setup. Attach that actual Intuit invitation below. Complete and verify direct-deposit setup inside QuickBooks; creating an accounting vendor alone does not enable direct deposit.</p>
    <a href="https://quickbooks.intuit.com/learn-support/en-us/help-article/direct-deposits/set-manage-direct-deposit-contractors/L63N4nBv9_US_en_US" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold text-blue-700 underline">QuickBooks contractor setup instructions</a>
    {message && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm">{message}</p>}
    {!data ? <button type="button" onClick={() => void load()} className="min-h-11 font-bold underline">Reload banking review</button> : <>
      <UploadedW9Review status={data.uploadedW9} />
      <p className="text-sm">Selected provider: {data.payout?.payout_provider || 'Not selected'} · Status: {data.payout?.verification_status || 'Not started'}</p>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void submit({ action: 'save_invitation', url: form.get('url') }); }}>
        <label className="block text-sm font-bold">This holder’s QuickBooks invitation URL<input key={data.invitationUrl} name="url" type="url" required defaultValue={data.invitationUrl} className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" /></label>
        <button disabled={busy} className="min-h-11 rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50">Attach personal invitation</button>
      </form>
      {['quickbooks','paypal'].includes(data.payout?.payout_provider || '') && <form className="space-y-3 border-t pt-4" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); void submit({ action: 'confirm_setup', provider: data.payout?.payout_provider, reference: form.get('reference'), confirmed: true }); }}>
        {data.payout?.paypal_recipient_email && <p className="break-all text-sm">PayPal destination to review: {data.payout.paypal_recipient_email}</p>}
        <label className="block text-sm font-bold">Provider vendor ID or verification reference<input name="reference" required minLength={3} maxLength={120} className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" /></label>
        <p className="text-sm">Never enter bank account, routing, card numbers, or provider credentials here.</p>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1" />I checked the actual provider account and confirmed this holder’s destination and completed provider setup.</label>
        <button disabled={busy} className="min-h-11 rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-50">Record verified setup</button>
      </form>}
    </>}
  </section>;
}
