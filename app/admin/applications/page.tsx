import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/applications',
  },
  title: 'Applications | Elevate For Humanity',
  description: 'Manage all applications',
};

interface QueueApplication {
  application_type: string;
  application_id: string;
  created_at: string;
  state: string;
  state_updated_at: string;
  intake: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    [key: string]: unknown;
  };
}

const stateLabels: Record<string, string> = {
  started: 'Started',
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  in_review: 'In Review',
  eligibility_complete: 'Eligibility Complete',
  documents_complete: 'Documents Complete',
  review_ready: 'Ready for Review',
};

const stateColors: Record<string, string> = {
  started: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  in_review: 'bg-blue-100 text-blue-800',
  eligibility_complete: 'bg-blue-100 text-blue-800',
  documents_complete: 'bg-indigo-100 text-indigo-800',
  review_ready: 'bg-yellow-100 text-yellow-800',
};

const typeLabels: Record<string, string> = {
  student: 'Student',
  partner: 'Partner',
  employer: 'Employer',
};

const typeColors: Record<string, string> = {
  student: 'bg-blue-50 text-blue-700 border-blue-200',
  partner: 'bg-green-50 text-green-700 border-green-200',
  employer: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; type?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Applications" }]} />
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

  // Build query for admin_applications_queue view
  let query = supabase
    .from('admin_applications_queue')
    .select('application_type, application_id, created_at, state, state_updated_at, intake', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Filter by state if provided
  const stateFilter = params.state;
  if (stateFilter && stateFilter !== 'all') {
    query = query.eq('state', stateFilter);
  }

  // Filter by type if provided
  const typeFilter = params.type;
  if (typeFilter && typeFilter !== 'all') {
    query = query.eq('application_type', typeFilter);
  }

  // Pagination
  const page = parseInt(params.page || '1', 10);
  const pageSize = 25;
  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);

  const { data: applications, count: totalCount, error } = await query;

  // Get counts by state
  const { data: allApps } = await supabase
    .from('admin_applications_queue')
    .select('state, application_type');
  
  const stateCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  allApps?.forEach((app: { state: string; application_type: string }) => {
    stateCounts[app.state] = (stateCounts[app.state] || 0) + 1;
    typeCounts[app.application_type] = (typeCounts[app.application_type] || 0) + 1;
  });

  const totalApplications = allApps?.length || 0;
  const totalPages = Math.ceil((totalCount || 0) / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Applications" }]} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Applications</h1>
          <Link
            href="/admin/dashboard"
            className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Total</h3>
            <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
          </div>
          {['student', 'partner', 'employer'].map((type) => (
            <div key={type} className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase">{typeLabels[type] || type}</h3>
              <p className="text-2xl font-bold text-gray-900">{typeCounts[type] || 0}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <form method="GET" className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type"
                name="type"
                defaultValue={typeFilter || 'all'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                <option value="all">All Types</option>
                <option value="student">Student</option>
                <option value="partner">Partner</option>
                <option value="employer">Employer</option>
              </select>
            </div>
            <div className="w-48">
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                id="state"
                name="state"
                defaultValue={stateFilter || 'all'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                <option value="all">All States</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
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

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-red-600">
              Error loading applications: {error.message}
            </div>
          ) : applications && applications.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        State
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications.map((app: QueueApplication) => {
                      const intake = app.intake || {};
                      const firstName = intake.first_name || '';
                      const lastName = intake.last_name || '';
                      const email = intake.email || '';
                      const displayName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown';
                      
                      return (
                        <tr key={`${app.application_type}-${app.application_id}`} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${typeColors[app.application_type] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                              {typeLabels[app.application_type] || app.application_type}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{displayName}</div>
                            {intake.phone && (
                              <div className="text-sm text-gray-500">{intake.phone}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {email || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stateColors[app.state] || 'bg-gray-100 text-gray-800'}`}>
                              {stateLabels[app.state] || app.state}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(app.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {app.state_updated_at ? new Date(app.state_updated_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <Link
                              href={`/admin/applications/${app.application_type}/${app.application_id}`}
                              className="text-brand-blue-600 hover:text-brand-blue-800 text-sm font-medium"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {offset + 1} to {Math.min(offset + pageSize, totalCount || 0)} of {totalCount} applications
                  </div>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link
                        href={`/admin/applications?page=${page - 1}${stateFilter ? `&state=${stateFilter}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}`}
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
                        href={`/admin/applications?page=${page + 1}${stateFilter ? `&state=${stateFilter}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}`}
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
              No applications found{stateFilter || typeFilter ? ' matching your filters' : ''}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
