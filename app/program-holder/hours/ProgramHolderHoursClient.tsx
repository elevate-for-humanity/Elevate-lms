'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

type HourEntry = {
  id: string;
  user_id: string;
  work_date: string;
  hours_claimed: number;
  source_type?: string;
  category?: string;
  status: string;
  notes?: string;
  profiles?: { full_name?: string; email?: string };
};

export function ProgramHolderHoursClient() {
  const [entries, setEntries] = useState<HourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/program-holder/hours?status=pending&limit=100');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load hours');
      setEntries(data.entries ?? data.hours ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(hourId: string, action: 'approve' | 'reject') {
    let rejection_reason: string | undefined;
    if (action === 'reject') {
      rejection_reason = window.prompt('Reason for rejection (required):')?.trim();
      if (!rejection_reason) return;
    }
    setActingId(hourId);
    setError('');
    try {
      const res = await fetch('/api/program-holder/hours/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hour_id: hourId, action, rejection_reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hour approvals</h1>
          <p className="text-slate-600 text-sm mt-1">Review and approve apprentice OJL hours</p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-brand-red-50 border border-brand-red-200 rounded-lg text-sm text-brand-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600">
          <p className="font-medium">No pending hours</p>
          <p className="text-sm mt-2">
            <Link href="/program-holder/dashboard" className="text-brand-blue-600 hover:underline">
              Back to dashboard
            </Link>
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => {
            const name =
              (e.profiles as { full_name?: string })?.full_name ||
              (e.profiles as { email?: string })?.email ||
              e.user_id.slice(0, 8);
            return (
              <li
                key={e.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">{name}</p>
                  <p className="text-sm text-slate-600">
                    {e.work_date} · {e.hours_claimed}h · {e.category || e.source_type || 'OJL'}
                  </p>
                  {e.notes && <p className="text-xs text-slate-500 mt-1">{e.notes}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={actingId === e.id}
                    onClick={() => act(e.id, 'approve')}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-brand-green-600 text-white text-sm font-medium rounded-lg hover:bg-brand-green-700 disabled:opacity-50"
                  >
                    {actingId === e.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actingId === e.id}
                    onClick={() => act(e.id, 'reject')}
                    className="inline-flex items-center gap-1 px-3 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
