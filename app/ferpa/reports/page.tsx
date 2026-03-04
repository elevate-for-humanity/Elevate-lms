import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  BarChart3,
  Download,
  Calendar,
  FileText,
  TrendingUp,
  Users,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reports | FERPA Portal',
  description: 'Generate FERPA compliance and audit reports.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function FerpaReportsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/ferpa/reports');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['admin', 'super_admin', 'ferpa_officer'];
  if (!profile || !allowedRoles.includes(profile.role)) redirect('/unauthorized');

  // Get report data
  const { count: totalRequests } = await db
    .from('ferpa_access_requests')
    .select('*', { count: 'exact', head: true });

  const { count: completedRequests } = await db
    .from('ferpa_access_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const { count: auditLogEntries } = await db
    .from('ferpa_audit_log')
    .select('*', { count: 'exact', head: true });

  const reportTypes = [
    {
      id: 'access-log',
      name: 'Access Log Report',
      description: 'Detailed log of all student record access',
      icon: FileText,
      color: 'blue',
    },
    {
      id: 'disclosure',
      name: 'Disclosure Report',
      description: 'Summary of all third-party disclosures',
      icon: Users,
      color: 'green',
    },
    {
      id: 'request-summary',
      name: 'Request Summary',
      description: 'Overview of access requests by type and status',
      icon: BarChart3,
      color: 'blue',
    },
    {
      id: 'training',
      name: 'Training Compliance',
      description: 'Staff FERPA training completion status',
      icon: TrendingUp,
      color: 'orange',
    },
    {
      id: 'response-time',
      name: 'Response Time Analysis',
      description: 'Average response times for requests',
      icon: Clock,
      color: 'red',
    },
    {
      id: 'annual',
      name: 'Annual Compliance Report',
      description: 'Comprehensive yearly compliance summary',
      icon: Calendar,
      color: 'indigo',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/ferpa-page-9.jpg" alt="FERPA compliance" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/ferpa" className="hover:text-gray-700">FERPA Portal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Reports</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Generate compliance and audit reports</p>
            </div>
            <Link
              href="/ferpa/reports/generate"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <BarChart3 className="w-4 h-4" />
              Custom Report
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Total Requests</p>
            <p className="text-3xl font-bold text-gray-900">{totalRequests || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-3xl font-bold text-brand-green-600">{completedRequests || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Audit Log Entries</p>
            <p className="text-3xl font-bold text-gray-900">{auditLogEntries || 0}</p>
          </div>
        </div>

        {/* Report Types */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Available Reports</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              const colorClasses: Record<string, string> = {
                blue: 'bg-brand-blue-100 text-brand-blue-600',
                green: 'bg-brand-green-100 text-brand-green-600',
                blue: 'bg-brand-blue-100 text-brand-blue-600',
                orange: 'bg-brand-orange-100 text-brand-orange-600',
                red: 'bg-brand-red-100 text-brand-red-600',
                indigo: 'bg-indigo-100 text-indigo-600',
              };

              return (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[report.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">{report.description}</p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/ferpa/reports/generate?type=${report.id}`}
                      className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                    >
                      Generate
                    </Link>
                    <span className="text-gray-300">|</span>
                    <button className="text-sm text-gray-600 hover:text-gray-900 font-medium inline-flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      Export
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recently Generated</h2>
          </div>
          <div className="p-6 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No reports generated yet</p>
            <p className="text-sm mt-1">Generated reports will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
