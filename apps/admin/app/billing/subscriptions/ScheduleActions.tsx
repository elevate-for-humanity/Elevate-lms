'use client';

import { useState } from 'react';

export function ScheduleActions({ id, status }: { id: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function change(next: 'active' | 'paused' | 'canceled') {
    setSaving(true);
    setError('');
    try {
    const response = await fetch('/api/admin/billing/schedules', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
    if (response.ok) setCurrent(next);
    else { const body = await response.json().catch(() => ({})); setError(body.error || 'Collection could not be changed.'); }
    } catch { setError('Connection failed. Refresh to verify collection status before retrying.'); }
    finally { setSaving(false); }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {error && <p role="alert" className="w-full text-xs text-red-700">{error}</p>}
      <span className="capitalize">{current}</span>
      {current === 'active' ? (
        <button disabled={saving} onClick={() => change('paused')} className="text-xs underline">
          Pause
        </button>
      ) : current === 'paused' ? (
        <button disabled={saving} onClick={() => change('active')} className="text-xs underline">
          Resume
        </button>
      ) : null}
      {!['canceled', 'completed'].includes(current) ? (
        <button
          disabled={saving}
          onClick={() => change('canceled')}
          className="text-xs text-red-700 underline"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );
}
