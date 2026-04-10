import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Users, GraduationCap, TrendingUp, DollarSign, FileText, HeartHandshake, Download, ChevronRight, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Reports | Admin' };

const REPORTS = [
  { title: 'Student Roster',       desc: 'All enrolled students with contact info and program',    href: '/admin/reports/students',     icon: Users,          format: 'CSV / PDF' },
  { title: 'Enrollment Summary',   desc: 'Enrollment counts by program, status, and date range',  href: '/admin/reports/enrollments',  icon: TrendingUp,     format: 'CSV / PDF' },
  { title: 'Completion Report',    desc: 'Graduates, certificates issued, pass rates',             href: '/admin/reports/completions',  icon: GraduationCap,  format: 'CSV / PDF' },
  { title: 'WIOA Performance',     desc: 'DOL-required outcomes: employment, earnings, retention', href: '/admin/reports/wioa',         icon: HeartHandshake, format: 'PDF' },
  { title: 'Revenue & Payments',   desc: 'Payments received, refunds, funding by source',         href: '/admin/reports/revenue',      icon: DollarSign,     format: 'CSV / PDF' },
  { title: 'Attendance Report',    desc: 'Daily attendance records by program and instructor',    href: '/admin/reports/attendance',   icon: FileText,       format: 'CSV / PDF' },
];

export default async function ReportsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await getAdminClient();

  const [
    { count: totalStudents },
    { count: totalEnrollments },
    { count: totalCerts },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }),
    db.from('program_completion_certificates').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Reports</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Generate and export operational, compliance, and performance reports</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Live counts */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Students',     value: totalStudents ?? 0,    icon: Users,         color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
            { label: 'Enrollments',  value: totalEnrollments ?? 0, icon: TrendingUp,    color: 'text-green-600',      bg: 'bg-green-50' },
            { label: 'Certificates', value: totalCerts ?? 0,       icon: GraduationCap, color: 'text-amber-600',      bg: 'bg-amber-50' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Report list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">Available Reports</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {REPORTS.map((r) => {
              const Icon = r.icon;
              return (
                <Link key={r.href} href={r.href}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{r.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium flex-shrink-0 hidden sm:block">{r.format}</span>
                  <Download className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
