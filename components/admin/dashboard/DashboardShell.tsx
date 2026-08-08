// Server component. Operational Admin dashboard using canonical root routes and live data only.

import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  DollarSign,
  FileText,
  Handshake,
  Inbox,
  Megaphone,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';

import { AdminGreeting } from '@/components/admin/AdminGreeting';
import type { AdminDashboardData } from './types';
import { OperationalAlerts } from './OperationalAlerts';
import { SystemHealthPanel } from './SystemHealthPanel';
import { RealtimeKpiGrid } from './RealtimeKpiGrid';
import { BlockedProgramsList } from './BlockedProgramsList';
import { RecentApplicationsList } from './RecentApplicationsList';
import { RecentPaymentsPanel } from './RecentPaymentsPanel';
import { StatsOverviewBar } from './StatsOverviewBar';
import { EnrollmentFunnel } from './EnrollmentFunnel';
import {
  JobBoardPanelLazy,
  ProgramIntegrityPanelLazy,
  PublishWebsitePanelLazy,
} from './DashboardDeferredPanels';
import { DashboardPanelErrorBoundary } from './DashboardPanelErrorBoundary';

const ADMIN_CATEGORIES = [
  {
    title: 'Operations',
    description: 'Mission control, system health, workflows, and daily priorities.',
    href: '/operations',
    Icon: Activity,
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Mission Control', href: '/mission-control' },
      { label: 'System Health', href: '/system-health' },
    ],
  },
  {
    title: 'Intelligence',
    description: 'Risk scoring, completion forecasts, and operational analytics.',
    href: '/intelligence',
    Icon: Bot,
    links: [
      { label: 'Risk Dashboard', href: '/intelligence' },
      { label: 'Forecast', href: '/intelligence/forecast' },
    ],
  },
  {
    title: 'Students',
    description: 'Applications, enrollments, documents, submissions, and certificates.',
    href: '/students',
    Icon: Users,
    links: [
      { label: 'Applications', href: '/applications' },
      { label: 'Enrollments', href: '/enrollments' },
      { label: 'Documents', href: '/documents/review' },
    ],
  },
  {
    title: 'Programs',
    description: 'Programs, courses, credentials, instructors, and curriculum tools.',
    href: '/programs',
    Icon: BookOpen,
    links: [
      { label: 'All Programs', href: '/programs' },
      { label: 'Course Builder', href: '/course-builder' },
      { label: 'Credentials', href: '/credentials' },
    ],
  },
  {
    title: 'Funding',
    description: 'WIOA, grants, contracts, payments, and funding verification.',
    href: '/funding',
    Icon: DollarSign,
    links: [
      { label: 'WIOA', href: '/wioa' },
      { label: 'Grants', href: '/grants' },
      { label: 'Stripe', href: '/integrations/stripe' },
    ],
  },
  {
    title: 'Partners',
    description: 'Program holders, employers, providers, tenants, and host organizations.',
    href: '/program-holders',
    Icon: Handshake,
    links: [
      { label: 'Program Holders', href: '/program-holders' },
      { label: 'Employers', href: '/employers' },
      { label: 'Tenants', href: '/tenants' },
    ],
  },
  {
    title: 'Marketing',
    description: 'CRM, leads, email marketing, content, and store operations.',
    href: '/crm',
    Icon: Megaphone,
    links: [
      { label: 'Leads', href: '/crm/leads' },
      { label: 'Email', href: '/email-marketing' },
      { label: 'Store', href: '/store' },
    ],
  },
  {
    title: 'Compliance',
    description: 'Audit logs, FERPA, governance, documents, and signatures.',
    href: '/compliance',
    Icon: ShieldCheck,
    links: [
      { label: 'Compliance', href: '/compliance' },
      { label: 'Audit Logs', href: '/audit-logs' },
      { label: 'FERPA', href: '/ferpa' },
    ],
  },
  {
    title: 'Dev Studio',
    description: 'Repository, workflows, deployments, containers, evaluation, and AI tooling.',
    href: '/studio',
    Icon: Settings,
    links: [
      { label: 'Open Studio', href: '/studio' },
      { label: 'Workflows', href: '/studio/workflows' },
      { label: 'Repository', href: '/studio/repository' },
    ],
  },
] as const;

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
    <div className={`mb-6 flex items-start gap-3 rounded-xl border px-5 py-4 text-sm ${
      dashboardUnavailable
        ? 'border-rose-200 bg-rose-50 text-rose-900'
        : 'border-amber-200 bg-amber-50 text-amber-900'
    }`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">
          {dashboardUnavailable ? 'Live dashboard data could not be fully loaded.' : 'Some dashboard sections are temporarily unavailable.'}
        </p>
        <p className="mt-1 text-xs opacity-80">Use System Health or Operations for the live dependency status.</p>
      </div>
    </div>
  );
}

function AdminCategoryLanding() {
  return (
    <section className="mb-8">
      <div className="mb-5">
        <h2 className="text-xl font-black text-slate-900">Admin Workspaces</h2>
        <p className="mt-1 text-sm text-slate-500">Canonical routes only. No legacy /admin path layer.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ADMIN_CATEGORIES.map(({ title, description, href, Icon, links }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Link href={href} className="group block">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700" />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
              <p className="mt-2 min-h-[40px] text-sm leading-5 text-slate-600">{description}</p>
            </Link>
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
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

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <FileText className="h-5 w-5 text-blue-600" />
        <h2 className="font-bold text-slate-900">Review Queues</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {queues.map((queue) => (
          <Link key={queue.label} href={queue.href} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
            <span className="text-sm font-semibold text-slate-800">{queue.label}</span>
            <span className="text-lg font-black tabular-nums text-slate-900">{queue.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({ items }: { items: { id: string; title: string; timestamp: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <TrendingUp className="h-5 w-5 text-emerald-600" />
        <h2 className="font-bold text-slate-900">Recent Activity</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {items.slice(0, 8).map((item) => (
          <div key={item.id} className="px-5 py-3">
            <p className="text-sm text-slate-700">{item.title}</p>
            <time className="mt-1 block text-xs text-slate-400" dateTime={item.timestamp}>
              {new Date(item.timestamp).toLocaleString('en-US')}
            </time>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardContent({ data }: { data: AdminDashboardData }) {
  const firstName = dashboardFirstName(data.profile);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="pb-16">
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 shadow-xl">
        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live Dashboard
              </div>
              <h1 className="text-2xl font-black text-white sm:text-3xl"><AdminGreeting name={firstName} /></h1>
              <p className="mt-1 text-sm text-slate-400">{today}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                <p className="text-xs text-slate-400">Pending Applications</p>
                <p className="mt-1 text-xl font-black text-white">{data.counts?.pendingApplications ?? 0}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                <p className="text-xs text-slate-400">Active Enrollments</p>
                <p className="mt-1 text-xl font-black text-emerald-400">{data.counts?.activeEnrollments ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DegradedBanner data={data} />
      <AdminCategoryLanding />

      <DashboardPanelErrorBoundary name="Publish website"><PublishWebsitePanelLazy /></DashboardPanelErrorBoundary>

      <div className="mt-8"><StatsOverviewBar data={data} /></div>

      {(data.kpis?.length ?? 0) > 0 && (
        <div className="mt-6"><DashboardPanelErrorBoundary name="KPI cards"><RealtimeKpiGrid kpis={data.kpis} /></DashboardPanelErrorBoundary></div>
      )}

      <div className="mt-6"><OperationalAlerts data={data} /></div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><ReviewQueues data={data} /></div>
        <div className="space-y-6">
          <EnrollmentFunnel data={data} />
          <RecentActivity items={data.recentActivity ?? []} />
          {(data.recentApplications?.length ?? 0) > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2"><Inbox className="h-4 w-4 text-slate-500" /><h2 className="font-bold text-slate-900">Recent Applications</h2></div>
                <Link href="/applications" className="text-xs font-semibold text-blue-600">View all</Link>
              </div>
              <RecentApplicationsList items={data.recentApplications} />
            </div>
          )}
          <RecentPaymentsPanel payments={data.recentPayments} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {(data.topPrograms?.length ?? 0) > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-slate-500" /><h2 className="font-bold text-slate-900">Top Programs</h2></div>
              <Link href="/programs" className="text-xs font-semibold text-blue-600">All programs</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {data.topPrograms.slice(0, 6).map((program) => (
                <Link key={program.id} href={`/programs/${encodeURIComponent(program.slug || program.id)}/manage`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <p className="truncate text-sm font-semibold text-slate-900">{program.title}</p>
                  <span className="ml-4 shrink-0 text-xs text-slate-500">{program.learners} enrolled</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {(data.blockedPrograms?.length ?? 0) > 0 && <BlockedProgramsList items={data.blockedPrograms} />}
      </div>

      <div className="mt-8"><DashboardPanelErrorBoundary name="Program integrity"><ProgramIntegrityPanelLazy /></DashboardPanelErrorBoundary></div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardPanelErrorBoundary name="Job board"><JobBoardPanelLazy /></DashboardPanelErrorBoundary>
        <SystemHealthPanel health={data.systemHealth ?? { stripeWebhookOk: false, stripeIssuingOk: false, buildEnvOk: false, staleJobs: 0, degraded: true, missingDocuments: 0, missingCertifications: 0, unresolvedFlags: 0, alerts: [] }} />
      </div>
    </div>
  );
}
