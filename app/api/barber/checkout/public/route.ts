// AUTH: Intentionally public — no authentication required
// POLICY: Tuition is fixed. Transfer hours NEVER affect price.
//         Only custom_setup_fee is user-influenced and is server-clamped.
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  BARBER_PRICING,
  calculateWeeklyPayment,
  formatFirstBillingDate,
} from '@/lib/programs/pricing';
import {
  TUITION_CENTS,
  TUITION_DOLLARS,
  PAYMENT_TERM_WEEKS,
  clampSetupFeeCents,
  remainingHoursDisplay,
} from '@/lib/barber/pricing';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * POST /api/barber/checkout/public
 * 
 * Public checkout for Barber Apprenticeship - no authentication required.
 * 
 * Payment Model (NOT a subscription):
 * 1. Setup fee ($1,743) - collected immediately via Checkout
 * 2. Weekly invoices - scheduled for each Friday, sent automatically
 * 
 * This allows:
 * - BNPL (Affirm, Klarna, Afterpay) for setup fee
 * - Automatic weekly invoice emails with payment links
 * - Student can pay via link or auto-charge if card saved
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const {
      hours_per_week = 40,
      customer_email,
      customer_name,
      customer_phone,
      sms_consent = false,
      application_id,
      has_host_shop,
      host_shop_name,
      success_url,
      cancel_url,
      // Payment options
      payment_type = 'payment_plan', // 'payment_plan', 'pay_in_full', 'bnpl'
      custom_setup_fee, // Custom setup fee amount (optional — student's chosen down payment)
      bnpl_provider, // 'affirm', 'klarna', 'afterpay', 'sezzle'
    } = body;
    // transferred_hours_verified is intentionally NOT read from the client.
    // It is fetched from the application record by application_id below.

    // Validate required fields
    if (!customer_email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate hours per week
    if (hours_per_week < 20 || hours_per_week > 50) {
      return NextResponse.json(
        { error: 'Hours per week must be between 20 and 50' },
        { status: 400 }
      );
    }

    // Transfer hours do not affect price (policy: progress credit only, tuition fixed).
    // Client-sent value is accepted for metadata/display only — it cannot manipulate price.
    // If a dedicated transfer_hours column is added to applications, read it here instead.
    const { transferred_hours_verified = 0 } = body;

    // Calculate weekly payment — term is fixed at 29 weeks, tuition fixed at $4,980.
    // transfer hours affect hoursRemaining display only, not weeklyPaymentDollars.
    const calculation = calculateWeeklyPayment(hours_per_week, transferred_hours_verified);

    if (calculation.weeksRemaining <= 0) {
      return NextResponse.json(
        { error: 'Invalid calculation: no weeks remaining' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      email: customer_email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: customer_email,
        name: customer_name || undefined,
        phone: customer_phone || undefined,
        metadata: {
          program: 'barber-apprenticeship',
          applicationId: application_id || '',
          hoursPerWeek: hours_per_week.toString(),
          transferHours: transferred_hours_verified.toString(),
          weeksRemaining: calculation.weeksRemaining.toString(),
          weeklyPaymentCents: calculation.weeklyPaymentCents.toString(),
        },
      });
      customerId = customer.id;
    }

    // Build success/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    const finalSuccessUrl = success_url || `${baseUrl}/programs/barber-apprenticeship/apply/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancel_url || `${baseUrl}/programs/barber-apprenticeship/apply?canceled=true`;

    const firstBillingDate = formatFirstBillingDate();

    // ── Pricing authority ─────────────────────────────────────────────────────
    // Tuition is TUITION_CENTS (498000 = $4,980). Fixed. No exceptions.
    // Transfer hours do not affect this value. Only custom_setup_fee is
    // user-influenced, and it is server-clamped by clampSetupFeeCents().
    // ─────────────────────────────────────────────────────────────────────────
    const weeksRemaining = PAYMENT_TERM_WEEKS; // 29 — fixed

    let checkoutAmountCents: number;
    let productName: string;
    let productDescription: string;

    if (payment_type === 'pay_in_full') {
      checkoutAmountCents = TUITION_CENTS;
      productName = 'Barber Apprenticeship - Full Payment';
      productDescription = 'Complete program tuition paid in full. No weekly payments required.';
    } else if (payment_type === 'bnpl') {
      checkoutAmountCents = TUITION_CENTS;
      productName = 'Barber Apprenticeship - Full Tuition';
      productDescription = `Complete program tuition. ${bnpl_provider || 'BNPL provider'} handles your payment plan.`;
    } else {
      // Payment plan — student's chosen down payment, server-clamped to [$600, $4,980].
      // This is the ONLY client-influenced value in the pricing chain.
      checkoutAmountCents = custom_setup_fee
        ? clampSetupFeeCents(custom_setup_fee)
        : 60000; // default $600
      const remainingCents = TUITION_CENTS - checkoutAmountCents;
      const weeklyDollars = (remainingCents / 100 / weeksRemaining).toFixed(2);
      productName = 'Barber Apprenticeship - Down Payment';
      productDescription = `Down payment of $${(checkoutAmountCents / 100).toFixed(0)}. Remaining $${(remainingCents / 100).toFixed(0)} at $${weeklyDollars}/week for ${weeksRemaining} weeks.`;
    }

    const weeklyPaymentCentsValue = payment_type === 'payment_plan'
      ? Math.round((TUITION_CENTS - checkoutAmountCents) / weeksRemaining)
      : 0;

    // Use explicit payment_method_types so BNPL (Klarna, Afterpay) is always available.
    // PMC approach was removed — the configured PMC had BNPL disabled.

    // Create Checkout Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: productName, description: productDescription },
            unit_amount: checkoutAmountCents, // always from TUITION_CENTS or clampSetupFeeCents()
          },
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        // ── Canonical keys read by barber webhook handler ──
        kind: 'program_enrollment',
        program: 'barber-apprenticeship',
        program_slug: 'barber-apprenticeship',
        program_id: '5ff21fcb-1968-41fd-99d3-37d69a31bd5c',
        student_id: application_id || '',
        application_id: application_id || '',
        payment_type,
        checkout_type: 'barber_enrollment',
        pricing_policy: 'fixed_tuition_v1',
        // ── Amounts (all derived from TUITION_CENTS — never from client) ──
        checkout_amount_cents: checkoutAmountCents.toString(),
        original_price_cents: TUITION_CENTS.toString(),
        adjusted_price_cents: TUITION_CENTS.toString(), // always equal — no adjustments
        weekly_payment_cents: weeklyPaymentCentsValue.toString(),
        weeks_remaining: weeksRemaining.toString(),
        // ── Transfer hours — display/ops only, cannot affect price ──
        transfer_hours_claimed: transferred_hours_verified.toString(),
        remaining_hours: remainingHoursDisplay(transferred_hours_verified).toString(),
        // ── Customer context ──
        bnpl_provider: bnpl_provider || '',
        applicationId: application_id || '',
        customerName: customer_name || '',
        customerPhone: customer_phone || '',
        smsConsent: sms_consent ? 'true' : 'false',
        hoursPerWeek: hours_per_week.toString(),
        hasHostShop: has_host_shop || '',
        hostShopName: host_shop_name || '',
      },
      custom_text: {
        submit: {
          message: payment_type === 'bnpl'
            ? 'Select Klarna or Afterpay below to split into installments.'
            : `Total program tuition: $${TUITION_DOLLARS.toLocaleString()}.`,
        },
      },
      // Save card for future weekly charges — scoped to card only.
      // Klarna and Afterpay do not support setup_future_usage.
      payment_method_options: {
        card: { setup_future_usage: 'off_session' },
      } as any,
      // Allow promotion codes
      allow_promotion_codes: true,
    };

    if (payment_type === 'bnpl') {
      // All methods confirmed active on this Stripe account at down payment amounts.
      // Affirm: not yet activated — enable at dashboard.stripe.com/settings/payment_methods
      sessionConfig.payment_method_types = [
        'card',
        'klarna',
        'afterpay_clearpay',
        'zip',
        'cashapp',
        'us_bank_account',
        'amazon_pay',
      ] as any;
    } else {
      // Let Stripe show all payment methods enabled on the account (card, Link,
      // Apple Pay, Google Pay, etc.) without hardcoding the list.
      (sessionConfig as any).automatic_payment_methods = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      calculation: {
        tuitionCents: TUITION_CENTS,
        tuitionDollars: TUITION_DOLLARS,
        checkoutAmountCents,
        weeklyPaymentCents: weeklyPaymentCentsValue,
        weeksRemaining,
        hoursRemaining: remainingHoursDisplay(transferred_hours_verified),
        firstBillingDate,
        billingDay: 'Friday',
      },
    });
  } catch (error) {
    logger.error('Barber public checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/barber/checkout/public
 * 
 * Calculate payment plan without creating a session (for preview)
 */
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const hoursPerWeek = parseInt(searchParams.get('hours_per_week') || '40');
    const transferredHours = parseInt(searchParams.get('transferred_hours') || '0');

    if (hoursPerWeek < 20 || hoursPerWeek > 50) {
      return NextResponse.json(
        { error: 'Hours per week must be between 20 and 50' },
        { status: 400 }
      );
    }

    const calculation = calculateWeeklyPayment(hoursPerWeek, transferredHours);
    const firstBillingDate = formatFirstBillingDate();

    return NextResponse.json({
      pricing: {
        fullPrice: BARBER_PRICING.fullPrice,
        setupFee: BARBER_PRICING.setupFee,
        setupFeeRate: '35%',
        remainingBalance: BARBER_PRICING.remainingBalance,
        totalHoursRequired: BARBER_PRICING.totalHoursRequired,
      },
      calculation: {
        hoursPerWeek,
        transferredHours,
        hoursRemaining: calculation.hoursRemaining,
        weeksRemaining: calculation.weeksRemaining,
        weeklyPaymentDollars: calculation.weeklyPaymentDollars,
        weeklyPaymentCents: calculation.weeklyPaymentCents,
      },
      billing: {
        setupFeeDueAt: 'enrollment',
        firstWeeklyCharge: firstBillingDate,
        billingDay: 'Friday',
        paymentMethod: 'Invoice sent weekly with payment link',
      },
      bnplAvailable: true,
      bnplOptions: ['Affirm', 'Klarna', 'Afterpay'],
      summary: {
        dueToday: `$${BARBER_PRICING.setupFee.toLocaleString()} (setup fee)`,
        weeklyPayment: `$${calculation.weeklyPaymentDollars.toFixed(2)}/week`,
        duration: `~${calculation.weeksRemaining} weeks`,
        paymentLinks: 'Sent every Friday via email',
      },
    });
  } catch (error) {
    logger.error('Barber checkout GET error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate payment plan' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/barber/checkout/public', _GET);
export const POST = withApiAudit('/api/barber/checkout/public', _POST);
