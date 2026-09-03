'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ProgramHolderStudentCloseoutForm({ enrollments }: { enrollments: any[] }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  if (!enrollments.length) return null;

  async function submit(formData: FormData) {
    setSaving(true);
    setMessage('');
    const response = await fetch('/api/program-holder/student-closeouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(result.error || 'Closeout could not be saved.');
    setMessage('Student closeout completed and sent to Admin.');
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
      <h2 className="text-xl font-black">Student graduation closeout</h2>
      <p className="mt-1 text-sm text-slate-700">
        Document the full hands-on record before that student’s payment can be released.
      </p>
      <form action={submit} className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">
          Student
          <select
            name="enrollment_id"
            required
            className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 font-normal"
          >
            <option value="">Select student</option>
            {enrollments.map((row) => (
              <option key={row.id} value={row.id}>
                {row.full_name || row.email || 'Student'}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Total hands-on training hours
          <input
            name="total_hours_completed"
            type="number"
            min="0.25"
            max="1000"
            step="0.25"
            required
            className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 font-normal"
          />
        </label>
        <label className="text-sm font-bold">
          Training start date
          <input
            name="training_start_date"
            type="date"
            required
            className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 font-normal"
          />
        </label>
        <label className="text-sm font-bold">
          Training end date
          <input
            name="training_end_date"
            type="date"
            required
            className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 font-normal"
          />
        </label>
        <label className="text-sm font-bold">
          Certificate issue date
          <input
            name="certificate_issued_date"
            type="date"
            required
            className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 font-normal"
          />
        </label>
        <div className="grid gap-2">
          <label className="flex items-center gap-3 rounded-lg border bg-white p-3 text-sm font-bold">
            <input name="lms_completed" value="true" type="checkbox" required /> Coursework
            completed
          </label>
          <label className="flex items-center gap-3 rounded-lg border bg-white p-3 text-sm font-bold">
            <input name="practical_skills_verified" value="true" type="checkbox" required />{' '}
            Practical HVAC skills verified
          </label>
          <label className="flex items-center gap-3 rounded-lg border bg-white p-3 text-sm font-bold">
            <input name="certificate_received" value="true" type="checkbox" required /> Certificate
            received
          </label>
        </div>
        <label className="text-sm font-bold md:col-span-2">
          Final completion summary
          <textarea
            name="completion_summary"
            minLength={20}
            maxLength={2000}
            required
            rows={4}
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"
            placeholder="Summarize final competencies, hands-on work, attendance, and completion outcome."
          />
        </label>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            disabled={saving}
            className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Complete student closeout'}
          </button>
          {message && (
            <p role="status" className="text-sm font-bold">
              {message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
