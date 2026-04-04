import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users, GraduationCap, TrendingUp, Award, BarChart3,
  Activity, Target, DollarSign, ArrowRight, ChevronRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Analytics | Admin' };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalEnrollments },
    { count: activeEnrollments },
    { count: completedEnrollments },
    { count: totalCerts },
    { count: livePrograms },
    { data: topPrograms },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('program_completion_certificates').select('*', { count: 'exact', head: true }),
    db.from('programs').select('*', { count: 'exact', head: true }).eq('published', true),
    db.from('program_enrollments')
      .select('program_id, programs:program_id(title)')
      .not('program_id', 'is', null)
      .limit(500),
  ]);

  // Tally enrollments per program
  const tally: Record<string, { title: string; count: number }> = {};
  for (const e of topPrograms ?? []) {
    const pid = e.program_id as string;
    const title = (e.programs as any)?.title ?? 'Unknown';
    if (!tally[pid]) tally[pid] = { title, count: 0 };
    tally[pid].count++;
  }
  const ranked = Object.values(tally).sort((a, b) => b.count - a.count).slice(0, 8);
  const maxCount = ranked[0]?.count || 1;

  const completionRate = totalEnrollments ? Math.round(((completedEnrollments ?? 0) / totalEnrollments) * 100) : 0;

  const METRICS = [
    { label: 'Total Users',       value: totalUsers ?? 0,       icon: Users,          href: '/admin/students',      color: 'text-brand-blue-600',  bg: 'bg-brand-blue-50' },
    { label: 'Students',          value: totalStudents ?? 0,    icon: GraduationCap,  href: '/admin/students',      color: 'text-green-600',       bg: 'bg-green-50' },
    { label: 'Active Enrollments',value: activeEnrollments ?? 0,icon: TrendingUp,     href: '/admin/enrollments',   color: 'text-amber-600',       bg: 'bg-amber-50' },
    { label: 'Completion Rate',   value: `${completionRate}%`,  icon: Target,         href: '/admin/reports/completions', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Certificates',      value: totalCerts ?? 0,       icon: Award,          href: '/admin/certificates',  color: 'text-rose-600',        bg: 'bg-rose-50' },
    { label: 'Live Programs',     value: livePrograms ?? 0,     icon: BarChart3,      href: '/admin/programs',      color: 'text-slate-600',       bg: 'bg-slate-100' },
  ];

  const DEEP_LINKS = [
    { label: 'Learning Analytics',   desc: 'Completion rates, lesson engagement, quiz scores',  href: '/admin/analytics/learning',   icon: Activity },
    { label: 'Engagement Analytics', desc: 'Login patterns, session length, active users',      href: '/admin/analytics/engagement', icon: TrendingUp },
    { label: 'Program Analytics',    desc: 'Program performance, outcomes, pass rates',         href: '/admin/analytics/programs',   icon: Target },
    { label: 'Revenue Analytics',    desc: 'Payments, refunds, funding sources breakdown',      href: '/admin/analytics/revenue',    icon: DollarSign },
    { label: 'Employer Pipeline',    desc: 'Job placements, OJT hours, employer activity',      href: '/admin/analytics/employers',  icon: Users },
    { label: 'Reports & Exports',    desc: 'WIOA reports, DOL submissions, CSV exports',        href: '/admin/reports',              icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Analytics</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Platform performance, learner outcomes, and operational metrics</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.label} href={m.href}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group">
                <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{m.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{m.label}</p>
              </Link>
            );
          })}
        </div>

        {/* Top programs by enrollment */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-900">Enrollments by Program</h2>
            <Link href="/admin/programs" className="text-xs text-brand-blue-600 hover:underline font-medium">View all →</Link>
          </div>
          {ranked.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No enrollment data yet</p>
          ) : (
            <div className="space-y-3">
              {ranked.map((p) => (
                <div key={p.title} className="flex items-center gap-3">
                  <p className="text-sm text-slate-700 w-48 truncate flex-shrink-0">{p.title}</p>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.round((p.count / maxCount) * 100)}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums w-8 text-right">{p.count}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deep-dive links */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4">Detailed Reports</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEEP_LINKS.map((l) => {
              const Icon = l.icon;
              return (
                <Link key={l.href} href={l.href}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{l.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{l.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 transition-colors flex-shrink-0 mt-0.5" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
