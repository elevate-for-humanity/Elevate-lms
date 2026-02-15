
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/reports/wioa/route.ts
import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { createSupabaseClient } from '@/lib/supabase-api';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = createSupabaseClient();
  const session = await requireApiAuth();
  if (!(session as string).isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const periodStart = searchParams.get('start');
  const periodEnd = searchParams.get('end');

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: 'start and end (YYYY-MM-DD) are required' },
      { status: 400 }
    );
  }

  const { data: records, error } = await supabase
    .from('wioa_participant_records')
    .select('*')
    .gte('reporting_period_start', periodStart)
    .lte('reporting_period_end', periodEnd);

  if (error || !records) {
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    );
  }

  const header = [
    'participant_id',
    'tenant_id',
    'program_id',
    'reporting_period_start',
    'reporting_period_end',
    'ssn_last4',
    'date_of_birth',
    'gender',
    'race_ethnicity',
    'veteran_status',
    'disability_status',
    'employment_status_at_entry',
    'education_level_at_entry',
    'program_entry_date',
    'program_exit_date',
    'employed_q2_after_exit',
    'employed_q4_after_exit',
    'median_earnings_q2',
    'credential_attained',
    'measurable_skill_gain',
  ];

  const rows = records.map((r: Record<string, any>) => [
    r.participant_id,
    r.tenant_id,
    r.program_id,
    r.reporting_period_start,
    r.reporting_period_end,
    r.ssn_last4,
    r.date_of_birth,
    r.gender,
    r.race_ethnicity,
    r.veteran_status,
    r.disability_status,
    r.employment_status_at_entry,
    r.education_level_at_entry,
    r.program_entry_date,
    r.program_exit_date,
    r.employed_q2_after_exit ? 'Y' : 'N',
    r.employed_q4_after_exit ? 'Y' : 'N',
    r.median_earnings_q2?.toString(),
    r.credential_attained ? 'Y' : 'N',
    r.measurable_skill_gain ? 'Y' : 'N',
  ]);

  const csv = [header, ...rows]
    .map((row: any) =>
      row.map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="wioa-report-${periodStart}-to-${periodEnd}.csv"`,
    },
  });
}
