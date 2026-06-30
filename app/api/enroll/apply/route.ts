// Using Node.js runtime for SendGrid

import { z } from 'zod';
import { requireAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { orchestrateEnrollment } from '@/lib/enrollment/orchestrate-enrollment';
import { sendApplicationConfirmation, sendAdminApplicationNotification } from '@/lib/email/service';
import { checkRateLimit, verifyTurnstileToken } from '@/lib/turnstile';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { provisionAccount } from '@/lib/enrollment/provision-account';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;



const enrollApplySchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  phone: z
    .string()
    .regex(/^[\d\s\-()+ ]+$/)
    .min(10)
    .optional(),
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
        { message: 'Validation failed', fields: parsed.error.issues.map((i) => i.path.join('.')) },
        { status: 400 },
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
          { status: 429 },
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
          { status: 400 },
        );
      }
    }

    const supabase = await createClient();

    // Get or create user profile
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const studentId = user?.id;

    // If no authenticated user, create a lead record
    if (!studentId) {
      // Use admin client to bypass RLS for public form submission
      const adminClient = await requireAdminClient();

      if (!adminClient) {
        return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
      }

      // Write to canonical applications table (partner_inquiries table does not exist)
      const { data: appRow, error: appError } = await adminClient
        .from('applications')
        .insert({
          first_name: body.firstName,
          last_name: body.lastName,
          email: body.email,
          phone: body.phone || null,
          program_interest: body.preferredProgramId,
          program_slug: body.preferredProgramId,
          funding_source: body.fundingSource || null,
          referral_source: body.referralSource || null,
          notes: body.notes || null,
          status: 'submitted',
          source: 'enroll_apply',
        })
        .select('id')
        .maybeSingle();

      if (appError) {
        logger.error('[Enroll Apply] Failed to create application:', appError);
        throw appError;
      }

      logger.info('[New Application - Created]', {
        applicationId: appRow?.id,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        preferredProgramId: body.preferredProgramId,
        submittedAt: new Date().toISOString(),
      });

      // Provision auth account + send onboarding email with portal access link
      const programSlug = body.preferredProgramId;
      const { data: programRow } = await adminClient
        .from('programs')
        .select('title')
        .eq('slug', programSlug)
        .maybeSingle();
      const programName = programRow?.title || programSlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

      const provision = await provisionAccount({
        db: adminClient,
        email: body.email,
        fullName: `${body.firstName} ${body.lastName}`,
        phone: body.phone || null,
        programName,
        programSlug,
        postLoginUrl: '/onboarding/learner',
      });

      if (provision.error) {
        logger.warn('[Enroll Apply] provisionAccount non-fatal error', { error: provision.error, email: body.email });
      } else {
        logger.info('[Enroll Apply] Account provisioned', { userId: provision.userId, isNewUser: provision.isNewUser });
      }

      // Update application row with provisioned userId
      if (provision.userId && appRow?.id) {
        await adminClient
          .from('applications')
          .update({ user_id: provision.userId })
          .eq('id', appRow.id)
          .then(undefined, (err) => logger.warn('[Enroll Apply] Failed to link user_id to application', { err: String(err) }));
      }

      // Skip generic confirmation email — provisionAccount already sent the welcome/onboarding email
      return NextResponse.json(
        { message: 'Application received. Check your email for next steps to access your portal.' },
        { status: 200 },
      );
    } else {
      // Authenticated user - check enrollment approval status
      const { data: profile } = await supabase
        .from('profiles')
        .select('enrollment_status, program_holder_id')
        .eq('id', studentId)
        .maybeSingle();

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
          { status: 403 },
        );
      }

      // Program holder must be assigned
      if (!profile.program_holder_id) {
        return NextResponse.json(
          {
            message: 'No program holder assigned. Please contact support.',
          },
          { status: 403 },
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
          new Error(orchestrationResult.error || 'Unknown error'),
        );
        return NextResponse.json(
          {
            message: orchestrationResult.error || 'Enrollment failed. Please try again.',
          },
          { status: 500 },
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

    // Authenticated path: send confirmation + admin notification
    sendApplicationConfirmation(
      body.email,
      `${body.firstName} ${body.lastName}`,
      body.preferredProgramId,
    ).catch((err) => logger.error('[Email] Application confirmation failed:', err instanceof Error ? err : new Error(String(err))));

    sendAdminApplicationNotification(
      `${body.firstName} ${body.lastName}`,
      body.email,
      body.preferredProgramId,
      studentId || 'pending',
    ).catch((err) => logger.error('[Email] Admin notification failed:', err instanceof Error ? err : new Error(String(err))));

    return NextResponse.json(
      {
        message:
          'Application received. A member of the Elevate team will follow up within 24 hours.',
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('[Enroll Apply] Error:', error);
    return NextResponse.json(
      {
        message:
          'Something went wrong submitting your application. Please try again or call ' + PLATFORM_DEFAULTS.supportPhone + '.',
      },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/enroll/apply', _POST);
