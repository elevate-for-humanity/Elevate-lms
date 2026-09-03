'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export type ReviewClaim = {
  id: string;
  claim_key: string;
  claim_text: string;
  claim_category: string;
  evidence_reference: string | null;
  evidence_url: string | null;
  methodology: string | null;
  status: string;
  updated_at: string;
  user_websites: { site_name: string | null } | null;
};

export function WebsiteClaimReviewClient({ initialClaims }: { initialClaims: ReviewClaim[] }) {
  const [claims, setClaims] = useState(initialClaims);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function decide(claim: ReviewClaim, decision: 'verify' | 'reject') {
    const rejectionReason = decision === 'reject' ? window.prompt('Why is this evidence insufficient or inaccurate?')?.trim() : '';
    if (decision === 'reject' && !rejectionReason) return;
    if (decision === 'verify' && !window.confirm('Confirm that you reviewed the evidence and this exact public claim is accurate?')) return;
    setBusy(claim.id); setError('');
    try {
      const response = await fetch(`/api/admin/website-claims/${claim.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, rejectionReason, reviewedUpdatedAt: claim.updated_at }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not record the review decision');
      setClaims((current) => current.filter((item) => item.id !== claim.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the review decision');
    } finally { setBusy(''); }
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</div> : null}
      {claims.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No website claims are awaiting review.</div> : claims.map((claim) => (
        <article key={claim.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-brand-red-700">{claim.claim_category.replaceAll('_', ' ')}</p><h2 className="mt-1 text-xl font-black text-slate-950">{claim.claim_key}</h2><p className="mt-1 text-sm text-slate-500">{claim.user_websites?.site_name || 'Website'} · submitted {new Date(claim.updated_at).toLocaleString()}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">pending review</span></div>
          <blockquote className="mt-5 rounded-xl border-l-4 border-slate-900 bg-slate-50 p-4 text-base font-semibold leading-7 text-slate-800">{claim.claim_text}</blockquote>
          <div className="mt-4 text-sm text-slate-600"><p><strong>Evidence:</strong> {claim.evidence_url ? <a className="text-brand-blue-700 underline" href={claim.evidence_url} target="_blank" rel="noreferrer">{claim.evidence_url}</a> : claim.evidence_reference}</p>{claim.methodology ? <p className="mt-2"><strong>Methodology:</strong> {claim.methodology}</p> : null}</div>
          <div className="mt-6 flex flex-wrap gap-3"><button disabled={busy === claim.id} onClick={() => void decide(claim, 'verify')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Verify evidence</button><button disabled={busy === claim.id} onClick={() => void decide(claim, 'reject')} className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-black text-red-700 disabled:opacity-50"><XCircle className="h-4 w-4" /> Reject with reason</button></div>
        </article>
      ))}
    </div>
  );
}
