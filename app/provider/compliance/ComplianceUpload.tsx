'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

const ARTIFACT_TYPES = [
  { value: 'mou', label: 'Memorandum of Understanding' },
  { value: 'insurance', label: 'Certificate of Insurance' },
  { value: 'w9', label: 'W-9' },
  { value: 'state_license', label: 'State License' },
  { value: 'etpl_approval', label: 'ETPL Approval' },
  { value: 'accreditation', label: 'Accreditation Certificate' },
  { value: 'other', label: 'Other' },
];

export default function ComplianceUpload({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    artifactType: '',
    label: '',
    issuer: '',
    issuedAt: '',
    expiresAt: '',
    externalUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.artifactType || !form.label) {
      setError('Document type and label are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/provider/compliance/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          artifactType: form.artifactType,
          label: form.label,
          issuer: form.issuer || null,
          issuedAt: form.issuedAt || null,
          expiresAt: form.expiresAt || null,
          externalUrl: form.externalUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Upload failed'); return; }
      setDone(true);
      setTimeout(() => { setDone(false); setForm({ artifactType: '', label: '', issuer: '', issuedAt: '', expiresAt: '', externalUrl: '' }); router.refresh(); }, 1500);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green-700 text-sm py-2">
        <CheckCircle className="w-4 h-4" /> Document submitted for review.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Document Type <span className="text-red-500">*</span></label>
          <select
            value={form.artifactType}
            onChange={e => setForm(f => ({ ...f, artifactType: e.target.value }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
          >
            <option value="">Select type…</option>
            {ARTIFACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Label <span className="text-red-500">*</span></label>
          <input
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Certificate of Insurance 2025"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Issuer</label>
          <input
            value={form.issuer}
            onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))}
            placeholder="e.g. Indiana DWD"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Document URL</label>
          <input
            value={form.externalUrl}
            onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))}
            placeholder="https://…"
            type="url"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Issue Date</label>
          <input
            value={form.issuedAt}
            onChange={e => setForm(f => ({ ...f, issuedAt: e.target.value }))}
            type="date"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Expiration Date</label>
          <input
            value={form.expiresAt}
            onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            type="date"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit Document
      </button>
      <p className="text-xs text-slate-400">
        To attach a file, upload it to your organization's document storage and paste the link above.
      </p>
    </form>
  );
}
