import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import Link from 'next/link';
import { Users, Award, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Board Dashboard',
  description: 'Oversight dashboard for workforce development boards.',
};

export const dynamic = 'force-dynamic';

/**
 * WORKFORCE BOARD DASHBOARD
 */
export default async function WorkforceBoardDashboard() {
  const { user, profile } = await requireRole([
    'workforce_board',
    'admin',
    'super_admin',
    'org_admin',
  ]);

  const supabase = await createClient();

  const [enrollmentsResult, completionsResult, activeResult, programsResult, providersResult] =
    await Promise.all([
      supabase.from('program_enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('partner_lms_providers').select('*', { count: 'exact', head: true }),
    ]);

  const totalEnrollments = enrollmentsResult.count || 0;
  const completedEnrollments = completionsResult.count || 0;
  const activeEnrollments = activeResult.count || 0;
  const activePrograms = programsResult.count || 0;
  const trainingProviders = providersResult.count || 0;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  const { data: rawRecentEnrollments } = await supabase
    .from('program_enrollments')
    .select('id, status, created_at, user_id, programs ( title )')
    .order('created_at', { ascending: false })
    .limit(5);

  const wfUserIds = [...new Set((rawRecentEnrollments || []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: wfProfiles } = wfUserIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', wfUserIds)
    : { data: [] };
  const wfProfileMap = Object.fromEntries((wfProfiles || []).map((p: any) => [p.id, p]));
  const recentEnrollments = (rawRecentEnrollments || []).map((e: any) => ({
    ...e,
    profiles: wfProfileMap[e.user_id] ?? null,
  }));

  const { data: certificatesIssued } = await supabase.from('certificates').select('id', { count: 'exact', head: true });
  const credentialCount = certificatesIssued?.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Workforce Board Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Welcome back, {profile?.full_name || 'Admin'}</p>
            </div>
            <Link href="/workforce-board/employment" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors">
              View Job Board <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalEnrollments}</p>
                  <p className="text-xs text-slate-500">Total Enrollments</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{completedEnrollments}</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{completionRate}%</p>
                  <p className="text-xs text-slate-500">Completion Rate</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{credentialCount}</p>
                  <p className="text-xs text-slate-500">Credentials Issued</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Enrollments</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {recentEnrollments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentEnrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{enrollment.profiles?.full_name || 'Participant'}</p>
                      <p className="text-sm text-slate-500">{enrollment.programs?.title || 'Program'}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${enrollment.status === 'completed' ? 'bg-green-100 text-green-700' : enrollment.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {enrollment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No recent enrollments</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/workforce-board/employment" className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md hover:border-brand-blue-200 transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">View Job Board</h3>
              <p className="text-sm text-slate-500">Browse employment opportunities</p>
            </Link>
            <Link href="/reports/wioa" className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md hover:border-brand-blue-200 transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">WIOA Reports</h3>
              <p className="text-sm text-slate-500">View compliance reports</p>
            </Link>
            <Link href="/case-manager/dashboard" className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md hover:border-brand-blue-200 transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">Case Manager</h3>
              <p className="text-sm text-slate-500">Manage participants</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}