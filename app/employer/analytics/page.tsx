import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { HiringTrendsChart, RetentionByRoleChart } from './EmployerCharts';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer/analytics' },
  title: 'Employer Analytics | Elevate For Humanity',
  description: 'View hiring analytics and workforce metrics.',
};

export default async function EmployerAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['employer', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/login');
  }

  // Fetch this employer's job postings
  const { data: jobPostings } = await supabase
    .from('job_postings')
    .select('id, status')
    .eq('employer_id', user.id);

  const jobIds = (jobPostings ?? []).map((j: any) => j.id);
  const openPositions = (jobPostings ?? []).filter((j: any) => j.status === 'active').length;

  let totalApplications = 0;
  let totalHires = 0;
  let avgTimeToHireDays = 0;

  if (jobIds.length > 0) {
    const { data: applications } = await supabase
      .from('job_applications')
      .select('id, status, applied_at, updated_at')
      .in('job_posting_id', jobIds);

    const apps = applications ?? [];
    totalApplications = apps.length;
    const hires = apps.filter((a: any) => a.status === 'hired');
    totalHires = hires.length;

    if (hires.length > 0) {
      const totalDays = hires.reduce((sum: number, app: any) => {
        const applied = app.applied_at ? new Date(app.applied_at).getTime() : 0;
        const updated = app.updated_at ? new Date(app.updated_at).getTime() : 0;
        if (!applied || !updated) return sum;
        return sum + (updated - applied) / (1000 * 60 * 60 * 24);
      }, 0);
      avgTimeToHireDays = Math.round(totalDays / hires.length);
    }
  }

  const stats = [
    { label: 'Total Hires', value: totalHires.toString(), color: 'text-brand-green-600' },
    { label: 'Open Positions', value: openPositions.toString(), color: 'text-brand-blue-600' },
    { label: 'Applications', value: totalApplications.toString(), color: 'text-brand-blue-600' },
    { label: 'Avg. Time to Hire', value: avgTimeToHireDays > 0 ? `${avgTimeToHireDays}d` : '—', color: 'text-brand-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/employer/dashboard" className="hover:text-gray-900">Employer</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Analytics</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Hiring Analytics</h1>
          <p className="text-gray-600 mt-2">Track your hiring performance and metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-500">{label}</h3>
              <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Hiring Trends</h2>
            <HiringTrendsChart />
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Retention by Role</h2>
            <RetentionByRoleChart />
          </div>
        </div>
      </div>
    </div>
  );
}
