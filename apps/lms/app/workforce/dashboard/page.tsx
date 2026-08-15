import { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  CheckSquare,
  ChevronRight,
  Clock,
  FileText,
  HeartHandshake,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { StudentSearchPanel } from '@/components/workforce/StudentSearchPanel';

export const metadata: Metadata = {
  title: 'Dashboard | Workforce Portal',
  description: 'Participant management, placements, and workforce outcomes.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function WorkforceDashboardPage() {
  const { effectiveRoles } = await requireRole([
    'workforce_partner',
    'admin',
    'staff',
    'org_admin',
  ]);

  const supabase = await createClient();
  const privileged = effectiveRoles.some((role) => ['admin', 'staff', 'org_admin'].includes(role));
  const admin = privileged ? await requireAdminClient() : null;
  const db = admin ?? supabase;

  const [
    totalRes,
    activeRes,
    completedRes,
    atRiskRes,
    programsRes,
    placementsRes,
    pendingPlacementsRes,
  ] = await Promise.all([
    db.from('program_enrollments').select('*', { count: 'exact', head: true }),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('enrollment_state', 'active'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('enrollment_state', 'completed'),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('at_risk', true),
    db.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('placement_records').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
    db.from('placement_records').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const totalEnrollments = totalRes.count ?? 0;
  const activeEnrollments = activeRes.count ?? 0;
  const completedEnrollments = completedRes.count ?? 0;
  const atRiskCount = atRiskRes.count ?? 0;
  const activePrograms = programsRes.count ?? 0;
  const placementsVerified = placementsRes.count ?? 0;
  const placementsPending = pendingPlacementsRes.count ?? 0;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  const { data: rawRecent } = await db
    .from('program_enrollments')
    .select('id, user_id, enrollment_state, enrolled_at, programs(title)')
    .order('enrolled_at', { ascending: false })
    .limit(8);

  const recentUserIds = [...new Set((rawRecent ?? []).map((enrollment: any) => enrollment.user_id).filter(Boolean))];
  const { data: recentProfiles } = recentUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', recentUserIds)
    : { data: [] };
  const profileMap = Object.fromEntries((recentProfiles ?? []).map((profile: any) => [profile.id, profile]));
  const recentParticipants = (rawRecent ?? []).map((enrollment: any) => ({
    ...enrollment,
    profile: profileMap[enrollment.user_id] ?? null,
  }));

  const stats = [
    {
      label: 'Total Participants',
      value: totalEnrollments,
      icon: Users,
      color: 'text-brand-blue-600',
      bg: 'bg-brand-blue-50',
      href: '/workforce/participants',
    },
    {
      label: 'Active Enrollments',
      value: activeEnrollments,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/workforce/participants?filter=active',
    },
    {
      label: 'Completions',
      value: completedEnrollments,
      icon: CheckCircle,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      href: '/workforce/participants?filter=completed',
    },
    {
      label: 'Placements Verified',
      value: placementsVerified,
      icon: Briefcase,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/workforce/placements',
    },
    ...(atRiskCount > 0
      ? [{
          label: 'At-Risk',
          value: atRiskCount,
          icon: AlertTriangle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          href: '/workforce/participants?filter=at-risk',
        }]
      : []),
    ...(placementsPending > 0
      ? [{
          label: 'Placements Pending',
          value: placementsPending,
          icon: Clock,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          href: '/workforce/placements?filter=pending',
        }]
      : []),
  ];

  const quickActions = [
    { label: 'View Participants', href: '/workforce/participants', icon: Users },
    { label: 'Verify Placements', href: '/workforce/placements?filter=pending', icon: Briefcase },
    { label: 'WIOA Export', href: '/workforce/wioa-export', icon: FileText },
    { label: 'Follow-Ups', href: '/workforce/follow-ups', icon: CheckSquare },
    { label: 'Eligibility', href: '/workforce/eligibility', icon: Shield },
    { label: 'Supportive Services', href: '/workforce/supportive-services', icon: HeartHandshake },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Workforce Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          {activePrograms} active program{activePrograms !== 1 ? 's' : ''} · {completionRate}% completion rate
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="group rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent Enrollments</h2>
            <Link href="/workforce/participants" className="flex items-center gap-1 text-xs text-brand-blue-600 hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {recentParticipants.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">No enrollments yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentParticipants.map((enrollment: any) => (
                <li key={enrollment.id} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue-100 text-xs font-bold text-brand-blue-700">
                      {(enrollment.profile?.full_name ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{enrollment.profile?.full_name ?? 'Unknown'}</p>
                      <p className="truncate text-xs text-slate-500">{(enrollment.programs as any)?.title ?? '—'}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    enrollment.enrollment_state === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : enrollment.enrollment_state === 'completed'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {enrollment.enrollment_state ?? 'unknown'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.href}>
                  <Link href={action.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50">
                    <Icon className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-brand-blue-600" />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{action.label}</span>
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <StudentSearchPanel action="/workforce/participants" label="Search workforce participants" />
      </div>
    </div>
  );
}
