import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Coins,
  Cpu,
  Database,
  ExternalLink,
  Gauge,
  RefreshCw,
  Server,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireRole } from '@/lib/auth/require-role';
import { getInfrastructureCostIntelligence } from '@/lib/admin/infrastructure-cost-intelligence';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Infrastructure Cost Intelligence | Admin' };

function duration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  return `${(seconds / 3600).toFixed(1)} hr`;
}

function bytes(value: number) {
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}

function money(value: number | null) {
  return value == null ? 'Rate not configured' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export default async function InfrastructureCostPage() {
  await requireRole(['super_admin', 'admin']);
  const intelligence = await getInfrastructureCostIntelligence(30);
  const { gpu } = intelligence;
  const cards = [
    { label: 'GPU render time', value: duration(gpu.renderSeconds), detail: 'Metered in the last 30 days', icon: Cpu },
    { label: 'Estimated GPU cost', value: money(gpu.estimatedWindowCost), detail: gpu.configuredHourlyRate == null ? 'Set NORTHFLANK_GPU_COST_PER_HOUR for dollar estimates' : `${money(gpu.configuredHourlyRate)} per GPU hour`, icon: Coins },
    { label: 'Failed-attempt waste', value: duration(gpu.failedAttemptSeconds), detail: money(gpu.estimatedFailedAttemptCost), icon: RefreshCw },
    { label: 'Generated output', value: bytes(gpu.outputBytes), detail: `${duration(gpu.videoSeconds)} of GPU video`, icon: Database },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Operations', href: '/operations' }, { label: 'Cost Intelligence' }]} />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Live infrastructure intelligence</p><h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Northflank & GPU Cost Control</h1><p className="mt-2 max-w-3xl text-sm font-medium text-slate-600">Uses the canonical video-job ledger, GPU usage meter, leases, retry classifications, and Northflank runtime configuration. No dashboard counts are hardcoded.</p></div>
            <Link href="/operations/infrastructure-costs" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800"><RefreshCw className="h-4 w-4" />Refresh live data</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, detail, icon: Icon }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-blue-700" /><p className="mt-4 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-sm font-bold text-slate-700">{label}</p><p className="mt-2 text-xs font-medium text-slate-500">{detail}</p></article>)}</section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-blue-700" /><h2 className="font-black text-slate-950">GPU queue and waste signals</h2></div><span className={`rounded-full px-3 py-1 text-xs font-black ${gpu.ready ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{gpu.ready ? 'Worker ready' : 'Worker unavailable'}</span></div>
            <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">{[
              ['Queued', gpu.queued], ['Rendering', gpu.rendering], ['Complete', gpu.completed], ['Failed', gpu.failed],
              ['Stale leases', gpu.stale], ['Dead letter', gpu.deadLettered], ['2+ retries', gpu.repeatedRetries], ['Storage failures', gpu.storageFailures],
            ].map(([label, value]) => <div key={String(label)} className="bg-white p-4"><p className="text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div>)}</div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Server className="h-5 w-5 text-indigo-700" /><h2 className="font-black text-slate-950">Northflank production services</h2></div><p className="mt-2 text-xs font-medium text-slate-500">API integration: {intelligence.northflank.configured ? 'configured' : 'not configured'}</p><div className="mt-4 space-y-3">{intelligence.northflank.services.map((service) => <div key={service.key} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-slate-900">{service.label}</p><span className="text-xs font-bold text-slate-600">{service.status}</span></div>{service.deployedCommit && <p className="mt-1 truncate font-mono text-[11px] text-slate-500">{service.deployedCommit}</p>}</div>)}</div></article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-950">Savings decisions</h2><p className="mt-1 text-sm text-slate-600">Root-cause actions are ordered before capacity changes so a broken retry loop cannot burn more credits.</p></div><div className="divide-y divide-slate-100">{intelligence.recommendations.map((item) => { const Icon = item.severity === 'healthy' ? CheckCircle2 : item.severity === 'opportunity' ? Coins : item.severity === 'critical' ? AlertTriangle : Clock3; return <div key={item.title} className="flex gap-3 p-5"><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${item.severity === 'healthy' ? 'text-emerald-600' : item.severity === 'opportunity' ? 'text-blue-600' : item.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'}`} /><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950">{item.title}</h3>{item.estimatedMonthlySavings != null && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800">Observed waste {money(item.estimatedMonthlySavings)}</span>}</div><p className="mt-1 text-sm leading-6 text-slate-700">{item.detail}</p></div></div>; })}</div></section>

        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><h2 className="font-black text-blue-950">Cost-control policy</h2><ul className="mt-3 grid gap-2 text-sm font-medium text-blue-950 sm:grid-cols-2"><li>• Admin and LMS stay continuously available.</li><li>• GPU work runs only from the durable queue.</li><li>• Zero active jobs makes the GPU eligible to sleep.</li><li>• Expired leases recover before duplicate rendering.</li><li>• Classified hard failures stop automatic retry spend.</li><li>• Dollar estimates appear only from configured rates.</li></ul><a href="https://app.northflank.com" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-blue-800">Open Northflank <ExternalLink className="h-4 w-4" /></a></section>

        <p className="text-xs font-medium text-slate-500">Generated {new Date(intelligence.generatedAt).toLocaleString('en-US')} from a {intelligence.windowDays}-day usage window.</p>
      </div>
    </main>
  );
}
