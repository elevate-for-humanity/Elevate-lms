import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Award,
  BarChart3,
  Activity,
  Target,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Platform Analytics',
  description:
    `Enrollment, completion, and outcome analytics for ${PLATFORM_DEFAULTS.orgName} workforce programs.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/analytics' },
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/analytics');

  // Check role — analytics is admin/staff only
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const allowedRoles = ['admin', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/lms/dashboard');
  }

  const db = await requireAdminClient();

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalEnrollments },
    { count: activeEnrollments },
    { count: completedEnrollments },
    { count: totalCertificates },
    { count: publishedPrograms },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }),
    db
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    db
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    db.from('program_completion_certificates').select('*', { count: 'exact', head: true }),
    db.from('programs').select('*', { count: 'exact', head: true }).eq('published', true),
  ]);

  // Recent enrollments
  const { data: recentEnrollments } = await db
    .from('program_enrollments')
    .select('id, status, created_at, programs(title)')
    .order('created_at', { ascending: false })
    .limit(8);

  const completionRate =
    totalEnrollments && completedEnrollments
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

  const stats = [
    { label: 'Total Users', value: totalUsers ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'Students', value: totalStudents ?? 0, icon: GraduationCap, color: 'text-brand-green-500' },
    {
      label: 'Active Enrollments',
      value: activeEnrollments ?? 0,
      icon: Activity,
      color: 'text-amber-500',
    },
    {
      label: 'Completions',
      value: completedEnrollments ?? 0,
      icon: Award,
      color: 'text-purple-500',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: Target,
      color: 'text-brand-red-500',
    },
    {
      label: 'Certificates Issued',
      value: totalCertificates ?? 0,
      icon: Award,
      color: 'text-teal-500',
    },
    {
      label: 'Published Programs',
      value: publishedPrograms ?? 0,
      icon: BarChart3,
      color: 'text-slate-500',
    },
    {
      label: 'Total Enrollments',
      value: totalEnrollments ?? 0,
      icon: TrendingUp,
      color: 'text-indigo-500',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Analytics' }]}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-red-600 hover:underline"
          >
            Full admin analytics <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-6">
                <Icon className={`w-6 h-6 ${s.color} mb-3`} />
                <p className="text-2xl font-extrabold text-slate-900">{s.value.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Recent enrollments */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Enrollments</h2>
            <Link
              href="/admin/enrollments"
              className="text-sm text-brand-red-600 hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {!recentEnrollments || recentEnrollments.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500 text-sm">No enrollments yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentEnrollments.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {e.programs?.title ?? 'Unknown Program'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(e.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      e.status === 'active'
                        ? 'bg-brand-green-50 text-brand-green-700'
                        : e.status === 'completed'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
