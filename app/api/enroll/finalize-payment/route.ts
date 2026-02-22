
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

interface FinalizePaymentRequest {
  enrollmentId: string;
  paymentMode: 'sponsored' | 'self_pay' | 'employer' | 'scholarship';
}

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
        { status: 400 }
      );
    }

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await db
      .from('enrollments')
      .select(
        `
        *,
        course:courses(
          id,
          title,
          slug,
          partner_id,
          wholesale_cost_cents,
          retail_price_cents
        ),
        student:profiles!enrollments_user_id_fkey(
          id,
          email,
          full_name,
          phone
        )
      `
      )
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Verify enrollment is in correct status
    if (!['approved', 'ready_to_start'].includes(enrollment.status)) {
      return NextResponse.json(
        {
          error: `Enrollment must be approved before payment. Current status: ${enrollment.status}`,
        },
        { status: 400 }
      );
    }

    // Check if already paid
    if (enrollment.payment_status === 'paid') {
      return NextResponse.json(
        {
          error: 'Enrollment already paid',
          enrollmentId: enrollment.id,
        },
        { status: 400 }
      );
    }

    // Check if billing is locked (payment already initiated)
    if (enrollment.billing_lock) {
      return NextResponse.json(
        {
          error: 'Payment already initiated',
          lockedAt: enrollment.billing_lock_at,
        },
        { status: 400 }
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
      const { error: updateError } = await db
        .from('enrollments')
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
        return NextResponse.json(
          { error: 'Failed to process scholarship' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        paymentMode: 'scholarship',
        enrollmentId: enrollment.id,
        message: 'Scholarship enrollment activated',
      });
    } else {
      // employer mode - create invoice for employer
      const { data: enrollment } = await db
        .from('enrollments')
        .select('*, programs(*), users(*)')
        .eq('id', enrollmentId)
        .single();

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Enrollment not found' },
          { status: 404 }
        );
      }

      // Create Stripe invoice for employer
      const invoice = await stripe.invoices.create({
        customer: enrollment.employer_stripe_customer_id,
        collection_method: 'send_invoice',
        days_until_due: 30,
        metadata: {
          enrollment_id: enrollmentId,
          payment_mode: 'employer',
          program_id: enrollment.program_id,
          student_id: enrollment.user_id,
        },
      });

      // Add invoice item
      await stripe.invoiceItems.create({
        customer: enrollment.employer_stripe_customer_id,
        invoice: invoice.id,
        amount: Math.round((enrollment.programs?.price || 0) * 100),
        currency: 'usd',
        description: `Training: ${enrollment.programs?.title || 'Program'}`,
      });

      // Finalize and send invoice
      await stripe.invoices.finalizeInvoice(invoice.id);

      // Update enrollment with invoice ID
      await db
        .from('enrollments')
        .update({
          stripe_invoice_id: invoice.id,
          payment_status: 'pending',
        })
        .eq('id', enrollmentId);

      return NextResponse.json({
        success: true,
        invoice_id: invoice.id,
        invoice_url: invoice.hosted_invoice_url,
      });
    }

    // Lock enrollment for billing (prevents double-charging)
    const { error: lockError } = await supabase.rpc(
      'initiate_enrollment_payment',
      {
        p_enrollment_id: enrollmentId,
        p_payment_mode: paymentMode,
        p_amount_cents: amountCents,
      }
    );

    if (lockError) {
      logger.error('Error locking enrollment for payment:', lockError);
      return NextResponse.json(
        { error: 'Failed to initiate payment' },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
        wholesale_cost_cents:
          enrollment.course.wholesale_cost_cents?.toString() || '0',
        retail_price_cents:
          enrollment.course.retail_price_cents?.toString() || '0',
      },
      // Enable payment methods
      payment_method_types: ['card', 'affirm', 'klarna', 'afterpay_clearpay'],
      // Disable automatic tax for now
      automatic_tax: {
        enabled: true,
      },
    });

    if (!session.url) {
      // Unlock enrollment if session creation failed
      await db
        .from('enrollments')
        .update({
          billing_lock: false,
          billing_lock_reason: 'Session creation failed',
        })
        .eq('id', enrollmentId);

      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    // Update enrollment with stripe session ID
    await db
      .from('enrollments')
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
        err:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
