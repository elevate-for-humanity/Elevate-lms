import { logger } from '@/lib/logger';
export const dynamic = 'force-dynamic';

// Using Node.js runtime for email compatibility
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendCreatorRejectionEmail } from '@/lib/email/sendgrid';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// Input validation schema
const rejectCreatorSchema = z.object({
  creatorId: z.string().uuid('Invalid creator ID'),
  reason: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters'),
});

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // 1. Authentication
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // 2. Authorization - check for admin or super_admin
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      logger.warn('[Creator Rejection] Unauthorized attempt', { userId: user.id, role: profile?.role });
      return NextResponse.json({ error: 'Forbidden', code: 'INSUFFICIENT_PERMISSIONS' }, { status: 403 });
    }

    // 3. Input validation
    const body = await req.json();
    const validation = rejectCreatorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          code: 'VALIDATION_ERROR',
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const { creatorId, reason } = validation.data;

    // 4. Use admin client to bypass RLS
    const adminSupabase = createAdminClient();

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // 5. Check if creator exists and get details
    const { data: creator, error: fetchError } = await adminSupabase
      .from('marketplace_creators')
      .select('id, status, user_id, profiles(email, full_name)')
      .eq('id', creatorId)
      .single();

    if (fetchError || !creator) {
      logger.warn('[Creator Rejection] Creator not found', { creatorId });
      return NextResponse.json(
        { error: 'Creator not found', code: 'CREATOR_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 6. Check if already rejected
    if (creator.status === 'rejected') {
      return NextResponse.json(
        { error: 'Creator already rejected', code: 'ALREADY_REJECTED' },
        { status: 400 }
      );
    }

    // 7. Update status (don't delete!)
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

    // 8. Send rejection email
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
          logger.error('[Creator Rejection] Email failed', {
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

    // 9. Audit log
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
      // Log but don't fail the request
      logger.error('[Creator Rejection] Audit log failed', auditError);
    }

    // 10. Success response

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
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/admin/creators/reject', _POST);
