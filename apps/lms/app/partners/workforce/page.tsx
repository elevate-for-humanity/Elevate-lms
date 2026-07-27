import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Workforce | Elevate for Humanity',
  description: 'Workforce page content.',
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">
                {isCaseManager ? 'My Caseload' : 'Workforce Dashboard'}
              </h1>
              <p className="text-slate-600 mt-1">
                {isCaseManager ? 'Manage your assigned participants' : 'Overview of workforce training programs'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-bold text-black">{stat.value.toLocaleString()}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-lg font-bold text-black mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <action.icon className="w-4 h-4 text-brand-blue-600" />
                <span className="text-sm font-medium text-slate-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Participants */}
      {recentParticipants.length > 0 && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-black">Recent Participants</h2>
              <Link href="/workforce/participants" className="text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                View All →
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Program</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentParticipants.map((participant: any) => (
                    <tr key={participant.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {participant.profile?.full_name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {(participant as any).programs?.title || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          participant.enrollment_state === 'active' ? 'bg-green-100 text-green-700' :
                          participant.enrollment_state === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {participant.enrollment_state}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(participant.enrolled_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
