'use client';

import { useCallback, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Mail, RefreshCw, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type TrainingRecord = {
  id: string;
  user_id: string;
  quiz_score: number | null;
  completed_at: string | null;
  expires_at: string | null;
  status: string | null;
  profiles: { full_name: string | null; email: string | null; role: string | null } | null;
};

type PendingUser = { id: string; full_name: string | null; email: string | null; role: string | null; created_at: string | null };

export default function FERPATrainingDashboard({
  trainingRecords: initialRecords,
  pendingUsers: initialPending,
}: {
  trainingRecords: TrainingRecord[];
  pendingUsers: PendingUser[];
  currentUser?: unknown;
}) {
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>(initialRecords);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>(initialPending);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'current' | 'expired' | 'pending'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const supabase = createClient();
      const [recordsResult, usersResult] = await Promise.all([
        supabase.from('ferpa_training_records').select('id,user_id,status,quiz_score,completed_at,expires_at,profiles:user_id(full_name,email,role)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id,full_name,email,role,created_at').in('role', ['staff', 'instructor', 'admin', 'super_admin']).order('full_name'),
      ]);
      const normalized = (recordsResult.data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        quiz_score: row.quiz_score,
        completed_at: row.completed_at,
        expires_at: row.expires_at,
        profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles ?? null,
      })) as TrainingRecord[];
      setTrainingRecords(normalized);
      const trainedIds = new Set(normalized.map((row) => row.user_id));
      setPendingUsers(((usersResult.data ?? []) as PendingUser[]).filter((row) => !trainedIds.has(row.id)));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const now = Date.now();
  const currentRecords = trainingRecords.filter((row) => row.status === 'completed' && (!row.expires_at || new Date(row.expires_at).getTime() > now));
  const expiredRecords = trainingRecords.filter((row) => row.expires_at && new Date(row.expires_at).getTime() <= now);
  const totalStaff = trainingRecords.length + pendingUsers.length;
  const complianceRate = totalStaff ? Math.round((currentRecords.length / totalStaff) * 100) : 0;

  const visibleRecords = useMemo(() => {
    const needle = search.toLowerCase();
    return trainingRecords.filter((row) => {
      const matches = `${row.profiles?.full_name ?? ''} ${row.profiles?.email ?? ''}`.toLowerCase().includes(needle);
      if (!matches) return false;
      if (filter === 'current') return row.status === 'completed' && (!row.expires_at || new Date(row.expires_at).getTime() > Date.now());
      if (filter === 'expired') return Boolean(row.expires_at && new Date(row.expires_at).getTime() <= Date.now());
      return filter !== 'pending';
    });
  }, [trainingRecords, search, filter]);

  const visiblePending = pendingUsers.filter((row) => `${row.full_name ?? ''} ${row.email ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  async function sendReminder(userId: string, email: string | null) {
    if (!email) return;
    await fetch('/api/ferpa/training/reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, email }) });
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-black text-slate-950">FERPA Training Compliance</h1><p className="text-sm text-slate-600">Current staff training records from the canonical FERPA training table.</p></div><button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></div>
      <div className="grid gap-4 sm:grid-cols-4">{[
        { label: 'Staff tracked', value: totalStaff, icon: Users },
        { label: 'Current training', value: currentRecords.length, icon: CheckCircle },
        { label: 'Expired', value: expiredRecords.length, icon: AlertCircle },
        { label: 'Compliance rate', value: `${complianceRate}%`, icon: Clock },
      ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-brand-blue-700" /><p className="mt-3 text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>)}</div>
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff" className="min-w-52 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="all">All records</option><option value="current">Current</option><option value="expired">Expired</option><option value="pending">Pending</option></select></div>
      {filter === 'pending' ? <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">{visiblePending.length ? visiblePending.map((row) => <div key={row.id} className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0"><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{row.full_name || 'Unnamed staff member'}</p><p className="text-xs text-slate-500">{row.email || 'No email'}</p></div><button type="button" onClick={() => void sendReminder(row.id, row.email)} disabled={!row.email} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"><Mail className="h-4 w-4" />Reminder</button></div>) : <p className="p-6 text-sm text-slate-600">No pending staff match this filter.</p>}</div> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50"><tr>{['Staff','Role','Score','Completed','Expires','Status'].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{visibleRecords.length ? visibleRecords.map((row) => <tr key={row.id}><td className="px-4 py-3"><p className="font-bold text-slate-900">{row.profiles?.full_name || 'Unknown'}</p><p className="text-xs text-slate-500">{row.profiles?.email || '—'}</p></td><td className="px-4 py-3 text-slate-700">{row.profiles?.role || '—'}</td><td className="px-4 py-3 text-slate-700">{row.quiz_score ?? '—'}</td><td className="px-4 py-3 text-slate-600">{row.completed_at ? new Date(row.completed_at).toLocaleDateString() : '—'}</td><td className="px-4 py-3 text-slate-600">{row.expires_at ? new Date(row.expires_at).toLocaleDateString() : '—'}</td><td className="px-4 py-3 font-bold capitalize text-slate-700">{row.status || 'unknown'}</td></tr>) : <tr><td colSpan={6} className="p-6 text-center text-slate-500">No training records match this filter.</td></tr>}</tbody></table></div></div>}
    </section>
  );
}
