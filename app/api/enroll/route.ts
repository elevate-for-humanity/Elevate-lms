export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { completeEnrollment } from '@/lib/enrollment/complete-enrollment';
import { applyRateLimit } from '@/lib/api/withRateLimit';

interface EnrollRequestBody {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  programCode?: string;
  courseId?: string;
  fundingInterest?: string;
  referralSource?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  let body: EnrollRequestBody;
  try {
    body = (await req.json()) as EnrollRequestBody;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON payload.' },
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
  } = body;

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
