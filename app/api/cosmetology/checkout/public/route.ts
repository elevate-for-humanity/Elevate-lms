// PUBLIC ROUTE: public cosmetology program checkout
// AUTH: Intentionally public — no authentication required
// POLICY: Tuition is fixed at $4,980. Never read price from client input.
//         Only custom_setup_fee is user-influenced and is server-clamped.
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import {
  TUITION_CENTS,
  TUITION_DOLLARS,
  PAYMENT_TERM_WEEKS,
  COSMETOLOGY_PROGRAM_ID,
  COSMETOLOGY_COURSE_ID,
  clampSetupFeeCents,
} from '@/lib/cosmetology/pricing';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getStripeMethodsForAmount, ACTIVE_BNPL_PROVIDERS } from '@/lib/bnpl-config';
import { formatFirstBillingDate } from '@/lib/programs/pricing';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

async function _POST(request: NextRequest) {
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
      success_url,
      cancel_url,
      payment_type = 'payment_plan', // 'payment_plan' | 'pay_in_full' | 'bnpl'
      custom_setup_fee,
      bnpl_provider,
    } = body;

    if (!customer_email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 });

    const customers = await stripe.customers.list({ email: customer_email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: customer_email,
        name: customer_name || undefined,
        phone: customer_phone || undefined,
        metadata: {
          program: 'cosmetology-apprenticeship',
          applicationId: application_id || '',
        },
      });
      customerId = customer.id;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
    const finalSuccessUrl = success_url || `${baseUrl}/programs/cosmetology-apprenticeship/apply/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancel_url || `${baseUrl}/programs/cosmetology-apprenticeship/apply?canceled=true`;

    let checkoutAmountCents: number;
    let productName: string;
    let productDescription: string;

    if (payment_type === 'pay_in_full') {
      checkoutAmountCents = TUITION_CENTS;
      productName = 'Cosmetology Apprenticeship - Full Payment';
      productDescription = 'Complete program tuition paid in full. No weekly payments required.';
    } else if (payment_type === 'bnpl') {
      checkoutAmountCents = TUITION_CENTS;
      productName = 'Cosmetology Apprenticeship - Full Tuition';
      productDescription = `Complete program tuition. ${bnpl_provider || 'BNPL provider'} handles your payment plan.`;
    } else {
      checkoutAmountCents = custom_setup_fee
        ? clampSetupFeeCents(custom_setup_fee)
        : 25000; // default $250 minimum
      const remainingCents = TUITION_CENTS - checkoutAmountCents;
      const weeklyDollars = (remainingCents / 100 / PAYMENT_TERM_WEEKS).toFixed(2);
      productName = 'Cosmetology Apprenticeship - Down Payment';
      productDescription = `Down payment of $${(checkoutAmountCents / 100).toFixed(0)}. Remaining $${(remainingCents / 100).toFixed(0)} at $${weeklyDollars}/week for ${PAYMENT_TERM_WEEKS} weeks.`;
    }

    const weeklyPaymentCentsValue = payment_type === 'payment_plan'
      ? Math.round((TUITION_CENTS - checkoutAmountCents) / PAYMENT_TERM_WEEKS)
      : 0;

    const firstBillingDate = formatFirstBillingDate();

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: productName, description: productDescription },
          unit_amount: checkoutAmountCents,
        },
        quantity: 1,
      }],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        kind: 'program_enrollment',
        program: 'cosmetology-apprenticeship',
        program_slug: 'cosmetology-apprenticeship',
        program_id: COSMETOLOGY_PROGRAM_ID,
        course_id: COSMETOLOGY_COURSE_ID,
        student_id: application_id || '',
        application_id: application_id || '',
        payment_type,
        checkout_type: 'cosmetology_enrollment',
        pricing_policy: 'fixed_tuition_v1',
        checkout_amount_cents: checkoutAmountCents.toString(),
        original_price_cents: TUITION_CENTS.toString(),
        adjusted_price_cents: TUITION_CENTS.toString(),
        weekly_payment_cents: weeklyPaymentCentsValue.toString(),
        weeks_remaining: PAYMENT_TERM_WEEKS.toString(),
        bnpl_provider: bnpl_provider || '',
        applicationId: application_id || '',
        customerName: customer_name || '',
        customerPhone: customer_phone || '',
        smsConsent: sms_consent ? 'true' : 'false',
      },
      custom_text: {
        submit: {
          message: payment_type === 'bnpl'
            ? 'Select your preferred BNPL provider to split into installments.'
            : `Total program tuition: $${TUITION_DOLLARS.toLocaleString()}.`,
        },
      },
      payment_method_options: {
        card: { setup_future_usage: 'off_session' },
      } as any,
      allow_promotion_codes: true,
    };

    if (payment_type === 'bnpl') {
      sessionConfig.payment_method_types = getStripeMethodsForAmount(checkoutAmountCents / 100) as any;
    } else {
      sessionConfig.payment_method_types = ['card'] as any;
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
        weeksRemaining: PAYMENT_TERM_WEEKS,
        firstBillingDate,
        billingDay: 'Friday',
      },
    });
  } catch (error) {
    logger.error('Cosmetology public checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const firstBillingDate = formatFirstBillingDate();

    return NextResponse.json({
      pricing: {
        tuitionDollars: TUITION_DOLLARS,
        minDownPaymentDollars: 250,
        paymentTermWeeks: PAYMENT_TERM_WEEKS,
      },
      billing: {
        firstWeeklyCharge: firstBillingDate,
        billingDay: 'Friday',
      },
      bnplAvailable: true,
      bnplOptions: ACTIVE_BNPL_PROVIDERS.map(p => p.name),
    });
  } catch (error) {
    logger.error('Cosmetology checkout GET error:', error);
    return NextResponse.json({ error: 'Failed to get pricing' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/cosmetology/checkout/public', _GET);
export const POST = withApiAudit('/api/cosmetology/checkout/public', _POST);
