'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  learnerId: string;
  caseManagerId: string;
};

export default function AddPlacementForm({ learnerId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const payload = {
      learnerId,
      employerName: String(form.get('employerName') || ''),
      jobTitle: String(form.get('jobTitle') || ''),
      employmentType: String(form.get('employmentType') || ''),
      hourlyWage: String(form.get('hourlyWage') || ''),
      startDate: String(form.get('startDate') || ''),
      verificationMethod: String(form.get('verificationMethod') || ''),
      notes: String(form.get('notes') || ''),
    };

    try {
      const response = await fetch('/api/case-manager/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to save placement.');

      event.currentTarget.reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save placement.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-800"
      >
        Add Employment Placement
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-800">
          Employer name
          <input name="employerName" required maxLength={200} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-800">
          Job title
          <input name="jobTitle" required maxLength={200} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-800">
          Employment type
          <select name="employmentType" required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">Select type</option>
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="contract">Contract</option>
            <option value="apprenticeship">Apprenticeship</option>
            <option value="self_employed">Self-employed</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-800">
          Hourly wage
          <input name="hourlyWage" type="number" min="0" step="0.01" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-800">
          Start date
          <input name="startDate" type="date" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
        </label>
        <label className="text-sm font-medium text-slate-800">
          Verification method
          <select name="verificationMethod" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
            <option value="">Not selected</option>
            <option value="employer_contact">Employer contact</option>
            <option value="pay_stub">Pay stub</option>
            <option value="offer_letter">Offer letter</option>
            <option value="self_report">Self report</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-800">
        Notes
        <textarea name="notes" maxLength={4000} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
      </label>
      {error ? <p role="alert" className="text-sm font-medium text-red-700">{error}</p> : null}
      <div className="flex gap-2">
        <button disabled={saving} type="submit" className="rounded-lg bg-brand-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-800 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Placement'}
        </button>
        <button disabled={saving} type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
