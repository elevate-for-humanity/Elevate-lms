'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HostShopDocumentUploadForm({
  documentType,
  requiresExpiration,
}: {
  documentType: string;
  requiresExpiration: boolean;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    form.set('documentType', documentType);
    try {
      const response = await fetch('/api/host-shop/documents', { method: 'POST', body: form });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) throw new Error(body?.error || 'The document could not be uploaded.');
      router.push(`/host-shop/onboarding/documents?uploaded=${encodeURIComponent(documentType)}`);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The document could not be uploaded.');
      setWorking(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="font-bold">
          File *
          <input type="file" name="file" required disabled={working} accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:font-bold file:text-white" />
        </label>
        {requiresExpiration ? (
          <label className="font-bold">
            Expiration date (if known)
            <input type="date" name="expirationDate" disabled={working} className="mt-2 w-full rounded-xl border border-slate-400 px-4 py-3 font-medium" />
            <span className="mt-1 block text-xs font-medium text-slate-600">You may upload the license now and provide the expiration date during review.</span>
          </label>
        ) : null}
        {error ? <p role="alert" className="text-sm font-bold text-red-800 sm:col-span-2">{error}</p> : null}
      </div>
      <button type="submit" disabled={working} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800 disabled:opacity-60">
        {working ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {working ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  );
}
