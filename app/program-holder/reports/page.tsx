import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText,
  AlertCircle,
  Phone,
  Mail,
  Plus,
  Download,
  Calendar,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reports | Program Holder Portal',
  description: 'Submit and manage compliance reports',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/reports',
  },
};

export default async function ReportsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Reports" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'program_holder') redirect('/');

  // Get program holder record
  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!programHolder) {
    redirect('/program-holder/apply');
  }

  // Fetch compliance reports (using apprentice_weekly_reports as template)
  const { data: reports, count: totalReports } = await supabase
    .from('apprentice_weekly_reports')
    .select('*', { count: 'exact' })
    .eq('program_holder_id', programHolder.id)
    .order('week_ending', { ascending: false })
    .limit(50);

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyReports =
    reports?.filter((r) => {
      const reportDate = new Date(r.week_ending);
      return (
        reportDate.getMonth() === currentMonth &&
        reportDate.getFullYear() === currentYear
      );
    }) || [];

  const pendingReports = reports?.filter((r) => r.status === 'pending') || [];
  const approvedReports = reports?.filter((r) => r.status === 'approved') || [];

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Reports" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/hero-training.jpg"
          alt="Reports"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Compliance Reports
          </h1>
          <p className="text-lg text-gray-100">
            Submit and track your compliance reports
          </p>
        </div>
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
                      {reports.map((report) => (
                        <tr
                          key={report.id}
                          className="border-b hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-black">
                            {new Date(report.week_ending).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-black">
                            {report.hours_worked || 0} hrs
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-2 text-xs rounded ${
                                report.status === 'approved'
                                  ? 'bg-brand-green-100 text-brand-green-800'
                                  : report.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-black'
                              }`}
                            >
                              {report.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-black">
                            {new Date(report.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <button className="text-brand-blue-600 hover:text-brand-blue-700 font-medium text-sm" aria-label="Action button">
                              View
                            </button>
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
