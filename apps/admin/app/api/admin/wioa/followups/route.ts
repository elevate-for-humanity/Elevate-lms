import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function limitFrom(request: NextRequest): number {
  const value = Number(request.nextUrl.searchParams.get('limit') ?? 50);
  return Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 1), 100) : 50;
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db: any = await requireAdminClient();
  const params = request.nextUrl.searchParams;
  const type = (params.get('type') ?? '').trim().slice(0, 80);
  const status = (params.get('status') ?? '').trim().slice(0, 40);
  const program = (params.get('program') ?? '').trim().slice(0, 120);
  const sector = (params.get('sector') ?? '').trim().slice(0, 120);
  const overdueOnly = params.get('overdue') === '1' || params.get('overdue') === 'true';
  const dueBefore = params.get('dueBefore');

  let query = db
    .from('follow_ups')
    .select('id,participant_id,case_worker_id,type,due_date,status,notes,completed_at,created_at')
    .order('due_date', { ascending: true })
    .limit(limitFrom(request));

  if (status) query = query.eq('status', status);
  else query = query.neq('status', 'completed');
  if (type) query = query.ilike('type', `%${type.replace(/[,%()]/g, ' ')}%`);
  if (dueBefore) {
    const parsed = new Date(dueBefore);
    if (!Number.isNaN(parsed.getTime())) query = query.lte('due_date', parsed.toISOString());
  } else if (overdueOnly) {
    query = query.lt('due_date', new Date().toISOString());
  }

  const { data: followups, error } = await query;
  if (error) return NextResponse.json({ error: 'Could not load WIOA follow-ups.' }, { status: 500 });

  const participantIds = [...new Set((followups ?? []).map((row: any) => row.participant_id).filter(Boolean))];
  const caseWorkerIds = [...new Set((followups ?? []).map((row: any) => row.case_worker_id).filter(Boolean))];

  let participantQuery = db
    .from('wioa_participants')
    .select('id,first_name,last_name,email,status,wioa_program,program_id,case_manager_id,workforce_region,career_pathway');
  if (participantIds.length) participantQuery = participantQuery.in('id', participantIds);
  else return NextResponse.json({ followups: [], count: 0 });

  const { data: participants } = await participantQuery;
  const filteredParticipants = (participants ?? []).filter((participant: any) => {
    if (program) {
      const haystack = `${participant.wioa_program ?? ''} ${participant.program_id ?? ''}`.toLowerCase();
      if (!haystack.includes(program.toLowerCase())) return false;
    }
    if (sector) {
      const haystack = `${participant.career_pathway ?? ''} ${participant.workforce_region ?? ''}`.toLowerCase();
      if (!haystack.includes(sector.toLowerCase())) return false;
    }
    return true;
  });
  const allowedParticipantIds = new Set(filteredParticipants.map((row: any) => row.id));

  const participantCaseManagers = filteredParticipants.map((row: any) => row.case_manager_id).filter(Boolean);
  const allManagerIds = [...new Set([...caseWorkerIds, ...participantCaseManagers])];
  const managers = allManagerIds.length
    ? (await db.from('case_managers').select('id,name,agency,email').in('id', allManagerIds)).data ?? []
    : [];

  const participantById = new Map(filteredParticipants.map((row: any) => [row.id, row]));
  const managerById = new Map(managers.map((row: any) => [row.id, row]));
  const now = Date.now();

  const rows = (followups ?? [])
    .filter((followup: any) => allowedParticipantIds.has(followup.participant_id))
    .map((followup: any) => {
      const participant = participantById.get(followup.participant_id) as any;
      const manager = managerById.get(followup.case_worker_id || participant?.case_manager_id) as any;
      return {
        id: followup.id,
        type: followup.type,
        dueDate: followup.due_date,
        status: followup.status,
        completedAt: followup.completed_at,
        overdue: Boolean(followup.due_date && new Date(followup.due_date).getTime() < now && followup.status !== 'completed'),
        participant: participant ? {
          id: participant.id,
          name: [participant.first_name, participant.last_name].filter(Boolean).join(' '),
          email: participant.email,
          status: participant.status,
          wioaProgram: participant.wioa_program,
          workforceRegion: participant.workforce_region,
          careerPathway: participant.career_pathway,
        } : null,
        caseManager: manager ? {
          id: manager.id,
          name: manager.name,
          agency: manager.agency,
          email: manager.email,
        } : null,
      };
    });

  return NextResponse.json({ followups: rows, count: rows.length });
}
