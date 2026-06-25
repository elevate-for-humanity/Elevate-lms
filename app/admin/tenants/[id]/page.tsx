import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Building2, Zap, Clock, AlertTriangle, CheckCircle,
  XCircle, Users, ArrowLeft, ExternalLink, Copy,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: 'Tenant Detail | Admin' };
}

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['admin']);
  const { id } = await params;
  const db = await requireAdminClient();

  const { data: tenant } = await db.from('tenants').select('*').eq('id', id).single();
  if (!tenant) notFound();

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    workflows,
    workflowRuns,
    cronRuns,
    enrollments,
    riskStudents,
  ] = await Promise.allSettled([
    db.from('workflows').select('id, name, status, last_run_at, last_run_status').eq('tenant_id', id).order('name'),
    db.from('workflow_runs')
      .select('id, status, triggered_by, started_at, error_message')
      .eq('tenant_id', id)
      .order('started_at', { ascending: false })
      .limit(15),
    db.from('cron_job_runs')
      .select('id, job_name, status, started_at, duration_ms')
      .eq('tenant_id', id)
      .order('started_at', { ascending: false })
      .limit(10),
    db.from('student_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', id),
    db.from('student_risk_status')
      .select('id, status', { count: 'exact' })
      .eq('tenant_id', id)
      .in('status', ['at_risk', 'critical']),
  ]);

  const wfList    = workflows.status === 'fulfilled' ? (workflows.value.data ?? []) : [];
  const runList   = workflowRuns.status === 'fulfilled' ? (workflowRuns.value.data ?? []) : [];
  const cronList  = cronRuns.status === 'fulfilled' ? (cronRuns.value.data ?? []) : [];
  const enrollCount = enrollments.status === 'fulfilled' ? (enrollments.value.count ?? 0) : 0;
  const riskCount   = riskStudents.status === 'fulfilled' ? (riskStudents.value.count ?? 0) : 0;

  const dashboardUrl = `https://${tenant.subdomain}.app.elevateforhumanity.org/admin`;

  const STATUS_BADGE: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-700',
    failed:  'bg-red-100 text-red-700',
    running: 'bg-blue-100 text-blue-700',
    pending: 'bg-slate-100 text-slate-600',
    active:  'bg-emerald-100 text-emerald-700',
    inactive:'bg-slate-100 text-slate-500',
    paused:  'bg-amber-100 text-amber-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/admin/tenants" className="mt-1 text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-brand-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tenant.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {tenant.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-slate-500 font-mono">{tenant.subdomain}.app.elevateforhumanity.org</span>
              <a href={dashboardUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand-blue-600 hover:text-brand-blue-800">
                Open Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <Link
            href={`/api/admin/tenants/${id}/clone`}
            className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Clone Tenant
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Plan',         value: tenant.plan ?? 'starter' },
            { label: 'Enrollments',  value: String(enrollCount) },
            { label: 'At-Risk',      value: String(riskCount) },
            { label: 'Workflows',    value: String(wfList.length) },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Workflows */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Workflows</h2>
            <span className="ml-auto text-xs text-slate-400">{wfList.length} total</span>
          </div>
          {wfList.length === 0 ? (
            <p className="px-5 py-6 text-slate-400 text-sm">No workflows assigned to this tenant.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {wfList.map((w: any) => (
                <div key={w.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[w.status] ?? ''}`}>{w.status}</span>
                  <span className="text-slate-800 flex-1">{w.name}</span>
                  {w.last_run_at && (
                    <span className="text-slate-400 text-xs">{new Date(w.last_run_at).toLocaleDateString()}</span>
                  )}
                  {w.last_run_status && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_BADGE[w.last_run_status] ?? ''}`}>{w.last_run_status}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent workflow runs */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Recent Workflow Runs</h2>
          </div>
          {runList.length === 0 ? (
            <p className="px-5 py-6 text-slate-400 text-sm">No workflow runs for this tenant yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {runList.map((r: any) => (
                <div key={r.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                  {r.status === 'success'
                    ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    : r.status === 'failed'
                    ? <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    : <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status] ?? ''}`}>{r.status}</span>
                  <span className="text-slate-500 text-xs capitalize">{r.triggered_by}</span>
                  <span className="text-slate-400 text-xs ml-auto">{new Date(r.started_at).toLocaleString()}</span>
                  {r.error_message && <span className="text-red-400 text-xs truncate max-w-xs">{r.error_message}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cron runs */}
        {cronList.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Recent Cron Runs</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {cronList.map((r: any) => (
                <div key={r.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                  {r.status === 'success'
                    ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  <span className="text-slate-800 font-mono">{r.job_name}</span>
                  <span className="text-slate-400 text-xs ml-auto">{r.duration_ms != null ? `${r.duration_ms}ms` : '—'}</span>
                  <span className="text-slate-400 text-xs">{new Date(r.started_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-500 space-y-1">
          <p><span className="font-medium text-slate-700">ID:</span> <span className="font-mono">{tenant.id}</span></p>
          <p><span className="font-medium text-slate-700">Created:</span> {new Date(tenant.created_at).toLocaleString()}</p>
          {tenant.contact_email && <p><span className="font-medium text-slate-700">Contact:</span> {tenant.contact_email}</p>}
          {tenant.cloned_from && (
            <p><span className="font-medium text-slate-700">Cloned from:</span>{' '}
              <Link href={`/admin/tenants/${tenant.cloned_from}`} className="text-brand-blue-600 hover:underline font-mono">
                {tenant.cloned_from}
              </Link>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
