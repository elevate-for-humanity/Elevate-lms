'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, TrendingUp, Inbox, DollarSign, AlertTriangle, Award,
  CheckCircle, XCircle, Eye, ChevronUp, ChevronDown, Download,
  Clock, BookOpen, FileText, Zap, BarChart3, Shield, Settings,
} from 'lucide-react';
import type { DashboardData } from './types';

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-800',
  submitted:  'bg-amber-100 text-amber-800',
  in_review:  'bg-blue-100 text-blue-800',
  approved:   'bg-emerald-100 text-emerald-800',
  enrolled:   'bg-teal-100 text-teal-800',
  rejected:   'bg-red-100 text-red-800',
  waitlisted: 'bg-purple-100 text-purple-800',
  active:     'bg-emerald-100 text-emerald-800',
  at_risk:    'bg-red-100 text-red-800',
  completed:  'bg-gray-100 text-gray-700',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', submitted: 'Submitted', in_review: 'In Review',
  approved: 'Approved', enrolled: 'Enrolled', rejected: 'Rejected',
  waitlisted: 'Waitlisted', active: 'Active', at_risk: 'At Risk', completed: 'Completed',
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

type SortKey = 'full_name' | 'enrollment_status' | 'created_at';

// ── component ─────────────────────────────────────────────────────────────────

export default function DashboardClient({ data }: { data: DashboardData }) {
  const c = data.counts;
  const [studentSearch, setStudentSearch] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'created_at', dir: 'desc' });

  function toggleSort(key: SortKey) {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort.key !== col) return <ChevronDown className="w-3 h-3 text-gray-300" />;
    return sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />;
  };

  const filteredStudents = useMemo(() => {
    let list = [...data.recentStudents];
    if (studentSearch) {
      const q = studentSearch.toLowerCase();
      list = list.filter(s => (s.full_name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return list;
  }, [data.recentStudents, studentSearch, sort]);

  const certRate = c.enrollments > 0 ? Math.round((c.certificates / c.enrollments) * 100) : 0;
  const revenueDollars = Math.round(data.totalRevenueCents / 100);
  const revenueDisplay = revenueDollars >= 1000
    ? `$${(revenueDollars / 1000).toFixed(1)}k`
    : `$${revenueDollars.toLocaleString()}`;

  // ── KPI cards ──────────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Total Students',       value: c.students,            sub: `${certRate}% cert rate`,       icon: Users,      color: 'text-blue-600',    bg: 'bg-blue-50',    href: '/admin/students' },
    { label: 'Active Enrollments',   value: c.enrollments,         sub: `${c.atRisk} at risk`,           icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/enrollments' },
    { label: 'Pending Applications', value: c.pendingApplications, sub: 'Need review',                   icon: Inbox,      color: 'text-amber-600',   bg: 'bg-amber-50',   href: '/admin/applications?status=pending' },
    { label: 'Revenue Collected',    value: revenueDollars,        sub: revenueDisplay + ' total paid',  icon: DollarSign, color: 'text-green-600',   bg: 'bg-green-50',   href: '/admin/payroll', isRevenue: true },
  ];

  // ── alerts / tasks ─────────────────────────────────────────────────────────
  const alerts = [
    c.pendingApplications > 0 && { label: `${c.pendingApplications} application${c.pendingApplications !== 1 ? 's' : ''} pending review`, href: '/admin/applications?status=pending', color: 'text-amber-700', dot: 'bg-amber-500' },
    c.pendingEnrollments > 0  && { label: `${c.pendingEnrollments} enrollment${c.pendingEnrollments !== 1 ? 's' : ''} awaiting approval`, href: '/admin/enrollments?status=pending',   color: 'text-orange-700', dot: 'bg-orange-500' },
    c.atRisk > 0              && { label: `${c.atRisk} student${c.atRisk !== 1 ? 's' : ''} flagged at-risk`,                              href: '/admin/at-risk',                       color: 'text-red-700',    dot: 'bg-red-500' },
    c.pendingDocs > 0         && { label: `${c.pendingDocs} document${c.pendingDocs !== 1 ? 's' : ''} awaiting review`,                   href: '/admin/documents/review',              color: 'text-blue-700',   dot: 'bg-blue-500' },
  ].filter(Boolean) as { label: string; href: string; color: string; dot: string }[];

  // ── quick actions ──────────────────────────────────────────────────────────
  const quickActions = [
    { label: 'Course Builder',  href: '/admin/course-builder',    icon: BookOpen },
    { label: 'Compliance',      href: '/admin/compliance',         icon: Shield },
    { label: 'Reports',         href: '/admin/reports',            icon: BarChart3 },
    { label: 'HVAC Activation', href: '/admin/hvac-activation',    icon: Zap },
    { label: 'Funding',         href: '/admin/funding',            icon: DollarSign },
    { label: 'Settings',        href: '/admin/settings',           icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-4">

        {/* ── Row 1: KPI cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map(k => (
            <Link key={k.label} href={k.href}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`w-4 h-4 ${k.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 leading-none">
                {(k as any).isRevenue ? revenueDisplay : k.value.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-gray-600 mt-1">{k.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{k.sub}</div>
            </Link>
          ))}
        </div>

        {/* ── Row 2: Applications table (70%) + Activity feed (30%) ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Applications table */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Inbox className="w-3.5 h-3.5 text-gray-400" /> Applications
                {c.pendingApplications > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{c.pendingApplications}</span>
                )}
              </h2>
              <Link href="/admin/applications" className="text-[11px] text-blue-600 font-medium hover:underline">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentApplications.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">No applications yet</td></tr>
                  ) : data.recentApplications.map(app => {
                    const name = [app.first_name, app.last_name].filter(Boolean).join(' ') || app.full_name || 'Unknown';
                    const isPending = ['pending', 'submitted', 'in_review'].includes(app.status);
                    return (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="text-xs font-medium text-gray-900">{name}</div>
                          <div className="text-[10px] text-gray-400">{app.email}</div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{app.program_interest || '—'}</td>
                        <td className="px-4 py-2.5"><Badge status={app.status} /></td>
                        <td className="px-4 py-2.5 text-[10px] text-gray-400">{new Date(app.created_at).toLocaleDateString('en-US')}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/applications/review/${app.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200">
                              <Eye className="w-2.5 h-2.5" /> View
                            </Link>
                            {isPending && (
                              <Link href={`/admin/applications/review/${app.id}?action=approve`}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                                <CheckCircle className="w-2.5 h-2.5" /> Approve
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent activity feed — real events from admin_activity_log + applications + enrollments */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {data.recentActivity.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-gray-400">No recent activity</div>
              ) : data.recentActivity.map(item => (
                <div key={item.id} className="flex items-start gap-3 px-4 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-800 leading-snug">{item.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(item.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: Students table (70%) + Alerts/Tasks (30%) ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Students table */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-gray-400" /> Recent Students
              </h2>
              <div className="flex items-center gap-2">
                <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Search…"
                  className="text-xs px-2 py-1 border border-gray-200 rounded w-32 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <button onClick={() => exportCSV(data.recentStudents.map(s => ({ Name: s.full_name || '', Email: s.email || '', Status: s.enrollment_status || '', Registered: s.created_at ? new Date(s.created_at).toLocaleDateString() : '' })), 'students.csv')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Export CSV">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <Link href="/admin/students" className="text-[11px] text-blue-600 font-medium hover:underline">View all →</Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('full_name')}>
                      <span className="flex items-center gap-1">Student <SortIcon col="full_name" /></span>
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('enrollment_status')}>
                      <span className="flex items-center gap-1">Status <SortIcon col="enrollment_status" /></span>
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                      <span className="flex items-center gap-1">Registered <SortIcon col="created_at" /></span>
                    </th>
                    <th className="px-4 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-400">{studentSearch ? 'No matching students' : 'No students yet'}</td></tr>
                  ) : filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0">
                            {(s.full_name || s.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900">{s.full_name || 'Unknown'}</div>
                            <div className="text-[10px] text-gray-400">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[10px] text-gray-500">{(s as any).program_name || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-2.5"><Badge status={s.enrollment_status || 'pending'} /></td>
                      <td className="px-4 py-2.5 text-[10px] text-gray-400">{s.created_at ? new Date(s.created_at).toLocaleDateString('en-US') : '—'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/learner/${s.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200">
                            <Eye className="w-2.5 h-2.5" /> View
                          </Link>
                          <Link href={`/admin/students/${s.id}/edit`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100">
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts + Quick actions */}
          <div className="space-y-4">
            {/* Needs attention */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-gray-400" /> Needs Attention
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {alerts.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">All clear</p>
                  </div>
                ) : alerts.map(a => (
                  <Link key={a.href} href={a.href}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.dot}`} />
                    <span className={`text-xs flex-1 ${a.color}`}>{a.label}</span>
                    <span className="text-gray-300 group-hover:text-gray-500 text-xs">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {quickActions.map(a => (
                  <Link key={a.href} href={a.href}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group">
                    <a.icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                    <span className="text-xs text-gray-700 group-hover:text-blue-700">{a.label}</span>
                    <span className="ml-auto text-gray-300 group-hover:text-gray-500 text-xs">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
