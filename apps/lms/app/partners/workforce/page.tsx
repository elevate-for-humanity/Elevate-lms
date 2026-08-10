import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  CheckSquare,
  Clock,
  FileText,
  HeartHandshake,
  Search,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Workforce | Elevate for Humanity',
  description: 'Workforce participant, enrollment, placement, and reporting dashboard.',
};

export const dynamic = 'force-dynamic';

export default async function WorkforceDashboardPage() {
  const { user, profile } = await requireRole([
    'workforce_board',
    'case_manager',
    'admin',
    'super_admin',
    'staff',
    'org_admin',
  ]);

  const supabase = await createClient();
  const db = await requireAdminClient();
  const isCaseManager = profile?.role === 'case_manager';
  const isWorkforceBoard = ['workforce_board', 'admin', 'super_admin', 'staff', 'org_admin'].includes(profile?.role ?? '');

  let learnerIds: string[] = [];
  if (isCaseManager) {
    const { data: assignments } = await supabase
      .from('case_manager_assignments')
      .select('learner_id')
      .eq('case_manager_id', user.id);
    learnerIds = (assignments ?? []).map((row: any) => row.learner_id).filter(Boolean);
  }

  const emptyCaseLoad = isCaseManager && learnerIds.length === 0;
  const enrollmentCount = async (state?: string, atRisk?: boolean) => {
    if (emptyCaseLoad) return 0;
    let query = db.from('program_enrollments').select('*', { count: 'exact', head: true });
    if (isCaseManager) query = query.in('user_id', learnerIds);
    if (state) query = query.eq('enrollment_state', state);
    if (atRisk !== undefined) query = query.eq('at_risk', atRisk);
    const { count } = await query;
    return count ?? 0;
  };

  const placementCount = async (status: string) => {
    if (emptyCaseLoad) return 0;
    let query = db.from('placement_records').select('*', { count: 'exact', head: true }).eq('status', status);
    if (isCaseManager) query = query.in('learner_id', learnerIds);
    const { count } = await query;
    return count ?? 0;
  };

  const [
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    atRiskCount,
    programsRes,
    placementsVerified,
    placementsPending,
  ] = await Promise.all([
    enrollmentCount(),
    enrollmentCount('active'),
    enrollmentCount('completed'),
    enrollmentCount(undefined, true),
    db.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    placementCount('verified'),
    placementCount('pending'),
  ]);

  const activePrograms = programsRes.count ?? 0;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  let recentQuery = db
    .from('program_enrollments')
    .select('id, user_id, enrollment_state, enrolled_at, programs(title)')
    .order('enrolled_at', { ascending: false })
    .limit(8);
  if (isCaseManager && learnerIds.length > 0) recentQuery = recentQuery.in('user_id', learnerIds);
  const { data: rawRecent } = emptyCaseLoad ? { data: [] as any[] } : await recentQuery;

  const recentUserIds = [...new Set((rawRecent ?? []).map((row: any) => row.user_id).filter(Boolean))] as string[];
  const { data: recentProfiles } = recentUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', recentUserIds)
    : { data: [] as any[] };
  const profileMap = Object.fromEntries((recentProfiles ?? []).map((row: any) => [row.id, row]));
  const recentParticipants = (rawRecent ?? []).map((row: any) => ({ ...row, profile: profileMap[row.user_id] ?? null }));

  const stats = [
    { label: isCaseManager ? 'My Caseload' : 'Total Participants', value: isCaseManager ? learnerIds.length : totalEnrollments, icon: Users, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50', href: '/workforce/participants' },
    { label: 'Active Enrollments', value: activeEnrollments, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/workforce/participants' },
    { label: 'Completions', value: completedEnrollments, icon: CheckCircle, color: 'text-violet-600', bg: 'bg-violet-50', href: '/workforce/reports' },
    { label: 'Placements Verified', value: placementsVerified, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', href: '/workforce/placements' },
    ...(atRiskCount > 0 ? [{ label: 'At-Risk', value: atRiskCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', href: '/workforce/participants?filter=at-risk' }] : []),
    ...(placementsPending > 0 ? [{ label: 'Placements Pending', value: placementsPending, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', href: '/workforce/placements?filter=pending' }] : []),
  ];

  const quickActions = [
    { label: 'View Participants', href: '/workforce/participants', icon: Users, show: true },
    { label: 'Student Search', href: '/workforce/search', icon: Search, show: true },
    { label: 'Verify Placements', href: '/workforce/placements?filter=pending', icon: Briefcase, show: true },
    { label: 'WIOA Export', href: '/workforce/wioa-export', icon: FileText, show: true },
    { label: 'Follow-Ups', href: '/workforce/follow-ups', icon: CheckSquare, show: isWorkforceBoard },
    { label: 'Eligibility', href: '/workforce/eligibility', icon: Shield, show: isWorkforceBoard },
    { label: 'Supportive Services', href: '/workforce/supportive-services', icon: HeartHandshake, show: isWorkforceBoard },
    { label: 'Reports', href: '/workforce/reports', icon: TrendingUp, show: true },
  ].filter((action) => action.show);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-2xl font-bold text-black">{isCaseManager ? 'My Caseload' : 'Workforce Dashboard'}</h1>
          <p className="mt-1 text-slate-600">{isCaseManager ? 'Manage your assigned participants' : 'Overview of workforce training programs'}</p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href} className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
                <div className="text-2xl font-bold text-black">{stat.value.toLocaleString()}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Completion rate: {completionRate}% · Active programs: {activePrograms}</p>
        </div>
      </section>

      <section className="py-4">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-4 text-lg font-bold text-black">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 transition-colors hover:bg-slate-50">
                <action.icon className="h-4 w-4 text-brand-blue-600" /><span className="text-sm font-medium text-slate-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {recentParticipants.length > 0 ? (
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-black">Recent Participants</h2><Link href="/workforce/participants" className="text-sm font-semibold text-brand-blue-600">View All →</Link></div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50"><tr>{['Name', 'Program', 'Status', 'Enrolled'].map((label) => <th key={label} className="px-4 py-3 text-left text-sm font-semibold text-slate-700">{label}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {recentParticipants.map((participant: any) => (
                    <tr key={participant.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">{participant.profile?.full_name || participant.profile?.email || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{Array.isArray(participant.programs) ? participant.programs[0]?.title : participant.programs?.title || 'N/A'}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{participant.enrollment_state}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-500">{participant.enrolled_at ? new Date(participant.enrolled_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
