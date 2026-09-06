'use client';

import { useState } from 'react';

export function StripeIdentityButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function startVerification() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/verification/stripe-session', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        status?: string;
        url?: string;
      };
      if (!response.ok) throw new Error(data.error || 'Unable to start verification.');
      if (data.status === 'verified') {
        window.location.reload();
        return;
      }
      if (!data.url) throw new Error('The identity provider did not return a verification link.');
      window.location.assign(data.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to start verification.');
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startVerification}
        disabled={loading}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-blue-700 px-6 py-3 font-black text-white hover:bg-brand-blue-800 disabled:bg-slate-500 sm:w-auto"
      >
        {loading ? 'Opening secure verification…' : 'Verify ID and selfie securely'}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm font-bold text-red-800">{error}</p> : null}
    </div>
  );
}
