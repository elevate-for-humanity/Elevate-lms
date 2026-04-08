// AUTH: Intentionally public — no authentication required
// POLICY: Tuition is fixed. Transfer hours NEVER affect price.
//         Only custom_setup_fee is user-influenced and is server-clamped.
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { BARBER_PRICING, calculateWeeklyPayment } from '@/lib/programs/pricing';
import {
  TUITION_CENTS,
  PAYMENT_TERM_WEEKS,
  remainingHoursDisplay,
} from '@/lib/barber/pricing';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * POST /api/barber/checkout/embedded
 *
 * Creates a Stripe Checkout Session with ui_mode='embedded' for inline BNPL
 * (Klarna, Afterpay) without redirecting away from the application page.
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
      has_host_shop,
      host_shop_name,
    } = body;
    // transferred_hours_verified is intentionally NOT read from the client.
    // It is fetched from the application record by application_id below.

    if (!customer_email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (hours_per_week < 20 || hours_per_week > 50) {
      return NextResponse.json({ error: 'Hours per week must be between 20 and 50' }, { status: 400 });
    }

    // Transfer hours do not affect price (policy: progress credit only, tuition fixed).
    // Client-sent value is accepted for metadata/display only — it cannot manipulate price.
    const { transferred_hours_verified = 0 } = body;

    const stripe = getStripe();

    // ── Pricing authority ─────────────────────────────────────────────────────
    // Tuition is TUITION_CENTS (498000 = $4,980). Fixed. No exceptions.
    // Transfer hours do not affect this value.
    // ─────────────────────────────────────────────────────────────────────────
    const checkoutAmountCents = TUITION_CENTS;

    const calculation = calculateWeeklyPayment(
      hours_per_week,
      transferred_hours_verified,
    );

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
          program: 'barber-apprenticeship',
          sms_consent: sms_consent ? 'true' : 'false',
        },
      });
      customerId = customer.id;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    const returnUrl = `${baseUrl}/programs/barber-apprenticeship/apply/success?session_id={CHECKOUT_SESSION_ID}`;

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
              name: 'Barber Apprenticeship — Full Tuition',
              description: `Complete program tuition ($${TUITION_CENTS / 100}). Klarna or Afterpay handles your installments.`,
            },
            unit_amount: checkoutAmountCents, // TUITION_CENTS — never client-derived
          },
          quantity: 1,
        },
      ],
      payment_method_types: ['card', 'klarna', 'afterpay_clearpay'] as any,
      metadata: {
        // ── Canonical keys read by barber webhook handler ──
        kind: 'program_enrollment',
        program: 'barber-apprenticeship',
        program_slug: 'barber-apprenticeship',
        program_id: '5ff21fcb-1968-41fd-99d3-37d69a31bd5c',
        student_id: application_id || '',
        application_id: application_id || '',
        payment_type: 'bnpl',
        checkout_type: 'barber_enrollment',
        pricing_policy: 'fixed_tuition_v1',
        // ── Amounts (all from TUITION_CENTS — never client-derived) ──
        checkout_amount_cents: checkoutAmountCents.toString(),
        original_price_cents: TUITION_CENTS.toString(),
        adjusted_price_cents: TUITION_CENTS.toString(),
        weekly_payment_cents: '0', // BNPL provider handles installments
        weeks_remaining: PAYMENT_TERM_WEEKS.toString(),
        // ── Transfer hours — display/ops only, cannot affect price ──
        transfer_hours_claimed: transferred_hours_verified.toString(),
        remaining_hours: remainingHoursDisplay(transferred_hours_verified).toString(),
        // ── Customer context ──
        applicationId: application_id || '',
        customerName: customer_name || '',
        customerPhone: customer_phone || '',
        smsConsent: sms_consent ? 'true' : 'false',
        hoursPerWeek: hours_per_week.toString(),
        hasHostShop: has_host_shop || '',
        hostShopName: host_shop_name || '',
      },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    logger.error('Barber embedded checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
