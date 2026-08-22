import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getCaseManagerParticipants } from '@/lib/case-manager/participant-scope';
import { caseManagerActorRole, requireCaseManagerApiAccess } from '@/lib/case-manager/api-auth';
import { logAction } from '@/lib/audit/logAction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
function booleanEvidence(value: unknown) {
  return value === true ? 'Yes' : value === false ? 'No' : '';
}

export async function GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireCaseManagerApiAccess();
  if (auth.error || !auth.user) return auth.error!;

  const admin = await requireAdminClient();
  const db = admin || auth.supabase;
  const participants = await getCaseManagerParticipants({
    db,
    userId: auth.user.id,
    effectiveRoles: auth.effectiveRoles,
  });
  const participantProfiles = participants.map((participant) => participant.learnerProfile).filter(Boolean);
  const userIds = [...new Set(participants.map((participant) => participant.learnerId).filter((id): id is string => Boolean(id)))];
  const profileById = Object.fromEntries(participantProfiles.map((row: any) => [row.id, row]));

  const wioaResult = userIds.length
    ? await db
        .from('wioa_participants')
        .select('id,user_id,first_name,last_name,email,wioa_program,eligibility_status,employment_status_at_entry')
        .in('user_id', userIds)
        .order('last_name', { ascending: true })
    : { data: [], error: null };
  if (wioaResult.error) return NextResponse.json({ error: 'Unable to load scoped WIOA participants.' }, { status: 400 });
  const wioaRows = wioaResult.data ?? [];
  const wioaIds = wioaRows.map((row: any) => row.id).filter(Boolean);

  const [outcomeResult, placementResult] = await Promise.all([
    wioaIds.length
      ? db
          .from('wioa_participant_records')
          .select('participant_id,program_entry_date,program_exit_date,employed_q2_after_exit,employed_q4_after_exit,median_earnings_q2,credential_attained,measurable_skill_gain,reporting_period_end')
          .in('participant_id', wioaIds)
          .order('reporting_period_end', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? db
          .from('placement_records')
          .select('learner_id,employer_name,job_title,hourly_wage,start_date,status')
          .in('learner_id', userIds)
          .eq('status', 'verified')
          .order('start_date', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (outcomeResult.error) return NextResponse.json({ error: 'Unable to load WIOA outcome evidence.' }, { status: 400 });
  if (placementResult.error) return NextResponse.json({ error: 'Unable to load placement evidence.' }, { status: 400 });

  const outcomeByParticipant: Record<string, any> = {};
  for (const row of outcomeResult.data ?? []) {
    if (!outcomeByParticipant[row.participant_id]) outcomeByParticipant[row.participant_id] = row;
  }
  const placementByUser: Record<string, any> = {};
  for (const row of placementResult.data ?? []) {
    if (!placementByUser[row.learner_id]) placementByUser[row.learner_id] = row;
  }

  const header = [
    'Participant ID','Participant','Email','WIOA Program','Eligibility','Entry Status','Entry Date','Exit Date',
    'Q2 Employed','Q4 Employed','Credential','Skill Gain','Q2 Earnings','Placement Employer','Placement Title','Hourly Wage',
  ];
  const rows = wioaRows.map((w: any) => {
    const outcome = outcomeByParticipant[w.id];
    const placement = placementByUser[w.user_id];
    const participant = `${w.first_name ?? ''} ${w.last_name ?? ''}`.trim() || profileById[w.user_id]?.full_name || '';
    return [
      w.user_id, participant, w.email || profileById[w.user_id]?.email || '', w.wioa_program || '',
      w.eligibility_status || '', w.employment_status_at_entry || '', outcome?.program_entry_date || '', outcome?.program_exit_date || '',
      booleanEvidence(outcome?.employed_q2_after_exit), booleanEvidence(outcome?.employed_q4_after_exit),
      booleanEvidence(outcome?.credential_attained), booleanEvidence(outcome?.measurable_skill_gain), outcome?.median_earnings_q2 ?? '',
      placement?.employer_name || '', placement?.job_title || '', placement?.hourly_wage ?? '',
    ];
  });

  await logAction(auth.user.id, caseManagerActorRole(auth.effectiveRoles), {
    action: 'wioa_outcomes_exported',
    entity_type: 'case_manager_report',
    metadata: { exported_rows: rows.length, authorized_learner_scope: userIds.length },
  });

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  return new Response(`\uFEFF${csv}\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="wioa-outcomes-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
