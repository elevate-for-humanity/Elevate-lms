import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { approveApplication } from '@/lib/enrollment/approve';
import { runPostApprovalActions } from '@/lib/enrollment/post-approval';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  // Auth guard — requires an authorized Admin surface user.
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const adminUserId = auth.id;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
  }
  const db = await requireAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { program_id, funding_type } = body;

    // The public application contract primarily persists program_slug /
    // program_interest. Do not depend on the Admin UI resending program_id:
    // resolve the canonical program record server-side before approval so an
    // "approved" application can never skip program_enrollments/LMS access.
    const { data: application, error: applicationError } = await db
      .from('applications')
      .select('program_id, program_slug, program_interest, funding_type')
      .eq('id', id)
      .maybeSingle();

    if (applicationError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    let resolvedProgramId = program_id || application.program_id || null;
    const programSlug = application.program_slug || application.program_interest || null;

    if (!resolvedProgramId && programSlug) {
      const { data: programRow, error: programError } = await db
        .from('programs')
        .select('id')
        .eq('slug', programSlug)
        .maybeSingle();

      if (programError) {
        logger.warn('[approve route] Program resolution query failed', {
          applicationId: id,
          programSlug,
          error: programError.message,
        });
      }
      resolvedProgramId = programRow?.id || null;
    }

    if (!resolvedProgramId) {
      return NextResponse.json(
        {
          error:
            'PROGRAM_NOT_RESOLVED: This application cannot be approved until its program is mapped to a canonical program record.',
        },
        { status: 409 },
      );
    }

    const resolvedFundingType = funding_type || application.funding_type || null;

    // Single approval pipeline — admin bypasses payment gate (audited above).
    // Program resolution is mandatory so approval and LMS access remain one
    // atomic business outcome from the Admin API perspective.
    const result = await approveApplication(db, {
      applicationId: id,
      programId: resolvedProgramId,
      fundingType: resolvedFundingType,
      bypassPaymentGate: true,
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
        program_id: resolvedProgramId,
        funding_type: resolvedFundingType,
        mode: 'admin',
      },
      req,
    });

    // Post-approval actions: program-specific emails, LMS access, CRM update (non-blocking)
    try {
      const { data: app } = await db
        .from('applications')
        .select('email, first_name, last_name, phone, program_interest, program_slug, city, zip, support_notes, eligibility_data, funding_type, source')
        .eq('id', id)
        .maybeSingle();

      if (app?.email) {
        const studentName = [app.first_name, app.last_name].filter(Boolean).join(' ') || app.email;
        const approvedProgramSlug = app.program_slug || app.program_interest || null;

        await runPostApprovalActions({
          db,
          applicationId: id,
          programSlug: approvedProgramSlug,
          studentEmail: app.email,
          studentName,
          studentPhone: app.phone ?? null,
          studentCity: app.city ?? null,
          fundingType:
            app.funding_type ??
            ((app.eligibility_data as Record<string, unknown>)?.funding_tag as string) ??
            null,
          passwordSetupLink: result.passwordSetupLink ?? null,
          tempPassword: null,
          enrollmentId: result.enrollmentId ?? null,
        });

        // Mark CRM lead converted
        await db
          .from('crm_leads')
          .update({
            stage: 'converted',
            status: 'won',
            enrollment_id: result.enrollmentId ?? null,
            updated_at: new Date().toISOString(),
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

// critical: false — this route already calls logAdminAudit() internally.
// Using critical:true caused the audit system to override a successful 200
// response with 503 when the audit_logs table was unavailable.
export const POST = withApiAudit('/api/admin/applications/[id]/approve', _POST);
