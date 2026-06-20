// WIOA performance report endpoint.
// Returns participant counts by status, entered employment, retention, and credential attainment.
// Required for WIOA Title I quarterly reporting to Indiana DWD / EmployIndy.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiAuthGuard } from '@/lib/admin/guards';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['admin', 'super_admin', 'staff', 'workforce_board'] as const;
const ALLOWED_FORMATS = ['json', 'csv', 'full'] as const;

function parseIsoDate(input: string | null, fallback: string): string {
  const value = input ?? fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('INVALID_DATE');
  }
  return date.toISOString();
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  if (!auth.role || !ALLOWED_ROLES.includes(auth.role as (typeof ALLOWED_ROLES)[number])) {
    return safeError('Forbidden', 403);
  }

  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const defaultFrom = new Date(Date.now() - 90 * 86400000).toISOString();
  const defaultTo = new Date().toISOString();

  let from: string;
  let to: string;
  try {
    from = parseIsoDate(searchParams.get('from'), defaultFrom);
    to = parseIsoDate(searchParams.get('to'), defaultTo);
  } catch {
    return safeError('Invalid date range. Use ISO date values for from/to.', 400);
  }

  if (new Date(from) > new Date(to)) {
    return safeError('Invalid date range. `from` must be before `to`.', 400);
  }

  const requestedFormat = searchParams.get('format') ?? 'json';
  const format = ALLOWED_FORMATS.includes(requestedFormat as (typeof ALLOWED_FORMATS)[number])
    ? requestedFormat
    : null;
  if (!format) {
    return safeError('Invalid format. Supported values: json, csv, full.', 400);
  }

  try {
    // Participants enrolled in WIOA-funded programs in period
    const { data: enrollments, error: enrollErr } = await supabase
      .from('program_enrollments')
      .select(`
        id, enrollment_state, created_at, completed_at,
        user_id,
        programs!inner(title, slug, wioa_approved)
      `)
      .eq('programs.wioa_approved', true)
      .gte('created_at', from)
      .lte('created_at', to);

    if (enrollErr) return safeDbError(enrollErr, 'Failed to fetch enrollments');

    // Placement outcomes in period
    const { data: placements, error: placErr } = await supabase
      .from('applications')
      .select('id, user_id, placed_at, placement_employer, placement_job_title, placement_hourly_wage, retained_at, follow_up_6mo_at, follow_up_6mo_employed, follow_up_12mo_at, follow_up_12mo_employed')
      .not('placed_at', 'is', null)
      .gte('placed_at', from)
      .lte('placed_at', to);

    if (placErr) return safeDbError(placErr, 'Failed to fetch placements');

    // Credentials earned in period
    const { data: credentials, error: credErr } = await supabase
      .from('program_completion_certificates')
      .select('id, user_id, issued_at, program_id')
      .gte('issued_at', from)
      .lte('issued_at', to);

    if (credErr) return safeDbError(credErr, 'Failed to fetch credentials');

    const report = {
      period: { from, to },
      generated_at: new Date().toISOString(),
      participants: {
        total:     enrollments?.length ?? 0,
        active:    enrollments?.filter(e => e.enrollment_state === 'active').length ?? 0,
        completed: enrollments?.filter(e => ['completed','graduated'].includes(e.enrollment_state)).length ?? 0,
        withdrawn: enrollments?.filter(e => e.enrollment_state === 'withdrawn').length ?? 0,
      },
      outcomes: {
        entered_employment:       placements?.length ?? 0,
        retained_6mo:             placements?.filter(p => p.follow_up_6mo_employed).length ?? 0,
        retained_12mo:            placements?.filter(p => p.follow_up_12mo_employed).length ?? 0,
        credentials_attained:     credentials?.length ?? 0,
        avg_hourly_wage:          placements?.length
          ? Math.round((placements.reduce((s, p) => s + (p.placement_hourly_wage ?? 0), 0) / placements.length) * 100) / 100
          : 0,
      },
      raw: format === 'full' ? { enrollments, placements, credentials } : undefined,
    };

    if (format === 'csv') {
      const rows = [
        ['Metric', 'Value'],
        ['Period From', from],
        ['Period To', to],
        ['Total Participants', report.participants.total],
        ['Active', report.participants.active],
        ['Completed', report.participants.completed],
        ['Withdrawn', report.participants.withdrawn],
        ['Entered Employment', report.outcomes.entered_employment],
        ['Retained 6 Months', report.outcomes.retained_6mo],
        ['Retained 12 Months', report.outcomes.retained_12mo],
        ['Credentials Attained', report.outcomes.credentials_attained],
        ['Avg Hourly Wage', report.outcomes.avg_hourly_wage],
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="wioa-report-${from.slice(0,10)}-${to.slice(0,10)}.csv"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (err) {
    return safeInternalError(err, 'Failed to generate WIOA report');
  }
}
