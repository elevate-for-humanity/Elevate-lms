// PUBLIC ROUTE: Stripe embedded checkout for cosmetology program
// AUTH: Intentionally public — no authentication required
// POLICY: Tuition is fixed. Transfer hours NEVER affect price.
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { TUITION_CENTS, PAYMENT_TERM_WEEKS, COSMETOLOGY_PROGRAM_ID, COSMETOLOGY_COURSE_ID } from '@/lib/cosmetology/pricing';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getStripeMethodsForAmount } from '@/lib/bnpl-config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

/**
 * POST /api/cosmetology/checkout/embedded
 *
 * Creates a Stripe Checkout Session with ui_mode='embedded' for inline BNPL.
 * Mirrors /api/barber/checkout/embedded — same flow, cosmetology program.
 *
 * Returns { clientSecret } which the client passes to <EmbeddedCheckout>.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const {
      customer_email,
      customer_name,
      customer_phone,
      sms_consent = false,
      application_id,
      hours_per_week = 40,
    } = body;

    if (!customer_email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
    }

    // Tuition is TUITION_CENTS (498000 = $4,980). Fixed. Never client-derived.
    const checkoutAmountCents = TUITION_CENTS;

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: customer_email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: customer_email,
        name: customer_name,
        phone: customer_phone,
        metadata: {
          application_id: application_id || '',
          program: 'cosmetology-apprenticeship',
          sms_consent: sms_consent ? 'true' : 'false',
        },
      });
      customerId = customer.id;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
    const returnUrl = `${baseUrl}/programs/cosmetology-apprenticeship/apply/success?session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      customer: customerId,
      mode: 'payment',
      return_url: returnUrl,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Cosmetology Apprenticeship — Full Tuition',
              description: `Complete program tuition ($${TUITION_CENTS / 100}). Your BNPL provider handles installments.`,
            },
            unit_amount: checkoutAmountCents,
          },
          quantity: 1,
        },
      ],
      payment_method_types: getStripeMethodsForAmount(TUITION_CENTS / 100) as any,
      metadata: {
        kind: 'program_enrollment',
        program: 'cosmetology-apprenticeship',
        program_slug: 'cosmetology-apprenticeship',
        program_id: COSMETOLOGY_PROGRAM_ID,
        course_id: COSMETOLOGY_COURSE_ID,
        student_id: application_id || '',
        application_id: application_id || '',
        payment_type: 'bnpl',
        checkout_type: 'cosmetology_enrollment',
        pricing_policy: 'fixed_tuition_v1',
        checkout_amount_cents: checkoutAmountCents.toString(),
        original_price_cents: TUITION_CENTS.toString(),
        adjusted_price_cents: TUITION_CENTS.toString(),
        weekly_payment_cents: '0',
        weeks_remaining: PAYMENT_TERM_WEEKS.toString(),
        hours_per_week: hours_per_week.toString(),
        customerName: customer_name || '',
        customerPhone: customer_phone || '',
        smsConsent: sms_consent ? 'true' : 'false',
      },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    logger.error('Cosmetology embedded checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
