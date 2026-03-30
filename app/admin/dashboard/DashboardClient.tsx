'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, TrendingUp, Inbox, DollarSign, AlertTriangle, Award,
  CheckCircle, Eye, ChevronUp, ChevronDown, Download,
  Clock, BookOpen, BarChart3, Shield, Settings, Zap,
  Activity, Target, ArrowRight,
} from 'lucide-react';
import type { DashboardData } from './types';

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

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronDown className="w-3 h-3 text-slate-300" />;
  return dir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-blue-500" />
    : <ChevronDown className="w-3 h-3 text-blue-500" />;
}

function OpsCard({ label, value, sub, icon: Icon, color, bg, href, urgent }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; color: string; bg: string; href: string; urgent?: boolean;
}) {
  return (
    <Link href={href}
      className={`relative bg-white rounded-xl border ${urgent ? 'border-red-300 shadow-red-100 shadow-md' : 'border-slate-200'} p-5 hover:shadow-lg transition-all group`}>
      {urgent && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-3xl font-black text-slate-900 leading-none tabular-nums">{value}</div>
      <div className="text-sm font-semibold text-slate-700 mt-1">{label}</div>
      <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </div>
    </Link>
  );
}

function DecisionPanel({ title, icon: Icon, iconColor, items, emptyLabel, viewAllHref }: {
  title: string; icon: React.ElementType; iconColor: string;
  items: { label: string; sub?: string; href: string; badge?: string; badgeColor?: string; urgent?: boolean }[];
  emptyLabel: string; viewAllHref?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {title}
        </h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs text-blue-600 font-medium hover:underline">View all →</Link>
        )}
      </div>
      <div className="divide-y divide-slate-50">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-slate-400">{emptyLabel}</p>
          </div>
        ) : items.map((item, i) => (
          <Link key={i} href={item.href}
            className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
            {item.urgent && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{item.label}</div>
              {item.sub && <div className="text-xs text-slate-400 mt-0.5">{item.sub}</div>}
            </div>
            {item.badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                {item.badge}
              </span>
            )}
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const c = data.counts;
  const [studentSearch, setStudentSearch] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'created_at', dir: 'desc' });

  function toggleSort(key: SortKey) {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  }

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
  const revenueDisplay = revenueDollars >= 1000 ? `$${(revenueDollars / 1000).toFixed(1)}k` : `$${revenueDollars.toLocaleString()}`;
  const firstName = data.profile?.full_name?.split(' ')[0] || 'Admin';
  const now = new Date(data.generatedAt);
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const timeLabel = now.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const opsMetrics = [
    { label: 'Active Learners',       value: c.enrollments.toLocaleString(), sub: `${c.atRisk} flagged at-risk`,  icon: Activity,  color: 'text-blue-600',    bg: 'bg-blue-50',    href: '/admin/enrollments',                  urgent: c.atRisk > 0 },
    { label: 'Pending Applications',  value: c.pendingApplications,          sub: 'Awaiting review',              icon: Inbox,     color: 'text-amber-600',   bg: 'bg-amber-50',   href: '/admin/applications?status=pending',  urgent: c.pendingApplications > 0 },
    { label: 'Revenue Collected',     value: revenueDisplay,                 sub: `${certRate}% cert rate`,       icon: DollarSign,color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/payroll' },
    { label: 'Certificates Issued',   value: c.certificates.toLocaleString(),sub: `${c.students} total students`, icon: Award,     color: 'text-purple-600',  bg: 'bg-purple-50',  href: '/admin/certificates' },
  ];

  const blockers = [
    c.pendingApplications > 0 && { label: `${c.pendingApplications} application${c.pendingApplications !== 1 ? 's' : ''} need review`, sub: 'Learners waiting for a decision', href: '/admin/applications?status=pending', badge: 'Urgent', badgeColor: 'bg-red-100 text-red-700', urgent: true },
    c.pendingEnrollments > 0  && { label: `${c.pendingEnrollments} enrollment${c.pendingEnrollments !== 1 ? 's' : ''} awaiting approval`, sub: 'Cannot start training until approved', href: '/admin/enrollments?status=pending', badge: 'Blocking', badgeColor: 'bg-orange-100 text-orange-700', urgent: true },
    c.pendingDocs > 0         && { label: `${c.pendingDocs} document${c.pendingDocs !== 1 ? 's' : ''} need review`, sub: 'Required for compliance', href: '/admin/documents/review', badge: 'Review', badgeColor: 'bg-blue-100 text-blue-700' },
    c.atRisk > 0              && { label: `${c.atRisk} learner${c.atRisk !== 1 ? 's' : ''} flagged at-risk`, sub: 'No activity or falling behind', href: '/admin/at-risk', badge: 'At Risk', badgeColor: 'bg-red-100 text-red-700', urgent: true },
  ].filter(Boolean) as any[];

  const recentAppsItems = data.recentApplications.slice(0, 6).map(app => {
    const name = [app.first_name, app.last_name].filter(Boolean).join(' ') || app.full_name || 'Unknown';
    return {
      label: name,
      sub: `${app.program_interest || 'Program not specified'} · ${new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      href: `/admin/applications/review/${app.id}`,
      badge: STATUS_LABEL[app.status] || app.status,
      badgeColor: STATUS_BADGE[app.status] || 'bg-gray-100 text-gray-600',
      urgent: ['pending', 'submitted', 'in_review'].includes(app.status),
    };
  });

  const activityItems = data.recentActivity.slice(0, 8).map(item => ({
    label: item.label,
    sub: new Date(item.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    href: '#',
  }));

  const quickActions = [
    { label: 'Course Builder',  sub: 'Create or edit programs',  href: '/admin/course-builder',  icon: BookOpen,  color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'Compliance',      sub: 'Documents & audits',       href: '/admin/compliance',       icon: Shield,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Reports',         sub: 'Analytics & exports',      href: '/admin/reports',          icon: BarChart3, color: 'text-purple-600',  bg: 'bg-purple-50' },
    { label: 'HVAC Activation', sub: 'Manage HVAC program',      href: '/admin/hvac-activation',  icon: Zap,       color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Funding',         sub: 'WIOA & grants',            href: '/admin/funding',          icon: Target,    color: 'text-green-600',   bg: 'bg-green-50' },
    { label: 'Settings',        sub: 'System configuration',     href: '/admin/settings',         icon: Settings,  color: 'text-slate-600',   bg: 'bg-slate-100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Command bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900">{greeting}, {firstName}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{timeLabel} · Operations overview</p>
          </div>
          <div className="flex items-center gap-3">
            {blockers.length > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-2 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5" />
                {blockers.length} item{blockers.length !== 1 ? 's' : ''} need attention
              </div>
            )}
            <Link href="/admin/reports"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition">
              <BarChart3 className="w-3.5 h-3.5" /> Reports
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

        {/* Row 1: Ops metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {opsMetrics.map(m => <OpsCard key={m.label} {...m} />)}
        </div>

        {/* Row 2: Blockers + Applications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <DecisionPanel
              title="Needs a Decision"
              icon={AlertTriangle}
              iconColor="text-red-500"
              items={blockers}
              emptyLabel="Nothing blocking — all clear"
            />
          </div>
          <div className="lg:col-span-2">
            <DecisionPanel
              title="Recent Applications"
              icon={Inbox}
              iconColor="text-amber-500"
              items={recentAppsItems}
              emptyLabel="No applications yet"
              viewAllHref="/admin/applications"
            />
          </div>
        </div>

        {/* Row 3: Students + Activity + Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Students table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> Recent Students
              </h2>
              <div className="flex items-center gap-2">
                <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Search…"
                  className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg w-36 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button
                  onClick={() => exportCSV(data.recentStudents.map(s => ({ Name: s.full_name || '', Email: s.email || '', Status: s.enrollment_status || '', Program: (s as any).program_name || '', Registered: s.created_at ? new Date(s.created_at).toLocaleDateString() : '' })), 'students.csv')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition" title="Export CSV">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <Link href="/admin/students" className="text-xs text-blue-600 font-medium hover:underline">View all →</Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('full_name')}>
                      <span className="flex items-center gap-1">Student <SortIcon active={sort.key === 'full_name'} dir={sort.dir} /></span>
                    </th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Program</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('enrollment_status')}>
                      <span className="flex items-center gap-1">Status <SortIcon active={sort.key === 'enrollment_status'} dir={sort.dir} /></span>
                    </th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                      <span className="flex items-center gap-1">Joined <SortIcon active={sort.key === 'created_at'} dir={sort.dir} /></span>
                    </th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">{studentSearch ? 'No matching students' : 'No students yet'}</td></tr>
                  ) : filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                            {(s.full_name || s.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{s.full_name || 'Unknown'}</div>
                            <div className="text-xs text-slate-400">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{(s as any).program_name || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-3"><Badge status={s.enrollment_status || 'pending'} /></td>
                      <td className="px-5 py-3 text-xs text-slate-400">{s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/learner/${s.id}`} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
                            <Eye className="w-3 h-3" /> View
                          </Link>
                          <Link href={`/admin/students/${s.id}/edit`} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
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

          {/* Right rail */}
          <div className="space-y-4">
            <DecisionPanel
              title="Recent Activity"
              icon={Clock}
              iconColor="text-slate-400"
              items={activityItems}
              emptyLabel="No recent activity"
            />
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {quickActions.map(a => (
                  <Link key={a.href} href={a.href}
                    className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                    <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center flex-shrink-0`}>
                      <a.icon className={`w-4 h-4 ${a.color}`} />
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
        </div>

      </div>
    </div>
  );
}
