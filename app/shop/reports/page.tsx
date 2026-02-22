import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, Calendar, Users, Clock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Reports | Shop | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ShopReportsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    redirect('/login?redirect=/shop/reports');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/shop/reports');
  }

  // Get shops this user is staff at
  const { data: staffRecords } = await db
    .from('shop_staff')
    .select('shop_id')
    .eq('user_id', user.id);

  const shopIds = (staffRecords || []).map(s => s.shop_id);

  // Get placements for those shops
  let reports: Array<{
    id: string;
    student_name: string;
    report_type: string;
    period: string;
    hours: number;
    status: string;
    created_at: string;
  }> = [];

  if (shopIds.length > 0) {
    const { data: placements } = await db
      .from('apprentice_placements')
      .select('id')
      .in('shop_id', shopIds);

    const placementIds = (placements || []).map(p => p.id);

    if (placementIds.length > 0) {
      const { data: weeklyReports } = await db
        .from('apprentice_weekly_reports')
        .select('id, placement_id, week_start, week_end, hours_total, status, created_at')
        .in('placement_id', placementIds)
        .order('created_at', { ascending: false })
        .limit(100);

      reports = (weeklyReports || []).map(r => ({
        id: r.id,
        student_name: `Placement ${r.placement_id?.slice(0, 8) || 'N/A'}`,
        report_type: 'weekly',
        period: `${new Date(r.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(r.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        hours: r.hours_total || 0,
        status: r.status || 'submitted',
        created_at: r.created_at,
      }));
    }
  }

  const totalHours = reports.reduce((sum, r) => sum + r.hours, 0);
  const thisMonth = reports.filter(r => {
    const date = new Date(r.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: 'Reports' }]} />
        </div>
      </div>

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/shop/dashboard" className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block">
              &larr; Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-8 h-8 text-brand-blue-600" />
                  <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                </div>
                <p className="text-gray-600">View and download student progress reports</p>
              </div>
              <Link href="/shop/reports/new" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 font-medium">
                + New Report
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-brand-blue-600" />
                <h3 className="text-sm font-medium text-gray-700">Total Reports</h3>
              </div>
              <p className="text-3xl font-bold text-brand-blue-600">{reports.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-brand-green-600" />
                <h3 className="text-sm font-medium text-gray-700">Placements</h3>
              </div>
              <p className="text-3xl font-bold text-brand-green-600">
                {new Set(reports.map(r => r.student_name)).size}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-brand-blue-600" />
                <h3 className="text-sm font-medium text-gray-700">Total Hours</h3>
              </div>
              <p className="text-3xl font-bold text-brand-blue-600">{totalHours}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-6 h-6 text-brand-orange-600" />
                <h3 className="text-sm font-medium text-gray-700">This Month</h3>
              </div>
              <p className="text-3xl font-bold text-brand-orange-600">{thisMonth}</p>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-900 text-lg">No reports found</p>
                <p className="text-gray-600 text-sm mt-2">Create your first report to get started</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{report.student_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded bg-brand-blue-100 text-brand-blue-800">
                          {report.report_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.period}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.hours} hrs</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          report.status === 'approved' ? 'bg-brand-green-100 text-brand-green-800' :
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
