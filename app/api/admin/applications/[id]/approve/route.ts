
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireApiAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { approveApplication } from '@/lib/enrollment/approve';
import { runPostApprovalActions } from '@/lib/enrollment/post-approval';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  // Auth guard
  let adminUserId: string;
  try {
    await requireApiAuth();
    const supabase = await createClient();
      const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    adminUserId = user.id;
    const adminDb = createAdminClient();
    const { data: profile } = await adminDb!
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden — requires admin or super_admin' },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { program_id, funding_type } = body;

    // Single approval pipeline
    const result = await approveApplication(db, {
      applicationId: id,
      programId: program_id || null,
      fundingType: funding_type || null,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Audit log
    await logAdminAudit({
      action: AdminAction.APPLICATION_APPROVED,
      actorId: adminUserId,
      entityType: 'applications',
      entityId: id,
      metadata: {
        created_user_id: result.userId,
        program_id: program_id || null,
        funding_type: funding_type || null,
        mode: 'admin',
      },
      req,
    });

    // Post-approval actions: program-specific emails, Milady, CRM update (non-blocking)
    try {
      const { data: app } = await supabase
        .from('applications')
        .select('email, first_name, last_name, phone, program_interest, program_slug')
        .eq('id', id)
        .single();

      if (app?.email) {
        const studentName = [app.first_name, app.last_name].filter(Boolean).join(' ') || app.email;
        const programSlug = app.program_slug || app.program_interest || null;

        await runPostApprovalActions({
          db,
          applicationId: id,
          programSlug,
          studentEmail:      app.email,
          studentName,
          studentPhone:      app.phone ?? null,
          passwordSetupLink: result.passwordSetupLink ?? null,
          enrollmentId:      result.enrollmentId ?? null,
        });

        // Mark CRM lead converted
        await db
          .from('crm_leads')
          .update({
            stage:         'converted',
            status:        'won',
            enrollment_id: result.enrollmentId ?? null,
            updated_at:    new Date().toISOString(),
          })
          .eq('email', app.email.toLowerCase().trim());

        // Close any pending follow-up reminders for this application
        await db
          .from('follow_up_reminders')
          .update({ status: 'completed' })
          .eq('application_id', id)
          .eq('status', 'pending');
      }
    } catch (postErr) {
      logger.warn('[approve route] Post-approval actions failed (non-critical)', postErr);
    }

    return NextResponse.json({
      message: 'Application approved',
      user_id: result.userId,
      enrollment_id: result.enrollmentId,
    });
  } catch (err) {
    logger.error('Approve application error:', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

export const POST = withApiAudit(
  '/api/admin/applications/[id]/approve',
  _POST,
  { critical: true },
);
