import 'server-only';
import { getWorkforceWorkspace, relatedRows, workforceRecords } from './workspace';
import { learnerId } from './records';

export type WorkforceTool = 'placements' | 'follow-ups' | 'eligibility' | 'supportive-services';

export async function getWorkforceTool(tool: WorkforceTool) {
  const workspace = await getWorkforceWorkspace();
  const { ctx, enrollments, userIds } = workspace;
  const names = new Map(
    enrollments.map((row) => [
      learnerId(row),
      row.profile?.full_name ?? row.profile?.email ?? 'Name not recorded',
    ]),
  );
  if (tool === 'placements') {
    const all = await workforceRecords(
      ctx,
      'placement_records',
      'id,learner_id,enrollment_id,tenant_id,employer_name,job_title,start_date,status,verification_method,verified_at,notes',
      'learner_id',
      userIds,
    );
    const rows = ctx.tenantId ? all.filter((row) => row.tenant_id === ctx.tenantId) : all;
    const profiles = await relatedRows(
      ctx.db,
      'profiles',
      'id,full_name,email',
      'id',
      rows.map((row) => row.learner_id).filter(Boolean),
    );
    profiles.forEach((row) => names.set(row.id, row.full_name ?? row.email));
    return { ...workspace, rows, names };
  }
  if (tool === 'follow-ups') {
    // Historical numeric user_id is not a profile UUID; scope through enrollment_id.
    const rows = await workforceRecords(
      ctx,
      'followup_schedule',
      'id,enrollment_id,followup_type,follow_up_type,scheduled_date,status,completed_date,outcome_notes',
      'enrollment_id',
      enrollments.map((row) => row.id),
    );
    const enrollmentMap = new Map(enrollments.map((row) => [row.id, row]));
    return {
      ...workspace,
      rows: rows.map((row) => ({
        ...row,
        learner_id: learnerId(enrollmentMap.get(row.enrollment_id) ?? {}),
      })),
      names,
    };
  }
  if (tool === 'eligibility') {
    const rows = await workforceRecords(
      ctx,
      'participant_eligibility',
      'id,user_id,eligibility_status,approved_at,expires_at',
      'user_id',
      userIds,
    );
    const profiles = await relatedRows(
      ctx.db,
      'profiles',
      'id,full_name,email',
      'id',
      rows.map((row) => row.user_id).filter(Boolean),
    );
    profiles.forEach((row) => names.set(row.id, row.full_name ?? row.email));
    return { ...workspace, rows, names };
  }
  const participants = await workforceRecords(
    ctx,
    'wioa_participants',
    'id,user_id,participant_name,participant_email,first_name,last_name',
    'user_id',
    userIds,
  );
  const rows = await relatedRows(
    ctx.db,
    'supportive_services',
    'id,participant_id,service_type,service_description,amount_requested,amount_approved,request_status,requested_date',
    'participant_id',
    participants.map((row) => row.id),
  );
  const participantMap = new Map(participants.map((row) => [row.id, row]));
  return {
    ...workspace,
    rows: rows.map((row) => ({ ...row, participant: participantMap.get(row.participant_id) })),
    names,
  };
}
