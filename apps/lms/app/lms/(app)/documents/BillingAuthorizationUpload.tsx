'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BillingAuthorizationUpload({ authorizationId }: { authorizationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    form.set('authorization_id', authorizationId);
    const response = await fetch('/api/learner/billing-authorization', {
      method: 'POST',
      body: form,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error || 'Upload failed.');
      setBusy(false);
      return;
    }
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <input
        required
        name="file"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="block w-full rounded-xl border border-red-300 bg-white p-3"
      />
      {error ? (
        <p role="alert" className="font-bold text-red-800">
          {error}
        </p>
      ) : null}
      <button
        disabled={busy}
        className="rounded-xl bg-red-700 px-5 py-3 font-black text-white disabled:opacity-60"
      >
        {busy ? 'Uploading…' : 'Upload signed authorization'}
      </button>
    </form>
  );
}
