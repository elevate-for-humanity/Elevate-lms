// Server component — no "use client", no useState, no useEffect.
// Operational command center layout — all data is real and DB-driven.

import Link from "next/link";
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
} from "./DashboardDeferredPanels";
import { DashboardPanelErrorBoundary } from "./DashboardPanelErrorBoundary";


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
function DegradedBanner({
  sections,
  dashboardUnavailable,
}: {
  sections: string[];
  dashboardUnavailable?: boolean;
}) {
  if (dashboardUnavailable) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900 mb-6">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
        <div>
          <span className="font-semibold">Live dashboard data could not be loaded.</span>{' '}
          Counts below may show zero until Supabase reconnects. Use{' '}
          <Link href="/admin/operations" className="underline font-medium">
            Operations
          </Link>{' '}
          or hard-refresh. If this persists, verify admin deploy SHA matches main.
        </div>
      </div>
    );
  }
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
      { label: 'Workflows', href: '/admin/dev-studio/workflows' },
    ],
  },
] as const;

function AdminCategoryLanding() {
  return (
    <section className="mb-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-600 rounded-full" />
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Admin OS</p>
          </div>
          <h2 className="text-xl font-black text-slate-900">Operate by category</h2>
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
        {ADMIN_CATEGORY_CARDS.map(({ title, eyebrow, description, href, Icon, links }, index) => {
          const gradients = [
            'from-blue-500 to-blue-600',
            'from-emerald-500 to-emerald-600',
            'from-purple-500 to-purple-600',
            'from-orange-500 to-orange-600',
            'from-pink-500 to-pink-600',
            'from-cyan-500 to-cyan-600',
          ];
          const gradient = gradients[index % gradients.length];
          return (
            <div key={title} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <Link href={href} className="block h-full">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{eyebrow}</p>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-brand-blue-700 transition-colors">{title}</h3>
                    </div>
                  </div>
                  <ArrowRight className="mt-2 h-5 w-5 text-slate-300 group-hover:text-brand-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="min-h-[40px] text-sm leading-5 text-slate-600">{description}</p>
              </Link>
              <div className="mt-4 flex flex-wrap gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand-blue-300 hover:bg-brand-blue-50 hover:text-brand-blue-700 transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TodaysPriorities({ data }: { data: AdminDashboardData }) {
  const items = data.priorities ?? [];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white mb-6 overflow-hidden shadow-sm">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
            <Inbox className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Today's Priorities</h2>
            {items.length > 0 && (
              <p className="text-xs text-slate-500">Ranked by impact score</p>
            )}
          </div>
        </div>
        {items.length > 0 && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">{items.length} items</span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="px-5 sm:px-6 py-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <span className="text-3xl">✨</span>
          </div>
          <p className="text-base font-semibold text-emerald-700">No urgent operational items right now.</p>
          <p className="text-sm text-slate-500 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const s = SEVERITY_STYLES[item.severity] ?? SEVERITY_STYLES.low;
            return (
              <Link key={item.id} href={item.href}
                className={`flex items-center justify-between px-5 sm:px-6 py-4 hover:brightness-95 group transition-all ${s.bg}`}>
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${s.dot} shadow-sm`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className={`text-[10px] font-black tracking-widest ${s.text} uppercase`}>{s.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">score {item.score}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 line-clamp-2">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.context}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
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
    <div className="rounded-2xl border border-slate-200 bg-white mb-6 overflow-hidden shadow-sm">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Learners Needing Attention</h2>
            <p className="text-xs text-slate-500">Inactive or at-risk learners</p>
          </div>
        </div>
        {learners.length > 0 && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">{learners.length} learners</span>
        )}
      </div>
      {learners.length === 0 ? (
        <div className="px-5 sm:px-6 py-8 text-center">
          <p className="text-sm text-slate-500">No learners currently need intervention.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {learners.slice(0, 6).map((l) => (
            <div key={l.enrollmentId} className="flex items-center justify-between px-5 sm:px-6 py-3 hover:bg-slate-50 transition-colors">
              <Link href={l.href} className="min-w-0 flex-1 group">
                <p className="text-sm font-semibold text-slate-900 truncate">{l.fullName ?? l.email ?? "Unknown learner"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 truncate">{l.programTitle ?? "Unknown program"}</span>
                </div>
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
  const counts = data.counts ?? {
    pendingApplications: 0,
    activeEnrollments: 0,
    revenueThisMonthCents: 0,
    certificatesIssued: 0,
    pendingProgramHolders: 0,
    pendingDocuments: 0,
  };
  const pendingWioaDocs = data.pendingWioaDocs ?? 0;
  const pendingSubmissionsCount = data.pendingSubmissions?.length ?? 0;
  const queues = [
    { label: "Applications awaiting review", count: counts.pendingApplications, context: counts.pendingApplications > 0 ? "Intake queue needs admin action" : "Queue is clear", href: "/admin/applications?status=submitted,pending,in_review,pending_admin_review", urgent: counts.pendingApplications > 0, color: "blue" },
    { label: "WIOA documents awaiting review", count: pendingWioaDocs, context: pendingWioaDocs > 0 ? "Funding eligibility may be blocked" : "Queue is clear", href: "/admin/wioa/documents", urgent: pendingWioaDocs > 0, color: "amber" },
    { label: "Lab submissions awaiting sign-off", count: pendingSubmissionsCount, context: pendingSubmissionsCount > 0 ? "Instructor action required" : "Queue is clear", href: "/admin/submissions", urgent: pendingSubmissionsCount > 0, color: "purple" },
    { label: "Program holders awaiting approval", count: counts.pendingProgramHolders, context: counts.pendingProgramHolders > 0 ? "Partner applications need review" : "Queue is clear", href: "/admin/program-holders", urgent: counts.pendingProgramHolders > 0, color: "emerald" },
    { label: "Program holder documents pending", count: counts.pendingDocuments, context: counts.pendingDocuments > 0 ? "Documents submitted, awaiting review" : "Queue is clear", href: "/admin/program-holder-documents", urgent: counts.pendingDocuments > 0, color: "pink" },
    { label: "Certificates to issue", count: counts.certificatesIssued, context: "Completed learners awaiting credential", href: "/admin/certificates", urgent: false, color: "cyan" },
  ];
  const urgentCount = queues.filter(q => q.urgent).length;
  
  return (
    <div className="rounded-2xl border border-slate-200 bg-white mb-6 overflow-hidden shadow-sm">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Review Queues</h2>
            <p className="text-xs text-slate-500">{queues.length} queues monitored</p>
          </div>
        </div>
        {urgentCount > 0 && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-700">{urgentCount} need attention</span>
        )}
      </div>
      <div className="divide-y divide-slate-100">
        {queues.map((q) => {
          const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
            blue: { bg: 'hover:bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
            amber: { bg: 'hover:bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
            purple: { bg: 'hover:bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
            emerald: { bg: 'hover:bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
            pink: { bg: 'hover:bg-pink-50', text: 'text-pink-600', dot: 'bg-pink-500' },
            cyan: { bg: 'hover:bg-cyan-50', text: 'text-cyan-600', dot: 'bg-cyan-500' },
          };
          const c = colorMap[q.color] || colorMap.blue;
          return (
            <Link key={q.label} href={q.href} className={`flex items-center justify-between px-5 sm:px-6 py-4 ${c.bg} group transition-colors`}>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${c.dot} ${q.urgent ? 'animate-pulse' : ''}`} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{q.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{q.context}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className={`text-xl font-black tabular-nums ${q.urgent ? c.text : "text-slate-300"}`}>{q.count}</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function CrmFollowUpQueue({ leads }: { leads: StaleLeadItem[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white mb-6 overflow-hidden shadow-sm">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Follow-Up Queue</h2>
            <p className="text-xs text-slate-500">Leads needing follow-up</p>
          </div>
        </div>
        {leads.length > 0 && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">{leads.length} leads</span>
        )}
      </div>
      {leads.length === 0 ? (
        <div className="px-5 sm:px-6 py-8 text-center">
          <p className="text-sm text-slate-500">No CRM follow-ups need attention today.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between px-5 sm:px-6 py-3 hover:bg-slate-50 transition-colors">
              <Link href={lead.href} className="min-w-0 flex-1 group">
                <p className="text-sm font-semibold text-slate-900 truncate">{lead.name ?? "Unknown lead"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{lead.status ?? "No status"}</span>
                  <span className="text-xs text-slate-400">{lead.days_stale}d stale</span>
                </div>
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

function LearnersNeedingAttention({ learners }: { learners: InactiveLearner[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white mb-6 overflow-hidden shadow-sm">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Learners Needing Attention</h2>
            <p className="text-xs text-slate-500">Inactive or at-risk learners</p>
          </div>
        </div>
        {learners.length > 0 && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">{learners.length} learners</span>
        )}
      </div>
      {learners.length === 0 ? (
        <div className="px-5 sm:px-6 py-8 text-center">
          <p className="text-sm text-slate-500">No learners currently need intervention.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {learners.slice(0, 6).map((l) => (
            <div key={l.enrollmentId} className="flex items-center justify-between px-5 sm:px-6 py-3 hover:bg-slate-50 transition-colors">
              <Link href={l.href} className="min-w-0 flex-1 group">
                <p className="text-sm font-semibold text-slate-900 truncate">{l.fullName ?? l.email ?? "Unknown learner"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 truncate">{l.programTitle ?? "Unknown program"}</span>
                </div>
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

function RecentStudentsPanel({ students }: { students: import('./types').RecentStudent[] }) {
  if (!students.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm">Recent Students</h2>
        </div>
        <Link href="/admin/students" className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {students.slice(0, 5).map(s => (
          <Link key={s.id} href={s.href} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{s.full_name ?? s.email ?? String(s.id).slice(0, 8)}</p>
              <p className="text-xs text-slate-500 truncate">{s.program_name ?? 'No program'}</p>
            </div>
            {s.enrollment_status && (
              <span className={`ml-2 flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
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
    <div className="rounded-2xl border border-slate-200 bg-white mb-6 overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <h2 className="font-bold text-slate-900 text-sm">Recent Activity</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {items.slice(0, 8).map((item) => (
          <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
            <p className="text-sm text-slate-700 truncate flex-1">{item.title}</p>
            <p className="text-xs text-slate-400 flex-shrink-0 ml-4 bg-slate-100 px-2 py-0.5 rounded-full">{relativeTime(item.timestamp)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function dashboardFirstName(profile: AdminDashboardData['profile']): string {
  const raw = profile?.full_name;
  if (typeof raw !== 'string' || !raw.trim()) return 'Admin';
  return raw.trim().split(/\s+/)[0] || 'Admin';
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
      {/* Premium Hero Header */}
      <div className="relative w-full overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #f97316 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, #2563eb 0%, transparent 50%)`,
          }} />
        </div>
        <div className="relative px-6 sm:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
                <AdminGreeting name={firstName} />
              </h1>
              <p className="text-slate-400 text-sm">{today}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <p className="text-xs text-slate-400 mb-0.5">Pending Applications</p>
                <p className="text-xl font-black text-white">{data.counts?.pendingApplications ?? 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <p className="text-xs text-slate-400 mb-0.5">Active Enrollments</p>
                <p className="text-xl font-black text-emerald-400">{data.counts?.activeEnrollments ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">

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

        <DegradedBanner
          sections={(data.degradedSections ?? []).filter((s) => s !== 'dashboard_data')}
          dashboardUnavailable={(data.degradedSections ?? []).includes('dashboard_data')}
        />

        <AdminCategoryLanding />

        <DashboardPanelErrorBoundary name="Publish website">
          <PublishWebsitePanelLazy />
        </DashboardPanelErrorBoundary>

        {/* ── Stats overview bar ───────────────────────────────────────── */}
        <StatsOverviewBar data={data} />

        {/* ── KPI cards ────────────────────────────────────────────────── */}
        {(data.kpis?.length ?? 0) > 0 && (
          <div className="mb-6">
            <DashboardPanelErrorBoundary name="KPI cards">
              <RealtimeKpiGrid kpis={data.kpis} />
            </DashboardPanelErrorBoundary>
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
            <LearnersNeedingAttention learners={data.inactiveLearners ?? []} />
            <ReviewQueues data={data} />
            <CrmFollowUpQueue leads={data.staleLeads ?? []} />
          </div>
          <div className="space-y-4">
            <EnrollmentFunnel data={data} />
            <RecentActivity items={data.recentActivity ?? []} />
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
            <RecentStudentsPanel students={data.recentStudents ?? []} />
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
                  <Link key={p.id} href={`/admin/programs/${encodeURIComponent(p.slug || p.id)}/manage`}
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
          <DashboardPanelErrorBoundary name="Program integrity">
            <ProgramIntegrityPanelLazy />
          </DashboardPanelErrorBoundary>
        </div>

        {/* ── Job board + system health ────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardPanelErrorBoundary name="Job board">
            <JobBoardPanelLazy />
          </DashboardPanelErrorBoundary>
          <SystemHealthPanel health={data.systemHealth ?? { stripeWebhookOk: false, stripeIssuingOk: false, buildEnvOk: false, staleJobs: 0, degraded: true, missingDocuments: 0, missingCertifications: 0, unresolvedFlags: 0, alerts: [] }} />
        </div>

      </div>
    </div>
  );
}
