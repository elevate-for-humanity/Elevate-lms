import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function percentage(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db: any = await requireAdminClient();
  const params = request.nextUrl.searchParams;
  const programId = (params.get('programId') ?? '').trim();
  const periodStart = (params.get('periodStart') ?? '').trim();
  const periodEnd = (params.get('periodEnd') ?? '').trim();
  const rawLimit = Number(params.get('limit') ?? 500);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 1000) : 500;

  let query = db
    .from('wioa_participant_records')
    .select('participant_id,tenant_id,program_id,reporting_period_start,reporting_period_end,program_entry_date,program_exit_date,employed_q2_after_exit,employed_q4_after_exit,median_earnings_q2,credential_attained,measurable_skill_gain')
    .order('reporting_period_end', { ascending: false })
    .limit(limit);

  if (programId) query = query.eq('program_id', programId);
  if (periodStart) query = query.gte('reporting_period_start', periodStart);
  if (periodEnd) query = query.lte('reporting_period_end', periodEnd);

  const { data: records, error } = await query;
  if (error) return NextResponse.json({ error: 'Could not load WIOA performance data.' }, { status: 500 });

  const rows = records ?? [];
  const exited = rows.filter((row: any) => Boolean(row.program_exit_date));
  const q2Eligible = exited.filter((row: any) => row.employed_q2_after_exit !== null);
  const q4Eligible = exited.filter((row: any) => row.employed_q4_after_exit !== null);
  const credentialEligible = exited.filter((row: any) => row.credential_attained !== null);
  const skillEligible = rows.filter((row: any) => row.measurable_skill_gain !== null);
  const earnings = rows
    .map((row: any) => Number(row.median_earnings_q2))
    .filter((value: number) => Number.isFinite(value) && value >= 0);

  const q2 = q2Eligible.filter((row: any) => row.employed_q2_after_exit === true).length;
  const q4 = q4Eligible.filter((row: any) => row.employed_q4_after_exit === true).length;
  const credentials = credentialEligible.filter((row: any) => row.credential_attained === true).length;
  const skills = skillEligible.filter((row: any) => row.measurable_skill_gain === true).length;

  return NextResponse.json({
    reporting: {
      records: rows.length,
      exitedParticipants: exited.length,
      programId: programId || null,
      periodStart: periodStart || null,
      periodEnd: periodEnd || null,
    },
    outcomes: {
      employedQ2: { numerator: q2, denominator: q2Eligible.length, ratePercent: percentage(q2, q2Eligible.length) },
      employedQ4: { numerator: q4, denominator: q4Eligible.length, ratePercent: percentage(q4, q4Eligible.length) },
      credentialAttainment: { numerator: credentials, denominator: credentialEligible.length, ratePercent: percentage(credentials, credentialEligible.length) },
      measurableSkillGain: { numerator: skills, denominator: skillEligible.length, ratePercent: percentage(skills, skillEligible.length) },
      medianEarningsQ2: median(earnings),
    },
    note: 'Aggregate performance output only; narrative conclusions should be reviewed by staff before external submission.',
  });
}
