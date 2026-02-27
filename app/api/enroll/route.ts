export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { completeEnrollment } from '@/lib/enrollment/complete-enrollment';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const enrollSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  phone: z.string().regex(/^[\d\s\-()+ ]+$/).min(10).optional(),
  programCode: z.string().max(100).optional(),
  courseId: z.string().uuid().optional(),
  fundingInterest: z.string().max(200).optional(),
  referralSource: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON payload.' },
      { status: 400 }
    );
  }

  const parsed = enrollSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
      { status: 400 }
    );
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    programCode,
    courseId,
    fundingInterest,
    referralSource,
    notes,
  } = parsed.data;

  // If user is authenticated and enrolling in a course
  if (user && courseId) {
    try {
      const result = await completeEnrollment({
        userId: user.id,
        courseId,
        programId: programCode,
        paymentStatus: 'pending',
      });

      if (!result.success) {
        return NextResponse.json(
          { ok: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          ok: true,
          enrollmentId: result.enrollmentId,
          courseAccessUrl: result.courseAccessUrl,
          message: 'Successfully enrolled! You can now access the course.',
        },
        { status: 201 }
      );
    } catch (err: any) {
      logger.error(
        'Enrollment error',
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json(
        { ok: false, error: 'Failed to complete enrollment' },
        { status: 500 }
      );
    }
  }

  // Otherwise, create checkout session for payment (for non-authenticated users)
  if (!firstName || !lastName || !email || !programCode) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Missing required fields: firstName, lastName, email, programCode.',
      },
      { status: 400 }
    );
  }

  try {
    // Create Stripe checkout session
    const checkoutResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/enroll/checkout`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          programSlug: programCode,
        }),
      }
    );

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { checkoutUrl, sessionId } = await checkoutResponse.json();

    return NextResponse.json(
      {
        ok: true,
        checkoutUrl,
        sessionId,
        message: 'Redirecting to payment...',
        nextStep: 'payment',
      },
      { status: 201 }
    );
  } catch (err: any) {
    logger.error('Enrollment API error', err?.message ?? err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err?.message ??
          'Unexpected error while creating checkout. Please try again.',
      },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/enroll', _POST);
