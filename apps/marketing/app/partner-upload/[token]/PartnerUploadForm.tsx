'use client';

import { useState } from 'react';

const REQUIRED_DOCUMENTS = [
  { type: 'business_license', label: 'Business / shop license' },
  { type: 'liability_insurance', label: 'Liability insurance certificate' },
  { type: 'ein_w9', label: 'EIN verification / W-9' },
] as const;

type Props = { partnerId: string; token: string };

export default function PartnerUploadForm({ partnerId, token }: Props) {
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(documentType: string, file: File) {
    setWorking(documentType);
    setMessage(null);
    setError(null);
    try {
      const body = new FormData();
      body.set('partnerId', partnerId);
      body.set('token', token);
      body.set('documentType', documentType);
      body.set('file', file);
      const response = await fetch('/api/partner-upload', { method: 'POST', body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || 'Upload failed.');
      setMessage('Document uploaded for review.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="space-y-4">
      {message ? <p className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-800">{message}</p> : null}
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p> : null}
      {REQUIRED_DOCUMENTS.map((document) => (
        <label key={document.type} className="block rounded-xl border border-slate-200 p-4">
          <span className="block font-semibold text-slate-900">{document.label}</span>
          <span className="mt-1 block text-xs text-slate-600">PDF, JPG or PNG · maximum 10 MB</span>
          <input
            className="mt-3 block w-full text-sm"
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            disabled={working !== null}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (file) void upload(document.type, file);
            }}
          />
          {working === document.type ? <span className="mt-2 block text-xs font-medium text-brand-blue-700">Uploading…</span> : null}
        </label>
      ))}
    </div>
  );
}
