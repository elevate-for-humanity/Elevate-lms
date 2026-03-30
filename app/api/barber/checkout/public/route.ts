import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  BARBER_PRICING,
  calculateWeeklyPayment,
  formatFirstBillingDate,
} from '@/lib/programs/pricing';
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
      transferred_hours_verified = 0,
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
      custom_setup_fee, // Custom setup fee amount (optional)
      bnpl_provider, // 'affirm', 'klarna', 'afterpay', 'sezzle'
    } = body;

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

    // Calculate weekly payment based on schedule and transfer hours
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

    // Calculate adjusted price based on transfer hours
    const totalHoursRequired = BARBER_PRICING.totalHoursRequired || 2000;
    const hoursRemaining = Math.max(0, totalHoursRequired - transferred_hours_verified);
    const priceRatio = hoursRemaining / totalHoursRequired;
    const adjustedFullPrice = Math.round(BARBER_PRICING.fullPrice * priceRatio);
    const transferCredit = BARBER_PRICING.fullPrice - adjustedFullPrice;

    // Calculate checkout amount based on payment type
    let checkoutAmount: number;
    let productName: string;
    let productDescription: string;
    // Minimum down payment is $600 as advertised — never override with a percentage.
    const minSetupFee = BARBER_PRICING.minDownPayment; // $600
    const weeksRemaining = BARBER_PRICING.paymentTermWeeks; // fixed 29 weeks

    if (payment_type === 'pay_in_full') {
      // Pay in full with 5% discount
      checkoutAmount = Math.round(adjustedFullPrice * 0.95);
      productName = 'Barber Apprenticeship - Full Payment (5% Discount)';
      productDescription = transferred_hours_verified > 0
        ? `Adjusted tuition with ${transferred_hours_verified} transfer hours credit. No weekly payments.`
        : 'Complete program tuition paid in full. No weekly payments required.';
    } else if (payment_type === 'bnpl') {
      // BNPL - full adjusted amount, provider handles installments
      checkoutAmount = adjustedFullPrice;
      productName = 'Barber Apprenticeship - Full Tuition';
      productDescription = transferred_hours_verified > 0
        ? `Adjusted tuition ($${adjustedFullPrice}) with ${transferred_hours_verified} transfer hours. ${bnpl_provider || 'BNPL'} handles payments.`
        : `Complete program tuition. ${bnpl_provider || 'BNPL provider'} handles your payment plan.`;
    } else {
      // Payment plan — honour the student's chosen down payment.
      // Clamp: must be at least $600, at most the full adjusted price.
      const setupFee = custom_setup_fee
        ? Math.max(minSetupFee, Math.min(custom_setup_fee, adjustedFullPrice))
        : minSetupFee; // default $600
      checkoutAmount = setupFee;
      const remainingBalance = adjustedFullPrice - setupFee;
      const weeklyPayment = weeksRemaining > 0 ? Math.round((remainingBalance / weeksRemaining) * 100) / 100 : 0;
      productName = 'Barber Apprenticeship - Down Payment';
      productDescription = transferred_hours_verified > 0
        ? `Down payment. ${transferred_hours_verified} transfer hours applied. $${weeklyPayment}/week for ${weeksRemaining} weeks.`
        : `Down payment of $${setupFee}. Remaining $${remainingBalance} at $${weeklyPayment}/week for ${weeksRemaining} weeks.`;
    }

    // Determine which Payment Method Configuration to use based on environment
    // Live mode: pmc_1SczlEIRNf5vPH3Ai841igCB (has Klarna, Afterpay, Cash App, Apple Pay, Google Pay)
    // Test mode: requires a separate PMC configured in Stripe Dashboard for test mode
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
    const paymentMethodConfig = isTestMode
      ? process.env.STRIPE_PMC_BARBER_TEST || undefined // Falls back to automatic if not set
      : 'pmc_1SczlEIRNf5vPH3Ai841igCB';

    // Create Checkout Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: checkoutAmount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        program: 'barber-apprenticeship',
        programSlug: 'barber-apprenticeship',
        checkout_type: 'barber_enrollment',
        payment_type: payment_type,
        checkout_amount_cents: (checkoutAmount * 100).toString(),
        // Original and adjusted pricing
        original_price_cents: (BARBER_PRICING.fullPrice * 100).toString(),
        adjusted_price_cents: (adjustedFullPrice * 100).toString(),
        transfer_credit_cents: (transferCredit * 100).toString(),
        // Setup fee info
        custom_setup_fee: custom_setup_fee?.toString() || '',
        min_setup_fee_cents: (minSetupFee * 100).toString(),
        // Weekly payment info
        weeks_remaining: weeksRemaining.toString(),
        weekly_payment_cents: payment_type === 'payment_plan' 
          ? Math.round(((adjustedFullPrice - checkoutAmount) / weeksRemaining) * 100).toString()
          : '0',
        // BNPL
        bnpl_provider: bnpl_provider || '',
        // Webhook expects camelCase field names
        applicationId: application_id || '',
        customerName: customer_name || '',
        customerPhone: customer_phone || '',
        smsConsent: sms_consent ? 'true' : 'false',
        transferHours: transferred_hours_verified.toString(),
        hoursPerWeek: hours_per_week.toString(),
        weeksRemaining: calculation.weeksRemaining.toString(),
        weeklyPaymentCents: calculation.weeklyPaymentCents.toString(),
        weeklyPaymentDollars: calculation.weeklyPaymentDollars.toFixed(2),
        hasHostShop: has_host_shop || '',
        hostShopName: host_shop_name || '',
      },
      custom_text: {
        submit: {
          message: `Full tuition: $${BARBER_PRICING.fullPrice.toLocaleString()}. Use Affirm/Klarna/Afterpay to split into payments, or pay in full with card.`,
        },
      },
      // Save payment method for any remaining balance
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      // Allow promotion codes
      allow_promotion_codes: true,
    };

    // Add payment method configuration if available
    if (paymentMethodConfig) {
      sessionConfig.payment_method_configuration = paymentMethodConfig;
    }
    // If no PMC (test mode without config), Stripe uses Dashboard default settings

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      calculation: {
        setupFee: BARBER_PRICING.setupFee,
        weeklyPayment: calculation.weeklyPaymentDollars,
        weeklyPaymentCents: calculation.weeklyPaymentCents,
        weeksRemaining: calculation.weeksRemaining,
        hoursRemaining: calculation.hoursRemaining,
        firstBillingDate,
        billingDay: 'Friday',
        totalProgram: BARBER_PRICING.fullPrice,
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
