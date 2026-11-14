import { logger } from '@/lib/logger';

// Using Node.js runtime for email compatibility

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendCreatorRejectionEmail } from '@/lib/email/sendgrid';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const rejectCreatorSchema = z.object({
  creatorId: z.string().uuid('Invalid creator ID'),
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters'),
});

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      logger.warn('[Creator Rejection] Unauthorized attempt', {
        userId: user.id,
        role: profile?.role,
      });
      return NextResponse.json(
        { error: 'Forbidden', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = rejectCreatorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          code: 'VALIDATION_ERROR',
          details: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { creatorId, reason } = validation.data;
    const adminSupabase = await requireAdminClient();

    const { data: creator, error: fetchError } = await adminSupabase
      .from('marketplace_creators')
      .select('id, status, user_id, profiles(email, full_name)')
      .eq('id', creatorId)
      .maybeSingle();

    if (fetchError || !creator) {
      logger.warn('[Creator Rejection] Creator not found', { creatorId });
      return NextResponse.json(
        { error: 'Creator not found', code: 'CREATOR_NOT_FOUND' },
        { status: 404 },
      );
    }

    if (creator.status === 'rejected') {
      return NextResponse.json(
        { error: 'Creator already rejected', code: 'ALREADY_REJECTED' },
        { status: 400 },
      );
    }

    const { error: updateError } = await adminSupabase
      .from('marketplace_creators')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', creatorId);

    if (updateError) {
      logger.error('[Creator Rejection] Update failed', updateError, { creatorId });
      throw updateError;
    }

    const creatorProfile = creator.profiles as any;
    let emailSent = false;

    if (creatorProfile?.email) {
      try {
        const result = await sendCreatorRejectionEmail({
          email: creatorProfile.email,
          name: creatorProfile.full_name || 'Applicant',
          reason,
        });

        emailSent = result.success;

        if (!result.success) {
          logger.error('[Creator Rejection] Email failed', undefined, {
            creatorId,
            email: creatorProfile.email,
            error: result.error,
          });
        }
      } catch (emailError) {
        logger.error('[Creator Rejection] Email error', emailError, {
          creatorId,
          email: creatorProfile.email,
        });
      }
    }

    try {
      await adminSupabase.from('audit_logs').insert({
        action: 'creator_rejected',
        actor_id: user.id,
        target_id: creatorId,
        metadata: {
          reason,
          creator_email: creatorProfile?.email,
          email_sent: emailSent,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditError) {
      logger.error('[Creator Rejection] Audit log failed', auditError);
    }

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? 'Creator rejected and notified via email'
        : 'Creator rejected but email notification failed',
    });
  } catch (err: any) {
    logger.error('[Creator Rejection] Failed', err);

    return NextResponse.json(
      {
        error: 'Failed to reject creator',
        code: 'REJECTION_FAILED',
        message: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/admin/creators/reject', _POST);
