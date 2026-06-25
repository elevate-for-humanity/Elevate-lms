// Outcomes report endpoint — placement, retention, wage, and credential data.
// Used by workforce board, admin, and employer analytics pages.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const allowed = ['admin', 'staff', 'workforce_board', 'employer'];
  if (!profile || !allowed.includes(profile.role)) return safeError('Forbidden', 403);

  const { searchParams } = new URL(request.url);
  const from    = searchParams.get('from') ?? new Date(Date.now() - 365 * 86400000).toISOString();
  const to      = searchParams.get('to')   ?? new Date().toISOString();
  const program = searchParams.get('program');
  const format  = searchParams.get('format') ?? 'json';

  try {
    let query = supabase
      .from('applications')
      .select('id, user_id, status, placed_at, placement_employer, placement_job_title, placement_hourly_wage, retained_at, follow_up_6mo_at, follow_up_6mo_employed, follow_up_6mo_wage, follow_up_12mo_at, follow_up_12mo_employed, follow_up_12mo_wage, program_id')
      .gte('created_at', from)
      .lte('created_at', to);

    if (program) query = query.eq('program_id', program);

    // Employers only see placements at their company
    if (profile.role === 'employer') {
      query = query.eq('placement_employer_id', user.id);
    }

    const { data, error } = await query;
    if (error) return safeDbError(error, 'Failed to fetch outcomes');

    const placed    = data?.filter(a => a.placed_at) ?? [];
    const retained6 = placed.filter(a => a.follow_up_6mo_employed);
    const retained12 = placed.filter(a => a.follow_up_12mo_employed);

    const outcomes = {
      period: { from, to },
      generated_at: new Date().toISOString(),
      total_applications: data?.length ?? 0,
      placements: {
        total:          placed.length,
        retention_6mo:  retained6.length,
        retention_12mo: retained12.length,
        retention_6mo_rate:  placed.length ? Math.round(retained6.length / placed.length * 100) : 0,
        retention_12mo_rate: placed.length ? Math.round(retained12.length / placed.length * 100) : 0,
        avg_starting_wage: placed.length
          ? Math.round(placed.reduce((s, p) => s + (p.placement_hourly_wage ?? 0), 0) / placed.length * 100) / 100
          : 0,
        avg_6mo_wage: retained6.length
          ? Math.round(retained6.reduce((s, p) => s + (p.follow_up_6mo_wage ?? 0), 0) / retained6.length * 100) / 100
          : 0,
      },
    };

    if (format === 'csv') {
      const rows = [
        ['Metric', 'Value'],
        ['Total Applications', outcomes.total_applications],
        ['Total Placements', outcomes.placements.total],
        ['6-Month Retention', outcomes.placements.retention_6mo],
        ['6-Month Retention Rate', `${outcomes.placements.retention_6mo_rate}%`],
        ['12-Month Retention', outcomes.placements.retention_12mo],
        ['12-Month Retention Rate', `${outcomes.placements.retention_12mo_rate}%`],
        ['Avg Starting Wage', `$${outcomes.placements.avg_starting_wage}`],
        ['Avg 6-Month Wage', `$${outcomes.placements.avg_6mo_wage}`],
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="outcomes-${from.slice(0,10)}-${to.slice(0,10)}.csv"`,
        },
      });
    }

    return NextResponse.json(outcomes);
  } catch (err) {
    return safeInternalError(err, 'Failed to generate outcomes report');
  }
}
