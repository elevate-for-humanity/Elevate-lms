export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireApiAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { approveApplication } from '@/lib/enrollment/approve';
import { withApiAudit } from '@/lib/audit/withApiAudit';

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
    const _admin = createAdminClient();
    const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    adminUserId = user.id;
    const { data: profile } = await db
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

    // Send approval email (non-blocking)
    try {
      const { data: app } = await db
        .from('applications')
        .select('email, first_name')
        .eq('id', id)
        .single();

      if (app?.email) {
        const { sendEmail } = await import('@/lib/email/sendgrid');
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ||
          'https://www.elevateforhumanity.org';
        await sendEmail({
          to: app.email,
          subject: 'Application Approved — Elevate for Humanity',
          html: `
            <h2>Congratulations, ${app.first_name || 'Student'}!</h2>
            <p>Your application has been <strong style="color:#10b981;">approved</strong>.</p>
            <p><a href="${siteUrl}/learner/dashboard" style="display:inline-block;padding:12px 24px;background:#ea580c;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Go to Dashboard</a></p>
            <p>Questions? Call <a href="tel:317-314-3757">317-314-3757</a></p>
          `,
        });
      }
    } catch (emailErr) {
      logger.warn('Approval email failed (non-critical)', emailErr);
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
