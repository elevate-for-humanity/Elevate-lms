'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export function TermsAcceptBanner() {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/legal/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreements: ['tos'], context: 'first_login' }),
      });
      if (res.status === 401) {
        // Not logged in — silently skip (public visitor)
        setAccepted(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Failed to record acceptance');
        return;
      }
      setAccepted(true);
    } catch {
      setError('Network error — try again');
    } finally {
      setLoading(false);
    }
  }

  if (accepted) {
    return (
      <div className="flex items-center gap-2 bg-brand-green-50 border border-brand-green-200 rounded-lg px-4 py-3 text-sm text-brand-green-700 font-medium">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        Terms accepted — thank you.
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <p className="text-sm text-slate-600 flex-1">
        By using this platform you agree to these Terms of Use. Click to record your acceptance.
      </p>
      <div className="flex items-center gap-3 flex-shrink-0">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          onClick={handleAccept}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Recording…' : 'I Accept'}
        </button>
      </div>
    </div>
  );
}
