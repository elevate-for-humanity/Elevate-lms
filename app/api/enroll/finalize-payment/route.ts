/**
 * Finalize Enrollment Payment
 *
 * This endpoint creates a Stripe checkout session ONLY when enrollment is finalized.
 * It should be called when enrollment status transitions to 'approved' or 'ready_to_start'.
 *
 * Payment Modes:
 * - sponsored: Elevate pays partner (charge Elevate's saved payment method)
 * - self_pay: Student pays (charge student via checkout)
 * - employer: Employer pays (invoice or saved payment method)
 * - scholarship: No charge (mark as paid)
 */

import { NextResponse } from 'next/server';
import { getStripe, stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

interface FinalizePaymentRequest {
  enrollmentId: string;
  paymentMode: 'sponsored' | 'self_pay' | 'employer' | 'scholarship';
}

async function _POST(req: Request) {
  try {

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: FinalizePaymentRequest = await req.json();
    const { enrollmentId, paymentMode } = body;

    if (!enrollmentId || !paymentMode) {
      return NextResponse.json(
        { error: 'Missing required fields: enrollmentId, paymentMode' },
        { status: 400 },
      );
    }

    // Get enrollment details
    const { data: rawEnrollment, error: enrollmentError } = await supabase
      .from('program_enrollments')
      .select(
        `*, course:courses(id, title, slug, partner_id, wholesale_cost_cents, retail_price_cents)`,
      )
      .eq('id', enrollmentId)
      .maybeSingle();

    if (enrollmentError || !rawEnrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Hydrate student profile separately (user_id → auth.users, no FK to profiles)
    const { data: studentProfile } = rawEnrollment.user_id
      ? await supabase
          .from('profiles')
          .select('id, email, full_name, phone')
          .eq('id', rawEnrollment.user_id)
          .maybeSingle()
      : { data: null };
    const enrollment = { ...rawEnrollment, student: studentProfile ?? null };

    // Verify enrollment is in correct status
    if (!['approved', 'ready_to_start'].includes(enrollment.status)) {
      return NextResponse.json(
        {
          error: `Enrollment must be approved before payment. Current status: ${enrollment.status}`,
        },
        { status: 400 },
      );
    }

    // Check if already paid
    if (enrollment.payment_status === 'paid') {
      return NextResponse.json(
        {
          error: 'Enrollment already paid',
          enrollmentId: enrollment.id,
        },
        { status: 400 },
      );
    }

    // Check if billing is locked (payment already initiated)
    if (enrollment.billing_lock) {
      return NextResponse.json(
        {
          error: 'Payment already initiated',
          lockedAt: enrollment.billing_lock_at,
        },
        { status: 400 },
      );
    }

    // Determine amount based on payment mode
    let amountCents: number;
    let description: string;

    if (paymentMode === 'sponsored') {
      // Elevate pays wholesale cost to partner
      amountCents = enrollment.course.wholesale_cost_cents || 0;
      description = `Sponsored seat: ${enrollment.course.course_name}`;
    } else if (paymentMode === 'self_pay') {
      // Student pays retail price
      amountCents = enrollment.course.retail_price_cents || 0;
      description = `Enrollment: ${enrollment.course.course_name}`;
    } else if (paymentMode === 'scholarship') {
      // No charge - mark as paid immediately
      const { error: updateError } = await supabase
        .from('program_enrollments')
        .update({
          status: 'active',
          payment_status: 'paid',
          payment_mode: 'scholarship',
          paid_at: new Date().toISOString(),
          amount_paid_cents: 0,
        })
        .eq('id', enrollmentId);

      if (updateError) {
        logger.error('Error updating scholarship enrollment:', updateError);
        return NextResponse.json({ error: 'Failed to process scholarship' }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        paymentMode: 'scholarship',
        enrollmentId: enrollment.id,
        message: 'Scholarship enrollment activated',
      });
    } else if (paymentMode === 'employer') {
      const { data: sponsorship } = await supabase
        .from('employer_sponsorships')
        .select('employer_contact_email, employer_name, total_tuition')
        .eq('enrollment_id', enrollmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const employerEmail = sponsorship?.employer_contact_email?.trim();
      if (!employerEmail) {
        return NextResponse.json(
          {
            error:
              'Employer sponsorship with a contact email is required before employer-paid checkout',
          },
          { status: 400 },
        );
      }

      amountCents = sponsorship?.total_tuition
        ? Math.round(Number(sponsorship.total_tuition) * 100)
        : enrollment.course?.retail_price_cents || 0;
      description = `Employer-sponsored training: ${enrollment.course?.course_name ?? 'Program'}`;

      const { error: employerLockError } = await supabase.rpc('initiate_enrollment_payment', {
        p_enrollment_id: enrollmentId,
        p_payment_mode: paymentMode,
        p_amount_cents: amountCents,
      });

      if (employerLockError) {
        logger.error('Error locking employer enrollment for payment:', employerLockError);
        return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
      }

      const siteUrl = ((process.env.NEXT_PUBLIC_SITE_URL || '').trim() || PLATFORM_DEFAULTS.siteUrl);

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: employerEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: description,
                description: sponsorship?.employer_name
                  ? `Employer: ${sponsorship.employer_name}`
                  : undefined,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${siteUrl}/enroll/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/dashboard?enrollment_id=${enrollmentId}`,
        metadata: {
          kind: 'program_enrollment',
          payment_mode: 'employer',
          funding_source: 'employer_paid',
          enrollment_id: enrollmentId,
          user_id: enrollment.user_id,
          student_id: enrollment.user_id,
          program_id: enrollment.program_id,
        },
      });

      await supabase
        .from('program_enrollments')
        .update({
          stripe_checkout_session_id: session.id,
          payment_status: 'pending',
          payment_mode: 'employer',
        })
        .eq('id', enrollmentId);

      return NextResponse.json({
        ok: true,
        paymentMode: 'employer',
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    }

    // Lock enrollment for billing (prevents double-charging)
    const { error: lockError } = await supabase.rpc('initiate_enrollment_payment', {
      p_enrollment_id: enrollmentId,
      p_payment_mode: paymentMode,
      p_amount_cents: amountCents,
    });

    if (lockError) {
      logger.error('Error locking enrollment for payment:', lockError);
      return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
    }

    const siteUrl = ((process.env.NEXT_PUBLIC_SITE_URL || '').trim() || PLATFORM_DEFAULTS.siteUrl);

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: enrollment.student.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: enrollment.course.course_name,
              description: description,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/enroll/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/dashboard?enrollment_id=${enrollmentId}`,
      metadata: {
        // Standardized metadata for grant/license compliance
        payment_type: 'enrollment_finalize',
        funding_source: paymentMode === 'sponsored' ? 'sponsored' : 'self_pay',
        enrollment_id: enrollmentId,
        user_id: enrollment.user_id,
        course_id: enrollment.course.id,
        payment_mode: paymentMode,
        partner_id: enrollment.course.partner_id || '',
        wholesale_cost_cents: enrollment.course.wholesale_cost_cents?.toString() || '0',
        retail_price_cents: enrollment.course.retail_price_cents?.toString() || '0',
      },
      // Enable payment methods
      payment_method_types: ['card', 'klarna', 'afterpay_clearpay'],
      // Disable automatic tax for now
      automatic_tax: {
        enabled: true,
      },
    });

    if (!session.url) {
      // Unlock enrollment if session creation failed
      await supabase
        .from('program_enrollments')
        .update({
          billing_lock: false,
          billing_lock_reason: 'Session creation failed',
        })
        .eq('id', enrollmentId);

      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    // Update enrollment with stripe session ID
    await supabase
      .from('program_enrollments')
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq('id', enrollmentId);

    logger.info('Payment session created', {
      sessionId: session.id,
      enrollmentId: enrollment.id,
      paymentMode: paymentMode,
      amountCents: amountCents,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      enrollmentId: enrollment.id,
      paymentMode: paymentMode,
      amountCents: amountCents,
    });
  } catch (err: any) {
    logger.error('Payment finalization err:', err);
    return NextResponse.json(
      {
        err: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
export const POST = withRuntime(withApiAudit('/api/enroll/finalize-payment', _POST));
