'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Loader2, Clock, RefreshCw } from 'lucide-react';

interface HoursEntry {
  id: string;
  status: string;
  week_ending: string | null;
  hours_worked: number | null;
  tasks_completed: string | null;
  created_at: string;
  // join key is apprentice_id → aliased as profiles
  profiles?: { full_name: string | null; email: string | null };
  apprenticeship_programs?: { name: string | null };
}

export default function ApprenticeshipHoursClient() {
  const [entries, setEntries] = useState<HoursEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch pending progress entries via Supabase client-side
      const res = await fetch('/api/admin/apprenticeships/pending-hours');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch { /* silently degrade */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    setApprovingId(id); setError(null);
    try {
      const res = await fetch(`/api/admin/apprenticeships/hours/${id}/approve`, { method: 'POST' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Approve failed'); }
      await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Approve failed'); }
    finally { setApprovingId(null); }
  };

  if (loading) return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading pending hours…
    </div>
  );

  if (!entries.length) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <h2 className="font-semibold text-amber-800">Pending Hours Approval ({entries.length})</h2>
        </div>
        <button onClick={load} className="p-1.5 rounded hover:bg-amber-100 text-amber-500">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <p className="text-xs text-red-600 px-5 py-2">{error}</p>}
      <table className="w-full text-sm">
        <thead className="bg-amber-100/50">
          <tr>
            {['Apprentice', 'Program', 'Week Ending', 'Hours', ''].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-amber-700 uppercase tracking-wide px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-100">
          {entries.map(e => (
            <tr key={e.id} className="hover:bg-amber-50/50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-800 text-xs">{e.profiles?.full_name ?? '—'}</p>
                <p className="text-xs text-slate-400">{e.profiles?.email ?? '—'}</p>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{e.apprenticeship_programs?.name ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {e.week_ending ? new Date(e.week_ending).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                {e.hours_worked != null ? `${e.hours_worked}h` : '—'}
              </td>
              <td className="px-4 py-3">
                <button onClick={() => approve(e.id)} disabled={approvingId === e.id}
                  className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                  {approvingId === e.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <CheckCircle className="w-3 h-3" />}
                  Approve
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
