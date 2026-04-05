import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, TrendingUp, PieChart, Target } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Charts & Visualizations | Elevate For Humanity',
  description: 'Visual data charts and analytics dashboards.',
};

export default async function ChartsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const [enrollments, completions, programs, applications] = await Promise.all([
    supabase.from('enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('partner_completions').select('id', { count: 'exact', head: true }),
    supabase.from('programs').select('id', { count: 'exact', head: true }),
    supabase.from('applications').select('id', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'Total Enrollments', value: enrollments.count ?? 0, icon: BarChart3 },
    { label: 'Completions', value: completions.count ?? 0, icon: TrendingUp },
    { label: 'Active Programs', value: programs.count ?? 0, icon: PieChart },
    { label: 'Applications', value: applications.count ?? 0, icon: Target },
  ];

  const { data: enrollmentsByStatus } = await supabase
    .from('enrollments')
    .select('status')
    .limit(500);

  const statusCounts: Record<string, number> = {};
  (enrollmentsByStatus ?? []).forEach((e: { status: string }) => {
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  });

  const { data: programEnrollments } = await supabase
    .from('enrollments')
    .select('program_id, programs(name)')
    .limit(500);

  const programCounts: Record<string, number> = {};
  (programEnrollments ?? []).forEach((e: any) => {
    const name = e.programs?.name || 'Unknown';
    programCounts[name] = (programCounts[name] || 0) + 1;
  });
  const topPrograms = Object.entries(programCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/reports" className="hover:text-primary">Reports</Link></li><li>/</li><li className="text-gray-900 font-medium">Charts</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Charts & Visualizations</h1>
          <p className="text-gray-600 mt-2">Real-time analytics from platform data</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-lg shadow-sm border p-5">
              <div className="flex items-center gap-3 mb-2">
                <s.icon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">{s.label}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{s.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-blue-600" />
              Enrollment by Status
            </h3>
            {Object.keys(statusCounts).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(statusCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => {
                    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-gray-700">{status.replace(/_/g, ' ')}</span>
                          <span className="text-gray-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No enrollment data yet</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-brand-orange-600" />
              Top Programs by Enrollment
            </h3>
            {topPrograms.length > 0 ? (
              <div className="space-y-3">
                {topPrograms.map(([name, count], i) => {
                  const max = topPrograms[0][1] as number;
                  const pct = max > 0 ? Math.round(((count as number) / max) * 100) : 0;
                  const colors = ['bg-brand-blue-500', 'bg-brand-green-500', 'bg-brand-orange-500', 'bg-purple-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500', 'bg-cyan-500'];
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate mr-2">{name}</span>
                        <span className="text-gray-500 shrink-0">{count as number}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors[i % colors.length]} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No program enrollment data yet</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-green-600" />
              Completion Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-brand-green-50 rounded-lg">
                <div className="text-2xl font-bold text-brand-green-700">{completions.count ?? 0}</div>
                <div className="text-sm text-brand-green-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-brand-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-brand-blue-700">{enrollments.count ?? 0}</div>
                <div className="text-sm text-brand-blue-600">Total Enrolled</div>
              </div>
            </div>
            {(enrollments.count ?? 0) > 0 && (
              <div className="mt-4 text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {Math.round(((completions.count ?? 0) / (enrollments.count ?? 1)) * 100)}% Completion Rate
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Application Pipeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Total Applications</span>
                <span className="font-semibold">{applications.count ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Active Programs</span>
                <span className="font-semibold">{programs.count ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Partner Completions</span>
                <span className="font-semibold">{completions.count ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
