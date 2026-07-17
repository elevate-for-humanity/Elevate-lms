'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

export function AcknowledgeHandbookButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAcknowledge() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/apprentice/handbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handbook_type: 'apprentice', acknowledged: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Failed to record acknowledgment'); return; }
      setDone(true);
    } catch {
      setError('Network error — try again');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-green-50 border border-brand-green-200 rounded-lg text-sm text-brand-green-700 font-medium">
        <CheckCircle className="w-4 h-4" /> Handbook acknowledged
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleAcknowledge}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        {loading ? 'Recording…' : 'Acknowledge Receipt'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
