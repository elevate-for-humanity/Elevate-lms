'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function GrantsSyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/grants/sync', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(`Error: ${data.error ?? 'Sync failed'}`);
        return;
      }
      const count = data.synced ?? data.count ?? data.opportunities?.length ?? '?';
      setResult(`Synced ${count} opportunities`);
    } catch {
      setResult('Network error — try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Syncing…' : 'Sync Opportunities'}
      </button>
      {result && (
        <span className={`text-xs font-medium ${result.startsWith('Error') ? 'text-red-600' : 'text-green-700'}`}>
          {result}
        </span>
      )}
    </div>
  );
}
