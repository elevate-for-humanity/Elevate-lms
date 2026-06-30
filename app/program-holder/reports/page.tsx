import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText,
  AlertCircle,
  Plus,
  Download,
  Calendar,
} from 'lucide-react';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reports | Program Holder Portal',
  description: 'Submit and manage compliance reports',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/reports',
  },
};

export default async function ReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['program_holder','admin','super_admin','staff'].includes(profile.role)) redirect('/login');

  // Get program holder record via profiles.program_holder_id
  const holderId = profile.program_holder_id;
  if (!holderId) redirect('/program-holder/onboarding');

  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('id')
    .eq('id', holderId)
    .maybeSingle();

  if (!programHolder) redirect('/program-holder/onboarding');

  // Fetch reports from program_holder_reports (generic) with fallback to apprentice_weekly_reports
  const { data: phReports, count: phCount } = await supabase
    .from('program_holder_reports')
    .select('*', { count: 'exact' })
    .eq('program_holder_id', programHolder.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fallback: if no generic reports exist, pull from apprentice_weekly_reports
  let reports = phReports;
  let totalReports = phCount;
  if (!reports || reports.length === 0) {
    const { data: weeklyReports, count: weeklyCount } = await supabase
      .from('apprentice_weekly_reports')
      .select('id, week_ending, hours_worked, status, submitted_at, created_at', { count: 'exact' })
      .eq('program_holder_id', programHolder.id)
      .order('week_ending', { ascending: false })
      .limit(50);
    reports = (weeklyReports ?? []).map((r: any) => ({
      id: r.id,
      title: `Week ending ${new Date(r.week_ending).toLocaleDateString()}`,
      status: r.status,
      created_at: r.submitted_at || r.created_at,
      hours_worked: r.hours_worked,
      report_type: 'weekly',
    }));
    totalReports = weeklyCount;
  }

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyReports = (reports ?? []).filter((r: any) => {
    const d = new Date(r.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const pendingReports = (reports ?? []).filter((r: any) => r.status === 'pending');
  const approvedReports = (reports ?? []).filter((r: any) => r.status === 'approved');

  return (
    <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Reports" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/program-holder-page-4.webp"
          alt="Reports"
          fill
          className="object-cover"
          quality={90}
          priority
          sizes="100vw" placeholder="empty"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="text-sm font-medium text-black">
                    Total Reports
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {totalReports || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-11 w-11 text-brand-green-600" />
                  <h3 className="text-sm font-medium text-black">
                    This Month
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-green-600">
                  {monthlyReports.length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="h-11 w-11 text-yellow-600" />
                  <h3 className="text-sm font-medium text-black">Pending</h3>
                </div>
                <p className="text-3xl font-bold text-yellow-600">
                  {pendingReports.length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Download className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="text-sm font-medium text-black">
                    Approved
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {approvedReports.length}
                </p>
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-black">
                  Recent Reports
                </h2>
                <Link
                  href="/program-holder/reports/new"
                  className="inline-flex items-center px-4 py-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Report
                </Link>
              </div>

              {reports && reports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Week Ending
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Hours
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Submitted
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reports ?? []).map((report: any) => (
                        <tr
                          key={report.id}
                          className="border-b hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-black">
                            {report.title || new Date(report.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-black">
                            {report.hours_worked != null ? `${report.hours_worked} hrs` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                report.status === 'approved'
                                  ? 'bg-brand-green-100 text-brand-green-800'
                                  : report.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-slate-100 text-slate-900'
                              }`}
                            >
                              {report.status || 'submitted'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-black">
                            {report.created_at ? new Date(report.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/program-holder/reports/${report.id}`}
                              className="text-brand-blue-600 hover:text-brand-blue-700 font-medium text-sm"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-black mb-2">
                    No Reports Yet
                  </h3>
                  <p className="text-black mb-6">
                    You haven't submitted any reports yet.
                  </p>
                  <Link
                    href="/program-holder/reports/new"
                    className="inline-flex items-center px-6 py-3 bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Submit Your First Report
                  </Link>
                </div>
              )}

              <div className="mt-6 flex justify-between items-center">
                <Link
                  href="/program-holder/dashboard"
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
