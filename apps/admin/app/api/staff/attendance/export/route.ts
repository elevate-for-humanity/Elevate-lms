import { NextRequest, NextResponse } from 'next/server';
import { isStaffPortalApiAuth, requireStaffPortalApi } from '@/lib/api/staff-portal-guard';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csv(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function _GET(request: NextRequest) {
  const auth = await requireStaffPortalApi();
  if (!isStaffPortalApiAuth(auth)) return auth;

  const start = request.nextUrl.searchParams.get('start');
  const end = request.nextUrl.searchParams.get('end');
  const cohortId = request.nextUrl.searchParams.get('cohort_id');
  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return NextResponse.json({ error: 'Valid start and end dates are required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  let query = db
    .from('attendance_hours')
    .select('id,enrollment_id,cohort_id,date,hours_logged,type,verified,verified_at,notes')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
    .limit(10000);
  if (cohortId) query = query.eq('cohort_id', cohortId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Attendance export failed' }, { status: 500 });

  const columns = ['id', 'enrollment_id', 'cohort_id', 'date', 'hours_logged', 'type', 'verified', 'verified_at', 'notes'];
  const body = [columns.join(','), ...(data || []).map((row: any) => columns.map((key) => csv(row[key])).join(','))].join('\n');
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="attendance-${start}-to-${end}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

export const GET = withApiAudit('/api/staff/attendance/export', _GET, { critical: true });
