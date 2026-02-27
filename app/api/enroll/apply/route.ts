export const dynamic = 'force-dynamic';

// Using Node.js runtime for Resend compatibility
export const maxDuration = 60;

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { orchestrateEnrollment } from '@/lib/enrollment/orchestrate-enrollment';
import {
  sendApplicationConfirmation,
  sendAdminApplicationNotification,
} from '@/lib/email/service';
import { checkRateLimit, verifyTurnstileToken } from '@/lib/turnstile';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const enrollApplySchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  phone: z.string().regex(/^[\d\s\-()+ ]+$/).min(10).optional(),
  preferredProgramId: z.string().min(1),
  fundingInterest: z.string().max(200).optional(),
  fundingSource: z.string().max(200).optional(),
  referralSource: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  turnstileToken: z.string().optional(),
});

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const rawBody = await req.json().catch(() => ({}));
    const parsed = enrollApplySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { message: `Validation failed: ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}` },
        { status: 400 }
      );
    }
    const body = parsed.data;

    // Rate limiting by email
    if (body.email) {
      const rateLimit = checkRateLimit(`enroll:${body.email}`, 3, 60000); // 3 per minute
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            message: 'Too many requests. Please try again in a minute.',
          },
          { status: 429 }
        );
      }
    }

    // Verify Turnstile token (if provided)
    if (body.turnstileToken) {
      const verification = await verifyTurnstileToken(body.turnstileToken);
      if (!verification.success) {
        return NextResponse.json(
          {
            message: verification.error || 'Verification failed',
          },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get or create user profile
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const studentId = user?.id;

    // If no authenticated user, create a lead record
    if (!studentId) {
      // Use admin client to bypass RLS for public form submission
      const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
      
      // Store as partner inquiry for now (can be migrated to dedicated applications table)
      const { data: inquiry, error: inquiryError } = await adminClient
        .from('partner_inquiries')
        .insert({
          name: `${body.firstName} ${body.lastName}`,
          email: body.email,
          phone: body.phone || null,
          message: `Student Application - Program: ${body.preferredProgramId}`,
          status: 'new',
        })
        .select()
        .single();

      if (inquiryError) {
        logger.error('[Enroll Apply] Failed to create inquiry:', inquiryError);
        throw inquiryError;
      }

      logger.info('[New Application - Lead Created]', {
        inquiryId: inquiry.id,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        preferredProgramId: body.preferredProgramId,
        submittedAt: new Date().toISOString(),
      });
    } else {
      // Authenticated user - check enrollment approval status
      const { data: profile } = await db
        .from('profiles')
        .select('enrollment_status, program_holder_id')
        .eq('id', studentId)
        .single();

      // Enrollment gate: must be approved or active
      if (
        !profile?.enrollment_status ||
        !['approved', 'active'].includes(profile.enrollment_status)
      ) {
        return NextResponse.json(
          {
            message:
              'You must be approved for enrollment before you can enroll. Please contact your program coordinator.',
          },
          { status: 403 }
        );
      }

      // Program holder must be assigned
      if (!profile.program_holder_id) {
        return NextResponse.json(
          {
            message: 'No program holder assigned. Please contact support.',
          },
          { status: 403 }
        );
      }

      // Orchestrate enrollment (idempotent)
      const orchestrationResult = await orchestrateEnrollment({
        studentId,
        programId: body.preferredProgramId,
        programHolderId: profile.program_holder_id,
        fundingSource: body.fundingSource || 'WIOA',
        idempotencyKey: `enrollment-${studentId}-${body.preferredProgramId}`,
      });

      if (!orchestrationResult.success) {
        logger.error(
          '[Enroll Apply] Orchestration failed:',
          new Error(orchestrationResult.error || 'Unknown error')
        );
        return NextResponse.json(
          {
            message:
              orchestrationResult.error ||
              'Enrollment failed. Please try again.',
          },
          { status: 500 }
        );
      }

      logger.info('[New Application - Enrollment Orchestrated]', {
        enrollmentId: orchestrationResult.enrollmentId,
        studentId,
        programId: body.preferredProgramId,
        programHolderId: profile.program_holder_id,
        stepsCreated: orchestrationResult.stepsCreated,
        submittedAt: new Date().toISOString(),
      });
    }

    // Send confirmation email to applicant (non-blocking)
    sendApplicationConfirmation(
      body.email,
      `${body.firstName} ${body.lastName}`,
      body.preferredProgramId
    ).catch((err) =>
      logger.error('[Email] Application confirmation failed:', err)
    );

    // Send notification to admin team (non-blocking)
    sendAdminApplicationNotification(
      `${body.firstName} ${body.lastName}`,
      body.email,
      body.preferredProgramId,
      studentId || 'pending'
    ).catch((err) => logger.error('[Email] Admin notification failed:', err));

    return NextResponse.json(
      {
        message:
          'Application received. A member of the Elevate team will follow up within 24 hours.',
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('[Enroll Apply] Error:', error);
    return NextResponse.json(
      {
        message:
          'Something went wrong submitting your application. Please try again or call (317) 314-3757.',
      },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/enroll/apply', _POST);
