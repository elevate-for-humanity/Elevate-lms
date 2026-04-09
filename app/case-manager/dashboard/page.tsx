import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import {
  Users, CheckCircle, Award, Briefcase, ChevronRight,
  AlertCircle, Clock, TrendingUp,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Case Manager Dashboard | Elevate Workforce Hub',
  description: 'Participant enrollment, progress, credentials, and placement outcomes.',
};

export const dynamic = 'force-dynamic';

export default async function CaseManagerDashboardPage() {
  const { user } = await requireRole(['case_manager', 'admin', 'super_admin', 'staff']);

  const supabase = await createClient();
  const admin = await getAdminClient();
  const db = admin || supabase;

  // ─── Assigned participants ────────────────────────────────────────────────
  const { data: assignments } = await supabase
    .from('case_manager_assignments')
    .select('learner_id, assigned_at, expires_at')
    .eq('case_manager_id', user.id);

  const learnerIds = (assignments ?? []).map((a: any) => a.learner_id);
  const totalAssigned = learnerIds.length;

  // ─── Participant profiles ─────────────────────────────────────────────────
  let participants: any[] = [];
  if (learnerIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, city, state, created_at')
      .in('id', learnerIds)
      .order('full_name', { ascending: true })
      .limit(50);
    participants = data ?? [];
  }

  // ─── Enrollment summary ───────────────────────────────────────────────────
  let activeEnrollments = 0;
  let completedEnrollments = 0;
  if (learnerIds.length > 0) {
    const { count: active } = await supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .in('user_id', learnerIds)
      .eq('status', 'active');
    const { count: completed } = await supabase
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .in('user_id', learnerIds)
      .eq('status', 'completed');
    activeEnrollments = active ?? 0;
    completedEnrollments = completed ?? 0;
  }

  // ─── Credential summary ───────────────────────────────────────────────────
  let credentialsEarned = 0;
  if (learnerIds.length > 0) {
    const { count } = await supabase
      .from('learner_credentials')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds)
      .eq('status', 'active');
    credentialsEarned = count ?? 0;
  }

  // ─── Placement summary ────────────────────────────────────────────────────
  let placementsVerified = 0;
  let placementsPending = 0;
  if (learnerIds.length > 0) {
    const { count: verified } = await supabase
      .from('placement_records')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds)
      .eq('status', 'verified');
    const { count: pending } = await supabase
      .from('placement_records')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds)
      .eq('status', 'pending');
    placementsVerified = verified ?? 0;
    placementsPending = pending ?? 0;
  }

  // ─── Recent enrollments needing attention ─────────────────────────────────
  let recentEnrollments: any[] = [];
  if (learnerIds.length > 0) {
    const { data } = await supabase
      .from('program_enrollments')
      .select(`
        id, status, enrolled_at, funding_source,
        user:profiles!user_id(id, full_name, email),
        program:programs!program_id(id, title)
      `)
      .in('user_id', learnerIds)
      .order('enrolled_at', { ascending: false })
      .limit(10);
    recentEnrollments = data ?? [];
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
      {/* Header */}
      <div className="bg-brand-blue-700 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-1">
            Workforce Hub
          </p>
          <h1 className="text-2xl font-extrabold mb-1">Case Manager Dashboard</h1>
          <p className="text-slate-500 text-sm">
            Participant outcomes, enrollment status, and placement verification
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${
                s.color === 'brand-red' ? 'text-brand-red-500'
                : s.color === 'brand-green' ? 'text-brand-green-600'
                : s.color === 'brand-orange' ? 'text-orange-500'
                : 'text-brand-blue-600'
              }`} />
              <div className="text-2xl font-extrabold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Participant list */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Assigned Participants</h2>
            <span className="text-xs text-slate-500">{totalAssigned} total</span>
          </div>
          {participants.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">
              No participants assigned yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {participants.map((p: any) => (
                <li key={p.id}>
                  <Link
                    href={`/case-manager/participants/${p.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-white transition"
                  >
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{p.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{p.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent enrollments */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Enrollments</h2>
          </div>
          {recentEnrollments.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">
              No recent enrollments.
            </div>
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
                  {recentEnrollments.map((e: any) => (
                    <tr key={e.id} className="hover:bg-white">
                      <td className="px-5 py-3">
                        <Link
                          href={`/case-manager/participants/${e.user?.id}`}
                          className="text-brand-blue-600 hover:underline font-medium"
                        >
                          {e.user?.full_name ?? '—'}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{e.program?.title ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{e.funding_source ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          e.status === 'completed' ? 'bg-brand-green-100 text-brand-green-700'
                          : e.status === 'active' ? 'bg-brand-blue-100 text-brand-blue-700'
                          : 'bg-white text-slate-600'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick links */}
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
