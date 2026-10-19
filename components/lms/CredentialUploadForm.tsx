'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type ProgramOption = { id: string; label: string };
const CREDENTIAL_TYPES = [
  ['prerequisite', 'Prerequisite, safety certification, license, or other prior credential'],
  ['exam_result', 'Passed certification exam or awarded credential'],
] as const;

export function CredentialUploadForm({ programs, credentials }: { programs: ProgramOption[]; credentials: ProgramOption[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setMessage('');
    setError('');
    let response: Response;
    try { response = await fetch('/api/learner/credentials', {
      method: 'POST',
      body: new FormData(form),
    }); } catch { setError('Upload failed due to a network problem. Try again.'); setBusy(false); return; }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error || 'Credential upload failed.');
      setBusy(false);
      return;
    }
    setMessage('Credential uploaded for verification. Elevate will review it before certificate issuance.');
    form.reset();
    router.refresh();
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <label htmlFor="credential_program" className="block text-sm font-black text-slate-900">Your program</label>
        <select id="credential_program" name="program_id" required className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950">
          <option value="">Select your enrolled program</option>
          {programs.map(program => <option key={program.id} value={program.id}>{program.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="credential_id" className="block text-sm font-black text-slate-900">Credential earned (optional if not listed)</label>
        <select id="credential_id" name="credential_id" className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950">
          <option value="">Other credential — staff will classify</option>
          {credentials.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="upload_type" className="block text-sm font-black text-slate-900">Credential type</label>
        <select id="upload_type" name="upload_type" required className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950">
          <option value="">Select a credential</option>
          {CREDENTIAL_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="credential_file" className="block text-sm font-black text-slate-900">Certificate or credential file</label>
        <input id="credential_file" name="file" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white p-2 text-sm" />
        <p className="mt-1 text-xs text-slate-600">PDF, JPG, PNG, or WebP up to 10 MB.</p>
      </div>
      <button type="submit" disabled={busy || programs.length === 0} className="min-h-12 w-full rounded-xl bg-blue-700 px-5 font-black text-white disabled:opacity-60">{busy ? 'Uploading…' : 'Upload credential'}</button>
      {programs.length === 0 ? <p role="alert" className="text-sm text-amber-800">No eligible program enrollment was found. Contact learner support to correct your enrollment before uploading.</p> : null}
      {message ? <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-900">{message}</p> : null}
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-900">{error}</p> : null}
    </form>
  );
}
