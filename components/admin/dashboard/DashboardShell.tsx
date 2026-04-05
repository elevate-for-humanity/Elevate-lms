// Server component — no "use client", no useState, no useEffect.

import Link from "next/link";
import Image from "next/image";
import { AdminGreeting } from "@/components/admin/AdminGreeting";
import {
  FileText, Users, DollarSign, Award, AlertTriangle,
  ArrowRight, BookOpen, TrendingUp, BarChart3,
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
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}


// ── Status pill ───────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="text-slate-400 text-sm py-10">{message}</p>;
}

function isOperationallyEmpty(data: AdminDashboardData): boolean {
  const { pendingApplications, activeEnrollments, revenueThisMonthCents, certificatesIssued } = data.counts;
  return pendingApplications === 0 && activeEnrollments === 0 && revenueThisMonthCents === 0 && certificatesIssued === 0;
}

function NoOperationalData() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border border-amber-200 mb-6">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-3">No operational data</h2>
      <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
        All KPIs returned zero. The database is either empty or the connection is not returning data.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/admin/applications"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">
          Check Applications
        </Link>
        <Link href="/admin/students"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
          Check Students
        </Link>
      </div>
    </div>
  );
}

const DEGRADED_LABELS: Record<string, string> = {
  inactive_learners:      "Inactive learners",
  unpublished_programs:   "Unpublished programs",
  recent_students:        "Recent students",
  enrollments_by_program: "Enrollment breakdown",
};
function DegradedBanner({ sections }: { sections: string[] }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div>
        <span className="font-semibold">Some sections are temporarily unavailable.</span>
        {" "}KPI counts are accurate.{" "}
        {sections.map(s => DEGRADED_LABELS[s] ?? s).join(", ")} could not be loaded.
      </div>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────
export function DashboardShell({ data }: { data: AdminDashboardData }) {
  if (isOperationallyEmpty(data)) return <NoOperationalData />;

  const firstName = data.profile?.full_name?.split(" ")[0] ?? "Admin";
  const updatedAt = new Date(data.generatedAt).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  const { pendingApplications, activeEnrollments, revenueThisMonthCents, certificatesIssued } = data.counts;
  const maxEnrollments = Math.max(...data.topPrograms.map(p => p.learners), 1);

  return (
    <div className="pb-16 sm:pb-32">

      {(data.degradedSections ?? []).length > 0 && (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <DegradedBanner sections={data.degradedSections ?? []} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          HERO — full-bleed image, all text below it
      ══════════════════════════════════════════════════════════ */}
      <section>
        {/* Hero image — no text on top */}
        <div className="relative w-full h-48 sm:h-72 lg:h-96 overflow-hidden">
          <Image
            src="/images/pages/admin-dashboard-hero.jpg"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Subtle bottom fade only */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Headline — below the image, full-width content area */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pt-10 sm:pb-16">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-4" suppressHydrationWarning>
            <AdminGreeting name={firstName} />
          </p>
          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-slate-900 leading-none tracking-tight mb-10">
            Operations
          </h1>

          {/* Urgent CTA — only shown when there are pending applications */}
          {pendingApplications > 0 && (
            <Link
              href="/admin/applications?status=submitted"
              className="inline-flex items-center gap-3 bg-rose-600 hover:bg-rose-700 text-white px-7 py-4 rounded-2xl font-bold text-lg transition-colors mb-10"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white/80 animate-pulse" />
              {pendingApplications} application{pendingApplications !== 1 ? "s" : ""} waiting for review
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}

          {/* Quick-nav — same pill style as marketing site */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Applications", href: "/admin/applications",                    icon: FileText   },
              { label: "Students",     href: "/admin/students",                        icon: Users      },
              { label: "Programs",     href: "/admin/programs",                        icon: BookOpen   },
              { label: "Analytics",    href: "/admin/analytics",                       icon: BarChart3  },
              { label: "Certificates", href: "/admin/certificates",                    icon: Award      },
              { label: "Revenue",      href: "/admin/enrollments?payment_status=paid", icon: DollarSign },
              { label: "At-Risk",      href: "/admin/at-risk",                         icon: TrendingUp },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all shadow-sm"
              >
                <Icon className="w-4 h-4 text-slate-400" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          NUMBERS — ruled list, big typographic values
      ══════════════════════════════════════════════════════════ */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-28">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-10">At a glance</p>
        <div className="divide-y divide-slate-100">
          {[
            { label: "Applications waiting",  value: fmtNum(pendingApplications),       href: "/admin/applications?status=submitted",       urgent: pendingApplications > 0 },
            { label: "Active enrollments",     value: fmtNum(activeEnrollments),         href: "/admin/enrollments?status=active",            urgent: false },
            { label: "Revenue this month",     value: fmtUsd(revenueThisMonthCents),     href: "/admin/enrollments?payment_status=paid",      urgent: false },
            { label: "Certificates issued",    value: fmtNum(certificatesIssued),        href: "/admin/certificates",                         urgent: false },
          ].map(({ label, value, href, urgent }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-center justify-between py-5 sm:py-8 hover:bg-slate-50 -mx-4 px-4 rounded-xl transition-colors"
            >
              <span className="text-base font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
                {label}
              </span>
              <div className="flex items-center gap-5">
                <span className={`text-3xl sm:text-4xl lg:text-5xl font-black tabular-nums tracking-tight ${urgent ? "text-rose-600" : "text-slate-900"}`}>
                  {value}
                </span>
                <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-slate-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          APPLICATIONS
      ══════════════════════════════════════════════════════════ */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-28">
        <div className="flex items-end justify-between mb-8 sm:mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Review queue</p>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-none">Applications</h2>
          </div>
          <Link href="/admin/applications" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.recentApplications.length === 0 ? (
          <Empty message="No pending applications." />
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentApplications.slice(0, 8).map(app => {
              const name = app.full_name ||
                [app.first_name, app.last_name].filter(Boolean).join(" ") || "Unnamed";
              return (
                <Link
                  key={app.id}
                  href={app.href}
                  className="group flex items-center gap-4 sm:gap-6 py-4 sm:py-6 hover:bg-slate-50 -mx-4 px-4 rounded-xl transition-colors"
                >
                  <div className={`w-1 h-14 rounded-full flex-shrink-0 ${app.urgent ? "bg-rose-500" : "bg-slate-200"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-slate-900 truncate">{name}</p>
                    <p className="text-sm text-slate-400 truncate mt-0.5">{app.program_interest ?? "No program selected"}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <StatusPill status={app.status} />
                    <span className={`text-sm font-medium hidden sm:block ${app.urgent ? "text-rose-600" : "text-slate-400"}`}>
                      {fmtAge(app.age_days)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-slate-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          PROGRAMS
      ══════════════════════════════════════════════════════════ */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-28">
        <div className="flex items-end justify-between mb-8 sm:mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Enrollment</p>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-none">Programs</h2>
          </div>
          <Link href="/admin/programs" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
            All programs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.topPrograms.length === 0 ? (
          <Empty message="No program enrollment data yet." />
        ) : (
          <div className="space-y-10">
            {data.topPrograms.map(p => (
              <Link key={p.id} href={`/admin/programs/${p.id}`} className="group block">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {p.name}
                  </span>
                  <div className="flex items-center gap-8 text-sm flex-shrink-0 ml-4">
                    <span className="text-slate-500 tabular-nums">{fmtNum(p.learners)} enrolled</span>
                    <span className="font-bold text-emerald-600 tabular-nums">{p.completionRate}% complete</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.round((p.learners / maxEnrollments) * 100)}%` }} />
                  </div>
                  <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${p.completionRate}%` }} />
                  </div>
                </div>
              </Link>
            ))}
            <div className="flex items-center gap-6 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-2"><span className="w-3 h-2 rounded-full bg-blue-500 inline-block" /> Enrollment</span>
              <span className="flex items-center gap-2"><span className="w-3 h-1 rounded-full bg-emerald-400 inline-block" /> Completion</span>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          STUDENTS + AT-RISK
      ══════════════════════════════════════════════════════════ */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-16 lg:gap-24 lg:grid-cols-2 mb-16 lg:mb-28">

        <section>
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Recently enrolled</p>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-none">Students</h2>
            </div>
            <Link href="/admin/students" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
              All students <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {data.recentStudents.length === 0 ? (
            <Empty message="No students yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentStudents.map(s => (
                <Link key={s.id} href={s.href} className="group flex items-center gap-4 py-5 hover:bg-slate-50 -mx-4 px-4 rounded-xl transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate">{s.full_name ?? s.email ?? "Unknown"}</p>
                    <p className="text-sm text-slate-400 truncate mt-0.5">{s.program_name ?? "No program"}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {s.enrollment_status && <StatusPill status={s.enrollment_status} />}
                    <span className="text-xs text-slate-400 hidden sm:block">{fmtDate(s.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Inactive 3+ days</p>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-none">
                At-Risk
                {data.inactiveLearners.length > 0 && (
                  <span className="ml-3 text-rose-600">{data.inactiveLearners.length}</span>
                )}
              </h2>
            </div>
            {data.inactiveLearners.length > 0 && (
              <Link href="/admin/at-risk" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
          {data.inactiveLearners.length === 0 ? (
            <Empty message="All students are engaged." />
          ) : (
            <div className="divide-y divide-slate-100">
              {data.inactiveLearners.map(l => (
                <Link key={l.enrollmentId} href={l.href} className="group flex items-center gap-4 py-5 hover:bg-slate-50 -mx-4 px-4 rounded-xl transition-colors">
                  <div className="w-1 h-10 rounded-full bg-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate">{l.fullName ?? "Unknown"}</p>
                    <p className="text-sm text-slate-400 truncate mt-0.5">{l.email ?? "No email"}</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 flex-shrink-0">Since {fmtDate(l.enrolledAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════
          UNPUBLISHED PROGRAMS
      ══════════════════════════════════════════════════════════ */}
      {data.blockedPrograms.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-28">
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Not yet live</p>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-none">Unpublished</h2>
            </div>
            <Link href="/admin/programs?status=draft" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
              All drafts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.blockedPrograms.map(p => (
              <Link key={p.id} href={p.href} className="group flex items-center gap-4 py-5 hover:bg-slate-50 -mx-4 px-4 rounded-xl transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-slate-900 truncate">{p.title}</p>
                  <p className="text-sm text-slate-400 truncate mt-0.5">{p.slug}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusPill status={p.status} />
                  <span className="text-xs text-slate-400 hidden sm:block">{fmtDate(p.updatedAt)}</span>
                  <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
