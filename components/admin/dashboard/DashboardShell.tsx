// Server component — no "use client", no useState, no useEffect.
// All values computed at render time on the server — zero hydration mismatch.

import Link from "next/link";
import Image from "next/image";
import {
  FileText, Users, DollarSign, Award, AlertTriangle, ArrowRight,
  RefreshCw, TrendingUp, BarChart3, Zap, ChevronRight,
  BookOpen, XCircle, UserX,
} from "lucide-react";
import type { AdminDashboardData } from "./types";
import { KpiGrid } from "./KpiGrid";
import { RecentApplicationsList } from "./RecentApplicationsList";
import { BlockedProgramsList } from "./BlockedProgramsList";
import { InactiveLearnersList } from "./InactiveLearnersList";

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);
}
function fmtNum(n: number) { return new Intl.NumberFormat("en-US").format(n); }
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtAge(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// ── Status pill ───────────────────────────────────────────────────────────────
const STATUS_PILL: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-800",
  pending:   "bg-amber-100 text-amber-800",
  in_review: "bg-blue-100 text-blue-800",
  active:    "bg-emerald-100 text-emerald-800",
  completed: "bg-slate-100 text-slate-600",
  draft:     "bg-slate-100 text-slate-500",
  inactive:  "bg-slate-100 text-slate-500",
};
function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_PILL[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
const KPI_THEMES = [
  { gradient: "from-rose-500 to-orange-400",   bg: "bg-rose-50",    icon: "text-rose-600"    },
  { gradient: "from-blue-500 to-cyan-400",     bg: "bg-blue-50",    icon: "text-blue-600"    },
  { gradient: "from-emerald-500 to-teal-400",  bg: "bg-emerald-50", icon: "text-emerald-600" },
  { gradient: "from-violet-500 to-purple-400", bg: "bg-violet-50",  icon: "text-violet-600"  },
];

function KpiCard({ label, value, sub, href, urgent, icon: Icon, index = 0 }: {
  label: string; value: string; sub: string;
  href: string; urgent?: boolean; icon: React.ElementType; index?: number;
}) {
  const theme = urgent ? KPI_THEMES[0] : KPI_THEMES[index % KPI_THEMES.length];
  return (
    <Link href={href} className={[
      "group relative flex flex-col rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
      urgent ? "ring-2 ring-rose-400" : "",
    ].join(" ")}>
      {/* Gradient top bar */}
      <div className={`h-1.5 bg-gradient-to-r ${theme.gradient}`} />
      <div className="flex-1 bg-white p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
          <div className={`rounded-xl p-2 flex-shrink-0 ${theme.bg} ${theme.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">{value}</p>
        <p className="text-xs text-slate-400 leading-snug mt-1.5">{sub}</p>
        {urgent && <span className="absolute top-5 right-14 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
        <ArrowRight className="absolute bottom-4 right-4 w-3.5 h-3.5 text-slate-200 group-hover:text-slate-500 transition-colors" />
      </div>
    </Link>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({ title, href, linkLabel, children, count, urgent }: {
  title: string; href?: string; linkLabel?: string;
  children: React.ReactNode; count?: number; urgent?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          {title}
          {(count ?? 0) > 0 && (
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${urgent ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
              {count}
            </span>
          )}
        </h2>
        {href && linkLabel && (
          <Link href={href} className="text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1">
            {linkLabel} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <div className="py-10 text-center text-sm text-slate-400">{message}</div>;
}

// ── Zero-state guard ──────────────────────────────────────────────────────────
// Reads from typed counts, not from kpis[] by label string.
// If all four operational counts are zero the DB is either empty or not connected.
function isOperationallyEmpty(data: AdminDashboardData): boolean {
  const { pendingApplications, activeEnrollments, revenueThisMonthCents, certificatesIssued } = data.counts;
  return pendingApplications === 0 && activeEnrollments === 0 && revenueThisMonthCents === 0 && certificatesIssued === 0;
}

function NoOperationalData() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 mb-6">
        <AlertTriangle className="w-7 h-7 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">No operational data</h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8">
        All KPIs returned zero. The database is either empty or the connection is not returning data.
        This is not a UI issue.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/admin/applications"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors">
          Check Applications table
        </Link>
        <Link href="/admin/students"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
          Check Students table
        </Link>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
const DEGRADED_SECTION_LABELS: Record<string, string> = {
  inactive_learners:      'Inactive learners (3+ days)',
  unpublished_programs:   'Unpublished programs list',
  recent_students:        'Recent students',
  enrollments_by_program: 'Enrollment breakdown by program',
};

function DegradedBanner({ sections }: { sections: string[] }) {
  const labels = sections.map(s => DEGRADED_SECTION_LABELS[s] ?? s);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div>
        <span className="font-medium">Some sections are temporarily unavailable.</span>
        {' '}KPI counts are accurate.
        <ul className="mt-1 list-disc list-inside text-amber-700">
          {labels.map(label => (
            <li key={label}>{label} could not be loaded</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DashboardShell({ data }: { data: AdminDashboardData }) {
  if (isOperationallyEmpty(data)) return <NoOperationalData />;

  const updatedAt   = new Date(data.generatedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const firstName   = data.profile?.full_name?.split(" ")[0] ?? "Admin";

  const { pendingApplications, activeEnrollments, revenueThisMonthCents, certificatesIssued } = data.counts;
  const pendingKpi  = data.kpis.find(k => k.label === "Pending Applications");
  const activeKpi   = data.kpis.find(k => k.label === "Active Enrollments");
  const revenueKpi  = data.kpis.find(k => k.label === "Revenue This Month");
  const totalPending   = pendingApplications;
  const maxEnrollments = Math.max(...data.topPrograms.map(p => p.learners), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-16 pt-4">
      {(data.degradedSections ?? []).length > 0 && (
        <DegradedBanner sections={data.degradedSections ?? []} />
      )}

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden h-48 sm:h-56 shadow-md">
        <Image
          src="/images/pages/admin-dashboard-hero.jpg"
          alt="Admin dashboard"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent" />
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
          <div>
            <p className="text-slate-300 text-xs font-semibold uppercase tracking-widest mb-1">{getGreeting()}, {firstName} · {updatedAt}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">Operations Dashboard</h1>
            {totalPending > 0 && (
              <p className="text-rose-300 text-sm font-bold mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse inline-block" />
                {totalPending} application{totalPending !== 1 ? 's' : ''} waiting for review
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/applications?status=submitted"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 hover:bg-brand-red-700 text-white px-4 py-2 text-sm font-bold transition-colors shadow-sm">
              <FileText className="w-4 h-4" />
              Applications
              {totalPending > 0 && (
                <span className="bg-white text-brand-red-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">{totalPending}</span>
              )}
            </Link>
            <Link href="/admin/students"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-4 py-2 text-sm font-semibold transition-colors">
              <Users className="w-4 h-4" /> Students
            </Link>
            <Link href="/admin/analytics"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-4 py-2 text-sm font-semibold transition-colors">
              <BarChart3 className="w-4 h-4" /> Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* KPI cards — delta labels from real month-over-month queries */}
      <KpiGrid kpis={data.kpis} />

      {/* Enrollment trend + student status breakdown */}
      {(data.enrollmentTrend.length > 0 || data.studentStatuses.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Enrollment trend — bar chart rendered as CSS bars (no recharts dep) */}
          {data.enrollmentTrend.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-blue-500" /> Enrollment Trend (12 months)
              </p>
              <div className="flex items-end gap-1.5 h-28">
                {(() => {
                  const max = Math.max(...data.enrollmentTrend.map(t => t.enrollments), 1);
                  return data.enrollmentTrend.map(t => (
                    <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-brand-blue-500 transition-all"
                        style={{ height: `${Math.round((t.enrollments / max) * 96)}px`, minHeight: t.enrollments > 0 ? '4px' : '0' }} />
                      <span className="text-[9px] text-slate-400 font-medium">{t.month}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Student status breakdown */}
          {data.studentStatuses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" /> Students by Status
              </p>
              <div className="space-y-3">
                {(() => {
                  const total = data.studentStatuses.reduce((s, r) => s + r.value, 0) || 1;
                  const COLORS: Record<string, string> = {
                    Active: 'bg-emerald-500', Completed: 'bg-blue-500',
                    Pending: 'bg-amber-500', Inactive: 'bg-slate-300',
                    Withdrawn: 'bg-rose-400',
                  };
                  return data.studentStatuses.map(s => (
                    <div key={s.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{s.name}</span>
                        <span className="text-slate-500 tabular-nums">{s.value} ({Math.round((s.value / total) * 100)}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${COLORS[s.name] ?? 'bg-slate-400'}`}
                          style={{ width: `${Math.round((s.value / total) * 100)}%` }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Applications + At-Risk */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentApplicationsList items={data.recentApplications} />
        <InactiveLearnersList items={data.inactiveLearners} />
      </div>

      {/* Programs by enrollment */}
      <Section title="Programs by Enrollment" href="/admin/programs" linkLabel="All programs">
        {data.topPrograms.length === 0 ? (
          <EmptyRow message="No program enrollment data yet" />
        ) : (
          <div className="px-5 py-4 space-y-4">
            {data.topPrograms.map(p => (
              <div key={p.id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <Link href={`/admin/programs/${p.id}`}
                    className="font-semibold text-slate-800 hover:text-brand-blue-600 truncate max-w-xs transition-colors">
                    {p.name}
                  </Link>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4 text-xs text-slate-500">
                    <span className="tabular-nums">{fmtNum(p.learners)} enrolled</span>
                    <span className="tabular-nums font-semibold text-emerald-600">{p.completionRate}% complete</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-brand-blue-500"
                      style={{ width: `${Math.round((p.learners / maxEnrollments) * 100)}%` }} />
                  </div>
                  <div className="w-16 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${p.completionRate}%` }} />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-brand-blue-500 inline-block" /> Enrollment</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block" /> Completion</span>
            </div>
          </div>
        )}
      </Section>

      {/* Recent activity feed */}
      {data.recentActivity.length > 0 && (
        <Section title="Recent Activity" href="/admin/students" linkLabel="All students">
          <div className="divide-y divide-slate-50">
            {data.recentActivity.slice(0, 10).map(item => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-2 h-2 rounded-full bg-brand-blue-400 flex-shrink-0" />
                <p className="flex-1 text-sm text-slate-700 truncate">{item.title}</p>
                <span className="text-[10px] text-slate-400 flex-shrink-0 tabular-nums">
                  {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Recent students + Unpublished programs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Recent Students" href="/admin/students" linkLabel="All students">
          {data.recentStudents.length === 0 ? (
            <EmptyRow message="No students yet" />
          ) : (
            <div className="divide-y divide-slate-50">
              {data.recentStudents.map(s => (
                <Link key={s.id} href={s.href}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-brand-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{s.full_name ?? s.email ?? "Unknown"}</p>
                    <p className="text-xs text-slate-400 truncate">{s.program_name ?? "No program"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {s.enrollment_status && <StatusPill status={s.enrollment_status} />}
                    <span className="text-[10px] text-slate-400">{fmtDate(s.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <BlockedProgramsList items={data.blockedPrograms} />
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "New Application",   href: "/admin/applications",  icon: FileText,   color: "text-amber-600",   bg: "bg-amber-50" },
            { label: "Add Student",       href: "/admin/students/new",  icon: Users,      color: "text-blue-600",    bg: "bg-blue-50" },
            { label: "Create Program",    href: "/admin/programs/new",  icon: BookOpen,   color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "WIOA Report",       href: "/admin/wioa",          icon: TrendingUp, color: "text-purple-600",  bg: "bg-purple-50" },
            { label: "Notifications",     href: "/admin/notifications", icon: Zap,        color: "text-rose-600",    bg: "bg-rose-50" },
            { label: "Analytics",         href: "/admin/analytics",     icon: BarChart3,  color: "text-slate-600",   bg: "bg-slate-100" },
          ].map(a => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href}
                className="group bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2.5 hover:shadow-md hover:border-slate-300 transition-all text-center">
                <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${a.color}`} />
                </div>
                <span className="text-xs font-semibold text-slate-700 leading-tight">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
