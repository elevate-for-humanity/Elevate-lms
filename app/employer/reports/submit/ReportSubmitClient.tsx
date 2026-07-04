'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileCheck2, Send, AlertTriangle } from 'lucide-react';

type Defaults = {
  participantsServed: number;
  completions: number;
  placements: number;
};

export default function ReportSubmitClient({
  companyName,
  defaults,
}: {
  companyName: string;
  defaults: Defaults;
}) {
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);
  const [participantsServed, setParticipantsServed] = useState(defaults.participantsServed);
  const [completions, setCompletions] = useState(defaults.completions);
  const [placements, setPlacements] = useState(defaults.placements);
  const [retention90, setRetention90] = useState(0);
  const [submissionMethod, setSubmissionMethod] = useState('electronic');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const placementRate = useMemo(() => {
    if (!participantsServed) return 0;
    return Math.round((placements / participantsServed) * 100);
  }, [participantsServed, placements]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!periodStart || !periodEnd) {
      setError('Please choose a valid reporting period.');
      return;
    }

    if (new Date(periodStart) > new Date(periodEnd)) {
      setError('Start date cannot be after end date.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/employer/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart,
          periodEnd,
          participantsServed,
          completions,
          placements,
          retention90,
          submissionMethod,
          notes,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Submission failed');
      }

      setSuccess('Report submitted successfully and routed to admin compliance review.');
    } catch (err: any) {
      setError(err?.message || 'Unable to submit report right now.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-600 mb-1">
              Employer Portal
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Submit WIOA Report</h1>
            <p className="text-slate-600 mt-1">Quarterly workforce outcomes for {companyName}.</p>
          </div>
          <Link
            href="/employer/reports"
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Back to Reports
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Stat label="Participants" value={participantsServed} />
          <Stat label="Placements" value={placements} />
          <Stat label="Placement Rate" value={`${placementRate}%`} />
        </div>

        <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck2 className="w-5 h-5 text-brand-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Reporting Details</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Period Start">
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </Field>
            <Field label="Period End">
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Participants Served">
              <input
                type="number"
                min={0}
                value={participantsServed}
                onChange={(e) => setParticipantsServed(Number(e.target.value || 0))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </Field>
            <Field label="Completions">
              <input
                type="number"
                min={0}
                value={completions}
                onChange={(e) => setCompletions(Number(e.target.value || 0))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Job Placements">
              <input
                type="number"
                min={0}
                value={placements}
                onChange={(e) => setPlacements(Number(e.target.value || 0))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </Field>
            <Field label="90-Day Retention">
              <input
                type="number"
                min={0}
                value={retention90}
                onChange={(e) => setRetention90(Number(e.target.value || 0))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </Field>
          </div>

          <Field label="Submission Method">
            <select
              value={submissionMethod}
              onChange={(e) => setSubmissionMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="electronic">Electronic</option>
              <option value="api_upload">API Upload</option>
              <option value="manual_attestation">Manual Attestation</option>
            </select>
          </Field>

          <Field label="Notes for Compliance Team">
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Include context on data corrections, late outcomes, or exceptions."
            />
          </Field>

          {error && (
            <div className="rounded-lg border border-brand-red-200 bg-brand-red-50 px-4 py-3 text-brand-red-800 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-brand-green-200 bg-brand-green-50 px-4 py-3 text-brand-green-800 text-sm flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-brand-blue-600 inline-block flex-shrink-0 mt-0.5" aria-hidden="true" />
              {success}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              Submitted reports are tracked in admin compliance dashboards for review and follow-up.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 text-white px-5 py-2.5 font-semibold hover:bg-brand-blue-700 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-800 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
