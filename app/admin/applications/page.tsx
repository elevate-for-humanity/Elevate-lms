import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FollowUpBlastButton } from '@/components/admin/FollowUpBlastButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/applications',
  },
  title: 'Applications | Elevate For Humanity',
  description: 'Manage all applications',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  in_review: 'In Review',
  enrolled: 'Enrolled',
  waitlisted: 'Waitlisted',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-brand-blue-100 text-brand-blue-800',
  approved: 'bg-brand-green-100 text-brand-green-800',
  rejected: 'bg-brand-red-100 text-brand-red-800',
  in_review: 'bg-brand-blue-100 text-brand-blue-800',
  enrolled: 'bg-emerald-100 text-emerald-800',
  waitlisted: 'bg-purple-100 text-purple-800',
};

interface ApplicationRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  zip: string | null;
  program_interest: string | null;
  support_notes: string | null;
  status: string;
  source: string | null;
  created_at: string;
  updated_at: string | null;
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();


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

  // Query the applications table (where the public form inserts)
  let query = supabase
    .from('applications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  const statusFilter = params.status;
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const search = params.search;
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const page = parseInt(params.page || '1', 10);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data: applications, count: totalCount, error } = await query;

  // Status counts
  const { data: allApps } = await supabase
    .from('applications')
    .select('status');

  const statusCounts: Record<string, number> = {};
  let totalApplications = 0;
  allApps?.forEach((app: { status: string }) => {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    totalApplications++;
  });

  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}

      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Applications" }]} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Applications</h1>
          <div className="flex gap-3">
            <FollowUpBlastButton pendingCount={(statusCounts['pending'] || 0) + (statusCounts['submitted'] || 0) + (statusCounts['in_review'] || 0)} />
            <Link
              href="/admin/dashboard"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Total</h3>
            <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Pending</h3>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts['pending'] || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase">In Review</h3>
            <p className="text-2xl font-bold text-brand-blue-600">{statusCounts['in_review'] || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Approved</h3>
            <p className="text-2xl font-bold text-brand-green-600">{statusCounts['approved'] || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Rejected</h3>
            <p className="text-2xl font-bold text-brand-red-600">{statusCounts['rejected'] || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <form method="GET" className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={statusFilter || 'all'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="enrolled">Enrolled</option>
              </select>
            </div>
            <div className="w-64">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={search || ''}
                placeholder="Name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Filter
            </button>
            <Link
              href="/admin/applications"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </Link>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-brand-red-600">
              Error loading applications. Check that the applications table exists in Supabase.
            </div>
          ) : applications && applications.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(applications as ApplicationRow[]).map((app) => {
                      const displayName =
                        [app.first_name, app.last_name].filter(Boolean).join(' ') ||
                        app.full_name ||
                        'Unknown';

                      return (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{displayName}</div>
                            {app.city && (
                              <div className="text-sm text-gray-500">
                                {app.city}
                                {app.zip ? `, ${app.zip}` : ''}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{app.email || 'N/A'}</div>
                            {app.phone && <div className="text-sm text-gray-500">{app.phone}</div>}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {app.program_interest || 'Not specified'}
                            </span>
                            {app.source && (
                              <div className="text-xs text-gray-400">
                                {app.source.replace(/-/g, ' ')}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[app.status] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {statusLabels[app.status] || app.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(app.created_at).toLocaleDateString('en-US')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <Link
                              href={`/admin/applications/review/${app.id}`}
                              className="text-brand-blue-600 hover:text-brand-blue-800 text-sm font-medium"
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {offset + 1} to {Math.min(offset + pageSize, totalCount || 0)} of{' '}
                    {totalCount} applications
                  </div>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link
                        href={`/admin/applications?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ''}${search ? `&search=${search}` : ''}`}
                        className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                      >
                        Previous
                      </Link>
                    )}
                    <span className="px-3 py-1 text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link
                        href={`/admin/applications?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ''}${search ? `&search=${search}` : ''}`}
                        className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No applications found
              {statusFilter && statusFilter !== 'all' ? ' matching your filters' : ''}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
