import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { BarChart3, Users, GraduationCap, DollarSign, TrendingUp, FileText, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Reports | Admin',
  description: 'Generate and view system reports',
};

export default async function ReportsPage() {
  const supabase = await createClient();

  // Fetch data for reports
  const [
    { count: totalUsers },
    { count: totalCourses },
    { count: totalLeads },
    { count: totalEnrollments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('program_enrollments').select('*', { count: 'exact', head: true }),
  ]);

  // Get recent activity
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const { data: recentEnrollments } = await supabase
    .from('program_enrollments')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const stats = [
    { label: 'Total Users', value: totalUsers || 0, icon: Users, color: 'text-brand-blue-600', bgColor: 'bg-brand-blue-100' },
    { label: 'Active Courses', value: totalCourses || 0, icon: GraduationCap, color: 'text-brand-green-600', bgColor: 'bg-brand-green-100' },
    { label: 'Total Leads', value: totalLeads || 0, icon: TrendingUp, color: 'text-brand-blue-600', bgColor: 'bg-brand-blue-100' },
    { label: 'Enrollments', value: totalEnrollments || 0, icon: FileText, color: 'text-brand-orange-600', bgColor: 'bg-brand-orange-100' },
  ];

  const reportTypes = [
    {
      title: 'Enrollment Report',
      description: 'Student enrollment trends, completion rates, and program performance',
      icon: GraduationCap,
      color: 'bg-brand-blue-500',
      href: '/admin/reports/enrollment',
      metrics: [`${recentEnrollments?.length || 0} new this month`],
    },
    {
      title: 'Lead Generation Report',
      description: 'Lead sources, conversion rates, and pipeline analysis',
      icon: TrendingUp,
      color: 'bg-brand-green-500',
      href: '/admin/reports/leads',
      metrics: [`${recentLeads?.length || 0} new leads this month`],
    },
    {
      title: 'Financial Report',
      description: 'WOTC credits, grants awarded, and funding overview',
      icon: DollarSign,
      color: 'bg-brand-blue-500',
      href: '/admin/reports/financial',
      metrics: ['WOTC tracking', 'Grant utilization'],
    },
    {
      title: 'User Activity Report',
      description: 'User registrations, roles, and platform engagement',
      icon: Users,
      color: 'bg-brand-orange-500',
      href: '/admin/reports/users',
      metrics: [`${totalUsers || 0} total users`],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate reports and view platform analytics</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {reportTypes.map((report, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${report.color}`}>
                  <report.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {report.metrics.map((metric, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {metric}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={report.href}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-brand-blue-600 text-white rounded hover:bg-brand-blue-700 transition"
                  >
                    <Eye className="w-3 h-3" />
                    View Report
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats Overview</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-brand-blue-600" />
                <span className="font-medium text-gray-900">Lead Conversion</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalLeads && totalEnrollments ? ((totalEnrollments / totalLeads) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-gray-600">Leads to enrollments</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-brand-green-600" />
                <span className="font-medium text-gray-900">Monthly Growth</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{recentLeads?.length || 0}</p>
              <p className="text-sm text-gray-600">New leads this month</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-brand-blue-600" />
                <span className="font-medium text-gray-900">Active Programs</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalCourses || 0}</p>
              <p className="text-sm text-gray-600">Available courses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
