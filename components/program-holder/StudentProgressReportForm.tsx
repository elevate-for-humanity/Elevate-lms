'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function StudentProgressReportForm({
  students,
  initialEnrollmentId = '',
}: {
  students: { id: string; full_name?: string | null }[];
  initialEnrollmentId?: string;
}) {
  const router = useRouter();
  const selectedEnrollmentId = students.some((student) => student.id === initialEnrollmentId)
    ? initialEnrollmentId
    : '';
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      values = new FormData(form);
    const checks = [
      'attendance',
      'instruction',
      'practice',
      'assessment',
      'safety',
      'support',
    ].filter((key) => values.get(key) === 'on');
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/program-holder/student-progress-reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: values.get('student'),
          start: values.get('start'),
          end: values.get('end'),
          hours: Number(values.get('hours')),
          progress: values.get('progress'),
          checks,
          notes: values.get('notes'),
        }),
      });
      if (!response.headers.get('content-type')?.includes('application/json'))
        throw new Error('Your session could not be verified. Reload and try again.');
      const result = await response.json();
      if (!response.ok || result.ok !== true)
        throw new Error(result.error || 'Unable to save report.');
      setMessage('Report submitted for review.');
      form.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save report. Please retry.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <section
      id="student-progress-report"
      aria-label="Student progress report"
      className="min-w-0 scroll-mt-6 rounded-xl border bg-white p-4 sm:p-5"
    >
      <h2 className="text-xl font-bold">Student progress report</h2>
      <p>
        Record instruction, practice, assessments, and support for an enrolled student. You can
        submit this report before clock hours are verified. Reported hours require separate
        verification and do not award training credit.
      </p>
      <form className="mt-4 grid gap-3" onSubmit={submit}>
        <label>
          Student name
          <select
            name="student"
            required
            defaultValue={selectedEnrollmentId}
            className="block w-full rounded border p-2"
          >
            <option value="">Choose student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name || 'Name unavailable'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start date
          <input name="start" required type="date" className="block w-full rounded border p-2" />
        </label>
        <label>
          End date
          <input name="end" required type="date" className="block w-full rounded border p-2" />
        </label>
        <label>
          Reported hours
          <input
            name="hours"
            required
            type="number"
            min="0"
            max="168"
            step="0.25"
            className="block w-full rounded border p-2"
          />
        </label>
        <label>
          Progress
          <select name="progress" required className="block w-full rounded border p-2">
            <option value="on_track">On track</option>
            <option value="needs_support">Needs support</option>
            <option value="at_risk">At risk</option>
            <option value="milestone_met">Milestone met — review required</option>
          </select>
        </label>
        <fieldset className="grid min-w-0 gap-2 rounded border p-3">
          <legend className="font-bold">Progress checklist</legend>
          {[
            ['attendance', 'Attended training'],
            ['instruction', 'Completed instruction'],
            ['practice', 'Practiced skills'],
            ['assessment', 'Completed assessment'],
            ['safety', 'Reviewed safety'],
            ['support', 'Support needs addressed'],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 focus-within:outline focus-within:outline-2 focus-within:outline-blue-600"
            >
              <input type="checkbox" name={key} className="h-8 w-8 shrink-0 accent-blue-700" />{' '}
              <span className="min-w-0">{label}</span>
            </label>
          ))}
        </fieldset>
        <label>
          Notes and next steps
          <textarea
            name="notes"
            required
            maxLength={4000}
            className="block w-full rounded border p-2"
          />
        </label>
        <button
          disabled={saving || !students.length}
          className="rounded bg-blue-700 p-3 font-bold text-white disabled:opacity-50"
        >
          {saving ? 'Submitting…' : 'Submit report for review'}
        </button>
        <p role="status">{message}</p>
      </form>
    </section>
  );
}
