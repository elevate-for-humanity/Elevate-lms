'use client';

import { useState } from 'react';
import { Brain, Check, Loader2 } from 'lucide-react';

export function AssignAICounselorButton({
  userId,
  riskId,
  learnerName,
  reason,
}: {
  userId: string;
  riskId?: string | null;
  learnerName: string;
  reason?: string | null;
}) {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function assign() {
    if (state === 'working' || state === 'done') return;
    setState('working');
    setMessage('');
    try {
      const response = await fetch('/api/admin/dev-studio/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Assign AI counselor to ${learnerName}`,
          description: reason || 'Create a proactive student-success intervention.',
          command: `Assign AI counselor to learner ${userId}`,
          agentSlug: 'student-success-agent',
          priority: 50,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error?.message || payload?.error || 'Counselor assignment failed.');
      }
      setState('done');
      setMessage('Assigned through Studio');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Counselor assignment failed.');
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={assign}
        disabled={state === 'working' || state === 'done'}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-indigo-700 px-3 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-60"
        title={`Assign an AI-supported counselor intervention to ${learnerName}`}
      >
        {state === 'working' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : state === 'done' ? <Check className="h-3.5 w-3.5" /> : <Brain className="h-3.5 w-3.5" />}
        {state === 'done' ? 'Assigned' : 'Assign AI counselor'}
      </button>
      {message ? <span className={`max-w-52 text-right text-[10px] font-semibold ${state === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>{message}</span> : null}
    </div>
  );
}
