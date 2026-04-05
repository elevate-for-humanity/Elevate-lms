import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AdminReportingDashboard } from '@/components/AdminReportingDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/reporting' },
  title: 'Reporting Center | Elevate For Humanity',
  description: 'Generate and view reports.',
};

export default async function ReportingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const reportTypes = [
    { name: 'Enrollment Report', description: 'Participant enrollment data', href: '/admin/reports/enrollment' },
    { name: 'Completion Report', description: 'Course completion metrics', href: '/admin/reports/completion' },
    { name: 'Outcome Report', description: 'Employment and credential outcomes', href: '/admin/reports/outcomes' },
    { name: 'Financial Report', description: 'Funding and expenditure data', href: '/admin/reports/financial' },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Reporting</li></ol></nav>
        </div>
        
        {/* Full Reporting Dashboard */}
        <AdminReportingDashboard />
        
        {/* Quick Links to Specific Reports */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Detailed Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTypes.map((report) => (
              <Link key={report.href} href={report.href} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md">
                <h3 className="font-semibold mb-2">{report.name}</h3>
                <p className="text-sm text-gray-500">{report.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
