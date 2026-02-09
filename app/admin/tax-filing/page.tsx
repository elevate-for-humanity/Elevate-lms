// app/admin/tax-filing/page.tsx
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { supabaseServer } from '@/lib/supabase-server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/tax-filing',
  },
  title: 'Tax Filing Management | Admin',
  description: 'Manage tax filing applications and preparers',
};

export default async function TaxFilingAdminPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Tax Filing" }]} />
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

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const { data: items, count: totalItems } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  const { count: activeItems } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Fetch applications
  const { data: applications, error } = await supabase
    .from('tax_filing_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  // Fetch preparers
  const { data: preparers } = await supabase
    .from('tax_preparers')
    .select('*')
    .order('created_at', { ascending: false });

  // Calculate stats
  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter((a) => a.status === 'pending').length || 0,
    inProgress:
      applications?.filter((a) => a.status === 'in_progress').length || 0,
    filed: applications?.filter((a) => a.status === 'filed').length || 0,
    completed:
      applications?.filter((a) => a.status === 'completed').length || 0,
    totalPreparers: preparers?.length || 0,
    activePreparers:
      preparers?.filter((p) => p.status === 'active').length || 0,
    totalRevenue:
      applications
        ?.filter((a) => a.status === 'completed')
        .reduce((sum, a) => sum + (a.fee_amount || 0), 0) || 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">
          Tax Filing Management
        </h1>
        <p className="text-black">
          Manage tax return applications, preparers, and tax software
          integration
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-black mb-1">
            Total Returns
          </div>
          <div className="text-3xl font-bold text-black">{stats.total}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-black mb-1">
            Pending Assignment
          </div>
          <div className="text-3xl font-bold text-brand-orange-600">
            {stats.pending}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-black mb-1">
            Active Preparers
          </div>
          <div className="text-3xl font-bold text-brand-green-600">
            {stats.activePreparers}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-black mb-1">
            Total Revenue
          </div>
          <div className="text-3xl font-bold text-brand-blue-600">
            ${stats.totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/tax-filing/applications"
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
          >
            View All Applications
          </Link>
          <Link
            href="/admin/tax-filing/preparers"
            className="px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Manage Preparers ({stats.totalPreparers})
          </Link>
          <Link
            href="/admin/tax-filing/training"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Training Management
          </Link>
          <Link
            href="/admin/tax-filing/reports"
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Reports & Analytics
          </Link>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold">Recent Tax Returns</h2>
        </div>

        {error && (
          <div className="p-6 text-brand-orange-600">
            Error loading applications: {error.message}
          </div>
        )}

        {!error && applications && applications.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No tax filing applications yet
          </div>
        )}

        {!error && applications && applications.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tax Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Preparer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black">
                        {app.first_name} {app.last_name}
                      </div>
                      <div className="text-sm text-slate-500">{app.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {app.tax_year || '2024'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {app.preparer_id ? (
                        <span className="text-brand-green-600">Assigned</span>
                      ) : (
                        <span className="text-brand-orange-600">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          app.status === 'completed'
                            ? 'bg-brand-green-100 text-green-800'
                            : app.status === 'filed'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : app.status === 'pending'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-slate-100 text-black'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      ${app.fee_amount?.toLocaleString() || '100'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/tax-filing/applications/${app.id}`}
                        className="text-brand-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                      {app.status === 'pending' && (
                        <button className="text-brand-green-600 hover:text-green-900" aria-label="Action button">
                          Assign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tax Software Integration Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          📋 Tax Software Integration
        </h3>
        <p className="text-blue-800 mb-4">
          Professional tax preparation powered by professional tax software.
          Industry-leading tax software with IRS e-file integration.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Features:</h4>
            <ul className="list-disc list-inside text-sm text-blue-700">
              <li>professional tax software integration</li>
              <li>All IRS forms supported</li>
              <li>Automatic calculations</li>
              <li>Direct IRS e-file</li>
              <li>Error checking</li>
              <li>State returns</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">
              Setup Required:
            </h4>
            <ul className="list-disc list-inside text-sm text-blue-700">
              <li>professional tax software license</li>
              <li>tax software API credentials</li>
              <li>IRS EFIN (E-File ID Number)</li>
              <li>IRS ETIN (Transmitter ID)</li>
              <li>Tax Office ID</li>
              <li>Tax Preparer ID</li>
            </ul>
          </div>
        </div>

        {/* Storytelling Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                    Your Journey Starts Here
                  </h2>
                  <p className="text-lg text-black mb-6 leading-relaxed">
                    Every great career begins with a single step. Whether you're
                    looking to change careers, upgrade your skills, or enter the
                    workforce for the first time, we're here to help you
                    succeed. Our programs are Funded, government-funded, and
                    designed to get you hired fast.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Funded training - no tuition, no hidden costs
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Industry-recognized certifications that employers value
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Job placement assistance and career support
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Flexible scheduling for working adults
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image priority
                    src="/images/success-new/success-3.jpg"
                    alt="Students learning"
                    fill
                    className="object-cover"
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16    text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Ready to Improve Your Career?
              </h2>
              <p className="text-base md:text-lg mb-8 text-blue-100">
                Join thousands who have launched successful careers through our
                free training programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-white text-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                  Apply Now - It's Free
                </Link>
                <Link
                  href="/programs"
                  className="bg-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                  Browse All Programs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
