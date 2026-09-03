'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ProgramHolderTrainingLogForm({
  enrollments,
  programs,
}: {
  enrollments: any[];
  programs: any[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(formData: FormData) {
    setSaving(true);
    setMessage('');
    const response = await fetch('/api/program-holder/training-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(result.error || 'Training log could not be submitted.');
      return;
    }
    setMessage('Training log submitted for Admin review.');
    (document.getElementById('program-holder-training-log') as HTMLFormElement | null)?.reset();
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">Add student progress and training hours</h2>
      <p className="mt-1 text-sm text-slate-700">
        Submit one daily entry, or one weekly summary using the week-ending date.
      </p>
      <form
        id="program-holder-training-log"
        action={submit}
        className="mt-5 grid gap-4 md:grid-cols-2"
      >
        <label className="text-sm font-bold text-slate-800">
          Student
          <select
            name="enrollment_id"
            required
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal"
          >
            <option value="">Select an enrolled student</option>
            {enrollments.map((row) => (
              <option key={row.id} value={row.id}>
                {row.full_name || row.email || 'Student'} —{' '}
                {String(row.enrollment_state || row.status).replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-slate-800">
          Log type
          <select
            name="period_type"
            required
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal"
          >
            <option value="daily">Daily progress</option>
            <option value="weekly">Weekly summary</option>
          </select>
        </label>
        <label className="text-sm font-bold text-slate-800">
          Training date or week ending
          <input
            name="work_date"
            type="date"
            required
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal"
          />
        </label>
        <label className="text-sm font-bold text-slate-800">
          Training hours
          <input
            name="hours"
            type="number"
            required
            min="0.25"
            max="60"
            step="0.25"
            placeholder="8"
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal"
          />
        </label>
        <label className="text-sm font-bold text-slate-800">
          Student progress after this training (%)
          <input
            name="progress_percent"
            type="number"
            required
            min="0"
            max="100"
            step="1"
            placeholder="25"
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal"
          />
        </label>
        <label className="text-sm font-bold text-slate-800 md:col-span-2">
          What the student did
          <textarea
            name="activities"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            placeholder="Describe lessons, hands-on HVAC tasks, equipment, skills practiced, and results."
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal"
          />
        </label>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            disabled={saving || enrollments.length === 0}
            className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
            type="submit"
          >
            {saving ? 'Submitting…' : 'Submit training log'}
          </button>
          {message && (
            <p role="status" className="text-sm font-bold text-slate-800">
              {message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
