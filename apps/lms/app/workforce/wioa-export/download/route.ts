import { getWorkforceWorkspace, workforceRecords } from '@/lib/workforce/workspace';
import { csvCell, learnerId } from '@/lib/workforce/records';
export const dynamic = 'force-dynamic';
export async function GET() {
  const { ctx, enrollments, userIds } = await getWorkforceWorkspace();
  const all = await workforceRecords(
    ctx,
    'placement_records',
    'id,learner_id,enrollment_id,tenant_id,status,employer_name,job_title,start_date',
    'learner_id',
    userIds,
  );
  const placements = ctx.tenantId ? all.filter((row) => row.tenant_id === ctx.tenantId) : all;
  const columns = [
    'enrollment_id',
    'participant_id',
    'participant_name',
    'email',
    'program',
    'enrollment_status',
    'funding_source',
    'enrolled_at',
    'training_start',
    'training_end',
    'completed_at',
    'placement_status',
    'employer',
    'job_title',
    'employment_start',
  ];
  const rows = enrollments.flatMap((row) => {
    // Only attach placements explicitly linked to this enrollment. Never copy a
    // learner-level placement into every program taken by that learner.
    const matches = placements.filter((placement) => placement.enrollment_id === row.id);
    return (matches.length ? matches : [null]).map((placement) => [
      row.id,
      learnerId(row),
      row.profile?.full_name,
      row.profile?.email,
      row.program?.title,
      row.enrollment_state,
      row.funding_source,
      row.enrolled_at,
      row.training_start_date ?? row.started_at,
      row.training_end_date,
      row.completed_at,
      placement?.status,
      placement?.employer_name,
      placement?.job_title,
      placement?.start_date,
    ]);
  });
  const csv = '\uFEFF' + [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="workforce-enrollments.csv"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
