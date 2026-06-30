'use client';

import { useState } from 'react';
import { UserCheck, Loader2, CheckCircle } from 'lucide-react';

export function ClaimAccountButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/supervisor/claim-account', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Failed to claim account'); return; }
      setDone(true);
    } catch { setError('Network error — try again'); }
    finally { setLoading(false); }
  }

  if (done) return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-green-50 border border-brand-green-200 rounded-lg text-sm text-brand-green-700 font-medium print:hidden">
      <CheckCircle className="w-4 h-4" /> Account claimed — check your email
    </div>
  );

  return (
    <div className="print:hidden">
      <button onClick={handleClaim} disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
        {loading ? 'Processing…' : 'Claim Supervisor Account'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <p className="text-xs text-slate-500 mt-1">Supervisors: click to receive login credentials for digital verification.</p>
    </div>
  );
}
