'use client';
import { FormEvent, useState } from 'react';

const options = [
  ['government_id', 'Government-issued photo ID'],
  ['business_registration', 'Business registration'],
  ['insurance', 'General liability insurance'],
  ['epa_608', 'EPA Section 608 certification'],
  ['w9', 'IRS Form W-9'],
  ['hvac_training_plan', 'HVAC syllabus and training plan'],
] as const;

export function ProgramHolderDocumentUpload() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const response = await fetch('/api/program-holder/documents', {
      method: 'POST',
      body: new FormData(event.currentTarget),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || 'Upload failed.');
      setBusy(false);
      return;
    }
    setMessage('Uploaded for compliance review.');
    window.setTimeout(() => window.location.reload(), 600);
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <h2 className="text-lg font-black text-blue-950">Upload an onboarding document</h2>
      <p className="mt-1 text-sm text-blue-900">
        PDF, JPG, or PNG; 10 MB maximum. Identity documents remain in protected storage.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <select
          name="documentType"
          required
          className="min-h-11 rounded-xl border border-blue-200 bg-white px-3 text-sm"
        >
          <option value="">Select document type</option>
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="file"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png"
          className="min-h-11 rounded-xl border border-blue-200 bg-white p-2 text-sm"
        />
        <button
          disabled={busy}
          className="min-h-11 rounded-xl bg-blue-700 px-5 font-bold text-white disabled:opacity-50"
        >
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </div>
      {message ? (
        <p role="status" className="mt-3 text-sm font-bold text-blue-950">
          {message}
        </p>
      ) : null}
    </form>
  );
}
