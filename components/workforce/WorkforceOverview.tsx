import Link from 'next/link';
import { getWorkforceWorkspace, workforceRecords } from '@/lib/workforce/workspace';
import { enrollmentSummary } from '@/lib/workforce/records';
import { StudentSearchPanel } from './StudentSearchPanel';

export async function WorkforceOverview({ admin = false }: { admin?: boolean }) {
  const { ctx, enrollments, userIds, reviewEnrollments = [] } = await getWorkforceWorkspace();
  const placements = await workforceRecords(
    ctx,
    'placement_records',
    'id,learner_id,status,tenant_id',
    'learner_id',
    userIds,
  );
  const visiblePlacements = ctx.tenantId
    ? placements.filter((row) => row.tenant_id === ctx.tenantId)
    : placements;
  const summary = enrollmentSummary(enrollments);
  const prefix = admin ? 'https://app.elevateforhumanity.org' : '';
  const stats = [
    ['Currently Enrolled Learners', summary.activeParticipants, '/participants?filter=active'],
    ['Active Program Enrollments', summary.active, '/participants?filter=active'],
    ['Learners With Records · All Statuses', summary.participants, '/participants'],
    ['Completions', summary.completed, '/participants?filter=completed'],
    [
      'Placements Verified',
      visiblePlacements.filter((row) => row.status === 'verified').length,
      '/placements',
    ],
    ['At-Risk Enrollments', summary.atRisk, '/participants?filter=at-risk'],
    [
      'Placements Pending',
      visiblePlacements.filter((row) => row.status === 'pending').length,
      '/placements?filter=pending',
    ],
  ] as const;
  const tools = [
    ['View Participants', 'participants'],
    ['Verify Placements', 'placements?filter=pending'],
    ['WIOA Export', 'wioa-export'],
    ['Follow-Ups', 'follow-ups'],
    ['Eligibility', 'eligibility'],
    ['Supportive Services', 'supportive-services'],
  ];
  const completionRate = summary.enrollments
    ? Math.round((summary.completed / summary.enrollments) * 100)
    : 0;
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workforce Overview</h1>
        <p>
          {summary.activeParticipants} currently enrolled learner accounts · {summary.active} active
          program enrollments · {completionRate}% enrollment completion rate
        </p>
      </div>
      <details className="rounded-xl border bg-white p-4">
        <summary>Historical records and records needing review</summary>
        <p>
          {summary.enrollments} learner records across all statuses, including applications,
          payment-pending, completed, withdrawn and suspended records. These are not all currently
          enrolled.
        </p>
        <p>
          {reviewEnrollments.length} test, staff/owner, or unlinked records are excluded from
          learner totals pending review.
        </p>
      </details>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(([label, value, path]) => (
          <Link
            className="rounded-xl border bg-white p-4"
            key={label}
            href={`${prefix}/workforce${path}`}
          >
            <p className="text-2xl font-bold">{value}</p>
            <p>{label}</p>
          </Link>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">Quick Actions</h2>
        <nav className="flex flex-wrap gap-4">
          {tools.map(([label, path]) => (
            <Link className="underline" key={label} href={`${prefix}/workforce/${path}`}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">Recent Enrollments</h2>
        <ul className="divide-y">
          {enrollments.slice(0, 8).map((row) => (
            <li className="py-3" key={row.id}>
              {row.profile?.full_name ?? 'Learner identity needs review'} ·{' '}
              {row.program?.title ?? 'Program not recorded'} ·{' '}
              {row.enrollment_state ?? 'Not recorded'}
            </li>
          ))}
        </ul>
        {!enrollments.length && <p>No enrollments in your authorized workspace.</p>}
      </div>
      <StudentSearchPanel
        action={`${prefix}/workforce/participants`}
        label="Search workforce participants"
      />
    </section>
  );
}
