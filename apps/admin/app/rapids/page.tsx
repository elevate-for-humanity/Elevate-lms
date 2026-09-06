import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Building2, ChevronRight, CheckCircle, Clock, GraduationCap } from 'lucide-react';
import RapidsExportClient from './RapidsExportClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'RAPIDS | Admin | Elevate For Humanity' };

export default async function RapidsPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  const [
    { count: pendingReg },
    pendingProgressResult,
    pendingCompletionResult,
    { data: recentSubmissions },
    { data: actionQueue },
  ] = await Promise.all([
    db.from('rapids_registrations').select('*', { count: 'exact', head: true }).is('submitted_at', null),
    db.from('rapids_progress_updates').select('*', { count: 'exact', head: true }).is('submitted_at', null),
    db.from('rapids_registrations').select('*', { count: 'exact', head: true }).eq('status', 'completed').is('submitted_at', null),
    db.from('rapids_submissions').select('id, submission_type, submission_date, record_count, status, submitted_by').order('submission_date', { ascending: false }).limit(10),
    db.from('rapids_action_queue').select('id,entity_type,entity_id,action_type,status,payload,created_at').in('status', ['pending','blocked']).order('created_at', { ascending: true }).limit(100),
  ]);

  const queue = actionQueue ?? [];
  const readyQueue = queue.filter((item: any) => item.status === 'pending');
  const blockedQueue = queue.filter((item: any) => item.status === 'blocked');
  const hostShopQueue = readyQueue.filter((item: any) => item.entity_type === 'host_shop');
  const apprenticeQueue = readyQueue.filter((item: any) => item.entity_type === 'apprentice');
  const stats = [
    { label: 'Apprentice registrations', value: pendingReg ?? 0, icon: Clock },
    { label: 'Verified Host Shops ready', value: hostShopQueue.length, icon: Building2 },
    { label: 'Verified apprentices ready', value: apprenticeQueue.length, icon: GraduationCap },
    { label: 'Blocked — fix before export', value: blockedQueue.length, icon: Clock },
    { label: 'Pending progress', value: pendingProgressResult.count ?? 0, icon: Clock },
    { label: 'Pending completions', value: pendingCompletionResult.count ?? 0, icon: CheckCircle },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div><nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-500"><Link href="/dashboard">Admin</Link><ChevronRight className="h-3 w-3"/><span className="font-medium text-slate-900">RAPIDS</span></nav><h1 className="text-2xl font-bold text-slate-900">RAPIDS Work Center</h1><p className="mt-1 text-sm text-slate-500">Verified Host Shops and activated apprentices enter this queue automatically for sponsor RAPIDS processing.</p></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="mb-3 h-5 w-5 text-slate-600"/><p className="text-2xl font-bold tabular-nums">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Automatic RAPIDS action queue</h2><p className="mt-1 text-xs text-slate-500">Host Shop rows are employer/worksite setup records. Apprentice rows are registration records waiting for sponsor submission.</p></div>
        {!queue.length ? <p className="py-8 text-center text-sm text-slate-400">No pending automatic RAPIDS actions.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr>{['Entity','Name / Reference','Action','Created','Status'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{queue.map((item: any) => { const p = item.payload || {}; const name = p.name || p.full_name || p.email || p.partner_id || p.enrollment_id || item.entity_id; return <tr key={item.id}><td className="px-4 py-3 font-bold capitalize">{item.entity_type.replace('_',' ')}</td><td className="px-4 py-3">{name}</td><td className="px-4 py-3 font-medium">{item.action_type.replaceAll('_',' ')}</td><td className="px-4 py-3 text-slate-500">{new Date(item.created_at).toLocaleDateString()}</td><td className="px-4 py-3"><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">{item.status}</span></td></tr>; })}</tbody></table></div>}
      </section>

      <RapidsExportClient />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-800">Recent RAPIDS submissions</h2></div>{!recentSubmissions?.length ? <p className="py-8 text-center text-sm text-slate-400">No submissions recorded yet.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr>{['Type','Date','Records','Status'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{recentSubmissions.map((s: any) => <tr key={s.id}><td className="px-4 py-3 font-medium capitalize">{s.submission_type}</td><td className="px-4 py-3 text-slate-500">{new Date(s.submission_date).toLocaleDateString()}</td><td className="px-4 py-3">{s.record_count}</td><td className="px-4 py-3">{s.status}</td></tr>)}</tbody></table></div>}</section>
    </div>
  );
}
