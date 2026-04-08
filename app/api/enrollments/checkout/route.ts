/**
import { getAdminClient } from '@/lib/supabase/admin';
 * @deprecated Use canonical enrollment routes:
 *   - /api/enroll (student enrollment)
 *   - /api/enrollment/submit (comprehensive wizard)
 *   - /api/enrollments/create-enforced (admin/partner)
 */

import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@supabase/supabase-js';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  await hydrateProcessEnv();

  // Auth: require authenticated user — payments must be tied to a real session
  const { createClient: createAuthClient } = await import('@/lib/supabase/server');
  const authSupabase = await createAuthClient();
  const { data: { session: authSession } } = await authSupabase.auth.getSession();
  if (!authSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = getStripe();
  const supabase = getSupabase();
  
  if (!stripe || !supabase) {
    return NextResponse.json(
      { error: 'Stripe or Supabase not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await parseBody<Record<string, any>>(request);
    const { enrollmentId, userId, userEmail, userName } = body;

    if (!enrollmentId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: enrollmentId, userId, userEmail' },
        { status: 400 }
      );
    }

    // 1. Load enrollment with lock
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('program_enrollments')
      .select(
        'id, partner_course_id, payment_status, payment_mode, billing_lock'
      )
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      logger.error('Enrollment not found:', enrollmentError);
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // 2. Guard rails - must be self-pay partner course
    if (!enrollment.partner_course_id) {
      return NextResponse.json(
        { error: 'This enrollment is not a self-pay partner course' },
        { status: 400 }
      );
    }

    if (enrollment.payment_mode !== 'self_pay') {
      return NextResponse.json(
        { error: 'This enrollment is not self-pay' },
        { status: 400 }
      );
    }

    if (enrollment.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'This enrollment is already paid' },
        { status: 400 }
      );
    }

    if (enrollment.billing_lock) {
      return NextResponse.json(
        { error: 'Payment already in progress' },
        { status: 400 }
      );
    }

    // 3. Load partner course pricing
    const { data: partnerCourse, error: courseError } = await supabase
      .from('partner_lms_courses')
      .select('id, course_name, retail_price_cents, stripe_price_id')
      .eq('id', enrollment.partner_course_id)
      .single();

    if (courseError || !partnerCourse) {
      logger.error('Partner course not found:', courseError);
      return NextResponse.json(
        { error: 'Partner course not found' },
        { status: 404 }
      );
    }

    if (
      !partnerCourse.retail_price_cents ||
      partnerCourse.retail_price_cents <= 0
    ) {
      return NextResponse.json(
        { error: 'Invalid course pricing' },
        { status: 400 }
      );
    }

    // 4. Initiate billing lock (call existing RPC)
    const { data: lockResult, error: lockError } = await supabase.rpc(
      'initiate_enrollment_payment',
      {
        p_enrollment_id: enrollmentId,
        p_payment_mode: 'self_pay',
        p_amount_cents: partnerCourse.retail_price_cents,
      }
    );

    if (lockError) {
      logger.error('Failed to initiate payment:', lockError);
      return NextResponse.json(
        { error: 'Failed to initiate payment' },
        { status: 500 }
      );
    }

    // 5. Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card', 'klarna', 'afterpay_clearpay'],
      customer_email: userEmail,
      client_reference_id: enrollmentId,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/enrollment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/enrollment/canceled`,
      metadata: {
        enrollment_id: enrollmentId,
        user_id: userId,
        partner_course_id: partnerCourse.id,
        payment_type: 'enrollment',
      },
      line_items: [],
    };

    // Use stripe_price_id if available, otherwise create price on the fly
    if (partnerCourse.stripe_price_id) {
      sessionParams.line_items = [
        {
          price: partnerCourse.stripe_price_id,
          quantity: 1,
        },
      ];
    } else {
      sessionParams.line_items = [
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
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // 6. Update enrollment with session ID
    await supabase
      .from('program_enrollments')
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId);

    logger.info(`Created checkout session for enrollment: ${enrollmentId}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) { 
    logger.error(
      'Error creating enrollment checkout:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/enrollments/checkout', _POST);
