'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, PenLine } from 'lucide-react';

type Props = {
  program: 'barber' | 'cosmetology' | 'esthetician' | 'nail';
  alreadySigned: boolean;
};

export default function HostShopMouSignForm({ program, alreadySigned }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(alreadySigned);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const signerName = String(form.get('signerName') || '').trim();
    const signerTitle = String(form.get('signerTitle') || '').trim();
    const agreed = form.get('agreed') === 'on';

    if (!signerName || !agreed) {
      setError('Enter the authorized signer name and acknowledge the agreement.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/host-shop/mou/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program, signerName, signerTitle, agreed }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.ok) throw new Error(body?.error || 'Unable to sign MOU.');

      setSigned(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign MOU.');
    } finally {
      setSubmitting(false);
    }
  }

  if (signed) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">
        <div className="flex items-center gap-2 font-bold">
          <CheckCircle2 className="h-5 w-5" />
          MOU signature is on file.
        </div>
        <p className="mt-1 text-sm">Return to your Host Shop board to continue compliance and apprentice setup.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <PenLine className="h-5 w-5 text-brand-blue-700" />
        <h2 className="text-xl font-black text-slate-950">Digital Signature</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        By submitting this form, the authorized representative adopts the typed name below as the
        electronic signature for this Host Shop MOU.
      </p>

      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="signerName" className="mb-1 block text-sm font-bold text-slate-900">Authorized signer name *</label>
          <input id="signerName" name="signerName" required className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
        </div>
        <div>
          <label htmlFor="signerTitle" className="mb-1 block text-sm font-bold text-slate-900">Title</label>
          <input id="signerTitle" name="signerTitle" className="w-full rounded-lg border border-slate-300 px-3 py-2.5" />
        </div>
      </div>

      <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-300 p-4 text-sm font-semibold leading-6 text-slate-800">
        <input type="checkbox" name="agreed" required className="mt-1 h-5 w-5" />
        I have read the MOU above, I am authorized to sign for this Host Shop, and I agree to the stated worksite responsibilities.
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-red-600 px-5 py-2.5 font-bold text-white hover:bg-brand-red-700 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign MOU
      </button>
    </form>
  );
}
