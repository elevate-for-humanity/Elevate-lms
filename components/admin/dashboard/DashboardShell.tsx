// Server component — no "use client", no useState, no useEffect.
// Operational command center layout — all data is real and DB-driven.

import Link from "next/link";
import Image from "next/image";
import { AdminGreeting } from "@/components/admin/AdminGreeting";
import {
  ArrowRight, AlertTriangle,
  Activity, TrendingUp, Inbox, Users, FileText,
  BookOpen, Bot, DollarSign, Handshake, Megaphone, Settings, ShieldCheck,
} from "lucide-react";
import type { AdminDashboardData, InactiveLearner, StaleLeadItem } from "./types";
import { OperationalAlerts } from "./OperationalAlerts";
import { LearnerActionButtons } from "./LearnerActionButtons";
import { LeadActionButtons } from "./LeadActionButtons";
import { SystemHealthPanel } from "./SystemHealthPanel";
import { RealtimeKpiGrid } from "./RealtimeKpiGrid";
import { BlockedProgramsList } from "./BlockedProgramsList";
import { RecentApplicationsList } from "./RecentApplicationsList";
import { RecentPaymentsPanel } from "./RecentPaymentsPanel";
import { StatsOverviewBar } from "./StatsOverviewBar";
import { EnrollmentFunnel } from "./EnrollmentFunnel";
import {
  JobBoardPanelLazy,
  ProgramIntegrityPanelLazy,
  PublishWebsitePanelLazy,
  SitePreviewPanelWrapperLazy,
  LizzyContainerWrapperLazy,
} from "./DashboardDeferredPanels";


function fmtUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}
function fmtNum(n: number) { return new Intl.NumberFormat("en-US").format(n); }
function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function Empty({ message }: { message: string }) {
  return <p className="text-slate-400 text-sm py-6 text-center">{message}</p>;
}

const DEGRADED_LABELS: Record<string, string> = {
  inactive_learners: "Inactive learners",
  unpublished_programs: "Unpublished programs",
  recent_students: "Recent students",
  enrollments_by_program: "Enrollment breakdown",
};
function DegradedBanner({ sections }: { sections: string[] }) {
  if (!sections.length) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 mb-6">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div>
        <span className="font-semibold">Some sections are temporarily unavailable.</span>
        {" "}KPI counts are accurate.{" "}
        {sections.map(s => DEGRADED_LABELS[s] ?? s).join(", ")} could not be loaded.
      </div>
    </div>
  );
}


const SEVERITY_STYLES = {
  critical: { dot: "bg-rose-500",    label: "CRITICAL", text: "text-rose-700",  bg: "bg-rose-50"    },
  high:     { dot: "bg-orange-500",  label: "HIGH",     text: "text-orange-700",bg: "bg-orange-50"  },
  medium:   { dot: "bg-yellow-400",  label: "MEDIUM",   text: "text-yellow-700",bg: "bg-yellow-50"  },
  low:      { dot: "bg-slate-300",   label: "LOW",      text: "text-slate-500", bg: "bg-white"      },
} as const;

const ADMIN_CATEGORY_CARDS = [
  {
    title: 'Operations',
    eyebrow: 'Command center',
    description: 'Operations hub, mission control, cron and workflow health, and daily priorities.',
    href: '/admin/operations',
    Icon: Activity,
    links: [
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Mission Control', href: '/admin/mission-control' },
      { label: 'System health', href: '/admin/system-health' },
    ],
  },
  {
    title: 'Intelligence',
    eyebrow: 'AI + forecasting',
    description: 'Risk scoring, completion forecasts, and operational analytics.',
    href: '/admin/intelligence',
    Icon: Bot,
    links: [
      { label: 'Risk dashboard', href: '/admin/intelligence' },
      { label: 'Forecast', href: '/admin/intelligence/forecast' },
    ],
  },
  {
    title: 'Students',
    eyebrow: 'Learner lifecycle',
    description: 'Applications, enrollments, documents, submissions, and certificates.',
    href: '/admin/students',
    Icon: Users,
    links: [
      { label: 'Applications', href: '/admin/applications' },
      { label: 'Enrollments', href: '/admin/enrollments' },
      { label: 'Documents', href: '/admin/documents/review' },
    ],
  },
  {
    title: 'Programs',
    eyebrow: 'Catalog + curriculum',
    description: 'Programs, courses, modules, credentials, quizzes, and instructors.',
    href: '/admin/programs',
    Icon: BookOpen,
    links: [
      { label: 'All programs', href: '/admin/programs' },
      { label: 'Course builder', href: '/admin/studio' },
      { label: 'Credentials', href: '/admin/credentials' },
    ],
  },
  {
    title: 'Funding',
    eyebrow: 'WIOA + grants',
    description: 'WIOA, JRI, grant applications, dislocated worker funding, and payouts.',
    href: '/admin/funding',
    Icon: DollarSign,
    links: [
      { label: 'WIOA', href: '/admin/wioa' },
      { label: 'Grants', href: '/admin/grants' },
      { label: 'Stripe', href: '/admin/integrations/stripe' },
    ],
  },
  {
    title: 'Partners',
    eyebrow: 'Employers + providers',
    description: 'Program holders, employers, shops, providers, tenants, and marketplace.',
    href: '/admin/program-holders',
    Icon: Handshake,
    links: [
      { label: 'Program holders', href: '/admin/program-holders' },
      { label: 'Employers', href: '/admin/employers' },
      { label: 'Tenants', href: '/admin/tenants' },
    ],
  },
  {
    title: 'Marketing',
    eyebrow: 'Growth pipeline',
    description: 'CRM, leads, campaigns, email marketing, promo codes, and store.',
    href: '/admin/crm',
    Icon: Megaphone,
    links: [
      { label: 'Leads', href: '/admin/crm/leads' },
      { label: 'Email', href: '/admin/email-marketing' },
      { label: 'Store', href: '/admin/store' },
    ],
  },
  {
    title: 'Compliance',
    eyebrow: 'Audit controls',
    description: 'Compliance, audit logs, FERPA, documents, signatures, and governance.',
    href: '/admin/compliance',
    Icon: ShieldCheck,
    links: [
      { label: 'Compliance', href: '/admin/compliance' },
      { label: 'Audit logs', href: '/admin/audit-logs' },
      { label: 'FERPA', href: '/admin/ferpa' },
    ],
  },
  {
    title: 'Dev Studio',
    eyebrow: 'Build + deploy',
    description: 'Container, environments, deploy pipeline, secrets, and platform tooling.',
    href: '/admin/dev-studio',
    Icon: Settings,
    links: [
      { label: 'Open studio', href: '/admin/dev-studio' },
      { label: 'Workflows', href: '/admin/workflows' },
    ],
  },
] as const;

function AdminCategoryLanding() {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-red-600">Admin OS</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">Operate by category</h2>
          <p className="mt-1 text-sm text-slate-500">
            Each card opens a dedicated admin area. Use the{' '}
            <span className="font-semibold text-slate-700">☰ menu</span> in the header for every
            subpage — applications, enrollments, Dev Studio, funding, compliance, and more.
          </p>
        </div>
        <Link href="/admin/settings/nav" className="hidden text-xs font-semibold text-brand-blue-600 hover:underline sm:inline">
          Configure navigation →
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ADMIN_CATEGORY_CARDS.map(({ title, eyebrow, description, href, Icon, links }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Link href={href} className="group block">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{eyebrow}</p>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-brand-blue-700">{title}</h3>
                  </div>
                </div>
                <ArrowRight className="mt-2 h-4 w-4 text-slate-300 group-hover:text-brand-blue-600" />
              </div>
              <p className="min-h-[40px] text-sm leading-5 text-slate-600">{description}</p>
            </Link>
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand-blue-300 hover:bg-brand-blue-50 hover:text-brand-blue-700"
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

function TodaysPriorities({ data }: { data: AdminDashboardData }) {
  const items = data.priorities ?? [];
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900">Today's Priorities</h2>
        </div>
        {items.length > 0 && (
          <span className="text-xs text-slate-400 hidden sm:block">Ranked by impact score</span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="px-4 sm:px-6 py-8 flex items-center gap-3 text-brand-green-700">
          <span className="w-5 h-5 rounded-full bg-brand-green-500 inline-block flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">No urgent operational items right now.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const s = SEVERITY_STYLES[item.severity];
            return (
              <Link key={item.id} href={item.href}
                className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:brightness-95 group transition-all ${s.bg}`}>
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[10px] font-black tracking-widest ${s.text}`}>{s.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">score {item.score}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.context}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0 ml-3" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}


function LearnersNeedingAttention({ learners }: { learners: InactiveLearner[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900">Learners Needing Attention</h2>
        </div>
        <Link href="/admin/at-risk" className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {learners.length === 0 ? (
        <Empty message="No learners currently need intervention." />
      ) : (
        <div className="divide-y divide-slate-100">
          {learners.slice(0, 6).map((l) => (
            <div key={l.enrollmentId} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-slate-50 transition-colors">
              <Link href={l.href} className="min-w-0 flex-1 group">
                <p className="text-sm font-semibold text-slate-900 truncate">{l.fullName ?? l.email ?? "Unknown learner"}</p>
                <p className="text-xs text-slate-500 truncate">{l.programTitle ?? "Unknown program"}</p>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Inactive {l.daysInactive}d</span>
                <LearnerActionButtons
                  studentId={l.userId}
                  enrollmentId={l.enrollmentId}
                  studentName={l.fullName ?? l.email ?? "learner"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewQueues({ data }: { data: AdminDashboardData }) {
  const queues = [
    { label: "Applications awaiting review", count: data.counts.pendingApplications, context: data.counts.pendingApplications > 0 ? "Intake queue needs admin action" : "Queue is clear", href: "/admin/applications?status=submitted,pending,in_review,pending_admin_review", urgent: data.counts.pendingApplications > 0 },
    { label: "WIOA documents awaiting review", count: data.pendingWioaDocs, context: data.pendingWioaDocs > 0 ? "Funding eligibility may be blocked" : "Queue is clear", href: "/admin/wioa/documents", urgent: data.pendingWioaDocs > 0 },
    { label: "Lab submissions awaiting sign-off", count: data.pendingSubmissions?.length ?? 0, context: (data.pendingSubmissions?.length ?? 0) > 0 ? "Instructor action required" : "Queue is clear", href: "/admin/submissions", urgent: (data.pendingSubmissions?.length ?? 0) > 0 },
    { label: "Program holders awaiting approval", count: data.counts.pendingProgramHolders, context: data.counts.pendingProgramHolders > 0 ? "Partner applications need review" : "Queue is clear", href: "/admin/program-holders", urgent: data.counts.pendingProgramHolders > 0 },
    { label: "Program holder documents pending", count: data.counts.pendingDocuments, context: data.counts.pendingDocuments > 0 ? "Documents submitted, awaiting review" : "Queue is clear", href: "/admin/program-holder-documents", urgent: data.counts.pendingDocuments > 0 },
    { label: "Certificates to issue", count: data.counts.certificatesIssued, context: "Completed learners awaiting credential", href: "/admin/certificates", urgent: false },
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-500" />
        <h2 className="font-bold text-slate-900">Review Queues</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {queues.map((q) => (
          <Link key={q.label} href={q.href} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 group transition-colors">
            <div>
              <p className="text-sm font-medium text-slate-900">{q.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{q.context}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <span className={`text-lg font-black tabular-nums ${q.urgent ? "text-rose-600" : "text-slate-400"}`}>{q.count}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CrmFollowUpQueue({ leads }: { leads: StaleLeadItem[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900">Follow-Up Queue</h2>
          {leads.length > 0 && (
            <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{leads.length}</span>
          )}
        </div>
        <Link href="/admin/crm/leads" className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {leads.length === 0 ? (
        <Empty message="No CRM follow-ups need attention today." />
      ) : (
        <div className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-slate-50 transition-colors">
              <Link href={lead.href} className="min-w-0 flex-1 group">
                <p className="text-sm font-semibold text-slate-900 truncate">{lead.name ?? "Unknown lead"}</p>
                <p className="text-xs text-slate-500">{lead.status ?? "No status"}</p>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{lead.days_stale}d no activity</span>
                <LeadActionButtons leadId={lead.id} leadName={lead.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function RecentStudentsPanel({ students }: { students: import('./types').RecentStudent[] }) {
  if (!students.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900 text-sm">Recent Students</h2>
        </div>
        <Link href="/admin/students" className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {students.slice(0, 5).map(s => (
          <Link key={s.id} href={s.href} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{s.full_name ?? s.email ?? s.id.slice(0, 8)}</p>
              <p className="text-xs text-slate-400 truncate">{s.program_name ?? 'No program'}</p>
            </div>
            {s.enrollment_status && (
              <span className={`ml-2 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                s.enrollment_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                s.enrollment_status === 'completed' ? 'bg-purple-100 text-purple-700' :
                'bg-slate-100 text-slate-600'
              }`}>{s.enrollment_status}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({ items }: { items: { id: string; title: string; timestamp: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white mb-6">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-slate-500" />
        <h2 className="font-bold text-slate-900">Recent Activity</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {items.slice(0, 8).map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 sm:px-6 py-3">
            <p className="text-sm text-slate-700 truncate flex-1">{item.title}</p>
            <p className="text-xs text-slate-400 flex-shrink-0 ml-4">{relativeTime(item.timestamp)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardContent({ data }: { data: AdminDashboardData }) {
  const firstName = data.profile?.full_name?.split(' ')[0] ?? 'Admin';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="pb-16">
      <div className="relative w-full h-32 sm:h-40 overflow-hidden rounded-2xl mb-6">
        <Image
          src="/images/pages/admin-dashboard-hero.webp"
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="pt-2">

        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-0.5" suppressHydrationWarning>
            <AdminGreeting name={firstName} /> · {today}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor operations, learner progress, compliance, and revenue.</p>
        </div>
        {/* Quick-action strip — mobile only. Desktop has the full nav bar. */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-none">
          <Link href="/admin/applications?status=submitted,pending,in_review,pending_admin_review" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">Review Applications</Link>
          <Link href="/admin/compliance" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Compliance</Link>
          <Link href="/admin/documents/templates" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Document Templates</Link>
          <Link href="/admin/studio" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Course Templates</Link>
          <Link href="/admin/crm/leads" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">CRM Queue</Link>
          <Link href="/admin/students" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Students</Link>
          <Link href="/admin/enrollments" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Enrollments</Link>
          <Link href="/admin/reports" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Reports</Link>
          <Link href="/admin/dev-studio" className="flex-shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Dev Studio</Link>
        </div>

        <DegradedBanner sections={data.degradedSections ?? []} />

        <AdminCategoryLanding />

        <PublishWebsitePanelLazy />

        {/* ── Stats overview bar ───────────────────────────────────────── */}
        <StatsOverviewBar data={data} />

        {/* ── KPI cards ────────────────────────────────────────────────── */}
        {(data.kpis?.length ?? 0) > 0 && (
          <div className="mb-6">
            <RealtimeKpiGrid kpis={data.kpis} />
          </div>
        )}

        {/* ── Operational alerts: stalled apps, missing outcomes, funding ─ */}
        <OperationalAlerts data={data} />

        {/* ── Scored priority list ─────────────────────────────────────── */}
        <TodaysPriorities data={data} />

        {/* ── Main operational grid ────────────────────────────────────── */}
        {/* Left (2/3): action queues — learners, review queues, CRM       */}
        {/* Right (1/3): activity feed + recent applications               */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-6">
          <div className="lg:col-span-2 min-w-0 space-y-4">
            <LearnersNeedingAttention learners={data.inactiveLearners} />
            <ReviewQueues data={data} />
            <CrmFollowUpQueue leads={data.staleLeads} />
          </div>
          <div className="space-y-4">
            <EnrollmentFunnel data={data} />
            <RecentActivity items={data.recentActivity} />
            {(data.recentApplications?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-slate-500" />
                    <h2 className="font-bold text-slate-900 text-sm">Recent Applications</h2>
                  </div>
                  <Link href="/admin/applications" className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <RecentApplicationsList items={data.recentApplications} />
              </div>
            )}
            <RecentPaymentsPanel payments={data.recentPayments} />
            <RecentStudentsPanel students={data.recentStudents} />
          </div>
        </div>

        {/* ── Top programs + unpublished programs ──────────────────────── */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(data.topPrograms?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  <h2 className="font-bold text-slate-900">Top Programs</h2>
                </div>
                <Link href="/admin/programs" className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
                  All programs <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {data.topPrograms.slice(0, 6).map((p) => (
                  <Link key={p.id} href={p.slug ? `/admin/programs/${p.slug}/manage` : '/admin/programs'}
                    className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                    <span className="text-xs text-slate-500 flex-shrink-0 ml-4">{p.learners} enrolled</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {(data.blockedPrograms?.length ?? 0) > 0 && (
            <BlockedProgramsList items={data.blockedPrograms} />
          )}
        </div>

        {/* ── Program integrity ────────────────────────────────────────── */}
        <div className="mt-8">
          <ProgramIntegrityPanelLazy />
        </div>

        {/* ── Job board + site status + system health ──────────────────── */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <JobBoardPanelLazy />
          <LizzyContainerWrapperLazy
            sites={data.sitePreviewTargets ?? []}
            isSuperAdmin={data.isSuperAdmin === true}
            pendingApplications={data.recentApplications}
            pendingApplicationsCount={data.counts.pendingApplications}
            pendingProgramHolders={data.counts.pendingProgramHolders}
          />
          <SitePreviewPanelWrapperLazy sites={data.sitePreviewTargets ?? []} />
          <SystemHealthPanel health={data.systemHealth} />
        </div>

      </div>
    </div>
  );
}
