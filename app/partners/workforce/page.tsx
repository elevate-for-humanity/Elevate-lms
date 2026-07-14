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
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Workforce</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}
