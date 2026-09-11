'use client';

import { useState } from 'react';

export function ScheduleActions({ id, status }: { id: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);
  async function change(next: 'active' | 'paused' | 'canceled') {
    setSaving(true);
    const response = await fetch('/api/admin/billing/schedules', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
    if (response.ok) setCurrent(next);
    setSaving(false);
  }
  return (
    <div className="flex gap-2">
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
