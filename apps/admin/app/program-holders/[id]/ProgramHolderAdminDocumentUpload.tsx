'use client';
import { FormEvent, useState } from 'react';

export function ProgramHolderAdminDocumentUpload({ holderId }: { holderId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const response = await fetch(`/api/admin/program-holders/${holderId}/documents`, {
      method: 'POST',
      body: new FormData(event.currentTarget),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || 'Upload failed.');
      setBusy(false);
      return;
    }
    setMessage('Added to the protected file for review.');
    window.setTimeout(() => window.location.reload(), 500);
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-slate-950">Add protected onboarding record</h2>
      <p className="mt-1 text-sm text-slate-600">
        Administrative upload; files remain pending until compliance review.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <select
          name="documentType"
          required
          className="min-h-11 rounded-xl border border-slate-300 px-3"
        >
          <option value="">Document type</option>
          <option value="government_id">Government photo ID</option>
          <option value="insurance">Liability insurance</option>
          <option value="epa_608">EPA 608 credential</option>
          <option value="legacy_mou_reference">Prior MOU reference</option>
          <option value="mou_draft">Unsigned current MOU draft</option>
        </select>
        <input
          name="file"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png"
          className="min-h-11 rounded-xl border border-slate-300 p-2"
        />
        <button
          disabled={busy}
          className="min-h-11 rounded-xl bg-indigo-700 px-5 font-black text-white disabled:opacity-50"
        >
          {busy ? 'Uploading…' : 'Add record'}
        </button>
      </div>
      {message ? (
        <p role="status" className="mt-3 text-sm font-bold text-slate-800">
          {message}
        </p>
      ) : null}
    </form>
  );
}
