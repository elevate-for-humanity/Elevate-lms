import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { requireAdmin } from '@/lib/authGuards';
import { supabaseServer } from '@/lib/supabase-server';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { BarChart, DollarSign, Gift } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cash Advances Admin | Elevate For Humanity',
  description: 'Admin dashboard',
};

export default async function CashAdvancesAdminPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Cash Advances" }]} />
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

  await requireAdmin();

  // Fetch applications
  const { data: applications, error } = await supabase
    .from('cash_advance_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  // Calculate stats
  const stats = {
    total: applications?.length || 0,
    pending: applications?.filter((a) => a.status === 'pending').length || 0,
    approved: applications?.filter((a) => a.status === 'approved').length || 0,
    funded: applications?.filter((a) => a.status === 'funded').length || 0,
    denied: applications?.filter((a) => a.status === 'denied').length || 0,
    totalAmount:
      applications?.reduce((sum, a) => sum + (a.requested_amount || 0), 0) || 0,
    approvedAmount:
      applications
        ?.filter((a) => a.status === 'approved' || a.status === 'funded')
        .reduce((sum, a) => sum + (a.approved_amount || 0), 0) || 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">
          Cash Advance Management
        </h1>
        <p className="text-black">
          Manage Supersonic Cash advance applications and approvals
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-black mb-1">
            Total Applications
          </div>
          <div className="text-3xl font-bold text-black">{stats.total}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-black mb-1">
            Pending Review
          </div>
          <div className="text-3xl font-bold text-brand-orange-600">
            {stats.pending}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-black mb-1">
            Approved
          </div>
          <div className="text-3xl font-bold text-brand-green-600">
            {stats.approved}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-black mb-1">
            Total Funded
          </div>
          <div className="text-3xl font-bold text-brand-blue-600">
            ${stats.approvedAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/cash-advances/pending"
            className="px-4 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700 transition"
          >
            Review Pending ({stats.pending})
          </Link>
          <Link
            href="/admin/cash-advances/reports"
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
          >
            View Reports
          </Link>
          <Link
            href="/admin/cash-advances/settings"
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Underwriting Settings
          </Link>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold">Recent Applications</h2>
        </div>

        {error && (
          <div className="p-6 text-brand-orange-600">
            Error loading applications: {error.message}
          </div>
        )}

        {!error && applications && applications.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No applications yet
          </div>
        )}

        {!error && applications && applications.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Income
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-black">
                        ${app.requested_amount?.toLocaleString()}
                      </div>
                      {app.approved_amount && (
                        <div className="text-xs text-brand-green-600">
                          Approved: ${app.approved_amount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      ${app.monthly_income?.toLocaleString()}/mo
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          app.status === 'approved'
                            ? 'bg-brand-green-100 text-green-800'
                            : app.status === 'pending'
                              ? 'bg-orange-100 text-orange-800'
                              : app.status === 'denied'
                                ? 'bg-red-100 text-red-800'
                                : app.status === 'funded'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-black'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/cash-advances/applications/${app.id}`}
                        className="text-brand-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                      {app.status === 'pending' && (
                        <>
                          <button className="text-brand-green-600 hover:text-green-900 mr-4" aria-label="Action button">
                            Approve
                          </button>
                          <button className="text-brand-orange-600 hover:text-red-900" aria-label="Action button">
                            Deny
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EPS Financial Partnership Status */}
      <div className="mt-8    text-white rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold mb-2">
              🏦 EPS Financial Partnership
            </h3>
            <p className="text-blue-100 mb-1">
              Powered by Pathward®, N.A. | www.epstax.net
            </p>
            <p className="text-sm text-blue-200">
              Industry-leading refund advances and cash advance solutions
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">44,000+</div>
            <div className="text-sm text-blue-200">Tax Offices Enrolled</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <h4 className="font-semibold mb-2">
              <DollarSign className="w-5 h-5 inline-block" /> E-Advance
            </h4>
            <p className="text-sm text-blue-100">
              No cost taxpayer advance loan program with no in-season marketing
              fees
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <h4 className="font-semibold mb-2">
              <BarChart className="w-5 h-5 inline-block" /> E-Collect
            </h4>
            <p className="text-sm text-blue-100">
              Simple, low-cost ($20) refund transfer program
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <h4 className="font-semibold mb-2">
              <Gift className="w-5 h-5 inline-block" /> E-Bonus
            </h4>
            <p className="text-sm text-blue-100">
              High incentive refund transfer - earn up to $20 more per return
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/20">
          <h4 className="font-semibold mb-3">Setup Requirements:</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm">EPS Financial API Credentials</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm">EPS Merchant/Office ID</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm">Pathward Bank Integration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm">FasterMoney® Visa® Card Setup</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <a
            href="https://www.epstax.net/getstarted/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white text-brand-blue-600 rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            Enroll with EPS
          </a>
          <a
            href="https://www.epstax.net/contact/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white/10 backdrop-blur border border-white/30 rounded-lg hover:bg-white/20 transition"
          >
            Contact Support: 888-782-0850
          </a>
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
                  workforce for the first time, we're here to help you succeed.
                  Our programs are Funded, government-funded, and designed to
                  get you hired fast.
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
                <Image
                  priority
                  src="/images/business/team-3.jpg"
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
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg mb-8 text-blue-100">
              Call (317) 314-3757 or apply online for a better career today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-600 border-2 border-white text-lg"
              >
                View Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
