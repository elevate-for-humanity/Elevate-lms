/**
 * GET /api/reports/participants
 *
 * WIOA-compliant participant report. Joins:
 *   profiles → program_enrollments → programs
 *   → enrollment_funding_records (most recent approved)
 *   → placement_records (most recent verified)
 *   → program_completion_certificates
 *
 * Query params:
 *   start_date  ISO date — filter by applied_at >=
 *   end_date    ISO date — filter by applied_at <=
 *   program_id  UUID — filter to one program
 *   funding     text — prefix match on funding_source (e.g. "wioa", "self_pay")
 *   status      text — enrollment_status exact match
 *   page        integer (default 1)
 *   per_page    integer (default 100, max 500)
 *
 * Access: admin | super_admin | staff
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { auditLog } from '@/lib/auditLog';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const startDate  = searchParams.get('start_date');
  const endDate    = searchParams.get('end_date');
  const programId  = searchParams.get('program_id');
  const funding    = searchParams.get('funding');
  const status     = searchParams.get('status');
  const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage    = Math.min(500, Math.max(1, parseInt(searchParams.get('per_page') ?? '100', 10)));

  const db = await requireAdminClient();

  // Beauty/barbershop/nail/esthetician programs are self-pay — never WIOA/WRG eligible.
  const SELF_PAY_SLUGS = '(barber,barber-2024,barber-apprenticeship,cosmetology,cosmetology-apprenticeship,esthetician,esthetician-apprenticeship,nail-technician,nail-technician-apprenticeship,nail-tech-apprenticeship,hair-stylist-nail-tech-apprenticeship,hair-stylist-esthetician-apprenticeship,beauty-career-educator)';

  try {
    // ── Summary metrics (single RPC call) ──────────────────────────────────
    const { data: summary, error: summaryErr } = await db.rpc('wioa_summary_metrics', {
      p_start_date: startDate  ?? null,
      p_end_date:   endDate    ?? null,
      p_program_id: programId  ?? null,
      p_funding:    funding    ?? null,
    });

    if (summaryErr) {
      // View may not be applied yet — return a clear message instead of 500
      logger.warn('wioa_summary_metrics RPC failed — migration may not be applied', summaryErr);
    }

    // ── Row-level data from participant_report view ─────────────────────────
    let query = db
      .from('participant_report')
      .select('*', { count: 'exact' })
      .not('program_slug', 'in', SELF_PAY_SLUGS)
      .order('applied_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (startDate)  query = query.gte('applied_at', startDate);
    if (endDate)    query = query.lte('applied_at', endDate);
    if (programId)  query = query.eq('program_id', programId);
    if (funding)    query = query.ilike('funding_source', `${funding}%`);
    if (status)     query = query.eq('enrollment_status', status);

    const { data: rows, count, error: rowErr } = await query;

    if (rowErr) {
      // View not yet applied — fall back to raw program_enrollments join
      logger.warn('participant_report view not found — falling back to raw query', rowErr);
      return fallbackReport(db, { startDate, endDate, programId, funding, status, page, perPage, selfPaySlugs: SELF_PAY_SLUGS });
    }

    // ── Audit log ──────────────────────────────────────────────────────────
    await auditLog({
      actor_user_id: auth.id,
      action: 'VIEW_REPORT',
      entity: 'participant_report',
      metadata: { filters: { startDate, endDate, programId, funding, status }, row_count: count },
    });

    return NextResponse.json({
      summary: summary?.[0] ?? null,
      participants: rows ?? [],
      pagination: {
        page,
        per_page: perPage,
        total: count ?? 0,
        total_pages: Math.ceil((count ?? 0) / perPage),
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to generate participant report');
  }
}

/** Fallback when the participant_report view hasn't been applied yet. */
async function fallbackReport(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  opts: {
    startDate: string | null;
    endDate: string | null;
    programId: string | null;
    funding: string | null;
    status: string | null;
    page: number;
    perPage: number;
    selfPaySlugs: string;
  },
) {
  const { page, perPage } = opts;

  let query = db
    .from('program_enrollments')
    .select(
      `
      id,
      created_at,
      confirmed_at,
      completed_at,
      exited_at,
      enrollment_state,
      status,
      program_slug,
      program_id,
      user_id,
      profiles!inner ( full_name, email, phone ),
      programs ( title, category, slug )
    `,
      { count: 'exact' },
    )
    .not('program_slug', 'in', opts.selfPaySlugs)
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (opts.startDate) query = query.gte('created_at', opts.startDate);
  if (opts.endDate)   query = query.lte('created_at', opts.endDate);
  if (opts.programId) query = query.eq('program_id', opts.programId);
  if (opts.status)    query = query.eq('enrollment_state', opts.status);

  const { data, count, error } = await query;
  if (error) return safeError('Failed to query enrollments', 500);

  return NextResponse.json({
    summary: null,
    participants: data ?? [],
    pagination: {
      page,
      per_page: perPage,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / perPage),
    },
    generated_at: new Date().toISOString(),
    _note: 'participant_report view not applied — run migration 20260429000001 in Supabase Dashboard',
  });
}

export const GET = withApiAudit('/api/reports/participants', _GET);
