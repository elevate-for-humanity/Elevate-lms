import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Tax Filing Applications | Admin | Elevate For Humanity',
  description: 'Manage tax filing applications and client intake.',
};

export default async function TaxFilingApplicationsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch tax applications
  const { data: applications } = await supabase
    .from('tax_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const { count: pendingCount } = await supabase
    .from('tax_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: completedCount } = await supabase
    .from('tax_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/tax-filing"
            className="text-brand-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Tax Filing
          </Link>
          <h1 className="text-3xl font-bold text-black">
            Tax Filing Applications
          </h1>
          <p className="mt-2 text-black">
            Manage client tax filing applications and intake process.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-blue-600">
              {applications?.length || 0}
            </div>
            <div className="text-black text-sm">Total Applications</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-orange-600">
              {pendingCount || 0}
            </div>
            <div className="text-black text-sm">Pending Review</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-green-600">
              {completedCount || 0}
            </div>
            <div className="text-black text-sm">Completed</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Link
              href="/admin/tax-filing/applications/new"
              aria-label="Link"
              className="block"
            >
              <div className="text-lg font-bold text-blue-600">+ New</div>
              <div className="text-black text-sm">Add Application</div>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="search"
              placeholder="Search by name or email..."
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <select className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="">All Tax Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
            <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700" aria-label="Action button">
              Apply Filters
            </button>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black">
              Recent Applications
            </h2>
            <Link
              href="/admin/tax-filing/applications/new"
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700 text-sm"
            >
              + New Application
            </Link>
          </div>

          {applications && applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Tax Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-black">
                          {item.client_name || 'N/A'}
                        </div>
                        <div className="text-sm text-black">
                          {item.client_email || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {item.tax_year || '2024'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === 'completed'
                              ? 'bg-brand-green-100 text-green-800'
                              : item.status === 'pending'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/tax-filing/applications/${item.id}`}
                          className="text-brand-blue-600 hover:text-blue-900"
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
            <div className="px-6 py-12 text-center text-black">
              No tax filing applications yet. Create your first application
              above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
