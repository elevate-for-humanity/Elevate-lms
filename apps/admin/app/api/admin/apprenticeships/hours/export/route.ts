import { NextRequest, NextResponse } from 'next/server';
import { apiRequireRoles } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { loadAdminHours } from '@/lib/apprenticeship/admin-hours';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { logAuditEvent, AuditActions } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function csvField(value: unknown) {
  let text = String(value ?? '');
  // Exported names/notes must remain text when opened in a spreadsheet.
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireRoles(req, ['admin', 'super_admin', 'staff']);
  if (auth.error) return auth.error;
  const params = req.nextUrl.searchParams;
  const start = params.get('start_date');
  const end = params.get('end_date');
  const status = params.get('status') || 'all';
  if (!validDate(start) || !validDate(end) || start > end || !['all', 'verified', 'submitted'].includes(status)) {
    return NextResponse.json({ error: 'Choose a valid date range and review status.' }, { status: 400 });
  }
  try {
    // Share the Student Hours loader: progress_entries plus identity/program
    // resolution and hour_entries review reconciliation. Do not substitute
    // attendance_hours or export ledger credit as worked OJT hours.
    const { entries } = await loadAdminHours(await requireAdminClient());
    const rows = entries.filter((entry) => entry.work_date >= start && entry.work_date <= end && (status === 'all' || entry.status === status));
    const csv = [
      ['Entry ID', 'Student Name', 'Student Email', 'Program', 'Work Date', 'Hours Worked', 'Review Status', 'Verified By', 'Verified At', 'Notes'],
      ...rows.map((entry) => [entry.id, entry.name, entry.email, entry.program_title, entry.work_date, entry.hours_worked, entry.status, entry.verified_by, entry.verified_at, entry.notes || entry.tasks_completed]),
    ].map((row) => row.map(csvField).join(',')).join('\r\n');
    await logAuditEvent({
      userId: auth.id,
      action: AuditActions.DATA_EXPORTED,
      resourceType: 'apprenticeship_ojt_hours',
      metadata: { start_date: start, end_date: end, status, count: rows.length },
    });
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ojt_hours_${start}_to_${end}.csv"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return safeInternalError(error, 'Export apprenticeship OJT hours', 'Could not export hours. Please try again.');
  }
}
