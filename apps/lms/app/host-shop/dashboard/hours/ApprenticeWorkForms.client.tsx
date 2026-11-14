'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Apprentice = { id: string; name: string; program_slug?: string | null };
export function ApprenticeWorkForms({ apprentices }: { apprentices: Apprentice[] }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>, kind: 'schedule' | 'hours') {
    event.preventDefault();
    const form = event.currentTarget,
      fields = new FormData(form);
    const details =
      kind === 'schedule'
        ? {
            startsAt: new Date(String(fields.get('start'))).toISOString(),
            endsAt: new Date(String(fields.get('end'))).toISOString(),
          }
        : {
            date: fields.get('date'),
            hours: Number(fields.get('hours')),
            notes: fields.get('notes'),
            attested: fields.get('attested') === 'yes',
          };
    setBusy(true);
    setFeedback('');
    try {
      const response = await fetch('/api/host-shop/apprentice-work', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, placementId: fields.get('placement'), ...details }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save.');
      setFeedback(
        kind === 'schedule'
          ? 'Student schedule saved. Planned time is not earned hours.'
          : 'Hours submitted for supervisor approval; not yet verified.',
      );
      form.reset();
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }
  const options = apprentices.map((student) => (
    <option key={student.id} value={student.id}>
      {student.name || 'Assigned apprentice'}
    </option>
  ));
  return (
    <section className="mt-6 space-y-4">
      <h2 className="text-xl font-black">Enter completed hours</h2>

      <div className="max-w-2xl">
        <form
          onSubmit={(event) => void submit(event, 'hours')}
          className="grid gap-3 rounded-xl border bg-white p-5"
        >
          <label className="grid gap-1 text-sm font-bold">
            Student
            <select
              name="placement"
              required
              defaultValue={apprentices.length === 1 ? apprentices[0].id : ''}
              className="min-h-11 rounded-lg border p-2"
            >
              <option value="">Choose student</option>
              {options}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Work date
            <input name="date" type="date" required className="min-h-11 rounded-lg border p-2" />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Hours (quarter-hour increments)
            <input
              name="hours"
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              required
              className="min-h-11 rounded-lg border p-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Service or work performed
            <textarea
              name="notes"
              minLength={10}
              maxLength={2000}
              required
              rows={3}
              className="rounded-lg border p-2"
              placeholder="Haircut, styling, sanitation, supervised practice, etc."
            />
          </label>
          <label className="flex gap-2 text-sm font-semibold">
            <input type="checkbox" required value="yes" name="attested" /> I reviewed the work, date
            and reported hours.
          </label>
          <button
            disabled={busy || !apprentices.length}
            className="min-h-11 rounded-lg bg-blue-800 p-3 font-bold text-white disabled:opacity-50"
          >
            Submit hours for review
          </button>
        </form>
      </div>
      <details className="max-w-2xl rounded-xl border bg-white p-4">
        <summary className="min-h-11 cursor-pointer font-bold">Plan a future shift</summary>
        <p className="mb-3 text-sm text-slate-600">Planned shifts do not add earned hours.</p>{' '}
        <form
          onSubmit={(event) => void submit(event, 'schedule')}
          className="grid gap-3 rounded-xl border bg-white p-5"
        >
          <h3 className="font-black">Schedule a student</h3>
          <label className="grid gap-1 text-sm font-bold">
            Student
            <select
              name="placement"
              required
              defaultValue={apprentices.length === 1 ? apprentices[0].id : ''}
              className="min-h-11 rounded-lg border p-2"
            >
              <option value="">Choose student</option>
              {options}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Shift start
            <input
              name="start"
              type="datetime-local"
              required
              className="min-h-11 rounded-lg border p-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Shift end
            <input
              name="end"
              type="datetime-local"
              required
              className="min-h-11 rounded-lg border p-2"
            />
          </label>
          <button
            disabled={busy || !apprentices.length}
            className="min-h-11 rounded-lg bg-blue-800 p-3 font-bold text-white disabled:opacity-50"
          >
            Save planned shift
          </button>
        </form>
      </details>
      <p role="status" className="text-sm font-semibold">
        {feedback}
      </p>
    </section>
  );
}
