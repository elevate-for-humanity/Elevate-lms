import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BarChart3, FileText, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/reports' },
  title: 'Reports Dashboard | Elevate For Humanity',
  description: 'Access reports and analytics for your programs.',
};

export default async function ReportsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/reports');

  const { data: reports } = await db
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Reports' }]} />
      </div>

      {/* Header */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-2">
            <BarChart3 className="w-8 h-8 text-brand-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
          </div>
          <p className="text-gray-600 ml-12">View and download reports for your programs and students.</p>
        </div>
      </section>

      {/* Reports List */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {reports && reports.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-white border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Report</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 hidden md:table-cell">Type</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700 hidden md:table-cell">Date</th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((report: any) => (
                    <tr key={report.id} className="hover:bg-white">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">{report.title || report.name || 'Untitled Report'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm hidden md:table-cell">{report.type || 'General'}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm hidden md:table-cell">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium inline-flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
              <p className="text-gray-600 mb-6">Reports will appear here as your programs generate data.</p>
              <Link
                href="/learner/dashboard"
                className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
