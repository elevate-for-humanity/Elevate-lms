'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TransferHoursRequestForm({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(null);
    try {
      const response = await fetch('/api/apprentice/transfer-hours', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollmentId,
          hours_requested: Number(data.get('hours')), previous_school_name: String(data.get('source') || '').trim(),
          documentation_url: String(data.get('evidence') || '').trim(), notes: String(data.get('notes') || '').trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to submit transfer request');
      router.push('/apprentice/transfer-hours?submitted=1'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to submit transfer request'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border bg-white p-6">
    <label className="block font-bold">Previous school or training provider<input name="source" required maxLength={200} className="mt-2 block w-full rounded-lg border p-3" /></label>
    <label className="block font-bold">Hours requested<input name="hours" type="number" required min={1} max={2000} step={0.25} className="mt-2 block w-full rounded-lg border p-3" /></label>
    <label className="block font-bold">Supporting evidence link<input name="evidence" type="url" required maxLength={2000} placeholder="https://..." className="mt-2 block w-full rounded-lg border p-3" /></label>
    <label className="block font-bold">Training and dates<textarea name="notes" required maxLength={4000} rows={4} className="mt-2 block w-full rounded-lg border p-3" /></label>
    <p className="text-sm text-slate-700">Requested hours remain pending until your sponsor reviews the evidence. Submission does not award credit.</p>
    {error ? <p role="alert" className="font-bold text-red-800">{error}</p> : null}
    <button disabled={busy} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit for review'}</button>
  </form>;
}
