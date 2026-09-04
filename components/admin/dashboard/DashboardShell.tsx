// Server component. Operational Admin dashboard using canonical routes and live data only.

import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  FileText,
  Inbox,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { AdminGreeting } from '@/components/admin/AdminGreeting';
import type { AdminDashboardData } from './types';
import { OperationalAlerts } from './OperationalAlerts';
import { SystemHealthPanel } from './SystemHealthPanel';
import { BlockedProgramsList } from './BlockedProgramsList';
import { RecentApplicationsList } from './RecentApplicationsList';
import { RecentPaymentsPanel } from './RecentPaymentsPanel';
import { StatsOverviewBar } from './StatsOverviewBar';
import { EnrollmentFunnel } from './EnrollmentFunnel';
import { PwaInstallCenter } from './PwaInstallCenter';
import { HostShopPortalLauncher } from './HostShopPortalLauncher';
import {
  JobBoardPanelLazy,
  ProgramIntegrityPanelLazy,
  PublishWebsitePanelLazy,
} from './DashboardDeferredPanels';
import { DashboardPanelErrorBoundary } from './DashboardPanelErrorBoundary';

function dashboardFirstName(profile: AdminDashboardData['profile']): string {
  const raw = profile?.full_name;
  if (typeof raw !== 'string' || !raw.trim()) return 'Admin';
  return raw.trim().split(/\s+/)[0] || 'Admin';
}

function DegradedBanner({ data }: { data: AdminDashboardData }) {
  const degraded = data.degradedSections ?? [];
  if (!degraded.length) return null;
  const dashboardUnavailable = degraded.includes('dashboard_data');

  return (
    <div className={`mb-6 flex items-start gap-3 rounded-xl border px-5 py-4 text-sm ${dashboardUnavailable ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">{dashboardUnavailable ? 'Live dashboard data could not be fully loaded.' : 'Some dashboard sections are temporarily unavailable.'}</p>
        <p className="mt-1 text-xs opacity-80">Open System Health for the current dependency status before acting on missing data.</p>
      </div>
    </div>
  );
}

function OperationalShortcuts() {
  const shortcuts = [
    { title: 'Applications', description: 'Review submitted applications and resolve intake decisions.', href: '/applications' },
    { title: 'Students', description: 'Open learner records, enrollments, documents, and progress.', href: '/students' },
    { title: 'Programs', description: 'Manage published programs, courses, credentials, and curriculum.', href: '/programs' },
    { title: 'Funding & Payments', description: 'Review funding, vouchers, payout holds, and releases.', href: '/funding' },
    { title: 'Documents', description: 'Review uploaded learner and partner documents.', href: '/documents/review' },
    { title: 'Program Holders', description: 'Manage program holders, onboarding, agreements, and students.', href: '/program-holders' },
    { title: 'Host Shops', description: 'Manage host shops, apprentices, verification, and compliance.', href: '/host-shops' },
    { title: 'Reports', description: 'Open enrollment, completion, payment, and compliance reporting.', href: '/reports' },
    { title: 'Compliance', description: 'Resolve alerts, missing records, and required approvals.', href: '/compliance' },
    { title: 'Website', description: 'Edit, preview, and publish the public website.', href: '/website-editor' },
    { title: 'System Health', description: 'Check integrations, deployments, jobs, and platform health.', href: '/system-health' },
    { title: 'Cost Intelligence', description: 'Control Northflank, GPU, retry, stale-job, and storage waste.', href: '/operations/infrastructure-costs' },
  ] as const;
  return (
    <section className="mb-8">
      <div className="mb-4"><h2 className="text-xl font-black text-slate-950">Run Elevate</h2><p className="mt-1 text-sm font-medium text-slate-700">Open every core administrative workspace directly.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{shortcuts.map((item) => <Link key={item.href} href={item.href} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><div className="flex items-center justify-between gap-3"><Activity className="h-5 w-5 text-blue-700" /><ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" /></div><h3 className="mt-3 font-black text-slate-950">{item.title}</h3><p className="mt-1 text-sm font-medium leading-5 text-slate-700">{item.description}</p></Link>)}</div>
    </section>
  );
}

function ReviewQueues({ data }: { data: AdminDashboardData }) {
  const counts = data.counts;
  const queues = [
    { label: 'Applications awaiting review', count: counts?.pendingApplications ?? 0, href: '/applications?status=submitted,pending,in_review,pending_admin_review' },
    { label: 'WIOA documents awaiting review', count: data.pendingWioaDocs ?? 0, href: '/wioa/documents' },
    { label: 'Lab submissions awaiting sign-off', count: data.pendingSubmissions?.length ?? 0, href: '/submissions' },
    { label: 'Program holders awaiting approval', count: counts?.pendingProgramHolders ?? 0, href: '/program-holders' },
    { label: 'Program holder documents pending', count: counts?.pendingDocuments ?? 0, href: '/program-holder-documents' },
  ];
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><FileText className="h-5 w-5 text-blue-600" /><h2 className="font-bold text-slate-950">Review queues</h2></div><div className="divide-y divide-slate-100">{queues.map((queue) => <Link key={queue.label} href={queue.href} className="flex min-h-12 items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"><span className="text-sm font-semibold text-slate-800">{queue.label}</span><span className="shrink-0 text-lg font-black tabular-nums text-slate-950">{queue.count}</span></Link>)}</div></div>;
}

function RecentActivity({ items }: { items: { id: string; title: string; timestamp: string }[] }) {
  if (!items.length) return null;
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><TrendingUp className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-slate-950">Recent activity</h2></div><div className="divide-y divide-slate-100">{items.slice(0, 8).map((item) => <div key={item.id} className="px-5 py-3"><p className="text-sm text-slate-700">{item.title}</p><time className="mt-1 block text-xs text-slate-500" dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleString('en-US')}</time></div>)}</div></div>;
}

export function AdminDashboardContent({ data, canAccessDevStudio = false }: { data: AdminDashboardData; canAccessDevStudio?: boolean }) {
  const firstName = dashboardFirstName(data.profile);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className="mx-auto w-full max-w-[1600px] min-w-0 px-3 pb-16 pt-4 sm:px-5 lg:px-6">
      <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="p-5 sm:p-8"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-900"><ShieldCheck className="h-4 w-4" /> Admin session protected</span><span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-black text-blue-900">Live Supabase data</span></div><h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"><AdminGreeting name={firstName} /></h1><p className="mt-2 text-sm font-bold text-slate-600">{today}</p><p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-700">This dashboard is an operational view of current application, enrollment, program, payment, compliance, and system-health data.</p></div></section>
      <DegradedBanner data={data} />
      <StatsOverviewBar data={data} />
      <OperationalShortcuts />
      {canAccessDevStudio && <section className="mb-8 overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/70 shadow-sm"><div className="p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wider text-blue-800"><Sparkles className="h-4 w-4" /> Admin AI</div><h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Work with Elevate’s operations assistant</h2><p className="mt-2 text-sm font-medium leading-6 text-slate-700">Ask it to inspect records, run approved workflows, build courses, diagnose deployments, or open the affected page beside the conversation.</p></div><Link href="/studio" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800">Open Admin AI <ArrowRight className="h-4 w-4" /></Link></div></div></section>}
      <DashboardPanelErrorBoundary name="Publish website"><PublishWebsitePanelLazy /></DashboardPanelErrorBoundary>
      <div className="mt-6"><OperationalAlerts data={data} /></div>
      <div className="mt-8 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3"><div className="min-w-0 lg:col-span-2"><ReviewQueues data={data} /></div><div className="min-w-0 space-y-6"><EnrollmentFunnel data={data} /><RecentActivity items={data.recentActivity ?? []} />{(data.recentApplications?.length ?? 0) > 0 && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2"><Inbox className="h-4 w-4 text-slate-500" /><h2 className="font-bold text-slate-950">Recent applications</h2></div><Link href="/applications" className="text-xs font-semibold text-blue-700">View all</Link></div><RecentApplicationsList items={data.recentApplications} /></div>}<RecentPaymentsPanel payments={data.recentPayments} /></div></div>
      <div className="mt-8 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">{(data.topPrograms?.length ?? 0) > 0 && <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div className="min-w-0 flex items-center gap-2"><BookOpen className="h-4 w-4 text-slate-500" /><h2 className="font-bold text-slate-950">Top programs</h2></div><Link href="/programs" className="shrink-0 text-xs font-semibold text-blue-700">All programs</Link></div><div className="divide-y divide-slate-100">{data.topPrograms.slice(0, 6).map((program) => <Link key={program.id} href={`/programs/${encodeURIComponent(program.slug || program.id)}/manage`} className="flex min-h-12 items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50"><p className="min-w-0 truncate text-sm font-semibold text-slate-950">{program.title}</p><span className="shrink-0 text-xs text-slate-600">{program.learners} enrolled</span></Link>)}</div></div>}{(data.blockedPrograms?.length ?? 0) > 0 && <BlockedProgramsList items={data.blockedPrograms} />}</div>
      <div className="mt-8"><DashboardPanelErrorBoundary name="Program integrity"><ProgramIntegrityPanelLazy /></DashboardPanelErrorBoundary></div>
      <div className="mt-8 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2"><DashboardPanelErrorBoundary name="Job board"><JobBoardPanelLazy /></DashboardPanelErrorBoundary><SystemHealthPanel health={data.systemHealth ?? { stripeWebhookOk: false, stripeIssuingOk: false, buildEnvOk: false, staleJobs: 0, degraded: true, missingDocuments: 0, missingCertifications: 0, unresolvedFlags: 0, alerts: [] }} /></div>
      <details className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm"><summary className="cursor-pointer list-none px-5 py-4 text-base font-black text-slate-950">Portal apps and secure portal access</summary><div className="border-t border-slate-100 pt-6"><PwaInstallCenter />{canAccessDevStudio && <HostShopPortalLauncher />}</div></details>
    </div>
  );
}
