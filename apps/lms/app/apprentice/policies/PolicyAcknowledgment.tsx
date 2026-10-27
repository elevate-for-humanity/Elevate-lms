'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { ApprenticePolicyKey } from '@/lib/apprenticeship/apprentice-policy';

export function PolicyAcknowledgment({
  agreementKey,
  alreadyAccepted,
}: {
  agreementKey: ApprenticePolicyKey;
  alreadyAccepted: boolean;
}) {
  const [acceptedName, setAcceptedName] = useState('');
  const [accepted, setAccepted] = useState(alreadyAccepted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/apprentice/policy-acknowledgment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreementKey, acceptedName }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to save acknowledgment');
      setAccepted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Unable to save acknowledgment',
      );
    } finally {
      setLoading(false);
    }
  }

  if (accepted) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 p-4 font-bold text-green-900">
        <CheckCircle2 className="h-5 w-5" /> Read and acknowledged
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border-2 border-slate-300 bg-white p-5">
      <label className="block text-sm font-black text-slate-950" htmlFor={`name-${agreementKey}`}>
        Type your full legal name to confirm you read and understand this policy.
      </label>
      <input
        id={`name-${agreementKey}`}
        value={acceptedName}
        onChange={(event) => setAcceptedName(event.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
        autoComplete="name"
      />
      <button
        type="button"
        onClick={submit}
        disabled={loading || acceptedName.trim().length < 2}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        {loading ? 'Recording…' : 'I have read and understand'}
      </button>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
