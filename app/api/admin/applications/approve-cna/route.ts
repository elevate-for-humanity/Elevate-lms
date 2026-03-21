import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/applications/approve-cna
 *
 * Thin wrapper — delegates entirely to approve_application_and_grant_access_atomic.
 * That function owns: financial gate, compliance gate, state machine transitions,
 * training_enrollments, partner_enrollments, audit log, revoked_at check.
 *
 * This route exists for backward compatibility with existing callers.
 * New callers should use POST /api/admin/applications/[id]/approve-and-grant.
 *
 * Body: { application_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const adminDb = createAdminClient();
    const db = adminDb || supabase;

    if (!supabase) return safeError('Database not configured', 503);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      return safeError('Forbidden', 403);
    }

    const body = await request.json().catch(() => null);
    const { application_id } = body ?? {};

    if (!application_id) return safeError('application_id is required', 400);

    // Verify it's a CNA application before delegating
    const { data: app, error: fetchErr } = await db
      .from('applications')
      .select('id, program_slug')
      .eq('id', application_id)
      .single();

    if (fetchErr || !app) return safeError('Application not found', 404);
    if (app.program_slug !== 'cna') return safeError('This route only handles CNA applications', 400);

    // Delegate to the atomic function — it owns all gates, writes, and revocation checks
    const { data: result, error: rpcErr } = await db.rpc(
      'approve_application_and_grant_access_atomic',
      {
        p_application_id: application_id,
        p_actor_user_id:  user.id,
        p_request_id:     crypto.randomUUID(),
      },
    );

    if (rpcErr) {
      logger.error('[approve-cna] RPC error:', rpcErr);
      return safeInternalError(rpcErr, 'Approval failed');
    }

    if (result?.status === 'blocked') {
      return NextResponse.json(
        { error: 'Approval blocked', blockers: result.blockers },
        { status: 409 },
      );
    }

    if (result?.status === 'already_processed') {
      return NextResponse.json({ success: true, status: 'already_processed', application_id });
    }

    if (result?.status === 'error') {
      return safeError(result.message ?? 'Approval failed', 422);
    }

    logger.info(`[approve-cna] application=${application_id} status=${result?.status} actor=${user.id}`);

    return NextResponse.json({
      success:        true,
      application_id,
      status:         result?.status,
      program_id:     result?.program_id,
      course_id:      result?.course_id,
    });
  } catch (err) {
    logger.error('[approve-cna] Unexpected error:', err);
    return safeInternalError(err, 'Internal server error');
  }
}
