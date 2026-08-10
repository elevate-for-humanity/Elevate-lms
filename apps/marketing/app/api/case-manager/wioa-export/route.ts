import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = new Set(['case_manager', 'admin', 'super_admin', 'staff']);

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile?.role || !ALLOWED_ROLES.has(profile.role)) {
    return NextResponse.json({ error: 'Case manager access required' }, { status: 403 });
  }

  const { data: assignments } = await supabase
    .from('case_manager_assignments')
    .select('application_id')
    .eq('case_manager_id', user.id);
  const applicationIds = (assignments ?? []).map((row: any) => row.application_id).filter(Boolean);

  if (!applicationIds.length) {
    const csv = 'Participant,Email,WIOA Program,Eligibility,Entry Status,Entry Date,Exit Date,Q2 Employed,Q4 Employed,Credential,Skill Gain,Q2 Earnings,Placement Employer,Hourly Wage\n';
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="wioa-outcomes-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const { data: apps } = await supabase.from('applications').select('email').in('id', applicationIds);
  const emails = (apps ?? []).map((row: any) => row.email).filter(Boolean);
  const { data: profiles } = emails.length
    ? await supabase.from('profiles').select('id, email, full_name').in('email', emails)
    : { data: [] };
  const userIds = (profiles ?? []).map((row: any) => row.id);
  const profileById = Object.fromEntries((profiles ?? []).map((row: any) => [row.id, row]));

  const { data: wioaRows } = userIds.length
    ? await supabase
        .from('wioa_participants')
        .select('id, user_id, first_name, last_name, email, wioa_program, eligibility_status, employment_status_at_entry')
        .in('user_id', userIds)
    : { data: [] };
  const wioaIds = (wioaRows ?? []).map((row: any) => row.id);

  const { data: outcomes } = wioaIds.length
    ? await supabase
        .from('wioa_participant_records')
        .select('participant_id, program_entry_date, program_exit_date, employed_q2_after_exit, employed_q4_after_exit, median_earnings_q2, credential_attained, measurable_skill_gain, reporting_period_end')
        .in('participant_id', wioaIds)
        .order('reporting_period_end', { ascending: false })
    : { data: [] };
  const outcomeByParticipant: Record<string, any> = {};
  for (const row of outcomes ?? []) if (!outcomeByParticipant[row.participant_id]) outcomeByParticipant[row.participant_id] = row;

  const { data: placements } = userIds.length
    ? await supabase
        .from('placement_records')
        .select('learner_id, employer_name, hourly_wage, start_date')
        .in('learner_id', userIds)
        .eq('status', 'verified')
        .order('start_date', { ascending: false })
    : { data: [] };
  const placementByUser: Record<string, any> = {};
  for (const row of placements ?? []) if (!placementByUser[row.learner_id]) placementByUser[row.learner_id] = row;

  const header = ['Participant','Email','WIOA Program','Eligibility','Entry Status','Entry Date','Exit Date','Q2 Employed','Q4 Employed','Credential','Skill Gain','Q2 Earnings','Placement Employer','Hourly Wage'];
  const rows = (wioaRows ?? []).map((w: any) => {
    const outcome = outcomeByParticipant[w.id];
    const placement = placementByUser[w.user_id];
    const participant = `${w.first_name ?? ''} ${w.last_name ?? ''}`.trim() || profileById[w.user_id]?.full_name || '';
    return [
      participant,
      w.email || profileById[w.user_id]?.email || '',
      w.wioa_program || '',
      w.eligibility_status || '',
      w.employment_status_at_entry || '',
      outcome?.program_entry_date || '',
      outcome?.program_exit_date || '',
      outcome?.employed_q2_after_exit ? 'Yes' : 'No',
      outcome?.employed_q4_after_exit ? 'Yes' : 'No',
      outcome?.credential_attained ? 'Yes' : 'No',
      outcome?.measurable_skill_gain ? 'Yes' : 'No',
      outcome?.median_earnings_q2 ?? '',
      placement?.employer_name || '',
      placement?.hourly_wage ?? '',
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  return new Response(`\uFEFF${csv}\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="wioa-outcomes-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
