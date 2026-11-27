'use client';

import toast from 'react-hot-toast';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { programHolderScopeReview, unresolvedProgramHolderInterest } from '@/lib/program-holder/program-interest';

export default function ProgramHolderApplicationActions({
  applicationId,
  disabled,
  applicationData = {},
  updatedAt = null,
  programs = [],
}: {
  applicationId: string;
  disabled?: boolean;
  applicationData?: Record<string, unknown>;
  updatedAt?: string | null;
  programs?: Array<{ id: string; slug: string; title: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [programId, setProgramId] = useState('');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const review = programHolderScopeReview(applicationData);
  const needsScopeReview = unresolvedProgramHolderInterest(applicationData);
  const reviewedProgramAvailable = !review || programs.some((program) =>
    program.id === review.program_id && program.slug === review.program_slug);

  async function resolveScope(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || loading || !needsScopeReview || !programId || !confirmed || note.trim().length < 10) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/program-holder/applications/${applicationId}/resolve-scope`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId, note: note.trim(), confirmReviewed: confirmed, expectedUpdatedAt: updatedAt }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload?.success !== true) {
        if (payload?.scopeRecorded === true) router.refresh();
        throw new Error(payload?.error || 'Unable to confirm the saved program scope review.');
      }
      toast.success('Program scope recorded. Review the application before approving.');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save the program scope review.');
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (disabled || loading || needsScopeReview || !reviewedProgramAvailable) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/program-holder/applications/${applicationId}/approve`, {
        method: 'POST',
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Approve failed');
      }
      toast.success('Application approved');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve application');
    } finally {
      setLoading(false);
    }
  }

  async function deny() {
    if (disabled || loading) return;
    const reason = window.prompt('Reason for denial (optional):', '') || '';
    setLoading(true);
    try {
      const res = await fetch(`/api/program-holder/applications/${applicationId}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Deny failed');
      }
      toast.success('Application denied');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to deny application');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-w-64 space-y-3">
      {!disabled && needsScopeReview ? (
        <form onSubmit={resolveScope} className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-semibold text-slate-900">Resolve program scope</p>
          <p className="text-slate-700">Confirm the training scope with the applicant, then record the matching active program. The application will remain pending for a separate approval decision.</p>
          <label htmlFor={`program-scope-${applicationId}`} className="block font-medium text-slate-800">Verified active program</label>
          <select id={`program-scope-${applicationId}`} value={programId} onChange={(event) => setProgramId(event.target.value)} required disabled={loading || programs.length === 0} className="w-full rounded border border-slate-300 bg-white px-2 py-2">
            <option value="">Select a verified program</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.title} ({program.slug})</option>)}
          </select>
          {programs.length === 0 ? <p className="text-amber-900">No verified active programs are available. Confirm the program catalog before resolving this request.</p> : null}
          <label htmlFor={`scope-note-${applicationId}`} className="block font-medium text-slate-800">Scope review note</label>
          <textarea id={`scope-note-${applicationId}`} value={note} onChange={(event) => setNote(event.target.value)} required minLength={10} maxLength={2000} disabled={loading} rows={3} className="w-full rounded border border-slate-300 bg-white px-2 py-2" />
          <label className="flex items-start gap-2 text-slate-700">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} required disabled={loading} className="mt-1" />
            I reviewed the scope with the applicant and confirmed this program matches the agreed training.
          </label>
          <button type="submit" disabled={loading || !programId || !confirmed || note.trim().length < 10} className="rounded-lg bg-blue-700 px-3 py-2 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'Saving…' : 'Save scope review'}
          </button>
        </form>
      ) : null}
      {!disabled && !reviewedProgramAvailable ? <p className="text-sm text-amber-900">The reviewed program is no longer available in the active catalog. Confirm its availability before approval.</p> : null}
      <div className="flex items-center gap-2">
      <button
        onClick={approve}
        disabled={disabled || loading || needsScopeReview || !reviewedProgramAvailable}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Approve'}
      </button>
      <button
        onClick={deny}
        disabled={disabled || loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Deny
      </button>
      </div>
    </div>
  );
}
