'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  learnerId:     string;
  caseManagerId: string;
}

export default function AddPlacementForm({ learnerId, caseManagerId }: Props) {
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const [form, setForm] = useState({
    employer_name:       '',
    job_title:           '',
    employment_type:     'full_time',
    hourly_wage:         '',
    start_date:          '',
    verification_method: 'self_report',
    notes:               '',
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/case-manager/placements', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          learner_id:          learnerId,
          case_manager_id:     caseManagerId,
          employer_name:       form.employer_name,
          job_title:           form.job_title,
          employment_type:     form.employment_type,
          hourly_wage:         form.hourly_wage ? parseFloat(form.hourly_wage) : null,
          start_date:          form.start_date || null,
          verification_method: form.verification_method,
          notes:               form.notes || null,
          status:              'pending',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save placement.');
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-brand-blue-600 hover:underline"
      >
        + Add placement
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
      <h4 className="text-sm font-semibold text-gray-700">New Placement</h4>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Employer">
          <input required value={form.employer_name} onChange={(e) => update('employer_name', e.target.value)}
            className="input-sm" placeholder="Employer name" />
        </Field>
        <Field label="Job Title">
          <input required value={form.job_title} onChange={(e) => update('job_title', e.target.value)}
            className="input-sm" placeholder="Job title" />
        </Field>
        <Field label="Type">
          <select value={form.employment_type} onChange={(e) => update('employment_type', e.target.value)} className="input-sm">
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="apprenticeship">Apprenticeship</option>
            <option value="self_employed">Self-employed</option>
          </select>
        </Field>
        <Field label="Hourly Wage ($)">
          <input type="number" step="0.01" min="0" value={form.hourly_wage}
            onChange={(e) => update('hourly_wage', e.target.value)}
            className="input-sm" placeholder="0.00" />
        </Field>
        <Field label="Start Date">
          <input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)}
            className="input-sm" />
        </Field>
        <Field label="Verification Method">
          <select value={form.verification_method} onChange={(e) => update('verification_method', e.target.value)} className="input-sm">
            <option value="self_report">Self-report</option>
            <option value="employer_contact">Employer contact</option>
            <option value="pay_stub">Pay stub</option>
            <option value="offer_letter">Offer letter</option>
          </select>
        </Field>
      </div>

      <Field label="Notes">
        <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)}
          className="input-sm w-full" rows={2} placeholder="Optional notes" />
      </Field>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="rounded-md bg-brand-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-blue-700 disabled:opacity-50">
          {loading ? 'Saving…' : 'Save Placement'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
