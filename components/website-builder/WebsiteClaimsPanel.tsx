'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { BadgeCheck, FileSearch, Loader2 } from 'lucide-react';

type Claim = {
  id: string;
  claim_key: string;
  claim_text: string;
  claim_category: string;
  status: 'draft' | 'pending_review' | 'verified' | 'rejected' | 'expired';
  evidence_reference: string | null;
  evidence_url: string | null;
  rejection_reason: string | null;
  verified_at: string | null;
};

const categories = [
  'business_fact', 'pricing', 'inventory', 'testimonial', 'rating', 'outcome',
  'operational_metric', 'credential', 'license', 'accreditation', 'contact', 'staff',
];

export function WebsiteClaimsPanel({ websiteId }: { websiteId: string }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ claimKey: '', claimText: '', claimValue: '', category: 'business_fact', evidenceReference: '', evidenceUrl: '' });

  async function load() {
    const response = await fetch(`/api/apps/website-builder/sites/${websiteId}/claims`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not load claim evidence');
    setClaims(Array.isArray(data.claims) ? data.claims : []);
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'Could not load claim evidence')); }, [websiteId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch(`/api/apps/website-builder/sites/${websiteId}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not submit claim');
      setNotice(data.message || 'Claim submitted for review.');
      setForm({ claimKey: '', claimText: '', claimValue: '', category: 'business_fact', evidenceReference: '', evidenceUrl: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit claim');
    } finally { setBusy(false); }
  }

  return (
    <section className="border-b border-slate-200 bg-white px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-emerald-100 p-3 text-emerald-800"><BadgeCheck className="h-5 w-5" /></span>
          <div>
            <h2 className="text-xl font-black text-slate-950">Verified website claims</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Keep real statistics, prices, testimonials, licenses, staff details, and outcomes by attaching evidence. Draft claims are preserved, but only staff-verified records can pass the publication gate.</p>
          </div>
        </div>

        {(error || notice) ? <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</div> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">Claim key<input required value={form.claimKey} onChange={(e) => setForm((v) => ({ ...v, claimKey: e.target.value }))} placeholder="student_count" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" /></label>
              <label className="text-sm font-bold text-slate-700">Category<select value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal">{categories.map((category) => <option key={category} value={category}>{category.replaceAll('_', ' ')}</option>)}</select></label>
            </div>
            <label className="block text-sm font-bold text-slate-700">Exact public claim<textarea required value={form.claimText} onChange={(e) => setForm((v) => ({ ...v, claimText: e.target.value }))} rows={3} placeholder="The exact statement, statistic, price, or testimonial to publish" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" /></label>
            <label className="block text-sm font-bold text-slate-700">Exact displayed value<input required value={form.claimValue} onChange={(e) => setForm((v) => ({ ...v, claimValue: e.target.value }))} placeholder="For example: 50, 98%, $45, or the exact testimonial quote" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" /></label>
            <label className="block text-sm font-bold text-slate-700">Evidence reference<input value={form.evidenceReference} onChange={(e) => setForm((v) => ({ ...v, evidenceReference: e.target.value }))} placeholder="Invoice, enrollment report, license number, signed testimonial…" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" /></label>
            <label className="block text-sm font-bold text-slate-700">Evidence URL<input type="url" value={form.evidenceUrl} onChange={(e) => setForm((v) => ({ ...v, evidenceUrl: e.target.value }))} placeholder="https://…" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" /></label>
            <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />} Submit evidence for review</button>
          </form>

          <div className="space-y-3">
            {claims.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No claims submitted yet. The website remains publishable as long as its content does not display unsupported material claims.</div> : claims.map((claim) => (
              <article key={claim.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black text-slate-950">{claim.claim_key}</p><span className={`rounded-full px-3 py-1 text-xs font-black ${claim.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : claim.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{claim.status.replaceAll('_', ' ')}</span></div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{claim.claim_text}</p>
                <p className="mt-2 text-xs text-slate-500">Evidence: {claim.evidence_url || claim.evidence_reference || 'missing'}</p>
                {claim.rejection_reason ? <p className="mt-2 text-xs font-semibold text-red-700">Review note: {claim.rejection_reason}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
