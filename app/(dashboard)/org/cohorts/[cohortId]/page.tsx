import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrgContext } from '@/lib/org/getOrgContext';
import { getOrgLearners, getOrgProgress } from '@/lib/lms/engine/org-scope';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ cohortId: string }>;
}

export default async function OrgCohortDetailPage({ params }: Props) {
  const { cohortId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/org/cohorts');

  let ctx;
  try {
    ctx = await getOrgContext(supabase, user.id);
  } catch {
    redirect('/org/create');
  }

  const db = createAdminClient();
  if (!db) return <p className="p-8 text-sm text-gray-500">Service unavailable.</p>;

  // Verify cohort belongs to this org
  const { data: cohort } = await supabase
    .from('cohorts')
    .select('id, name, status, start_date, end_date, delivery_mode')
    .eq('id', cohortId)
    .eq('organization_id', ctx.organization_id)
    .maybeSingle();

  if (!cohort) notFound();

  const [learners, summary] = await Promise.all([
    getOrgLearners(ctx.organization_id, cohortId),
    getOrgProgress({ organizationId: ctx.organization_id, cohortId }),
  ]);

  const enrollmentBadge = (status: string) => {
    if (status === 'active')    return 'bg-green-100 text-green-800';
    if (status === 'completed') return 'bg-blue-100 text-blue-800';
    if (status === 'withdrawn') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/org/cohorts" className="hover:underline">Cohorts</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{cohort.name}</span>
      </nav>

      <h1 className="text-2xl font-semibold text-gray-900">{cohort.name}</h1>

      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
        <span>Status: <strong className="text-gray-800">{cohort.status}</strong></span>
        {cohort.start_date && (
          <span>Start: <strong className="text-gray-800">{new Date(cohort.start_date).toLocaleDateString()}</strong></span>
        )}
        {cohort.end_date && (
          <span>End: <strong className="text-gray-800">{new Date(cohort.end_date).toLocaleDateString()}</strong></span>
        )}
        {cohort.delivery_mode && (
          <span>Delivery: <strong className="text-gray-800">{cohort.delivery_mode}</strong></span>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Enrolled',      value: summary.totalLearners },
          { label: 'Completed',     value: summary.completedLearners },
          { label: 'Avg Progress',  value: `${summary.avgProgressPercent}%` },
          { label: 'Certificates',  value: summary.certificatesIssued },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Learner table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800">Learners</h2>
        {learners.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No learners enrolled in this cohort.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {learners.map((learner) => (
                  <tr key={learner.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{learner.fullName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{learner.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${enrollmentBadge(learner.enrollmentStatus)}`}>
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
    </div>
  );
}
