import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import {
  Users, BookOpen, TrendingUp, GraduationCap,
  BarChart3, Activity, Target, DollarSign,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Analytics | Admin',
};

const SECTIONS = [
  { title: 'Learning Analytics',    desc: 'Completion rates, progress, lesson engagement',   href: '/admin/analytics/learning',    icon: BookOpen,     color: 'bg-brand-blue-500/10 text-brand-blue-400' },
  { title: 'Engagement Analytics',  desc: 'Login patterns, session length, active users',    href: '/admin/analytics/engagement',  icon: Activity,     color: 'bg-green-500/10 text-green-400' },
  { title: 'Program Analytics',     desc: 'Program performance, outcomes, pass rates',       href: '/admin/analytics/programs',    icon: Target,       color: 'bg-purple-500/10 text-purple-400' },
  { title: 'Revenue Analytics',     desc: 'Payments, refunds, funding sources',              href: '/admin/analytics/revenue',     icon: DollarSign,   color: 'bg-amber-500/10 text-amber-400' },
  { title: 'Employer Pipeline',     desc: 'Job placements, employer activity, OJT hours',    href: '/admin/analytics/employers',   icon: TrendingUp,   color: 'bg-brand-red-500/10 text-brand-red-400' },
  { title: 'Reports',               desc: 'Export data, WIOA reports, DOL submissions',      href: '/admin/reports',               icon: BarChart3,    color: 'bg-slate-500/10 text-slate-400' },
];

export default async function AnalyticsPage() {
  const db = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalEnrollments },
    { count: totalPrograms },
    { count: activeStudents },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }),
    db.from('programs').select('*', { count: 'exact', head: true }).eq('published', true),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
  ]);

  return (
    <AdminPageShell
      title="Analytics"
      description="Platform performance, learner outcomes, and operational metrics"
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Analytics' }]}
      stats={[
        { label: 'Total Users',    value: totalUsers ?? 0,       icon: Users,          color: 'blue' },
        { label: 'Students',       value: activeStudents ?? 0,   icon: GraduationCap,  color: 'green' },
        { label: 'Enrollments',    value: totalEnrollments ?? 0, icon: TrendingUp,     color: 'amber' },
        { label: 'Live Programs',  value: totalPrograms ?? 0,    icon: Target,         color: 'purple' },
      ]}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{s.title}</h3>
                <p className="text-slate-500 text-sm mt-0.5">{s.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
