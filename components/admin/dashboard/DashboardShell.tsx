"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, CheckCircle, Clock, Users,
  FileText, DollarSign, Award, XCircle, UserX, TrendingUp,
  RefreshCw, ChevronUp, ChevronDown, Download, ExternalLink,
} from "lucide-react";
import { RecentApplicationsList } from "./RecentApplicationsList";
import { BlockedProgramsList } from "./BlockedProgramsList";
import { InactiveLearnersList } from "./InactiveLearnersList";
import type { AdminDashboardData, RecentStudent } from "./types";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function fmtUsd(cents: number) {
  if (cents === 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  submitted:  "bg-amber-100 text-amber-800",
  pending:    "bg-amber-100 text-amber-800",
  in_review:  "bg-blue-100 text-blue-800",
  approved:   "bg-emerald-100 text-emerald-800",
  enrolled:   "bg-teal-100 text-teal-800",
  active:     "bg-emerald-100 text-emerald-800",
  rejected:   "bg-red-100 text-red-800",
  waitlisted: "bg-purple-100 text-purple-800",
  at_risk:    "bg-red-100 text-red-800",
  completed:  "bg-slate-100 text-slate-600",
  draft:      "bg-slate-100 text-slate-600",
  inactive:   "bg-slate-100 text-slate-500",
};
const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted", pending: "Pending", in_review: "In Review",
  approved: "Approved", enrolled: "Enrolled", active: "Active",
  rejected: "Rejected", waitlisted: "Waitlisted", at_risk: "At Risk",
  completed: "Completed", draft: "Draft", inactive: "Inactive",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, href, urgent, icon: Icon }: {
  label: string; value: string | number; sub: string;
  href: string; urgent?: boolean; icon: React.ElementType;
}) {
  return (
    <Link href={href} className={`group relative flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all ${urgent ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={`rounded-xl p-2 flex-shrink-0 ${urgent ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-400 leading-snug">{sub}</p>
      {urgent && <span className="absolute top-4 right-12 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
      <ArrowRight className="absolute bottom-4 right-4 w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition-colors" />
    </Link>
  );
}

// ── Sort icon ─────────────────────────────────────────────────────────────────
type SortKey = "full_name" | "enrollment_status" | "created_at";
function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return null;
  return dir === "asc" ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />;
}

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

// ── Main shell ────────────────────────────────────────────────────────────────
export function DashboardShell({ data }: { data: AdminDashboardData }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "created_at", dir: "desc" });
  const [greeting, setGreeting] = useState("Good morning");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setUpdatedAt(new Date(data.generatedAt).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    }));
  }, [data.generatedAt]);

  const firstName = data.profile?.full_name?.split(" ")[0] || "Admin";

  const pendingAppsKpi = data.kpis.find(k => k.label === "Pending Applications");
  const totalPending = pendingAppsKpi?.value ?? 0;
  const urgentApps = data.recentApplications.filter(a => a.urgent).length;
  const urgentCount = [totalPending > 0, data.blockedPrograms.length > 0, data.inactiveLearners.length > 0].filter(Boolean).length;

  const revenueKpi = data.kpis.find(k => k.label === "Revenue This Month");
  const revenueThisMonth = fmtUsd(revenueKpi?.value ?? 0);
  const revenueAllTime = revenueKpi?.sub ?? "";

  const activeKpi = data.kpis.find(k => k.label === "Active Enrollments");
  const certsKpi = data.kpis.find(k => k.label === "Certificates Issued");

  const filteredStudents = useMemo(() => {
    let list = [...data.recentStudents];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => (s.full_name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const av = a[sort.key as keyof RecentStudent] ?? "";
      const bv = b[sort.key as keyof RecentStudent] ?? "";
      return sort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return list;
  }, [data.recentStudents, search, sort]);

  function toggleSort(key: SortKey) {
    setSort(p => ({ key, dir: p.key === key && p.dir === "asc" ? "desc" : "asc" }));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-12">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap pt-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{greeting}, {firstName}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <RefreshCw className="w-3 h-3 flex-shrink-0" />
            <span>Updated {updatedAt || "—"}</span>
            {urgentCount > 0 && (
              <span className="font-semibold text-rose-600">
                · {urgentCount} item{urgentCount !== 1 ? "s" : ""} need attention
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/admin/reports" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-semibold px-3 py-2 hover:bg-slate-50 transition-colors shadow-sm">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reports</span>
          </Link>
          <Link href="/admin/applications?status=submitted" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold px-3 py-2 transition-colors shadow-sm">
            <span className="hidden sm:inline">Review </span>Applications
            {totalPending > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{totalPending}</span>
            )}
          </Link>
        </div>
      </div>

      {/* ── Zone 1: Primary metrics ── */}
      <section>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Live Operations</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Applications Waiting"
            value={fmtNumber(totalPending)}
            sub={pendingAppsKpi?.sub ?? "No pending applications"}
            href="/admin/applications?status=submitted,pending,in_review"
            urgent={totalPending > 0}
            icon={FileText}
          />
          <MetricCard
            label="Active Enrollments"
            value={fmtNumber(activeKpi?.value ?? 0)}
            sub={activeKpi?.sub ?? ""}
            href="/admin/students?status=active"
            urgent={(data.inactiveLearners.length) > 0}
            icon={Users}
          />
          <MetricCard
            label="Revenue This Month"
            value={revenueThisMonth}
            sub={revenueAllTime}
            href="/admin/enrollments?payment_status=paid"
            icon={DollarSign}
          />
          <MetricCard
            label="Certificates Issued"
            value={fmtNumber(certsKpi?.value ?? 0)}
            sub="All time"
            href="/admin/certificates"
            icon={Award}
          />
        </div>
      </section>

      {/* ── Zone 2: Action queues ── */}
      <section>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Action Queues</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Applications — full width left */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Applications Awaiting Review
                {totalPending > 0 && (
                  <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{totalPending}</span>
                )}
                {urgentApps > 0 && (
                  <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">{urgentApps} urgent</span>
                )}
              </h2>
              <Link href="/admin/applications?status=submitted" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                View all <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <RecentApplicationsList items={data.recentApplications} />
          </div>

          {/* Right column: blockers */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  Blocking Enrollment
                  {data.blockedPrograms.length > 0 && (
                    <span className="text-[10px] font-black bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{data.blockedPrograms.length}</span>
                  )}
                </h2>
                <Link href="/admin/programs" className="text-xs text-blue-600 font-medium hover:underline">Fix →</Link>
              </div>
              {data.blockedPrograms.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-400">All programs published</p>
                </div>
              ) : <BlockedProgramsList items={data.blockedPrograms} />}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserX className="w-4 h-4 text-amber-500" />
                  Inactive Learners
                  {data.inactiveLearners.length > 0 && (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{data.inactiveLearners.length}</span>
                  )}
                </h2>
                <Link href="/admin/at-risk" className="text-xs text-blue-600 font-medium hover:underline">View →</Link>
              </div>
              {data.inactiveLearners.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-400">No inactive learners</p>
                </div>
              ) : <InactiveLearnersList items={data.inactiveLearners} />}
            </div>
          </div>
        </div>
      </section>

      {/* ── Zone 3: Programs by enrollment ── */}
      {data.topPrograms.length > 0 && (
        <section>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Programs by Enrollment</p>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <div className="space-y-4">
              {data.topPrograms.map(p => (
                <div key={p.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <Link href={`/admin/programs/${p.id}`} className="font-medium text-slate-800 hover:text-blue-600 truncate max-w-xs">
                      {p.name}
                    </Link>
                    <span className="text-slate-500 flex-shrink-0 ml-4 text-xs tabular-nums">
                      {fmtNumber(p.learners)} enrolled · {fmtNumber(p.completed)} completed · {p.completionRate}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-cyan-500 transition-all" style={{ width: `${Math.max(2, p.completionRate)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Zone 4: Recent students ── */}
      <section>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Students</p>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" /> Students
            </h2>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg w-32 sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => exportCSV(
                  data.recentStudents.map(s => ({
                    Name: s.full_name || "", Email: s.email || "",
                    Status: s.enrollment_status || "", Program: s.program_name || "",
                    Registered: s.created_at ? fmtDate(s.created_at) : "",
                  })),
                  "students.csv"
                )}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <Link href="/admin/students" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                All <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Mobile: card list */}
          <div className="sm:hidden divide-y divide-slate-50">
            {filteredStudents.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">{search ? "No students match" : "No students yet"}</p>
            ) : filteredStudents.map(s => (
              <Link key={s.id} href={s.href} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                  {(s.full_name || s.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{s.full_name || "—"}</div>
                  <div className="text-xs text-slate-400 truncate">{s.program_name || s.email || "—"}</div>
                </div>
                <StatusBadge status={s.enrollment_status || "pending"} />
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {([["full_name", "Name"], ["enrollment_status", "Status"], ["created_at", "Registered"]] as [SortKey, string][]).map(([key, label]) => (
                    <th key={key} className="px-4 py-3 text-left font-semibold text-slate-500 cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(key)}>
                      <span className="flex items-center gap-1">{label}<SortIcon active={sort.key === key} dir={sort.dir} /></span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Program</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">{search ? "No students match your search" : "No students yet"}</td></tr>
                ) : filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                          {(s.full_name || s.email || "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate max-w-[140px]">{s.full_name || "—"}</div>
                          <div className="text-slate-400 truncate max-w-[140px]">{s.email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.enrollment_status || "pending"} /></td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.created_at ? fmtDate(s.created_at) : "—"}</td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-[120px]">{s.program_name || "—"}</td>
                    <td className="px-4 py-3"><Link href={s.href} className="text-blue-600 hover:underline font-medium">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
