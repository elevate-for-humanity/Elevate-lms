import { Metadata } from 'next';
import { requireAdmin } from '@/lib/authGuards';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Zap, Activity, FlaskConical, Cpu, ArrowRight,
  CheckCircle, XCircle, Clock, ChevronRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Autopilot | Admin',
};

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-800',
  inactive: 'bg-slate-100 text-slate-600',
  paused:   'bg-amber-100 text-amber-800',
  error:    'bg-red-100 text-red-800',
};

export default async function AutopilotPage() {
  await requireAdmin();
  const db = await getAdminClient();

  // workflows and automation_rules tables may not exist yet — use empty fallback
  const [workflowsResult, automationsResult] = await Promise.all([
    db.from('workflows')
      .select('id, name, status, category, run_count, last_run_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .limit(20),
    db.from('automation_rules')
      .select('id, name, status, trigger_type, action_type, run_count, last_triggered_at', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .limit(20),
  ]);

  const wRows = workflowsResult.error ? [] : (workflowsResult.data ?? []);
  const aRows = automationsResult.error ? [] : (automationsResult.data ?? []);
  const workflowCount = workflowsResult.error ? 0 : (workflowsResult.count ?? 0);
  const automationCount = automationsResult.error ? 0 : (automationsResult.count ?? 0);
  const activeWorkflows = wRows.filter((r: any) => r.status === 'active').length;
  const activeAutomations = aRows.filter((r: any) => r.status === 'active').length;
  const totalRuns = wRows.reduce((s: number, r: any) => s + (r.run_count ?? 0), 0)
    + aRows.reduce((s: number, r: any) => s + (r.run_count ?? 0), 0);

  const TOOLS = [
    { label: 'Workflows',        desc: 'Multi-step automated sequences',    href: '/admin/workflows',        icon: Activity },
    { label: 'Course Generator', desc: 'AI-powered course creation',        href: '/admin/course-generator', icon: FlaskConical },
    { label: 'Video Generator',  desc: 'Auto-generate lesson videos',       href: '/admin/video-generator',  icon: Zap },
    { label: 'AI Console',       desc: 'Prompt management and AI settings', href: '/admin/ai-console',       icon: Cpu },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">

      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Autopilot</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Autopilot</h1>
        <p className="text-sm text-slate-500 mt-1">Live automation rules and workflow state</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Workflows',   value: activeWorkflows,    icon: Activity,      color: 'text-brand-blue-600', bg: 'bg-brand-blue-50', href: '/admin/workflows' },
          { label: 'Active Automations', value: activeAutomations,  icon: Zap,           color: 'text-emerald-600',    bg: 'bg-emerald-50',    href: '#automations' },
          { label: 'Total Workflows',    value: workflowCount ?? 0, icon: Activity,      color: 'text-slate-600',      bg: 'bg-slate-100',     href: '/admin/workflows' },
          { label: 'Total Runs',         value: totalRuns,          icon: CheckCircle,   color: 'text-amber-600',      bg: 'bg-amber-50',      href: '#' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <Link key={k.label} href={k.href} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{k.value.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{k.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Tool cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Automation Tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((l) => {
            const Icon = l.icon;
            return (
              <Link key={l.href} href={l.href}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group">
                <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-brand-blue-50 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Icon className="w-4 h-4 text-slate-500 group-hover:text-brand-blue-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{l.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{l.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 transition-colors flex-shrink-0 mt-0.5" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Workflows */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" /> Workflows
          </h2>
          <Link href="/admin/workflows/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors">
            + New
          </Link>
        </div>
        {wRows.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No workflows yet</p>
            <Link href="/admin/workflows/new" className="mt-3 inline-block text-xs font-semibold text-brand-blue-600 hover:underline">Create first workflow →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Name', 'Category', 'Status', 'Runs', 'Last Run', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {wRows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{r.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 capitalize">{r.category ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 tabular-nums">{(r.run_count ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {r.last_run_at ? new Date(r.last_run_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/admin/workflows/${r.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Automation rules */}
      <div id="automations" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-400" /> Automation Rules
          </h2>
          <span className="text-xs text-slate-400">{automationCount ?? 0} rules</span>
        </div>
        {aRows.length === 0 ? (
          <div className="py-12 text-center">
            <Zap className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No automation rules configured</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Name', 'Trigger', 'Action', 'Status', 'Runs', 'Last Triggered'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {aRows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{r.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 capitalize">{r.trigger_type ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500 capitalize">{r.action_type ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 tabular-nums">{(r.run_count ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {r.last_triggered_at ? new Date(r.last_triggered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
