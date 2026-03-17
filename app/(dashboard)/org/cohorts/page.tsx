import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org/getOrgContext';
import { getOrgCohorts } from '@/lib/lms/engine/org-scope';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cohorts | Organization',
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  upcoming:  'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-700',
  archived:  'bg-yellow-100 text-yellow-800',
};

export default async function OrgCohortsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/org/cohorts');

  let ctx;
  try {
    ctx = await getOrgContext(supabase, user.id);
  } catch {
    redirect('/org/create');
  }

  const cohorts = await getOrgCohorts(ctx.organization_id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cohorts</h1>
          <p className="mt-1 text-sm text-gray-500">{ctx.organization.name}</p>
        </div>
      </div>

      {cohorts.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">No cohorts found for this organization.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Learners</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Delivery</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cohorts.map((cohort) => (
                <tr key={cohort.cohortId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{cohort.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[cohort.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {cohort.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{cohort.enrolledCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {cohort.startDate ? new Date(cohort.startDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{cohort.deliveryMode ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/org/cohorts/${cohort.cohortId}`}
                      className="text-xs text-brand-blue-600 hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
