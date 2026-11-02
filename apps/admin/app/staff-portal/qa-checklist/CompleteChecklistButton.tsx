'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CompleteChecklistButton({ checklistId }: {checklistId: string}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  async function complete() {
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/staff/qa-checklist', {
        method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({checklist_id:checklistId}),
      });
      const result = await response.json();
      if (!response.ok || !result.completion?.id) throw new Error(result.error || 'Checklist completion was not confirmed.');
      router.refresh();
    } catch (cause) {setError(cause instanceof Error ? cause.message : 'Checklist could not be saved.');}
    finally {setSaving(false);}
  }
  return <div><button type="button" disabled={saving} onClick={() => void complete()} className="min-h-11 w-full rounded-lg bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-60">{saving ? 'Saving completion…' : 'Mark as Complete'}</button>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}
