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
 * Approves a CNA application and routes the applicant into the CMI pipeline:
 *   applications.status → 'approved'
 *   partner_enrollments row created (partner: 'CMI')
 *   cmi_students row created (status: 'enrolled')
 *
 * Body: { application_id: string, cohort?: string }
 *
 * Requires admin or super_admin role.
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
    const { application_id, cohort } = body ?? {};

    if (!application_id) return safeError('application_id is required', 400);

    // Fetch the application — must be CNA and not already approved
    const { data: app, error: fetchErr } = await db
      .from('applications')
      .select('id, user_id, program_slug, status, first_name, last_name, email')
      .eq('id', application_id)
      .single();

    if (fetchErr || !app) return safeError('Application not found', 404);
    if (app.program_slug !== 'cna') return safeError('This route only handles CNA applications', 400);
    if (app.status === 'approved') return safeError('Application already approved', 409);

    // 1. Update application status
    const { error: updateErr } = await db
      .from('applications')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', application_id);

    if (updateErr) {
      logger.error('[approve-cna] Failed to update application status:', updateErr);
      return safeInternalError(updateErr, 'Failed to update application status');
    }

    // 2. Create partner_enrollments row
    const { error: enrollErr } = await db
      .from('partner_enrollments')
      .insert({
        user_id: app.user_id,
        program_slug: 'cna',
        partner: 'CMI',
        status: 'assigned',
      });

    if (enrollErr) {
      logger.error('[approve-cna] Failed to create partner_enrollment:', enrollErr);
      // Non-fatal — log and continue so application status is not left inconsistent
    }

    // 3. Create cmi_students row
    const { data: cmiStudent, error: cmiErr } = await db
      .from('cmi_students')
      .insert({
        user_id: app.user_id,
        application_id: app.id,
        cohort: cohort ?? null,
        status: 'enrolled',
      })
      .select('id')
      .single();

    if (cmiErr) {
      logger.error('[approve-cna] Failed to create cmi_students row:', cmiErr);
      return safeInternalError(cmiErr, 'Failed to enroll student in CMI');
    }

    logger.info(`[approve-cna] application=${application_id} → cmi_student=${cmiStudent.id} actor=${user.id}`);

    return NextResponse.json({
      success: true,
      application_id,
      cmi_student_id: cmiStudent.id,
      status: 'approved',
      partner: 'CMI',
    });
  } catch (err) {
    logger.error('[approve-cna] Unexpected error:', err);
    return safeInternalError(err, 'Internal server error');
  }
}
