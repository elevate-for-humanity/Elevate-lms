import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import {
  Users, CheckCircle, Award, Briefcase, TrendingUp, AlertTriangle,
  Clock, FileText, Shield, HeartHandshake, Search, ChevronRight,
} from 'lucide-react';
import { StudentSearchPanel } from '@/app/case-manager/StudentSearchPanel';

export const metadata: Metadata = {
  title: 'Dashboard | Workforce Portal',
  description: 'Participant management, placements, and workforce outcomes.',
};

export const dynamic = 'force-dynamic';

export default async function WorkforceDashboardPage() {
  const { user, profile } = await requireRole([
    'workforce_board', 'case_manager', 'admin', 'super_admin', 'staff', 'org_admin',
  ]);

  const supabase = await createClient();
  const admin = await requireAdminClient();
  const db = admin || supabase;

  const isCaseManager = profile?.role === 'case_manager';
  const isWorkforceBoard = profile?.role === 'workforce_board' || profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'staff' || profile?.role === 'org_admin';

  // ── Case manager: load assigned caseload ──────────────────────────────────
  let learnerIds: string[] = [];
  if (isCaseManager) {
    const { data: assignments } = await supabase
      .from('case_manager_assignments')
      .select('learner_id')
      .eq('case_manager_id', user.id);
    learnerIds = (assignments ?? []).map((a: any) => a.learner_id);
  }

  // ── Enrollment counts ─────────────────────────────────────────────────────
  const enrollBase = isCaseManager && learnerIds.length > 0
    ? db.from('program_enrollments').select('*', { count: 'exact', head: true }).in('user_id', learnerIds)
    : db.from('program_enrollments').select('*', { count: 'exact', head: true });

  const [totalRes, activeRes, completedRes, atRiskRes, programsRes, placementsRes, pendingPlacementsRes] =
    await Promise.all([
      (isCaseManager && learnerIds.length === 0)
        ? Promise.resolve({ count: 0 })
        : db.from('program_enrollments').select('*', { count: 'exact', head: true })
            .pipe ? enrollBase : enrollBase,
      isCaseManager && learnerIds.length === 0
        ? Promise.resolve({ count: 0 })
        : (isCaseManager
            ? db.from('program_enrollments').select('*', { count: 'exact', head: true }).in('user_id', learnerIds).eq('enrollment_state', 'active')
            : db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('enrollment_state', 'active')),
      isCaseManager && learnerIds.length === 0
        ? Promise.resolve({ count: 0 })
        : (isCaseManager
            ? db.from('program_enrollments').select('*', { count: 'exact', head: true }).in('user_id', learnerIds).eq('enrollment_state', 'completed')
            : db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('enrollment_state', 'completed')),
      isCaseManager && learnerIds.length === 0
        ? Promise.resolve({ count: 0 })
        : (isCaseManager
            ? db.from('program_enrollments').select('*', { count: 'exact', head: true }).in('user_id', learnerIds).eq('at_risk', true)
            : db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('at_risk', true)),
      db.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      isCaseManager && learnerIds.length === 0
        ? Promise.resolve({ count: 0 })
        : (isCaseManager
            ? db.from('placement_records').select('*', { count: 'exact', head: true }).in('learner_id', learnerIds).eq('status', 'verified')
            : db.from('placement_records').select('*', { count: 'exact', head: true }).eq('status', 'verified')),
      isCaseManager && learnerIds.length === 0
        ? Promise.resolve({ count: 0 })
        : (isCaseManager
            ? db.from('placement_records').select('*', { count: 'exact', head: true }).in('learner_id', learnerIds).eq('status', 'pending')
            : db.from('placement_records').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
    ]);

  const totalEnrollments = totalRes.count ?? 0;
  const activeEnrollments = activeRes.count ?? 0;
  const completedEnrollments = completedRes.count ?? 0;
  const atRiskCount = atRiskRes.count ?? 0;
  const activePrograms = programsRes.count ?? 0;
  const placementsVerified = placementsRes.count ?? 0;
  const placementsPending = pendingPlacementsRes.count ?? 0;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  // ── Recent participants ───────────────────────────────────────────────────
  const { data: rawRecent } = isCaseManager && learnerIds.length === 0
    ? { data: [] }
    : await (isCaseManager
        ? db.from('program_enrollments')
            .select('id, user_id, enrollment_state, enrolled_at, programs(title)')
            .in('user_id', learnerIds)
            .order('enrolled_at', { ascending: false })
            .limit(8)
        : db.from('program_enrollments')
            .select('id, user_id, enrollment_state, enrolled_at, programs(title)')
            .order('enrolled_at', { ascending: false })
            .limit(8));

  const recentUserIds = [...new Set((rawRecent ?? []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: recentProfiles } = recentUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', recentUserIds)
    : { data: [] };
  const profileMap = Object.fromEntries((recentProfiles ?? []).map((p: any) => [p.id, p]));
  const recentParticipants = (rawRecent ?? []).map((e: any) => ({
    ...e,
    profile: profileMap[e.user_id] ?? null,
  }));

  const stats = [
    {
      label: isCaseManager ? 'My Caseload' : 'Total Participants',
      value: isCaseManager ? learnerIds.length : totalEnrollments,
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
      href: '/workforce/participants',
    },
    {
      label: 'Completions',
      value: completedEnrollments,
      icon: CheckCircle,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      href: '/workforce/reports',
    },
    {
      label: 'Placements Verified',
      value: placementsVerified,
      icon: Briefcase,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/workforce/placements',
    },
    ...(atRiskCount > 0 ? [{
      label: 'At-Risk',
      value: atRiskCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      href: '/workforce/participants?filter=at-risk',
    }] : []),
    ...(placementsPending > 0 ? [{
      label: 'Placements Pending',
      value: placementsPending,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      href: '/workforce/placements?filter=pending',
    }] : []),
  ];

  // Quick actions — role-based
  const quickActions = [
    { label: 'View Participants', href: '/workforce/participants', icon: Users, show: true },
    { label: 'Student Search', href: '/workforce/search', icon: Search, show: isCaseManager || !isCaseManager },
    { label: 'Verify Placements', href: '/workforce/placements?filter=pending', icon: Briefcase, show: true },
    { label: 'WIOA Export', href: '/workforce/wioa-export', icon: FileText, show: true },
    { label: 'Follow-Ups', href: '/workforce/follow-ups', icon: CheckSquare, show: isWorkforceBoard },
    { label: 'Eligibility', href: '/workforce/eligibility', icon: Shield, show: isWorkforceBoard },
    { label: 'Supportive Services', href: '/workforce/supportive-services', icon: HeartHandshake, show: isWorkforceBoard },
    { label: 'Reports', href: '/workforce/reports', icon: TrendingUp, show: true },
  ].filter((a) => a.show);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isCaseManager ? 'My Caseload' : 'Workforce Overview'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isCaseManager
            ? `Managing ${learnerIds.length} assigned participant${learnerIds.length !== 1 ? 's' : ''}`
            : `${activePrograms} active program${activePrograms !== 1 ? 's' : ''} · ${completionRate}% completion rate`}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow group"
            >
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent participants */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">
              {isCaseManager ? 'Recent Caseload Activity' : 'Recent Enrollments'}
            </h2>
            <Link href="/workforce/participants" className="text-xs text-brand-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentParticipants.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">
              {isCaseManager ? 'No participants assigned yet.' : 'No enrollments yet.'}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentParticipants.map((e: any) => (
                <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-brand-blue-100 flex items-center justify-center text-xs font-bold text-brand-blue-700 shrink-0">
                      {(e.profile?.full_name ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{e.profile?.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400 truncate">{(e.programs as any)?.title ?? '—'}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    e.enrollment_state === 'active' ? 'bg-emerald-100 text-emerald-700'
                    : e.enrollment_state === 'completed' ? 'bg-violet-100 text-violet-700'
                    : 'bg-slate-100 text-slate-500'
                  }`}>
                    {e.enrollment_state ?? 'unknown'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">Quick Actions</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <li key={a.href}>
                  <Link
                    href={a.href}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-600 transition-colors shrink-0" />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{a.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-auto" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Student search — available to all roles */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          Student Search
        </h2>
        <StudentSearchPanel />
      </div>
    </div>
  );
}
