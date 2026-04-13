'use client';

import { useState } from 'react';
import { Loader2, Mail, CheckCircle } from 'lucide-react';

interface Props {
  /** Prefill the email field if already known (e.g. from query params) */
  defaultEmail?: string;
  /** Where to redirect after sign-in. Defaults to /learner/dashboard */
  next?: string;
  /** Label shown on the trigger button */
  label?: string;
}

export function ResendMagicLinkForm({
  defaultEmail = '',
  next = '/learner/dashboard',
  label = 'Resend sign-in link',
}: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/resend-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), next }),
      });

      // Always returns 200 — endpoint never reveals whether email exists
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Unable to send link');
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message ?? 'Unable to send link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 mt-4">
        <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-800">Sign-in link sent</p>
          <p className="text-sm text-emerald-700 mt-0.5">
            Check your inbox and spam folder. The link expires in 1 hour.
          </p>
          <button
            onClick={() => { setSent(false); setError(null); }}
            className="text-xs text-emerald-600 underline mt-2"
          >
            Send again
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div>
        <label htmlFor="resend-email" className="block text-sm font-medium text-slate-700 mb-1">
          Email address
        </label>
        <div className="flex gap-2">
          <input
            id="resend-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending</>
              : <><Mail className="w-4 h-4" /> {label}</>}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
