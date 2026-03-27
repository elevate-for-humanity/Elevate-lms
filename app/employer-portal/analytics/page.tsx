import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, Users, Briefcase,
  ArrowRight, Download, CheckCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics | Employer Portal | Elevate For Humanity',
  description: 'View hiring analytics and performance metrics.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employer-portal/analytics');
  }

  // Fetch employer's job postings
  const { data: jobPostings } = await supabase
    .from('job_postings')
    .select('id, job_title, status, positions_available, positions_filled, created_at')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false });

  const jobIds = (jobPostings || []).map(j => j.id);
  const safeJobIds = jobIds.length > 0 ? jobIds : ['00000000-0000-0000-0000-000000000000'];

  // Fetch application counts
  const { count: totalApplications } = await supabase
    .from('job_applications')
    .select('id', { count: 'exact', head: true })
    .in('job_id', safeJobIds);

  const { count: hiredCount } = await supabase
    .from('job_applications')
    .select('id', { count: 'exact', head: true })
    .in('job_id', safeJobIds)
    .eq('status', 'hired');

  const activeJobs = (jobPostings || []).filter(j => j.status === 'active').length;
  const totalPositions = (jobPostings || []).reduce((sum, j) => sum + (j.positions_available || 0), 0);
  const appCount = totalApplications || 0;
  const hired = hiredCount || 0;
  const hireRate = appCount > 0 ? Math.round((hired / appCount) * 100) : 0;

  const metrics = [
    { label: 'Total Applications', value: appCount.toLocaleString(), icon: Users },
    { label: 'Active Job Postings', value: activeJobs.toString(), icon: Briefcase },
    { label: 'Positions Filled', value: hired.toString(), icon: CheckCircle },
    { label: 'Hire Rate', value: `${hireRate}%`, icon: TrendingUp },
  ];

  // Top jobs by positions filled
  const topJobs = (jobPostings || [])
    .map(j => ({
      title: j.job_title,
      positions: j.positions_available || 0,
      filled: j.positions_filled || 0,
      status: j.status,
    }))
    .sort((a, b) => b.filled - a.filled)
    .slice(0, 6);

  // Status breakdown
  const statusCounts = (jobPostings || []).reduce<Record<string, number>>((acc, j) => {
    const s = j.status || 'unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const statusEntries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const totalJobs = jobPostings?.length || 0;

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Analytics" }]} />

      {/* Header */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              </div>
              <p className="text-gray-600">Track your hiring performance and metrics</p>
            </div>
            <div className="flex gap-3">
              <a
                href="/employer-portal/analytics/export"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-slate-50"
              >
                <Download className="w-4 h-4" />
                Export
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <metric.icon className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-gray-500 text-sm mt-1">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Summary + Status Breakdown */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Hiring Summary</h3>
              <div className="space-y-5">
                {[
                  { label: 'Total Job Postings', value: totalJobs.toString() },
                  { label: 'Total Positions Available', value: totalPositions.toString() },
                  { label: 'Applications Received', value: appCount.toString() },
                  { label: 'Candidates Hired', value: hired.toString(), green: true },
                  { label: 'Hire Rate', value: `${hireRate}%`, green: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{row.label}</span>
                    <span className={`font-semibold ${row.green ? 'text-brand-green-600' : 'text-gray-900'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Job Status Breakdown</h3>
              {statusEntries.length > 0 ? (
                <div className="space-y-4">
                  {statusEntries.map(([status, count]) => {
                    const pct = totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0;
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-700 capitalize">{status}</span>
                          <span className="font-semibold text-gray-900">{count} ({pct}%)</span>
                        </div>
                        <div className="h-3 bg-white rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No job postings yet. Post your first job to see analytics.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Top Jobs */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Top Jobs by Positions Filled</h3>
            </div>
            {topJobs.length > 0 ? (
              <table className="w-full">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Positions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filled</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topJobs.map((job, index) => (
                    <tr key={index} className="hover:bg-white">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{job.title}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{job.positions}</td>
                      <td className="px-6 py-4">
                        <span className="text-brand-green-600 font-medium">{job.filled}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          job.status === 'active' ? 'bg-brand-green-100 text-brand-green-700' :
                          job.status === 'closed' ? 'bg-white text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No job postings yet.</p>
                <Link href="/employer-portal/jobs/new" className="inline-flex items-center gap-2 mt-4 text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                  Post your first job <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
