'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

/** Records a general program-holder acknowledgement via /api/program-holder/acknowledge-agreement. */
export function AcknowledgeButton({ documentType, label }: { documentType: string; label: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAck() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/program-holder/acknowledge-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_type: documentType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Failed to record'); return; }
      setDone(true);
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  if (done) return (
    <span className="inline-flex items-center gap-1 text-xs text-brand-green-700 font-medium">
      <CheckCircle className="w-3.5 h-3.5" /> Acknowledged
    </span>
  );

  return (
    <div>
      <button onClick={handleAck} disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-blue-600 border border-brand-blue-200 rounded-lg hover:bg-brand-blue-50 transition-colors disabled:opacity-50">
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
        {loading ? 'Recording…' : label}
      </button>
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}
