import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, AlertTriangle, TrendingDown, CheckCircle, User, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Retention Analytics | Elevate For Humanity',
  description: 'Track participant retention and engagement metrics.',
};

export default async function RetentionPage() {
  const supabase = await createClient();


  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: allEnrollments },
    { count: atRiskCount },
    { data: recentDropouts },
    { data: lessonActivity },
    { data: statusBreakdown },
  ] = await Promise.all([
    supabase.from('program_enrollments').select('id, status, enrolled_at, progress, user_id').limit(2000),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('enrollment_status', 'at_risk'),
    supabase.from('program_enrollments')
      .select('id, status, enrolled_at, profiles(full_name, email)')
      .eq('status', 'dropped')
      .order('enrolled_at', { ascending: false })
      .limit(10),
    supabase.from('lesson_progress').select('user_id, completed_at').gte('completed_at', thirtyDaysAgo).limit(1000),
    supabase.from('profiles').select('enrollment_status').eq('role', 'student').limit(2000),
  ]);

  // 30-day retention: enrolled in last 30 days still active
  const enrolledLast30 = (allEnrollments || []).filter((e: any) => e.enrolled_at && new Date(e.enrolled_at) >= new Date(thirtyDaysAgo));
  const activeIn30 = enrolledLast30.filter((e: any) => e.status === 'active' || e.status === 'completed');
  const retention30 = enrolledLast30.length > 0 ? Math.round((activeIn30.length / enrolledLast30.length) * 100) : 0;

  // 90-day retention
  const enrolledLast90 = (allEnrollments || []).filter((e: any) => e.enrolled_at && new Date(e.enrolled_at) >= new Date(ninetyDaysAgo));
  const activeIn90 = enrolledLast90.filter((e: any) => e.status === 'active' || e.status === 'completed');
  const retention90 = enrolledLast90.length > 0 ? Math.round((activeIn90.length / enrolledLast90.length) * 100) : 0;

  // Churned in last 30 days
  const churnedRecent = (allEnrollments || []).filter((e: any) =>
    e.status === 'dropped' && e.enrolled_at && new Date(e.enrolled_at) >= new Date(thirtyDaysAgo)
  ).length;

  // Active learners (lesson activity in last 30 days)
  const activeLearnersSet = new Set((lessonActivity || []).map((l: any) => l.user_id));

  // Status distribution
  const statusCounts: Record<string, number> = {};
  for (const s of (statusBreakdown || [])) {
    const st = s.enrollment_status || 'unknown';
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  }
  const totalStudents = (statusBreakdown || []).length;

  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    at_risk: 'bg-yellow-500',
    completed: 'bg-brand-blue-500',
    dropped: 'bg-red-400',
    pending: 'bg-gray-400',
    unknown: 'bg-gray-300',
  };
  const statusBadge: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    at_risk: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-brand-blue-100 text-brand-blue-700',
    dropped: 'bg-red-100 text-red-700',
    pending: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Retention' }]} />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Retention Analytics</h1>
              <p className="text-gray-600 mt-1">Participant retention and engagement</p>
            </div>
            <Link href="/admin/at-risk" className="flex items-center gap-2 text-brand-orange-600 hover:text-brand-orange-800 text-sm font-medium">
              View At-Risk Students <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{retention30}%</p>
            <p className="text-sm text-gray-500 mt-1">30-Day Retention</p>
            <p className="text-xs text-gray-400 mt-1">{activeIn30.length} of {enrolledLast30.length} enrolled</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-brand-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{retention90}%</p>
            <p className="text-sm text-gray-500 mt-1">90-Day Retention</p>
            <p className="text-xs text-gray-400 mt-1">{activeIn90.length} of {enrolledLast90.length} enrolled</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{atRiskCount || 0}</p>
            <p className="text-sm text-gray-500 mt-1">At Risk</p>
            <p className="text-xs text-gray-400 mt-1">Needs intervention</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-3">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{churnedRecent}</p>
            <p className="text-sm text-gray-500 mt-1">Dropped (30d)</p>
            <p className="text-xs text-gray-400 mt-1">Recent withdrawals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Student Status Distribution</h2>
            {totalStudents > 0 ? (
              <div className="space-y-3">
                {Object.entries(statusCounts).sort(([, a], [, b]) => b - a).map(([status, count]) => {
                  const pct = Math.round((count / totalStudents) * 100);
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700">{status.replace('_', ' ')}</span>
                        <span className="font-medium text-gray-900">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${statusColors[status] || 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No student data yet</p>
            )}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">Active learners (lesson activity, 30d): <span className="font-semibold text-gray-700">{activeLearnersSet.size}</span></p>
            </div>
          </div>

          {/* Recent Dropouts */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">Recent Withdrawals</h2>
              <Link href="/admin/enrollments" className="text-sm text-brand-blue-600 hover:text-brand-blue-800">All enrollments</Link>
            </div>
            <div className="divide-y">
              {recentDropouts && recentDropouts.length > 0 ? recentDropouts.map((e: any) => (
                <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{(e.profiles as any)?.full_name || 'Student'}</p>
                      <p className="text-xs text-gray-500">{(e.profiles as any)?.email || '—'}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusBadge.dropped}`}>Dropped</span>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 text-sm">No recent withdrawals</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
