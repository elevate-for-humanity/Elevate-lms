// Authenticated route: record and retrieve employment outcomes for WIOA performance reporting.

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard, apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

// GET /api/outcomes?user_id=&program_slug=
// Admin: fetch any user's outcomes. Student: fetch own outcomes only.
async function _GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { searchParams } = req.nextUrl;
  const requestedUserId = searchParams.get('user_id');
  const program_slug = searchParams.get('program_slug');

  // Students can only see their own outcomes
  const isAdmin = ['admin', 'super_admin', 'staff'].includes(auth.role ?? '');
  const userId = isAdmin && requestedUserId ? requestedUserId : auth.id;

  let query = db
    .from('employment_outcomes')
    .select('*')
    .eq('user_uuid', userId)
    .order('created_at', { ascending: false });

  if (program_slug) query = query.eq('program_slug', program_slug);

  const { data, error } = await query;
  if (error) return safeDbError(error, 'Failed to fetch outcomes');
  return NextResponse.json({ outcomes: data });
}

// POST /api/outcomes
// Body: { user_id?, program_slug, outcome_type, employer_name?, job_title?, hourly_wage?, start_date?, notes? }
// outcome_type: 'employed' | 'credential' | 'military' | 'education' | 'self-employed' | 'other'
async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;

  let body: Record<string, string | number>;
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { program_slug, outcome_type } = body;
  if (!program_slug || !outcome_type) {
    return safeError('program_slug and outcome_type are required', 400);
  }

  const VALID_OUTCOME_TYPES = ['employed', 'credential', 'military', 'education', 'self-employed', 'other'];
  if (!VALID_OUTCOME_TYPES.includes(outcome_type as string)) {
    return safeError(`outcome_type must be one of: ${VALID_OUTCOME_TYPES.join(', ')}`, 400);
  }

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Admins can record outcomes for any user; students record their own
  const isAdmin = ['admin', 'super_admin', 'staff'].includes(auth.role ?? '');
  const userId = isAdmin && body.user_id ? (body.user_id as string) : auth.id;

  const { data, error } = await db
    .from('employment_outcomes')
    .insert({
      user_uuid: userId,
      program_slug: program_slug as string,
      outcome_type: outcome_type as string,
      employer_name: (body.employer_name as string) || null,
      job_title: (body.job_title as string) || null,
      hourly_wage: body.hourly_wage ? parseFloat(body.hourly_wage as string) : null,
      start_date: (body.start_date as string) || null,
      notes: (body.notes as string) || null,
      recorded_by: auth.id,
    })
    .select('id')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to record outcome');

  // Advance application status to 'placed' if outcome_type is 'employed' or 'self-employed'
  if (outcome_type === 'employed' || outcome_type === 'self-employed') {
    await db
      .from('applications')
      .update({ status: 'placed', placed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('status', ['completed', 'active_apprentice'])
      .then(({ error: e }) => {
        if (e) logger.warn('[outcomes] Failed to advance application status', e);
      });
  }

  return NextResponse.json({ success: true, id: data?.id }, { status: 201 });
}

// PATCH /api/outcomes — admin update (correct wage, employer, etc.)
async function _PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  let body: Record<string, string | number>;
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const { id } = body;
  if (!id) return safeError('id is required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { error } = await db
    .from('employment_outcomes')
    .update({
      ...(body.employer_name !== undefined ? { employer_name: body.employer_name } : {}),
      ...(body.job_title !== undefined ? { job_title: body.job_title } : {}),
      ...(body.hourly_wage !== undefined ? { hourly_wage: parseFloat(body.hourly_wage as string) } : {}),
      ...(body.start_date !== undefined ? { start_date: body.start_date } : {}),
      ...(body.outcome_type !== undefined ? { outcome_type: body.outcome_type } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id as string);

  if (error) return safeDbError(error, 'Failed to update outcome');
  return NextResponse.json({ success: true });
}

export const GET   = withApiAudit(_GET,   { action: 'api:get:/api/outcomes' });
export const POST  = withApiAudit(_POST,  { action: 'api:post:/api/outcomes' });
export const PATCH = withApiAudit(_PATCH, { action: 'api:patch:/api/outcomes' });
