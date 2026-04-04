import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminPageShell, AdminCard } from '@/components/admin/AdminPageShell';
import { BarChart3, Users, GraduationCap, DollarSign, TrendingUp, FileText, Download, HeartHandshake } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Reports | Admin' };

const REPORT_TYPES = [
  { title: 'Student Roster',         desc: 'All enrolled students with contact info and program',    href: '/admin/reports/students',       icon: Users,          format: 'CSV / PDF' },
  { title: 'Enrollment Summary',     desc: 'Enrollment counts by program, status, and date range',  href: '/admin/reports/enrollments',    icon: TrendingUp,     format: 'CSV / PDF' },
  { title: 'Completion Report',      desc: 'Graduates, certificates issued, pass rates',             href: '/admin/reports/completions',    icon: GraduationCap,  format: 'CSV / PDF' },
  { title: 'WIOA Performance',       desc: 'DOL-required outcomes: employment, earnings, retention', href: '/admin/reports/wioa',           icon: HeartHandshake, format: 'PDF' },
  { title: 'Revenue & Payments',     desc: 'Payments received, refunds, funding by source',         href: '/admin/reports/revenue',        icon: DollarSign,     format: 'CSV / PDF' },
  { title: 'Attendance Report',      desc: 'Daily attendance records by program and instructor',    href: '/admin/reports/attendance',     icon: FileText,       format: 'CSV / PDF' },
];

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const db = createAdminClient();
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
    <AdminPageShell
      title="Reports"
      description="Generate and export operational, compliance, and performance reports"
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Reports' }]}
      stats={[
        { label: 'Students',     value: totalStudents ?? 0,    icon: Users,          color: 'blue' },
        { label: 'Enrollments',  value: totalEnrollments ?? 0, icon: TrendingUp,     color: 'green' },
        { label: 'Certificates', value: totalCerts ?? 0,       icon: GraduationCap,  color: 'amber' },
      ]}
    >
      <AdminCard title="Available Reports">
        <div className="divide-y divide-slate-100">
          {REPORT_TYPES.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.href}
                href={r.href}
                className="flex items-center gap-4 py-4 px-2 hover:bg-slate-50 rounded-lg transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{r.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{r.desc}</p>
                </div>
                <span className="text-xs text-slate-400 font-medium flex-shrink-0">{r.format}</span>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-600 transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </AdminCard>
    </AdminPageShell>
  );
}
