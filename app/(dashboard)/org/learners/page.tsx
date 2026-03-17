import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org/getOrgContext';
import { getOrgLearners } from '@/lib/lms/engine/org-scope';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Learners | Organization',
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  withdrawn: 'bg-red-100 text-red-800',
};

export default async function OrgLearnersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/org/learners');

  let ctx;
  try {
    ctx = await getOrgContext(supabase, user.id);
  } catch {
    redirect('/org/create');
  }

  const learners = await getOrgLearners(ctx.organization_id);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Learners</h1>
          <p className="mt-1 text-sm text-gray-500">
            {ctx.organization.name} &middot; {learners.length} learner{learners.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {learners.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">No learners enrolled yet.</p>
          <Link href="/org/invites" className="mt-3 inline-block text-sm text-brand-blue-600 hover:underline">
            Send invitations →
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cohort</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {learners.map((learner) => (
                <tr key={`${learner.userId}-${learner.cohortId}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{learner.fullName ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{learner.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <Link href={`/org/cohorts/${learner.cohortId}`} className="hover:underline text-brand-blue-600">
                      {learner.cohortName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[learner.enrollmentStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                      {learner.enrollmentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(learner.enrolledAt).toLocaleDateString()}
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
