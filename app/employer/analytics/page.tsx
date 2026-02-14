import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { HiringTrendsChart, RetentionByRoleChart } from './EmployerCharts';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer/analytics' },
  title: 'Employer Analytics | Elevate For Humanity',
  description: 'View hiring analytics and workforce metrics.',
};

export default async function EmployerAnalyticsPage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/employer" className="hover:text-primary">Employer</Link></li><li>/</li><li className="text-gray-900 font-medium">Analytics</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Hiring Analytics</h1>
          <p className="text-gray-600 mt-2">Track your hiring performance and metrics</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Total Hires</h3><p className="text-3xl font-bold text-green-600 mt-2">47</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Open Positions</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">8</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Applications</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">156</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Avg. Time to Hire</h3><p className="text-3xl font-bold text-orange-600 mt-2">18d</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Hiring Trends</h2><HiringTrendsChart /></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Retention by Role</h2><RetentionByRoleChart /></div>
        </div>
      </div>
    </div>
  );
}
