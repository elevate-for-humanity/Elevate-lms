import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Canonical checkout for an existing partner-course enrollment.
 *
 * This flow is intentionally separate from /api/checkout/learner because it
 * applies the enrollment billing lock RPC and prices from partner_lms_courses.
 */
async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  await hydrateProcessEnv();

  const { createClient: createAuthClient } = await import('@/lib/supabase/server');
  const authSupabase = await createAuthClient();
  const {
    data: { session: authSession },
  } = await authSupabase.auth.getSession();
  if (!authSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = getStripe();
  const supabase = await requireAdminClient();
  if (!stripe || !supabase) {
    return NextResponse.json({ error: 'Stripe or Supabase not configured' }, { status: 503 });
  }

  try {
    const body = await parseBody<Record<string, any>>(request);
    const { enrollmentId, userId, userEmail } = body;

    if (!enrollmentId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: enrollmentId, userId, userEmail' },
        { status: 400 },
      );
    }

    if (authSession.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('program_enrollments')
      .select('id, user_id, course_id, payment_status')
      .eq('id', enrollmentId)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      logger.error('Enrollment not found:', enrollmentError);
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.user_id && enrollment.user_id !== authSession.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!enrollment.course_id) {
      return NextResponse.json({ error: 'This enrollment is not linked to a course' }, { status: 400 });
    }
    if (enrollment.payment_status === 'paid') {
      return NextResponse.json({ error: 'This enrollment is already paid' }, { status: 400 });
    }

    const { data: partnerCourse, error: courseError } = await supabase
      .from('partner_lms_courses')
      .select('id, course_name, retail_price_cents, stripe_price_id')
      .eq('id', enrollment.course_id)
      .maybeSingle();

    if (courseError || !partnerCourse) {
      logger.error('Partner course not found:', courseError);
      return NextResponse.json({ error: 'Partner course not found' }, { status: 404 });
    }
    if (!partnerCourse.retail_price_cents || partnerCourse.retail_price_cents <= 0) {
      return NextResponse.json({ error: 'Invalid course pricing' }, { status: 400 });
    }

    const { error: lockError } = await supabase.rpc('initiate_enrollment_payment', {
      p_enrollment_id: enrollmentId,
      p_payment_mode: 'self_pay',
      p_amount_cents: partnerCourse.retail_price_cents,
    });

    if (lockError) {
      logger.error('Failed to initiate payment:', lockError);
      return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card', 'klarna', 'afterpay_clearpay'],
      customer_email: authSession.user.email || userEmail,
      client_reference_id: enrollmentId,
      success_url: `${siteUrl}/enrollment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/enrollment/canceled`,
      metadata: {
        enrollment_id: enrollmentId,
        user_id: authSession.user.id,
        partner_course_id: partnerCourse.id,
        payment_type: 'enrollment',
      },
      line_items: partnerCourse.stripe_price_id
        ? [{ price: partnerCourse.stripe_price_id, quantity: 1 }]
        : [
            {
              price_data: {
                currency: 'usd',
                unit_amount: partnerCourse.retail_price_cents,
                product_data: {
                  name: partnerCourse.course_name,
                  description: 'Partner course enrollment',
                },
              },
              quantity: 1,
            },
          ],
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    const { error: updateError } = await supabase
      .from('program_enrollments')
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .eq('user_id', authSession.user.id);

    if (updateError) {
      logger.error('Failed to persist enrollment checkout session:', updateError);
      return NextResponse.json({ error: 'Failed to persist checkout session' }, { status: 500 });
    }

    logger.info('Created partner-course checkout session', {
      enrollmentId,
      userId: authSession.user.id,
      sessionId: session.id,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error(
      'Error creating partner-course checkout:',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/checkout/partner-course', _POST);
