import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrgContext } from '@/lib/org/getOrgContext';
import { getOrgCohorts, getOrgProgress } from '@/lib/lms/engine/org-scope';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reports | Organization',
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  archived:  'bg-gray-100 text-gray-700',
};

export default async function OrgReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/org/reports');

  let ctx;
  try {
    ctx = await getOrgContext(supabase, user.id);
  } catch {
    redirect('/org/create');
  }

  const orgId = ctx.organization_id;

  const [cohorts, overall] = await Promise.all([
    getOrgCohorts(orgId),
    getOrgProgress({ organizationId: orgId }),
  ]);

  // Per-cohort summaries — run in parallel
  const cohortSummaries = await Promise.all(
    cohorts.map(async (c) => ({
      cohort:  c,
      summary: await getOrgProgress({ organizationId: orgId, cohortId: c.cohortId }),
    }))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
      <p className="mt-1 text-sm text-gray-500">{ctx.organization.name} — learning outcomes</p>

      {/* Overall */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Organization Overview</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Learners',  value: overall.totalLearners },
            { label: 'Completed',       value: overall.completedLearners },
            { label: 'Avg Progress',    value: `${overall.avgProgressPercent}%` },
            { label: 'Certificates',    value: overall.certificatesIssued },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-cohort */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">By Cohort</h2>
        {cohortSummaries.length === 0 ? (
          <p className="text-sm text-gray-500">No cohorts found.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cohort</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Enrolled</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Completed</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Avg %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Certs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cohortSummaries.map(({ cohort, summary }) => (
                  <tr key={cohort.cohortId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{cohort.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[cohort.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {cohort.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{summary.totalLearners}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{summary.completedLearners}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{summary.avgProgressPercent}%</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{summary.certificatesIssued}</td>
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
