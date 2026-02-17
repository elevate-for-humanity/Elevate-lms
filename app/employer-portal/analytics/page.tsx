import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Briefcase,
  Eye, Clock, ArrowRight, Download,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics | Employer Portal | Elevate For Humanity',
  description: 'View hiring analytics and performance metrics.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirect=/employer-portal/analytics');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/employer-portal/analytics');
  }

  const metrics = [
    { label: 'Total Applications', value: '247', change: '+12%', trend: 'up', icon: Users },
    { label: 'Job Views', value: '1,892', change: '+8%', trend: 'up', icon: Eye },
    { label: 'Avg. Time to Hire', value: '14 days', change: '-3 days', trend: 'up', icon: Clock },
    { label: 'Offer Acceptance', value: '78%', change: '+5%', trend: 'up', icon: CheckCircle },
  ];

  const topJobs = [
    { title: 'Certified Nursing Assistant', applications: 45, views: 312, conversion: '14.4%' },
    { title: 'Licensed Barber', applications: 32, views: 245, conversion: '13.1%' },
    { title: 'HVAC Technician', applications: 28, views: 198, conversion: '14.1%' },
    { title: 'CDL Driver', applications: 24, views: 167, conversion: '14.4%' },
  ];

  const sourceData = [
    { source: 'Direct', percentage: 45 },
    { source: 'Job Boards', percentage: 30 },
    { source: 'Referrals', percentage: 15 },
    { source: 'Social Media', percentage: 10 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Analytics" }]} />
{/* Header */}
      <section className="bg-white border-b">
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
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 12 months</option>
              </select>
              <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Export
              </button>
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
                  <span className={`flex items-center gap-1 text-sm font-medium ${
                    metric.trend === 'up' ? 'text-brand-green-600' : 'text-brand-red-600'
                  }`}>
                    {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {metric.change}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-gray-500 text-sm mt-1">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Applications Over Time */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Applications Over Time</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {[40, 65, 45, 80, 55, 70, 90, 75, 85, 60, 95, 80].map((height, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-indigo-500 rounded-t-sm transition-all hover:bg-indigo-600"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-500">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Sources */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Sources</h3>
              <div className="space-y-4">
                {sourceData.map((source, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">{source.source}</span>
                      <span className="font-semibold text-gray-900">{source.percentage}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Performing Jobs */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Jobs</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topJobs.map((job, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{job.title}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{job.applications}</td>
                    <td className="px-6 py-4 text-gray-600">{job.views}</td>
                    <td className="px-6 py-4">
                      <span className="text-brand-green-600 font-medium">{job.conversion}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
