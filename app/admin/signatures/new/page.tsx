'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const DOC_TYPES = [
  { value: 'enrollment_agreement', label: 'Enrollment Agreement' },
  { value: 'nda', label: 'Non-Disclosure Agreement' },
  { value: 'mou', label: 'Memorandum of Understanding' },
  { value: 'policy', label: 'Policy Acknowledgment' },
  { value: 'other', label: 'Other' },
];

export default function NewSignaturePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('enrollment_agreement');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/signature/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), type, body: body.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create document');
        setSubmitting(false);
        return;
      }

      // Redirect to signatures list — admin can copy the sign link from there
      router.push(`/admin/signatures?created=${data.document.id}`);
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Signatures', href: '/admin/signatures' },
            { label: 'New Document' },
          ]}
        />

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Create Signature Document</h1>
          <p className="text-slate-500 mt-2">
            Create a document and share the signing link with the recipient.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="e.g. Enrollment Agreement — Spring 2025"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Document Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 font-mono text-sm"
                placeholder="Paste or type the full document text here. HTML is supported."
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Plain text or HTML. The signer will see this content before signing.
              </p>
            </div>

            <div className="flex gap-4 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting || !title.trim() || !body.trim()}
                className="flex-1 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Document'}
              </button>
              <Link
                href="/admin/signatures"
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
