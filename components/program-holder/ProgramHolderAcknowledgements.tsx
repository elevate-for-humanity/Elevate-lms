'use client';
import { useState } from 'react';

export function ProgramHolderAcknowledgements() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(formData: FormData) {
    setBusy(true);
    setMessage('');
    const response = await fetch('/api/program-holder/acknowledgements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handbook: formData.get('handbook') === 'yes',
        rights: formData.get('rights') === 'yes',
      }),
    });
    const result = await response.json();
    setBusy(false);
    setMessage(
      response.ok
        ? 'Acknowledgements recorded.'
        : result.error || 'Unable to save acknowledgements.',
    );
    if (response.ok) window.setTimeout(() => window.location.reload(), 500);
  }
  return (
    <form action={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Required onboarding acknowledgements</h2>
      <p className="mt-1 text-sm text-slate-600">
        Review the Program Holder handbook and rights and responsibilities before accepting.
      </p>
      <div className="mt-4 space-y-3">
        <label className="flex items-start gap-3 rounded-xl border p-4 text-sm font-semibold">
          <input name="handbook" value="yes" type="checkbox" required className="mt-1" /> I reviewed
          and accept the Program Holder handbook.
        </label>
        <label className="flex items-start gap-3 rounded-xl border p-4 text-sm font-semibold">
          <input name="rights" value="yes" type="checkbox" required className="mt-1" /> I reviewed
          and accept the rights and responsibilities.
        </label>
      </div>
      <button
        disabled={busy}
        className="mt-4 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Record acknowledgements'}
      </button>
      {message && (
        <p role="status" className="mt-3 text-sm font-bold">
          {message}
        </p>
      )}
    </form>
  );
}
