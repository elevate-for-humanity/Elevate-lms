'use client';

import { useState, type FormEvent } from 'react';

const HVAC_CREDENTIALS = [
  ['osha-10', 'OSHA 10-Hour Construction'],
  ['cpr-aed', 'CPR / AED / First Aid'],
  ['epa-608', 'EPA Section 608'],
] as const;

export function CredentialUploadForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    const response = await fetch('/api/learner/credentials', {
      method: 'POST',
      body: new FormData(event.currentTarget),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error || 'Credential upload failed.');
      setBusy(false);
      return;
    }
    setMessage('Credential uploaded for verification. Elevate will review it before certificate issuance.');
    event.currentTarget.reset();
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <label htmlFor="upload_type" className="block text-sm font-black text-slate-900">Credential type</label>
        <select id="upload_type" name="upload_type" required className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950">
          <option value="">Select a credential</option>
          {HVAC_CREDENTIALS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="credential_file" className="block text-sm font-black text-slate-900">Certificate or credential file</label>
        <input id="credential_file" name="file" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm" />
        <p className="mt-1 text-xs text-slate-600">PDF, JPG, PNG, or WebP up to 10 MB.</p>
      </div>
      <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-blue-700 px-5 font-black text-white disabled:opacity-60">{busy ? 'Uploading…' : 'Upload credential'}</button>
      {message ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-900">{message}</p> : null}
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-900">{error}</p> : null}
    </form>
  );
}
