
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireRole } from '@/lib/admin/guards';
import Link from 'next/link';
import { 

  Users, 
  GraduationCap,
  DollarSign,
  Award,
  BookOpen
} from 'lucide-react';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Performance Dashboard | Admin | Elevate For Humanity',
  description: 'Track key performance indicators and metrics.',
};

export default async function AdminPerformanceDashboardPage() {
  const auth = await requireRole(['admin', 'super_admin', 'staff']);
  if (auth.error) return auth.error;
  const supabase = auth.supabase;

  // Fetch real data from database
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  const { count: enrolledLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'enrolled');

  const { count: totalCourses } = await supabase
    .from('training_courses')
    .select('*', { count: 'exact', head: true });

  const { count: publishedCourses } = await supabase
    .from('training_courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  const { count: totalContacts } = await supabase
    .from('crm_contacts')
    .select('*', { count: 'exact', head: true });

  const { count: employerContacts } = await supabase
    .from('crm_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('contact_type', 'employer');

  const { count: wotcApplications } = await supabase
    .from('wotc_applications')
    .select('*', { count: 'exact', head: true });

  const { count: approvedWotc } = await supabase
    .from('wotc_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  // Calculate rates
  const enrollmentRate = totalLeads && totalLeads > 0 
    ? ((enrolledLeads || 0) / totalLeads * 100).toFixed(1) 
    : '0';

  const wotcApprovalRate = wotcApplications && wotcApplications > 0
    ? ((approvedWotc || 0) / wotcApplications * 100).toFixed(1)
    : '0';

  // Get courses by category
  const { data: courses } = await supabase
    .from('training_courses')
    .select('category, status');

  const categoryStats: Record<string, { total: number; published: number }> = {};
  courses?.forEach(course => {
    const cat = course.category || 'Uncategorized';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, published: 0 };
    }
    categoryStats[cat].total++;
    if (course.status === 'published') {
      categoryStats[cat].published++;
    }
  });

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Performance Dashboard" }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
            <p className="text-gray-600 mt-1">Key metrics and organizational KPIs</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm">
              <option>All Time</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalLeads || 0}</p>
                <p className="text-sm text-brand-blue-600 mt-1">{enrolledLeads || 0} enrolled</p>
              </div>
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Enrollment Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{enrollmentRate}%</p>
                <p className="text-sm text-gray-500 mt-1">Lead to enrollment</p>
              </div>
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-brand-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Employer Partners</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{employerContacts || 0}</p>
                <p className="text-sm text-gray-500 mt-1">of {totalContacts || 0} contacts</p>
              </div>
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-brand-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">WOTC Approval Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{wotcApprovalRate}%</p>
                <p className="text-sm text-gray-500 mt-1">{approvedWotc || 0} of {wotcApplications || 0}</p>
              </div>
              <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-brand-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Course Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Overview</h2>
            <div className="flex items-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">{totalCourses || 0}</p>
                <p className="text-sm text-gray-500">Total Courses</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-brand-green-600">{publishedCourses || 0}</p>
                <p className="text-sm text-gray-500">Published</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-yellow-600">{(totalCourses || 0) - (publishedCourses || 0)}</p>
                <p className="text-sm text-gray-500">Draft</p>
              </div>
            </div>
            <Link href="/admin/course-builder" className="text-sm text-brand-blue-600 hover:text-brand-blue-700">
              Manage courses →
            </Link>
          </div>

          {/* Program Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Courses by Category</h2>
            {Object.keys(categoryStats).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No course data available.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{category}</span>
                      <span className="text-sm text-gray-500">{stats.published}/{stats.total} published</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-brand-green-500 h-2 rounded-full" 
                        style={{ width: `${stats.total > 0 ? (stats.published / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Lead Pipeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Pipeline</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Leads</span>
                <span className="font-semibold text-gray-900">{totalLeads || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Enrolled</span>
                <span className="font-semibold text-gray-900">{enrolledLeads || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="font-semibold text-gray-900">{enrollmentRate}%</span>
              </div>
            </div>
            <Link href="/admin/leads" className="block mt-4 text-sm text-brand-blue-600 hover:text-brand-blue-700">
              View all leads →
            </Link>
          </div>

          {/* WOTC Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">WOTC Applications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Applications</span>
                <span className="font-semibold text-gray-900">{wotcApplications || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Approved</span>
                <span className="font-semibold text-gray-900">{approvedWotc || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Approval Rate</span>
                <span className="font-semibold text-gray-900">{wotcApprovalRate}%</span>
              </div>
            </div>
            <Link href="/admin/wotc" className="block mt-4 text-sm text-brand-blue-600 hover:text-brand-blue-700">
              View WOTC applications →
            </Link>
          </div>

          {/* Contact Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">CRM Contacts</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Contacts</span>
                <span className="font-semibold text-gray-900">{totalContacts || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Employer Partners</span>
                <span className="font-semibold text-gray-900">{employerContacts || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Partner Rate</span>
                <span className="font-semibold text-gray-900">
                  {totalContacts && totalContacts > 0 
                    ? ((employerContacts || 0) / totalContacts * 100).toFixed(0) 
                    : 0}%
                </span>
              </div>
            </div>
            <Link href="/admin/crm/contacts" className="block mt-4 text-sm text-brand-blue-600 hover:text-brand-blue-700">
              View all contacts →
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/admin/leads"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-brand-blue-300 transition-colors"
            >
              <Users className="w-5 h-5 text-brand-blue-600" />
              <span className="font-medium text-gray-900">Leads</span>
            </Link>
            <Link 
              href="/admin/campaigns"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-brand-blue-300 transition-colors"
            >
              <Award className="w-5 h-5 text-brand-green-600" />
              <span className="font-medium text-gray-900">Campaigns</span>
            </Link>
            <Link 
              href="/admin/course-builder"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-brand-blue-300 transition-colors"
            >
              <BookOpen className="w-5 h-5 text-brand-blue-600" />
              <span className="font-medium text-gray-900">Courses</span>
            </Link>
            <Link 
              href="/admin/wotc"
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-brand-blue-300 transition-colors"
            >
              <DollarSign className="w-5 h-5 text-brand-orange-600" />
              <span className="font-medium text-gray-900">WOTC</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
