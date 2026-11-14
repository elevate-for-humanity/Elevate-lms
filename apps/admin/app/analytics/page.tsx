import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { loadAllEnrollmentRows, metricCount } from '@/lib/analytics/report-integrity.mjs';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Award,
  BarChart3,
  Activity,
  Target,
  DollarSign,
  ArrowRight,
  ChevronRight,
  Globe2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Analytics | Admin',
};

export default async function AnalyticsPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const start30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const results = await Promise.all([
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
    db.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', start30d),
    loadAllEnrollmentRows(db),
  ]);
  const [
    usersRes,
    studentsRes,
    enrollmentsRes,
    activeRes,
    completedRes,
    certsRes,
    programsRes,
    viewsRes,
    rankingRes,
  ] = results;
  const totalUsers = metricCount(usersRes);
  const totalStudents = metricCount(studentsRes);
  const totalEnrollments = metricCount(enrollmentsRes);
  const activeEnrollments = metricCount(activeRes);
  const completedEnrollments = metricCount(completedRes);
  const totalCerts = metricCount(certsRes);
  const livePrograms = metricCount(programsRes);
  const pageViews30d = metricCount(viewsRes);
  const topPrograms = rankingRes.error ? null : rankingRes.data;
  const unavailable = results.some((result) => result.error);

  const tally: Record<string, { title: string; count: number }> = {};
  for (const e of topPrograms ?? []) {
    const pid = e.program_id as string;
    if (!pid) continue;
    const related = Array.isArray(e.programs) ? e.programs[0] : e.programs;
    const title = related?.title ?? 'Program title unavailable';
    if (!tally[pid]) tally[pid] = { title, count: 0 };
    tally[pid].count++;
  }
  const enrollmentStatuses: Record<string, number> = {};
  for (const row of topPrograms ?? []) {
    const status = row.status || 'Unspecified';
    enrollmentStatuses[status] = (enrollmentStatuses[status] || 0) + 1;
  }
  const ranked = Object.values(tally)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxCount = ranked[0]?.count || 1;

  const completionRate =
    totalEnrollments === null || completedEnrollments === null || totalEnrollments === 0
      ? null
      : Math.round((completedEnrollments / totalEnrollments) * 100);

  const METRICS = [
    {
      label: 'Total enrollments',
      value: totalEnrollments === null ? 'Unavailable' : totalEnrollments.toLocaleString(),
      icon: GraduationCap,
      href: '/enrollments',
      color: 'text-blue-800',
      bg: 'bg-blue-50',
    },
    {
      label: 'Raw page views (30d)',
      value: pageViews30d === null ? 'Unavailable' : pageViews30d.toLocaleString(),
      icon: Globe2,
      href: '/analytics/traffic',
      color: 'text-cyan-700',
      bg: 'bg-cyan-50',
    },
    {
      label: 'Registered accounts',
      value: totalUsers === null ? 'Unavailable' : totalUsers.toLocaleString(),
      icon: Users,
      href: '/students',
      color: 'text-brand-blue-600',
      bg: 'bg-brand-blue-50',
    },
    {
      label: 'Student accounts',
      value: totalStudents === null ? 'Unavailable' : totalStudents.toLocaleString(),
      icon: GraduationCap,
      href: '/students',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Active Enrollments',
      value: activeEnrollments === null ? 'Unavailable' : activeEnrollments.toLocaleString(),
      icon: TrendingUp,
      href: '/enrollments',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Completion Rate',
      value: completionRate === null ? 'Not available' : `${completionRate}%`,
      icon: Target,
      href: '/reports',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Certificates',
      value: totalCerts === null ? 'Unavailable' : totalCerts.toLocaleString(),
      icon: Award,
      href: '/certificates',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      label: 'Live Programs',
      value: livePrograms === null ? 'Unavailable' : livePrograms.toLocaleString(),
      icon: BarChart3,
      href: '/programs',
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
  ];

  const DEEP_LINKS = [
    {
      label: 'Website Traffic',
      desc: 'Page views, sessions, top pages, referrers, and campaign sources',
      href: '/analytics/traffic',
      icon: Globe2,
    },
    {
      label: 'Learning Analytics',
      desc: 'Completion rates, lesson engagement, quiz scores',
      href: '/analytics/learning',
      icon: Activity,
    },
    {
      label: 'Engagement Analytics',
      desc: 'Login patterns, session length, active users',
      href: '/analytics/engagement',
      icon: TrendingUp,
    },
    {
      label: 'Program Analytics',
      desc: 'Program performance, outcomes, pass rates',
      href: '/analytics/programs',
      icon: Target,
    },
    {
      label: 'Revenue Analytics',
      desc: 'Payments, refunds, funding sources breakdown',
      href: '/analytics/revenue',
      icon: DollarSign,
    },
    {
      label: 'Employer Pipeline',
      desc: 'Job placements, OJT hours, employer activity',
      href: '/analytics/employers',
      icon: Users,
    },
    {
      label: 'Reports & Exports',
      desc: 'WIOA reports, DOL submissions, CSV exports',
      href: '/reports',
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Analytics</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Website traffic, platform performance, learner outcomes, and operational metrics
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-slate-900">
          <h2 className="font-bold">What these numbers measure</h2>
          <p className="mt-2 text-sm">
            Traffic is recorded by this website, not Google Analytics. Raw page views include
            repeated visits, crawlers and automated checks. Registered accounts are not website
            visitors. Enrollment and credential figures are all-time totals.
          </p>
          <p className="mt-2 text-sm">
            Completion rate = completed enrollments ÷ all enrollments, including active and
            withdrawn records. This is not a cohort graduation rate.
          </p>
          <Link
            href="/analytics/traffic"
            className="mt-3 inline-block font-semibold text-blue-800 underline"
          >
            Inspect traffic sources and data quality →
          </Link>
        </section>
        {unavailable && (
          <p
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-slate-900"
          >
            Some reports could not be loaded. Unavailable figures are not zero.
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.label}
                href={m.href}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <p className="text-xl font-bold text-slate-900 tabular-nums break-words">
                  {m.value}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{m.label}</p>
              </Link>
            );
          })}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-950">Enrollment status breakdown · all time</h2>
          {rankingRes.error ? (
            <p role="alert">Enrollment statuses could not be loaded.</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(enrollmentStatuses)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([status, count]) => (
                  <div key={status} className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold capitalize text-slate-700">
                      {status.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">
                      {count.toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>
          )}
          <p className="mt-3 text-sm text-slate-600">
            Includes records awaiting payment or program assignment. One person may have more than
            one enrollment.
          </p>
        </section>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-900">
              Enrollments by Program · assigned records
            </h2>
            <Link
              href="/programs"
              className="text-xs text-brand-blue-600 hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          {rankingRes.error ? (
            <p role="alert" className="text-sm text-red-800">
              Program totals could not be loaded.
            </p>
          ) : ranked.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No enrollment data yet</p>
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
                  <p className="text-sm font-semibold text-slate-900 tabular-nums w-8 text-right">
                    {p.count}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 mb-4">Detailed Reports</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEEP_LINKS.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group"
                >
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
