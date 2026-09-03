import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { AlertTriangle, BarChart3, CheckCircle, Clock, Inbox, XCircle, Zap } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Operations Hub | Admin' };

type Health = 'ok' | 'warn' | 'fail';
type Result = PromiseSettledResult<{ data?: any[] | null; count?: number | null; error?: { message?: string } | null }>;

function count(result: Result): number {
  return result.status === 'fulfilled' ? result.value.count ?? 0 : 0;
}
function rows(result: Result): any[] {
  return result.status === 'fulfilled' && Array.isArray(result.value.data) ? result.value.data : [];
}
function failed(result: Result): boolean {
  return result.status === 'rejected' || Boolean(result.status === 'fulfilled' && result.value.error);
}
function resultAt(results: Result[], index: number): Result {
  return results[index] ?? { status: 'rejected', reason: new Error(`OPERATIONS_QUERY_RESULT_MISSING:${index}`) };
}
function health(failedCount: number, warnAt = 2): Health {
  return failedCount === 0 ? 'ok' : failedCount <= warnAt ? 'warn' : 'fail';
}
function StatusDot({ status }: { status: Health }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${status === 'ok' ? 'bg-emerald-500' : status === 'warn' ? 'bg-amber-500' : 'bg-rose-500'}`} aria-hidden />;
}

export default async function OperationsPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();
  const since24h = new Date(Date.now() - 86_400_000).toISOString();
  const since1h = new Date(Date.now() - 3_600_000).toISOString();

  const results = await Promise.allSettled([
    db.from('cron_job_runs').select('id', { count: 'exact', head: true }).gte('started_at', since24h),
    db.from('cron_job_runs').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('started_at', since24h),
    db.from('cron_job_runs').select('id', { count: 'exact', head: true }).gte('started_at', since1h),
    db.from('workflow_runs').select('id', { count: 'exact', head: true }).gte('created_at', since24h),
    db.from('workflow_runs').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', since24h),
    db.from('workflow_dead_letters').select('id', { count: 'exact', head: true }),
    db.from('workflow_dead_letters').select('id', { count: 'exact', head: true }).gte('created_at', since24h),
    db.from('workflow_step_logs').select('id', { count: 'exact', head: true }).gte('created_at', since24h),
    db.from('workflows').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('admin_alerts').select('id', { count: 'exact', head: true }).eq('resolved', false),
    db.from('admin_alerts').select('id', { count: 'exact', head: true }).eq('resolved', false).in('severity', ['critical', 'high']),
    db.from('cron_job_runs').select('id,job_name,status,started_at,duration_ms,error').order('started_at', { ascending: false }).limit(15),
    db.from('workflow_dead_letters').select('id,workflow_id,action_type,last_error,attempts,created_at').order('created_at', { ascending: false }).limit(10),
    db.from('admin_alerts').select('id,alert_type,severity,message,created_at,resolved').eq('resolved', false).order('created_at', { ascending: false }).limit(10),
  ]) as Result[];

  const cronTotal = resultAt(results, 0);
  const cronFailed = resultAt(results, 1);
  const cronRecent = resultAt(results, 2);
  const workflowRuns = resultAt(results, 3);
  const workflowFailed = resultAt(results, 4);
  const deadLetters = resultAt(results, 5);
  const deadLettersRecent = resultAt(results, 6);
  const stepLogs = resultAt(results, 7);
  const activeWorkflows = resultAt(results, 8);
  const openAlerts = resultAt(results, 9);
  const criticalAlerts = resultAt(results, 10);
  const recentCronRuns = resultAt(results, 11);
  const recentDeadLetters = resultAt(results, 12);
  const recentAlerts = resultAt(results, 13);
  const summary: Array<{ label: string; status: Health; value: string }> = [
    { label: 'Cron (24h)', status: health(count(cronFailed)), value: `${count(cronTotal)} runs · ${count(cronFailed)} failed` },
    { label: 'Workflows (24h)', status: health(count(workflowFailed), 3), value: `${count(workflowRuns)} runs · ${count(workflowFailed)} failed` },
    { label: 'Dead letters', status: health(count(deadLettersRecent)), value: `${count(deadLetters)} total · ${count(deadLettersRecent)} new` },
    { label: 'Alerts', status: health(count(criticalAlerts), 3), value: `${count(openAlerts)} open · ${count(criticalAlerts)} high/critical` },
  ];
  const unavailable = [failed(cronTotal) ? 'Cron jobs' : null, failed(workflowRuns) ? 'Workflow runs' : null, failed(deadLetters) ? 'Dead letters' : null, failed(openAlerts) ? 'Admin alerts' : null].filter(Boolean) as string[];
  const cronRows = rows(recentCronRuns);
  const deadRows = rows(recentDeadLetters);
  const alertRows = rows(recentAlerts);
  const quickLinks: Array<readonly [label: string, href: string]> = [
    ['Infrastructure Costs', '/operations/infrastructure-costs'],
    ['Mission Control', '/mission-control'],
    ['System Health', '/system-health'],
    ['Workflows', '/studio/workflows'],
    ['Advanced Tools', '/advanced-tools'],
    ['Monitoring', '/monitoring'],
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Operations Hub' }]} />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-black text-slate-950">Operations Hub</h1><p className="mt-1 text-sm text-slate-600">Live workflow, cron, dead-letter and alert health from Supabase.</p></div><div className="flex flex-wrap gap-2">{quickLinks.map(([label, href]) => <Link key={href} href={href} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-brand-blue-300">{label}</Link>)}</div></div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {unavailable.length > 0 && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"><AlertTriangle className="h-5 w-5 shrink-0" /><span>Could not load: {unavailable.join(', ')}. Verify the required Supabase migrations and service permissions.</span></div>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{summary.map((item) => <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><StatusDot status={item.status} /><span className="text-xs font-black uppercase tracking-wide text-slate-500">{item.label}</span></div><p className="mt-3 text-sm font-bold text-slate-950">{item.value}</p></div>)}</div>
        <div className="grid gap-4 sm:grid-cols-3">{[
          { label: 'Active workflows', value: count(activeWorkflows), icon: Zap },
          { label: 'Step logs (24h)', value: count(stepLogs), icon: BarChart3 },
          { label: 'Cron runs (1h)', value: count(cronRecent), icon: Clock },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-brand-blue-600" /><p className="mt-3 text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>)}</div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><Clock className="h-4 w-4" /><h2 className="font-black text-slate-950">Recent cron runs</h2></div>{cronRows.length ? <ul className="divide-y divide-slate-100">{cronRows.map((row) => <li key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">{row.status === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}<span className="font-mono font-bold text-slate-900">{row.job_name}</span><span className="ml-auto text-slate-500">{row.duration_ms == null ? '—' : `${row.duration_ms}ms`}</span><span className="text-xs text-slate-400">{row.started_at ? new Date(row.started_at).toLocaleString() : '—'}</span>{row.error && <p className="w-full pl-7 text-xs text-rose-600">{String(row.error)}</p>}</li>)}</ul> : <p className="p-6 text-sm text-slate-600">No cron runs recorded yet.</p>}</section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><Inbox className="h-4 w-4" /><h2 className="font-black text-slate-950">Dead letters</h2></div>{deadRows.length ? <ul className="divide-y divide-slate-100">{deadRows.map((row) => <li key={row.id} className="p-4 text-sm"><p className="font-bold text-slate-900">{row.action_type || 'Workflow action'}</p><p className="mt-1 text-xs text-rose-600">{row.last_error || 'No error detail'}</p><p className="mt-1 text-xs text-slate-500">{row.attempts || 0} attempts</p></li>)}</ul> : <p className="p-6 text-sm text-slate-600">No dead letters.</p>}</section>
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><AlertTriangle className="h-4 w-4" /><h2 className="font-black text-slate-950">Open alerts</h2></div>{alertRows.length ? <ul className="divide-y divide-slate-100">{alertRows.map((row) => <li key={row.id} className="p-4 text-sm"><div className="flex justify-between gap-3"><p className="font-bold text-slate-900">{row.alert_type || 'Alert'}</p><span className="text-xs font-black uppercase text-rose-700">{row.severity}</span></div><p className="mt-1 text-slate-700">{row.message}</p></li>)}</ul> : <p className="p-6 text-sm text-slate-600">No unresolved alerts.</p>}</section>
        </div>
      </main>
    </div>
  );
}
