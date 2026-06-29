'use client';

import { useState } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const TRANSITIONS: Record<string, string[]> = {
  draft:     ['active', 'cancelled'],
  active:    ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  draft:     'Draft',
  active:    'Activate',
  completed: 'Mark completed',
  cancelled: 'Cancel',
};

export default function IepStatusButton({
  iepId,
  currentStatus,
}: {
  iepId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const transitions = TRANSITIONS[currentStatus] ?? [];
  if (transitions.length === 0) return null;

  async function transition(newStatus: string) {
    setSaving(true);
    setError('');
    setOpen(false);

    const res = await fetch(`/api/wioa/iep/${iepId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({})) as { error?: { message?: string } };
      setError(json.error?.message ?? 'Failed to update status');
    }
    setSaving(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 hover:border-slate-300 font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Update status
            <ChevronDown className="w-3.5 h-3.5" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 min-w-[160px] overflow-hidden">
          {transitions.map((s) => (
            <button
              key={s}
              onClick={() => transition(s)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition"
            >
              {STATUS_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="absolute top-full mt-1 right-0 text-xs text-red-600 whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}
