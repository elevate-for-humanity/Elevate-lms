import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { getCaseManagerParticipants } from '@/lib/case-manager/participant-scope';
import Link from 'next/link';
import {
  Users,
  CheckCircle,
  Award,
  Briefcase,
  ChevronRight,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { StudentSearchPanel } from '../StudentSearchPanel';

export const metadata: Metadata = {
  title: 'Case Manager Dashboard | Elevate Workforce Hub',
  description: 'Participant enrollment, progress, credentials, and placement outcomes.',
};

export const dynamic = 'force-dynamic';

export default async function CaseManagerDashboardPage() {
  const { user, effectiveRoles } = await requireRole(['case_manager', 'admin', 'staff']);

  const supabase = await createClient();
  const admin = await requireAdminClient();
  const db = admin || supabase;

  const scopedParticipants = await getCaseManagerParticipants({
    db,
    userId: user.id,
    effectiveRoles,
  });

  const learnerIds = scopedParticipants
    .map((participant) => participant.learnerId)
    .filter((id): id is string => Boolean(id));
  const totalAssigned = scopedParticipants.length;
  const applicationIdByLearnerId = Object.fromEntries(
    scopedParticipants
      .filter((participant) => participant.learnerId)
      .map((participant) => [participant.learnerId as string, participant.application.id]),
  );

  let activeEnrollments = 0;
  let completedEnrollments = 0;
  if (learnerIds.length > 0) {
    const [{ count: active }, { count: completed }] = await Promise.all([
      db
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .in('user_id', learnerIds)
        .eq('status', 'active'),
      db
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .in('user_id', learnerIds)
        .eq('status', 'completed'),
    ]);
    activeEnrollments = active ?? 0;
    completedEnrollments = completed ?? 0;
  }

  let credentialsEarned = 0;
  if (learnerIds.length > 0) {
    const { count } = await db
      .from('learner_credentials')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds)
      .eq('status', 'active');
    credentialsEarned = count ?? 0;
  }

  let placementsVerified = 0;
  let placementsPending = 0;
  if (learnerIds.length > 0) {
    const [{ count: verified }, { count: pending }] = await Promise.all([
      db
        .from('placement_records')
        .select('id', { count: 'exact', head: true })
        .in('learner_id', learnerIds)
        .eq('status', 'verified'),
      db
        .from('placement_records')
        .select('id', { count: 'exact', head: true })
        .in('learner_id', learnerIds)
        .eq('status', 'pending'),
    ]);
    placementsVerified = verified ?? 0;
    placementsPending = pending ?? 0;
  }

  let recentEnrollments: any[] = [];
  if (learnerIds.length > 0) {
    const { data: rawCmEnrollments } = await db
      .from('program_enrollments')
      .select('id, user_id, status, enrolled_at, funding_source, program:programs!program_id(id, title)')
      .in('user_id', learnerIds)
      .order('enrolled_at', { ascending: false })
      .limit(10);

    const profileByLearnerId = Object.fromEntries(
      scopedParticipants
        .filter((participant) => participant.learnerId)
        .map((participant) => [participant.learnerId as string, participant.learnerProfile]),
    );

    recentEnrollments = (rawCmEnrollments ?? []).map((enrollment: any) => ({
      ...enrollment,
      user: profileByLearnerId[enrollment.user_id] ?? null,
      applicationId: applicationIdByLearnerId[enrollment.user_id] ?? null,
    }));
  }

  const stats = [
    { label: 'Assigned Participants', value: totalAssigned, icon: Users, color: 'brand-blue' },
    { label: 'Active Enrollments', value: activeEnrollments, icon: Clock, color: 'brand-orange' },
    { label: 'Completions', value: completedEnrollments, icon: CheckCircle, color: 'brand-green' },
    { label: 'Credentials Earned', value: credentialsEarned, icon: Award, color: 'brand-blue' },
    { label: 'Verified Placements', value: placementsVerified, icon: Briefcase, color: 'brand-green' },
    { label: 'Placements Pending', value: placementsPending, icon: AlertCircle, color: 'brand-red' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-brand-blue-700 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">Workforce Hub</p>
          <h1 className="text-2xl font-extrabold mb-1">Case Manager Dashboard</h1>
          <p className="text-blue-50 text-sm">Participant outcomes, enrollment status, and placement verification</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <stat.icon
                className={`w-5 h-5 mx-auto mb-2 ${
                  stat.color === 'brand-red'
                    ? 'text-brand-red-500'
                    : stat.color === 'brand-green'
                      ? 'text-brand-green-600'
                      : stat.color === 'brand-orange'
                        ? 'text-orange-500'
                        : 'text-brand-blue-600'
                }`}
              />
              <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Assigned Participants</h2>
            <span className="text-xs text-slate-500">{totalAssigned} total</span>
          </div>
          {scopedParticipants.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">No participants assigned yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {scopedParticipants.slice(0, 50).map(({ application, learnerProfile }) => (
                <li key={application.id}>
                  <Link
                    href={`/case-manager/participants/${application.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition"
                  >
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {learnerProfile?.full_name || `${application.first_name ?? ''} ${application.last_name ?? ''}`.trim() || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">{application.email ?? learnerProfile?.email ?? '—'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Enrollments</h2>
          </div>
          {recentEnrollments.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">No recent enrollments.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Participant</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Program</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Funding</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentEnrollments.map((enrollment: any) => (
                    <tr key={enrollment.id} className="hover:bg-white">
                      <td className="px-5 py-3">
                        {enrollment.applicationId ? (
                          <Link
                            href={`/case-manager/participants/${enrollment.applicationId}`}
                            className="text-brand-blue-600 hover:underline font-medium"
                          >
                            {enrollment.user?.full_name ?? '—'}
                          </Link>
                        ) : (
                          <span className="font-medium text-slate-700">{enrollment.user?.full_name ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{enrollment.program?.title ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{enrollment.funding_source ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            enrollment.status === 'completed'
                              ? 'bg-brand-green-100 text-brand-green-700'
                              : enrollment.status === 'active'
                                ? 'bg-brand-blue-100 text-brand-blue-700'
                                : 'bg-white text-slate-600'
                          }`}
                        >
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <StudentSearchPanel />

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Pending Placements', href: '/case-manager/placements?status=pending', icon: AlertCircle, desc: 'Verify employment outcomes' },
            { label: 'WIOA Reporting', href: '/case-manager/reports/wioa', icon: TrendingUp, desc: 'Participant outcome exports' },
            { label: 'All Participants', href: '/case-manager/participants', icon: Users, desc: 'Full participant list' },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-red-300 hover:shadow-sm transition flex items-start gap-3"
            >
              <link.icon className="w-5 h-5 text-brand-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">{link.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
