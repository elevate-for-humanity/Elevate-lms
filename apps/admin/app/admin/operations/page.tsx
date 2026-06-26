import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  Inbox,
  RefreshCw,
  RotateCcw,
  XCircle,
  Zap,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Operations Hub | Admin' };

type QueryResult<T> = PromiseSettledResult<{ data?: T; count?: number | null; error?: { message?: string } | null }>;

function getCount(r: QueryResult<unknown>): number {
  if (r.status !== 'fulfilled') return 0;
  return r.value.count ?? 0;
}

function getRows<T>(r: QueryResult<T[]>, fallback: T[] = []): T[] {
  if (r.status !== 'fulfilled') return fallback;
  return (r.value.data as T[] | null) ?? fallback;
}

function queryFailed(r: QueryResult<unknown>): boolean {
  if (r.status === 'rejected') return true;
  return Boolean(r.value.error);
}

function StatusDot({ status }: { status: 'ok' | 'warn' | 'fail' }) {
  const cls =
    status === 'ok' ? 'bg-emerald-500' : status === 'warn' ? 'bg-amber-400' : 'bg-rose-500';
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${cls}`} aria-hidden />;
}

function healthFromCounts(failed: number, warnAt: number, failAt: number): 'ok' | 'warn' | 'fail' {
  if (failed === 0) return 'ok';
  if (failed <= warnAt) return 'warn';
  if (failed >= failAt) return 'fail';
  return failed <= warnAt ? 'warn' : 'fail';
}

export default async function OperationsPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();

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
    db
      .from('cron_job_runs')
      .select('id, job_name, status, started_at, duration_ms, error')
      .order('started_at', { ascending: false })
      .limit(20),
    db
      .from('workflow_dead_letters')
      .select('id, workflow_id, action_type, last_error, attempts, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    db
      .from('admin_alerts')
      .select('id, alert_type, severity, message, created_at, resolved')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const [
    cronTotal,
    cronFailed,
    cronRecent,
    workflowRuns,
    workflowFailed,
    deadLetters,
    deadLettersRecent,
    stepLogs,
    activeWorkflows,
    openAlerts,
    criticalAlerts,
    recentCronRuns,
    recentDeadLetters,
    recentAlerts,
  ] = results;

  const cronTotalCount = getCount(cronTotal);
  const cronFailedCount = getCount(cronFailed);
  const cronRecentCount = getCount(cronRecent);
  const wfRunsCount = getCount(workflowRuns);
  const wfFailedCount = getCount(workflowFailed);
  const dlTotalCount = getCount(deadLetters);
  const dlRecentCount = getCount(deadLettersRecent);
  const stepLogsCount = getCount(stepLogs);
  const activeWorkflowCount = getCount(activeWorkflows);
  const openAlertsCount = getCount(openAlerts);
  const criticalCount = getCount(criticalAlerts);

  const cronRows = getRows(recentCronRuns);
  const dlRows = getRows(recentDeadLetters);
  const alertRows = getRows(recentAlerts);

  const cronHealth = healthFromCounts(cronFailedCount, 2, 3);
  const wfHealth = healthFromCounts(wfFailedCount, 3, 4);
  const dlHealth = dlRecentCount === 0 ? 'ok' : dlRecentCount <= 2 ? 'warn' : 'fail';
  const alertHealth = criticalCount === 0 ? 'ok' : criticalCount <= 3 ? 'warn' : 'fail';

  const unavailable: string[] = [];
  if (queryFailed(cronTotal)) unavailable.push('Cron jobs');
  if (queryFailed(workflowRuns)) unavailable.push('Workflow runs');
  if (queryFailed(deadLetters)) unavailable.push('Dead letters');
  if (queryFailed(openAlerts)) unavailable.push('Admin alerts');

  const SEVERITY_STYLES: Record<string, string> = {
    critical: 'bg-rose-100 text-rose-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-amber-100 text-amber-800',
    warning: 'bg-yellow-100 text-yellow-800',
    low: 'bg-slate-100 text-slate-600',
  };

  const quickLinks = [
    { label: 'Mission Control', href: '/admin/mission-control' },
    { label: 'System Health', href: '/admin/system-health' },
    { label: 'Workflows', href: '/admin/workflows' },
    { label: 'Automation log', href: '/admin/automation' },
    { label: 'Monitoring', href: '/admin/monitoring' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Operations Hub' },
          ]}
        />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Operations Hub</h1>
            <p className="mt-1 text-sm text-slate-600">
              Live cron, workflow engine, dead letters, and unresolved admin alerts from Supabase.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {unavailable.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              Could not load: {unavailable.join(', ')}. Confirm migrations for{' '}
              <code className="rounded bg-amber-100 px-1 text-xs">cron_job_runs</code>, workflows, and{' '}
              <code className="rounded bg-amber-100 px-1 text-xs">admin_alerts</code> are applied in Supabase.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            {
              label: 'Cron (24h)',
              status: cronHealth,
              value: `${cronTotalCount} runs · ${cronFailedCount} failed`,
            },
            {
              label: 'Workflows (24h)',
              status: wfHealth,
              value: `${wfRunsCount} runs · ${wfFailedCount} failed`,
            },
            {
              label: 'Dead letters',
              status: dlHealth,
              value: `${dlTotalCount} total · ${dlRecentCount} new (24h)`,
            },
            {
              label: 'Alerts',
              status: alertHealth,
              value: `${openAlertsCount} open · ${criticalCount} critical/high`,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <StatusDot status={s.status} />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[
            { label: 'Active workflow definitions', value: activeWorkflowCount, icon: Zap },
            { label: 'Step logs (24h)', value: stepLogsCount, icon: BarChart3 },
            { label: 'Cron runs (1h)', value: cronRecentCount, icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="mb-3 h-5 w-5 text-slate-400" />
              <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Clock className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Recent cron runs</h2>
            <span className="ml-auto text-xs text-slate-500">{cronRecentCount} in the last hour</span>
          </div>
          {cronRows.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No cron runs in the log yet. After migration <code className="text-xs">20260705000001</code>, scheduled
              jobs will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cronRows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  {r.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : r.status === 'failed' ? (
                    <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  ) : (
                    <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-amber-500" />
                  )}
                  <span className="font-mono text-slate-900">{r.job_name}</span>
                  <span className="ml-auto text-slate-500">
                    {r.duration_ms != null ? `${r.duration_ms}ms` : '—'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(r.started_at).toLocaleString()}
                  </span>
                  {r.error ? (
                    <span className="w-full truncate text-xs text-rose-600">{r.error}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Inbox className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Workflow dead letters</h2>
            <span className="ml-auto text-xs text-slate-500">{dlTotalCount} total</span>
            <Link
              href="/admin/workflows"
              className="ml-2 flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:underline"
            >
              Workflows <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {dlRows.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              {dlTotalCount === 0
                ? 'No dead letters — workflow steps are completing successfully.'
                : 'No dead letters in the recent window.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {dlRows.map((r) => (
                <li key={r.id} className="px-5 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="font-mono text-slate-900">{r.action_type ?? 'unknown'}</span>
                    <span className="text-xs text-slate-500">{r.attempts} attempts</span>
                    <span className="text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                    {r.workflow_id ? (
                      <Link
                        href={`/admin/workflows/${r.workflow_id}`}
                        className="ml-auto flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
                      >
                        <RotateCcw className="h-3 w-3" /> Open workflow
                      </Link>
                    ) : null}
                  </div>
                  {r.last_error ? (
                    <p className="mt-1 truncate pl-7 text-xs text-rose-600">{r.last_error}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <AlertTriangle className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Unresolved admin alerts</h2>
            <span className="ml-auto text-xs text-slate-500">{openAlertsCount} open</span>
            <Link
              href="/admin/monitoring"
              className="ml-2 text-xs font-semibold text-brand-blue-600 hover:underline"
            >
              Monitoring →
            </Link>
          </div>
          {alertRows.length === 0 ? (
            <p className="flex items-center gap-2 px-5 py-6 text-sm text-slate-500">
              <CheckCircle className="h-4 w-4 text-emerald-600" /> No unresolved alerts.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {alertRows.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3 text-sm">
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      SEVERITY_STYLES[a.severity] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {a.severity}
                  </span>
                  <span className="flex-1 text-slate-700">{a.message}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
