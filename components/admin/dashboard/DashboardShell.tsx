// Server component. Operational Admin dashboard using canonical root routes and live data only.

import Image from 'next/image';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  FileText,
  Globe2,
  Handshake,
  Inbox,
  Megaphone,
  PlayCircle,
  Settings,
  ShieldCheck,
  Smartphone,
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
    tone: 'bg-blue-600',
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
    tone: 'bg-violet-600',
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
    tone: 'bg-emerald-600',
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
    tone: 'bg-orange-600',
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
    tone: 'bg-amber-600',
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
    tone: 'bg-cyan-700',
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
    tone: 'bg-pink-600',
    links: [
      { label: 'Leads', href: '/crm/leads' },
      { label: 'Email', href: '/email-marketing' },
      { label: 'Store', href: 'https://www.elevateforhumanity.org/store' },
    ],
  },
  {
    title: 'Compliance',
    description: 'Audit logs, FERPA, governance, documents, and signatures.',
    href: '/compliance',
    Icon: ShieldCheck,
    tone: 'bg-red-700',
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
    tone: 'bg-slate-700',
    devStudioOnly: true,
    links: [
      { label: 'Open Studio', href: '/studio' },
      { label: 'Workflows', href: '/studio/workflows' },
      { label: 'Repository', href: '/studio/repository' },
    ],
  },
] as const;

const LIVE_PORTALS = [
  {
    title: 'Student PWA',
    detail: 'Courses, progress, assignments, certificates and learner support.',
    href: 'https://app.elevateforhumanity.org/lms/dashboard',
    image: '/images/pages/training-classroom.webp',
    installable: true,
  },
  {
    title: 'Apprentice PWA',
    detail: 'OJT hours, RTI, competencies, documents and host-site progress.',
    href: 'https://app.elevateforhumanity.org/apprentice',
    image: '/images/pages/apprenticeship-structure.webp',
    installable: true,
  },
  {
    title: 'Host Shop PWA',
    detail: 'Apprentices, hour approvals, attendance, competencies and compliance.',
    href: 'https://app.elevateforhumanity.org/host-shop/dashboard',
    image: '/images/pages/barber-training.webp',
    installable: true,
  },
  {
    title: 'Program Holder PWA',
    detail: 'Programs, students, documents, hours and compliance actions.',
    href: 'https://app.elevateforhumanity.org/program-holder/dashboard',
    image: '/images/pages/business-meeting.webp',
    installable: true,
  },
  {
    title: 'Prestige Barber Course',
    detail: 'Open the published Prestige Elevation Barber Curriculum in the LMS.',
    href: 'https://app.elevateforhumanity.org/lms/courses/3fb5ce19-1cde-434c-a8c6-f138d7d7aa17',
    image: '/images/pages/barber-apprenticeship-hero.jpg',
    installable: false,
  },
  {
    title: 'Curvature Builder Draft',
    detail: 'Open the Curvature Body Sculpting website created in Website Builder.',
    href: 'https://www.elevateforhumanity.org/apps/website-builder/edit/4f36ef25-800d-48fa-a071-cf473064c22e',
    image: '/images/pages/comp-layout-hero.webp',
    installable: false,
  },
  {
    title: 'Store Product Demos',
    detail: 'Open the Store marketplace and interactive capability demos.',
    href: 'https://www.elevateforhumanity.org/store#marketplace',
    image: '/images/heroes/lms-analytics.webp',
    installable: false,
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
    <div
      className={`mb-6 flex items-start gap-3 rounded-xl border px-5 py-4 text-sm ${
        dashboardUnavailable
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : 'border-amber-200 bg-amber-50 text-amber-900'
      }`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">
          {dashboardUnavailable
            ? 'Live dashboard data could not be fully loaded.'
            : 'Some dashboard sections are temporarily unavailable.'}
        </p>
        <p className="mt-1 text-xs opacity-80">
          Use System Health or Operations for the live dependency status.
        </p>
      </div>
    </div>
  );
}

function AdminQuickStart() {
  const steps = [
    {
      title: '1. Review what needs attention',
      text: 'Start with submitted applications, pending documents and review queues.',
      href: '/applications',
      className: 'border-blue-200 bg-blue-50',
    },
    {
      title: '2. Run programs and learners',
      text: 'Open programs, courses, enrollments and credentials from one operating view.',
      href: '/programs',
      className: 'border-emerald-200 bg-emerald-50',
    },
    {
      title: '3. Confirm the platform is healthy',
      text: 'Check service health, integrations and deployment status before making changes.',
      href: '/system-health',
      className: 'border-amber-200 bg-amber-50',
    },
  ];

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">Start here</h2>
          <p className="mt-1 text-sm font-medium text-slate-700">
            The dashboard now gives you a clear operating order instead of dropping you into a shell.
          </p>
        </div>
        <a
          href="https://www.elevateforhumanity.org/store#marketplace"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-900 hover:bg-slate-50"
        >
          <PlayCircle className="h-4 w-4" /> Store demos
        </a>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {steps.map((step) => (
          <Link
            key={step.title}
            href={step.href}
            className={`group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${step.className}`}
          >
            <CheckCircle2 className="h-6 w-6 text-slate-900" />
            <h3 className="mt-4 font-black text-slate-950">{step.title}</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{step.text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-slate-950">
              Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PortalLaunchpad() {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-black text-slate-950">Live portals, PWAs and proof links</h2>
        <p className="mt-1 text-sm font-medium text-slate-700">
          Open the real user experiences, the Prestige barber curriculum, Curvature Website Builder draft and Store demos from one place.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {LIVE_PORTALS.map((portal) => (
          <a
            key={portal.title}
            href={portal.href}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            <div className="relative aspect-[16/8] overflow-hidden bg-slate-100">
              <Image
                src={portal.image}
                alt={`${portal.title} preview`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute left-3 top-3 flex gap-2">
                <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-950 shadow-sm">
                  {portal.installable ? 'PWA · Installable' : 'Live link'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">{portal.title}</h3>
                  <p className="mt-1 text-sm font-medium leading-5 text-slate-700">{portal.detail}</p>
                </div>
                {portal.installable ? (
                  <Smartphone className="h-5 w-5 shrink-0 text-blue-700" />
                ) : (
                  <Globe2 className="h-5 w-5 shrink-0 text-slate-600" />
                )}
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-blue-800">
                Open <ExternalLink className="h-4 w-4" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function AdminCategoryLanding({ canAccessDevStudio }: { canAccessDevStudio: boolean }) {
  const categories = ADMIN_CATEGORIES.filter(
    (category) => !('devStudioOnly' in category) || !category.devStudioOnly || canAccessDevStudio,
  );

  return (
    <section className="mb-8">
      <div className="mb-5">
        <h2 className="text-xl font-black text-slate-950">Admin workspaces</h2>
        <p className="mt-1 text-sm font-medium text-slate-700">
          Role-aware operating areas with canonical routes and clear next actions.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map(({ title, description, href, Icon, tone, links }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Link href={href} className="group block">
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-800" />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-2 min-h-[40px] text-sm font-medium leading-5 text-slate-700">{description}</p>
            </Link>
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
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
    {
      label: 'Applications awaiting review',
      count: counts?.pendingApplications ?? 0,
      href: '/applications?status=submitted,pending,in_review,pending_admin_review',
    },
    { label: 'WIOA documents awaiting review', count: data.pendingWioaDocs ?? 0, href: '/wioa/documents' },
    { label: 'Lab submissions awaiting sign-off', count: data.pendingSubmissions?.length ?? 0, href: '/submissions' },
    { label: 'Program holders awaiting approval', count: counts?.pendingProgramHolders ?? 0, href: '/program-holders' },
    { label: 'Program holder documents pending', count: counts?.pendingDocuments ?? 0, href: '/program-holder-documents' },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <FileText className="h-5 w-5 text-blue-600" />
        <h2 className="font-bold text-slate-950">Review Queues</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {queues.map((queue) => (
          <Link key={queue.label} href={queue.href} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
            <span className="text-sm font-semibold text-slate-800">{queue.label}</span>
            <span className="text-lg font-black tabular-nums text-slate-950">{queue.count}</span>
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
        <h2 className="font-bold text-slate-950">Recent Activity</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {items.slice(0, 8).map((item) => (
          <div key={item.id} className="px-5 py-3">
            <p className="text-sm text-slate-700">{item.title}</p>
            <time className="mt-1 block text-xs text-slate-500" dateTime={item.timestamp}>
              {new Date(item.timestamp).toLocaleString('en-US')}
            </time>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardContent({
  data,
  canAccessDevStudio = false,
}: {
  data: AdminDashboardData;
  canAccessDevStudio?: boolean;
}) {
  const firstName = dashboardFirstName(data.profile);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="pb-16">
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-rose-50 shadow-lg">
        <div className="grid min-h-[320px] lg:grid-cols-[1.12fr_0.88fr]">
          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-900">
                <ShieldCheck className="h-4 w-4" /> Secure Admin Session
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-black text-blue-900">Live operations</span>
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              <AdminGreeting name={firstName} />
            </h1>
            <p className="mt-2 text-sm font-bold text-slate-600">{today}</p>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-700">
              Review what needs attention, operate programs and portals, verify system health, and jump directly into the live experiences you are managing.
            </p>
            <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-600">Pending applications</p>
                <p className="mt-1 text-2xl font-black text-blue-800">{data.counts?.pendingApplications ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-600">Active enrollments</p>
                <p className="mt-1 text-2xl font-black text-emerald-700">{data.counts?.activeEnrollments ?? 0}</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-rose-200 bg-white p-4 shadow-sm sm:col-span-1">
                <p className="text-xs font-bold text-slate-600">Portal security</p>
                <p className="mt-1 text-sm font-black text-rose-800">Role restricted</p>
              </div>
            </div>
          </div>
          <div className="relative min-h-[260px] lg:min-h-full">
            <Image
              src="/images/pages/business-meeting.webp"
              alt="Elevate administration and workforce operations"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/40 bg-white/90 p-4 shadow-lg backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-red-700">Admin mission</p>
              <p className="mt-1 font-black text-slate-950">Know what needs action and where to go next.</p>
            </div>
          </div>
        </div>
      </section>

      <DegradedBanner data={data} />
      <AdminQuickStart />
      <PortalLaunchpad />
      <AdminCategoryLanding canAccessDevStudio={canAccessDevStudio} />

      <DashboardPanelErrorBoundary name="Publish website">
        <PublishWebsitePanelLazy />
      </DashboardPanelErrorBoundary>

      <div className="mt-8">
        <StatsOverviewBar data={data} />
      </div>

      {(data.kpis?.length ?? 0) > 0 && (
        <div className="mt-6">
          <DashboardPanelErrorBoundary name="KPI cards">
            <RealtimeKpiGrid kpis={data.kpis} />
          </DashboardPanelErrorBoundary>
        </div>
      )}

      <div className="mt-6">
        <OperationalAlerts data={data} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReviewQueues data={data} />
        </div>
        <div className="space-y-6">
          <EnrollmentFunnel data={data} />
          <RecentActivity items={data.recentActivity ?? []} />
          {(data.recentApplications?.length ?? 0) > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-slate-500" />
                  <h2 className="font-bold text-slate-950">Recent Applications</h2>
                </div>
                <Link href="/applications" className="text-xs font-semibold text-blue-700">View all</Link>
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
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-500" />
                <h2 className="font-bold text-slate-950">Top Programs</h2>
              </div>
              <Link href="/programs" className="text-xs font-semibold text-blue-700">All programs</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {data.topPrograms.slice(0, 6).map((program) => (
                <Link
                  key={program.id}
                  href={`/programs/${encodeURIComponent(program.slug || program.id)}/manage`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <p className="truncate text-sm font-semibold text-slate-950">{program.title}</p>
                  <span className="ml-4 shrink-0 text-xs text-slate-600">{program.learners} enrolled</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {(data.blockedPrograms?.length ?? 0) > 0 && <BlockedProgramsList items={data.blockedPrograms} />}
      </div>

      <div className="mt-8">
        <DashboardPanelErrorBoundary name="Program integrity">
          <ProgramIntegrityPanelLazy />
        </DashboardPanelErrorBoundary>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardPanelErrorBoundary name="Job board">
          <JobBoardPanelLazy />
        </DashboardPanelErrorBoundary>
        <SystemHealthPanel
          health={
            data.systemHealth ?? {
              stripeWebhookOk: false,
              stripeIssuingOk: false,
              buildEnvOk: false,
              staleJobs: 0,
              degraded: true,
              missingDocuments: 0,
              missingCertifications: 0,
              unresolvedFlags: 0,
              alerts: [],
            }
          }
        />
      </div>
    </div>
  );
}