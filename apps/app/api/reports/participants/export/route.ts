/**
 * GET /api/reports/participants/export
 *
 * CSV export of the WIOA participant report. Same filters as the JSON endpoint.
 * Streams up to 5,000 rows. For larger exports, use the batch export endpoint.
 *
 * Query params: same as /api/reports/participants (no pagination — returns all matching rows)
 *
 * Access: admin | super_admin | staff
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { auditLog } from '@/lib/auditLog';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { convertToCSV, type ExportColumn } from '@/lib/dataExport';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_ROWS = 5000;

/** Columns exported in the WIOA CSV — order matches DOL reporting conventions. */
const WIOA_COLUMNS: ExportColumn[] = [
  { key: 'enrollment_id',         label: 'Enrollment ID' },
  { key: 'participant_id',        label: 'Participant ID' },
  { key: 'full_name',             label: 'Full Name' },
  { key: 'email',                 label: 'Email' },
  { key: 'phone',                 label: 'Phone' },
  { key: 'program_title',         label: 'Program' },
  { key: 'program_category',      label: 'Category' },
  { key: 'enrollment_status',     label: 'Status' },
  { key: 'funding_source',        label: 'Funding Source' },
  { key: 'funding_status',        label: 'Funding Status' },
  { key: 'workone_case_number',   label: 'WorkOne Case #' },
  { key: 'applied_at',            label: 'Applied Date',    format: fmtDate },
  { key: 'enrolled_at',           label: 'Enrolled Date',   format: fmtDate },
  { key: 'completed_at',          label: 'Completed Date',  format: fmtDate },
  { key: 'exited_at',             label: 'Exited Date',     format: fmtDate },
  { key: 'outcome_type',          label: 'Outcome Type' },
  { key: 'employer_name',         label: 'Employer' },
  { key: 'job_title',             label: 'Job Title' },
  { key: 'employment_type',       label: 'Employment Type' },
  { key: 'hourly_wage',           label: 'Hourly Wage',     format: fmtWage },
  { key: 'employment_start_date', label: 'Employment Start', format: fmtDate },
  { key: 'placement_status',      label: 'Placement Status' },
  { key: 'verification_method',   label: 'Verification Method' },
  { key: 'credential_received',   label: 'Credential Received', format: fmtBool },
  { key: 'credential_issued_at',  label: 'Credential Date', format: fmtDate },
  { key: 'certificate_number',    label: 'Certificate #' },
];

function fmtDate(v: unknown): string {
  if (!v) return '';
  try { return new Date(v as string).toISOString().split('T')[0]; } catch { return String(v); }
}

function fmtWage(v: unknown): string {
  if (v === null || v === undefined) return '';
  return `$${Number(v).toFixed(2)}`;
}

function fmtBool(v: unknown): string {
  return v ? 'Yes' : 'No';
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate   = searchParams.get('end_date');
  const programId = searchParams.get('program_id');
  const funding   = searchParams.get('funding');
  const status    = searchParams.get('status');

  const db = await requireAdminClient();

  try {
    let query = db
      .from('participant_report')
      .select('*')
      .order('applied_at', { ascending: false })
      .limit(MAX_ROWS);

    if (startDate) query = query.gte('applied_at', startDate);
    if (endDate)   query = query.lte('applied_at', endDate);
    if (programId) query = query.eq('program_id', programId);
    if (funding)   query = query.ilike('funding_source', `${funding}%`);
    if (status)    query = query.eq('enrollment_status', status);

    const { data, error } = await query;

    if (error) {
      // View not applied — fall back to raw enrollments
      logger.warn('participant_report view not found for CSV export — using fallback', error);
      return fallbackCsvExport(db, { startDate, endDate, programId, status });
    }

    const rows = data ?? [];
    const csv  = convertToCSV(rows, WIOA_COLUMNS);

    const dateTag = new Date().toISOString().split('T')[0];
    const filename = `wioa-participants-${dateTag}.csv`;

    await auditLog({
      actor_user_id: auth.id,
      action: 'EXPORT_REPORT',
      entity: 'participant_report',
      metadata: {
        format: 'csv',
        row_count: rows.length,
        filters: { startDate, endDate, programId, funding, status },
      },
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Row-Count': String(rows.length),
      },
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to export participant report');
  }
}

async function fallbackCsvExport(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  opts: { startDate: string | null; endDate: string | null; programId: string | null; status: string | null },
) {
  let query = db
    .from('program_enrollments')
    .select(`
      id,
      created_at,
      confirmed_at,
      completed_at,
      exited_at,
      enrollment_state,
      status,
      program_slug,
      profiles!inner ( full_name, email ),
      programs ( title, category )
    `)
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS);

  if (opts.startDate) query = query.gte('created_at', opts.startDate);
  if (opts.endDate)   query = query.lte('created_at', opts.endDate);
  if (opts.programId) query = query.eq('program_id', opts.programId);
  if (opts.status)    query = query.eq('enrollment_state', opts.status);

  const { data, error } = await query;
  if (error) return safeError('Failed to query enrollments for export', 500);

  // Flatten nested joins for CSV
  const flat = (data ?? []).map((row: any) => ({
    enrollment_id:    row.id,
    full_name:        row.profiles?.full_name ?? '',
    email:            row.profiles?.email ?? '',
    program_title:    row.programs?.title ?? row.program_slug ?? '',
    program_category: row.programs?.category ?? '',
    enrollment_status: row.enrollment_state ?? row.status ?? '',
    applied_at:       fmtDate(row.created_at),
    enrolled_at:      fmtDate(row.confirmed_at),
    completed_at:     fmtDate(row.completed_at),
    exited_at:        fmtDate(row.exited_at),
  }));

  const csv = convertToCSV(flat);
  const dateTag = new Date().toISOString().split('T')[0];

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="enrollments-fallback-${dateTag}.csv"`,
      'X-Row-Count': String(flat.length),
      'X-Warning': 'participant_report view not applied — run migration 20260429000001',
    },
  });
}
