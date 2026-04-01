"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  AlertTriangle, CheckCircle, ArrowRight, Download, ChevronUp, ChevronDown,
  XCircle, UserX, BookOpen, Shield, BarChart3, Zap, Target, Settings, Users,
} from "lucide-react";
import { KpiGrid } from "./KpiGrid";
import { BlockedProgramsList } from "./BlockedProgramsList";
import { InactiveLearnersList } from "./InactiveLearnersList";
import { RecentApplicationsList } from "./RecentApplicationsList";
import type { AdminDashboardData, RecentStudent } from "./types";

// ── Chart constants ───────────────────────────────────────────────────────────
const PIE_COLORS = ["#0f172a","#06b6d4","#94a3b8","#22c55e","#f59e0b","#ef4444"];
const LINE_COLOR = "#3b82f6";
const BAR_COLOR  = "#06b6d4";

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string,string> = {
  pending:"bg-amber-100 text-amber-800", submitted:"bg-amber-100 text-amber-800",
  in_review:"bg-blue-100 text-blue-800", approved:"bg-emerald-100 text-emerald-800",
  enrolled:"bg-teal-100 text-teal-800",  rejected:"bg-red-100 text-red-800",
  waitlisted:"bg-purple-100 text-purple-800", active:"bg-emerald-100 text-emerald-800",
  at_risk:"bg-red-100 text-red-800",     completed:"bg-gray-100 text-gray-700",
};
const STATUS_LABEL: Record<string,string> = {
  pending:"Pending", submitted:"Submitted", in_review:"In Review",
  approved:"Approved", enrolled:"Enrolled", rejected:"Rejected",
  waitlisted:"Waitlisted", active:"Active", at_risk:"At Risk", completed:"Completed",
};
function Badge({ status }: { status: string }) {
  return (
    <span className={"inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold " + (STATUS_BADGE[status] || "bg-gray-100 text-gray-600")}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(rows: Record<string,unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

// ── Sort helpers ──────────────────────────────────────────────────────────────
type SortKey = "full_name" | "enrollment_status" | "created_at";
function SortIcon({ active, dir }: { active: boolean; dir: "asc"|"desc" }) {
  if (!active) return <ChevronDown className="w-3 h-3 text-slate-300"/>;
  return dir === "asc" ? <ChevronUp className="w-3 h-3 text-blue-500"/> : <ChevronDown className="w-3 h-3 text-blue-500"/>;
}

// ── Quick actions (static — no DB dependency) ─────────────────────────────────
const QUICK_ACTIONS = [
  { label:"Course Builder", sub:"Create or edit programs",  href:"/admin/course-builder",    icon:BookOpen, bg:"bg-blue-50",    color:"text-blue-600"    },
  { label:"Compliance",     sub:"Documents & audits",       href:"/admin/compliance",         icon:Shield,   bg:"bg-emerald-50", color:"text-emerald-600" },
  { label:"Reports",        sub:"Analytics & exports",      href:"/admin/reports",            icon:BarChart3,bg:"bg-purple-50",  color:"text-purple-600"  },
  { label:"HVAC",           sub:"Manage HVAC program",      href:"/admin/hvac-activation",    icon:Zap,      bg:"bg-amber-50",   color:"text-amber-600"   },
  { label:"Funding",        sub:"WIOA & grants",            href:"/admin/funding",            icon:Target,   bg:"bg-green-50",   color:"text-green-600"   },
  { label:"Settings",       sub:"System configuration",     href:"/admin/settings",           icon:Settings, bg:"bg-slate-100",  color:"text-slate-600"   },
];

// ── Main shell ────────────────────────────────────────────────────────────────
export function DashboardShell({ data }: { data: AdminDashboardData }) {
  const [trendRange, setTrendRange] = useState<"7d"|"30d"|"3mo">("30d");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc"|"desc" }>({ key: "created_at", dir: "desc" });

  function toggleSort(key: SortKey) {
    setSort(p => ({ key, dir: p.key === key && p.dir === "asc" ? "desc" : "asc" }));
  }

  // Defer time-dependent values to client to avoid SSR/hydration mismatch
  const [greeting, setGreeting] = useState("Good morning");
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
    setDateLabel(now.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }));
  }, []);
  const firstName = data.profile?.full_name?.split(" ")[0] || "Admin";

  const trendData = useMemo(() => {
    const n = trendRange === "7d" ? 2 : trendRange === "30d" ? 4 : data.enrollmentTrend.length;
    return data.enrollmentTrend.slice(-n);
  }, [data.enrollmentTrend, trendRange]);

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

  // Attention blockers — derived from already-resolved data
  const pendingAppsKpi = data.kpis.find(k => k.label === "Pending Applications");
  const blockers = [
    pendingAppsKpi?.urgent && {
      label: `${pendingAppsKpi.value} application${pendingAppsKpi.value !== 1 ? "s" : ""} need review`,
      sub: "Learners waiting for a decision",
      href: "/admin/applications?status=pending",
      badge: "Urgent", badgeColor: "bg-red-100 text-red-700", urgent: true,
    },
    data.blockedPrograms.length > 0 && {
      label: `${data.blockedPrograms.length} program${data.blockedPrograms.length !== 1 ? "s" : ""} unpublished`,
      sub: "Blocking revenue",
      href: "/admin/programs",
      badge: "Blocking", badgeColor: "bg-orange-100 text-orange-700", urgent: true,
    },
    data.inactiveLearners.length > 0 && {
      label: `${data.inactiveLearners.length} learner${data.inactiveLearners.length !== 1 ? "s" : ""} inactive 3+ days`,
      sub: "No activity or falling behind",
      href: "/admin/at-risk",
      badge: "At Risk", badgeColor: "bg-red-100 text-red-700", urgent: true,
    },
  ].filter(Boolean) as { label: string; sub: string; href: string; badge: string; badgeColor: string; urgent: boolean }[];

  return (
    <div className="space-y-6">

      {/* Welcome bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{greeting}, {firstName}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {dateLabel}
            {blockers.length > 0 && (
              <span className="ml-2 font-semibold text-rose-600">
                · {blockers.length} item{blockers.length !== 1 ? "s" : ""} need attention
              </span>
            )}
          </p>
        </div>
        <Link href="/admin/reports" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 transition-colors">
          <BarChart3 className="h-4 w-4"/>Reports
        </Link>
      </div>

      {/* KPI cards */}
      <KpiGrid kpis={data.kpis} />

      {/* Enrollment trend */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Enrollment Trend</h2>
            <p className="text-sm text-slate-500">Monthly learner enrollment volume</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(["7d","30d","3mo"] as const).map(r => (
              <button key={r} onClick={() => setTrendRange(r)}
                className={"px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors " + (trendRange === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize:12, fill:"#94a3b8" }}/>
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize:12, fill:"#94a3b8" }}/>
                <Tooltip contentStyle={{ fontSize:12, borderRadius:12, border:"1px solid #e2e8f0" }}/>
                <Line type="monotone" dataKey="enrollments" stroke={LINE_COLOR} strokeWidth={3} dot={{ r:4, fill:LINE_COLOR }} activeDot={{ r:6 }} name="Enrollments"/>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">No enrollment data yet</div>
          )}
        </div>
      </section>

      {/* Status donut + Top programs */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Student Statuses</h2>
          <p className="text-sm text-slate-500 mb-4">Current distribution by learner status</p>
          {data.studentStatuses.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.studentStatuses} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {data.studentStatuses.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize:12, borderRadius:12, border:"1px solid #e2e8f0" }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {data.studentStatuses.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}/>
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900 tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">No status data yet</div>
          )}
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Top Programs</h2>
          <p className="text-sm text-slate-500 mb-4">Highest learner volume by program</p>
          {data.topPrograms.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topPrograms} layout="vertical" margin={{ left:8, right:8, top:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize:11, fill:"#94a3b8" }}/>
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize:11, fill:"#64748b" }} width={120}/>
                  <Tooltip contentStyle={{ fontSize:12, borderRadius:12, border:"1px solid #e2e8f0" }}/>
                  <Bar dataKey="learners" fill={BAR_COLOR} radius={[0,8,8,0]} name="Learners"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">No program data yet</div>
          )}
        </div>
      </section>

      {/* Program performance */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Program Performance Snapshot</h2>
          <p className="text-sm text-slate-500">Enrollment and completion rate by program</p>
        </div>
        <div className="space-y-4">
          {data.topPrograms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No program performance data available yet.
            </div>
          ) : data.topPrograms.map(p => (
            <div key={p.id || p.name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800 truncate max-w-xs">{p.name}</span>
                <span className="text-slate-500 flex-shrink-0 ml-4">
                  {p.learners} learners · {p.completed} completed · {p.completionRate}% completion
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100">
                <div className="h-2.5 rounded-full bg-cyan-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, p.completionRate))}%` }}/>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Attention blockers + Recent applications */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500"/>
            <h2 className="text-sm font-bold text-slate-900">Needs a Decision</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {blockers.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-2"/>
                <p className="text-xs text-slate-400">Nothing blocking — all clear</p>
              </div>
            ) : blockers.map((b, i) => (
              <Link key={i} href={b.href} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
                {b.urgent && <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"/>}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{b.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{b.sub}</div>
                </div>
                <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 " + b.badgeColor}>{b.badge}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0"/>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <RecentApplicationsList items={data.recentApplications} />
        </div>
      </section>

      {/* Blocked programs + Inactive learners */}
      {(data.blockedPrograms.length > 0 || data.inactiveLearners.length > 0) && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500"/>Programs Blocking Revenue
                <span className="text-[10px] font-black bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{data.blockedPrograms.length}</span>
              </h2>
              <Link href="/admin/programs" className="text-xs text-blue-600 font-medium hover:underline">View all →</Link>
            </div>
            <BlockedProgramsList items={data.blockedPrograms} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserX className="w-4 h-4 text-amber-500"/>Inactive Learners
                <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{data.inactiveLearners.length}</span>
              </h2>
              <Link href="/admin/at-risk" className="text-xs text-blue-600 font-medium hover:underline">View all →</Link>
            </div>
            <InactiveLearnersList items={data.inactiveLearners} />
          </div>
        </section>
      )}

      {/* Students table + Activity + Quick actions */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400"/>Recent Students
            </h2>
            <div className="flex items-center gap-2">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              <button
                onClick={() => exportCSV(
                  data.recentStudents.map(s => ({ Name: s.full_name||"", Email: s.email||"", Status: s.enrollment_status||"", Program: s.program_name||"", Registered: s.created_at ? new Date(s.created_at).toLocaleDateString() : "" })),
                  "students.csv"
                )}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition" title="Export CSV">
                <Download className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {([["full_name","Name"],["enrollment_status","Status"],["created_at","Registered"]] as [SortKey,string][]).map(([key, label]) => (
                    <th key={key} className="px-5 py-3 text-left font-semibold text-slate-500 cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(key)}>
                      <span className="flex items-center gap-1">{label}<SortIcon active={sort.key === key} dir={sort.dir}/></span>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-left font-semibold text-slate-500">Program</th>
                  <th className="px-5 py-3"/>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No students found</td></tr>
                ) : filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
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
                    <td className="px-5 py-3"><Badge status={s.enrollment_status || "pending"}/></td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"2-digit" }) : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500 truncate max-w-[120px]">{s.program_name || "—"}</td>
                    <td className="px-5 py-3">
                      <Link href={s.href} className="text-blue-600 hover:underline font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest administrative events</p>
            </div>
            <div className="divide-y divide-slate-50">
              {data.recentActivity.length === 0 ? (
                <div className="px-5 py-8 text-center"><p className="text-xs text-slate-400">No recent activity</p></div>
              ) : data.recentActivity.map(item => (
                <div key={item.id} className="flex gap-3 px-5 py-3">
                  <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-500"/>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-100">
              {QUICK_ACTIONS.map(a => (
                <Link key={a.href} href={a.href} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
                  <div className={"w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 " + a.bg}>
                    <a.icon className={"w-4 h-4 " + a.color}/>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{a.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{a.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
