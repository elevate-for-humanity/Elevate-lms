// Server component — no "use client", no useState, no useEffect.
// All values computed at render time on the server — zero hydration mismatch.

import Link from "next/link";
import {
  FileText, Users, DollarSign, Award, AlertTriangle, ArrowRight,
  RefreshCw, TrendingUp, BarChart3, Zap, ChevronRight,
  BookOpen, XCircle, UserX,
} from "lucide-react";
import type { AdminDashboardData } from "./types";

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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_PILL[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, href, urgent, icon: Icon }: {
  label: string; value: string; sub: string;
  href: string; urgent?: boolean; icon: React.ElementType;
}) {
  return (
    <Link href={href} className={[
      "group relative flex flex-col gap-2 rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all",
      urgent ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200",
    ].join(" ")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <div className={`rounded-xl p-2 flex-shrink-0 ${urgent ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-400 leading-snug">{sub}</p>
      {urgent && <span className="absolute top-4 right-12 w-2 h-2 rounded-full bg-rose-500" />}
      <ArrowRight className="absolute bottom-4 right-4 w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition-colors" />
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
export function DashboardShell({ data }: { data: AdminDashboardData }) {
  if (isOperationallyEmpty(data)) return <NoOperationalData />;
  const greeting    = getGreeting();
  const updatedAt   = new Date(data.generatedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const firstName   = data.profile?.full_name?.split(" ")[0] ?? "Admin";

  const { pendingApplications, activeEnrollments, revenueThisMonthCents, certificatesIssued } = data.counts;

  // kpis[] is still used for sub-labels (context lines) — not for values
  const pendingKpi  = data.kpis.find(k => k.label === "Pending Applications");
  const activeKpi   = data.kpis.find(k => k.label === "Active Enrollments");
  const revenueKpi  = data.kpis.find(k => k.label === "Revenue This Month");
  const certsKpi    = data.kpis.find(k => k.label === "Certificates Issued");

  const totalPending   = pendingApplications;
  const maxEnrollments = Math.max(...data.topPrograms.map(p => p.learners), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16 pt-4">
      {data.degradedSections.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>
            Some dashboard sections could not be loaded ({data.degradedSections.join(', ')}).
            KPI counts are accurate. Supplemental lists may be incomplete.
          </span>
        </div>
      )}

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm font-medium">{greeting}, {firstName}</p>
            <h1 className="text-2xl font-black tracking-tight mt-0.5">Admin Dashboard</h1>
            <p className="text-slate-400 text-xs mt-1 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" /> Updated {updatedAt}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/applications?status=submitted"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-2.5 text-sm font-bold hover:bg-slate-100 transition-colors shadow-sm">
              <FileText className="w-4 h-4" />
              Applications
              {totalPending > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{totalPending}</span>
              )}
            </Link>
            <Link href="/admin/students"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-700 text-white px-4 py-2.5 text-sm font-bold hover:bg-slate-600 transition-colors">
              <Users className="w-4 h-4" /> Students
            </Link>
            <Link href="/admin/analytics"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-700 text-white px-4 py-2.5 text-sm font-bold hover:bg-slate-600 transition-colors">
              <BarChart3 className="w-4 h-4" /> Analytics
            </Link>
          </div>
        </div>

        {/* Inline KPI strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Pending",          value: fmtNum(totalPending),              urgent: totalPending > 0 },
            { label: "Active Learners",  value: fmtNum(activeEnrollments),         urgent: false },
            { label: "Revenue",          value: fmtUsd(revenueThisMonthCents),     urgent: false },
            { label: "Certificates",     value: fmtNum(certificatesIssued),        urgent: false },
          ].map(k => (
            <div key={k.label} className={`rounded-xl px-4 py-3 ${k.urgent ? "bg-rose-500/20 border border-rose-400/30" : "bg-white/10"}`}>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{k.label}</p>
              <p className={`text-xl font-black tabular-nums mt-0.5 ${k.urgent ? "text-rose-300" : "text-white"}`}>{k.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label="Applications Waiting" value={fmtNum(totalPending)}
          sub={pendingKpi?.sub ?? "No pending applications"}
          href="/admin/applications?status=submitted" urgent={totalPending > 0} icon={FileText} />
        <KpiCard label="Active Enrollments" value={fmtNum(activeEnrollments)}
          sub={activeKpi?.sub ?? ""}
          href="/admin/enrollments?status=active" urgent={data.inactiveLearners.length > 0} icon={Users} />
        <KpiCard label="Revenue This Month" value={fmtUsd(revenueThisMonthCents)}
          sub={revenueKpi?.sub ?? ""}
          href="/admin/enrollments?payment_status=paid" icon={DollarSign} />
        <KpiCard label="Certificates Issued" value={fmtNum(certificatesIssued)}
          sub="All time" href="/admin/certificates" icon={Award} />
      </div>

      {/* Applications + At-Risk */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Applications Awaiting Review"
          href="/admin/applications?status=submitted" linkLabel="All applications"
          count={totalPending} urgent={totalPending > 0}>
          {data.recentApplications.length === 0 ? (
            <EmptyRow message="No pending applications" />
          ) : (
            <div className="divide-y divide-slate-50">
              {data.recentApplications.slice(0, 8).map(app => {
                const name = app.full_name ||
                  [app.first_name, app.last_name].filter(Boolean).join(" ") || "Unnamed";
                return (
                  <Link key={app.id} href={app.href}
                    className={`flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors ${app.urgent ? "bg-rose-50/40" : ""}`}>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                      {name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                      <p className="text-xs text-slate-400 truncate">{app.program_interest ?? "No program"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusPill status={app.status} />
                      <span className={`text-[10px] font-semibold ${app.urgent ? "text-rose-600" : "text-slate-400"}`}>
                        {fmtAge(app.age_days)}{app.urgent ? " ⚠️" : ""}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="At-Risk Learners" href="/admin/at-risk" linkLabel="View all"
          count={data.inactiveLearners.length} urgent={data.inactiveLearners.length > 0}>
          {data.inactiveLearners.length === 0 ? (
            <EmptyRow message="All students are engaged" />
          ) : (
            <div className="divide-y divide-slate-50">
              {data.inactiveLearners.map(l => (
                <Link key={l.enrollmentId} href={l.href}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <UserX className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{l.fullName ?? "Unknown"}</p>
                    <p className="text-xs text-slate-400 truncate">{l.email ?? "No email"}</p>
                  </div>
                  <span className="text-xs text-amber-600 font-semibold flex-shrink-0">
                    Since {fmtDate(l.enrolledAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Section>
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
                  <div className="w-8 h-8 rounded-full bg-brand-blue-100 flex items-center justify-center text-xs font-bold text-brand-blue-700 flex-shrink-0">
                    {(s.full_name?.[0] ?? s.email?.[0] ?? "?").toUpperCase()}
                  </div>
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

        <Section title="Unpublished Programs" href="/admin/programs?status=draft"
          linkLabel="All programs" count={data.blockedPrograms.length} urgent={data.blockedPrograms.length > 0}>
          {data.blockedPrograms.length === 0 ? (
            <EmptyRow message="All programs are published" />
          ) : (
            <div className="divide-y divide-slate-50">
              {data.blockedPrograms.map(p => (
                <Link key={p.id} href={p.href}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400">Updated {fmtDate(p.updatedAt)}</p>
                  </div>
                  <StatusPill status={p.status} />
                </Link>
              ))}
            </div>
          )}
        </Section>
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
