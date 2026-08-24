'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

function DocumentUploadForm() {
  const requirement = useSearchParams().get('requirement') || '';
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    form.set('requirement_id', requirement);
    const response = await fetch('/api/learner/documents', { method: 'POST', body: form });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error || 'Upload failed');
      setBusy(false);
      return;
    }
    router.push('/lms/documents');
    router.refresh();
  }

  if (!requirement) {
    return (
      <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-red-300 bg-red-50 p-6">
        <h1 className="text-xl font-black">No document requirement selected</h1>
        <Link href="/lms/documents" className="mt-4 inline-flex font-black text-blue-800 underline">
          Return to documents
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-black">Upload Required Document</h1>
      <p className="mt-2 text-slate-700">
        PDF, JPG, PNG, or WebP · maximum 10 MB. Submitted documents remain pending until staff review.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border bg-white p-6">
        <input
          required
          name="file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="block w-full rounded-xl border p-3"
        />
        {error ? <p role="alert" className="font-bold text-red-700">{error}</p> : null}
        <button disabled={busy} className="rounded-xl bg-slate-950 px-5 py-3 font-black text-white disabled:opacity-60">
          {busy ? 'Uploading…' : 'Submit for review'}
        </button>
      </form>
    </div>
  );
}

export default function DocumentUploadPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl p-6 text-slate-700">Loading document upload…</div>}>
      <DocumentUploadForm />
    </Suspense>
  );
}
