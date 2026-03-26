import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  BARBER_PRICING,
  calculateWeeklyPayment,
  getBillingCycleAnchor,
  formatFirstBillingDate,
} from '@/lib/programs/pricing';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * POST /api/barber/checkout
 * 
 * Creates a Stripe Checkout session for Barber Apprenticeship enrollment.
 * 
 * Billing flow:
 * 1. Setup fee ($1,743) collected immediately at checkout
 * 2. Weekly payments start on the FOLLOWING Friday (never same-day)
 * 3. Weekly amount = $3,237 / weeks_remaining
 * 4. Subscription ends after weeks_remaining weeks
 * 
 * Friday billing rule:
 * - Mon-Thu enrollment: first charge upcoming Friday
 * - Friday enrollment: first charge next week's Friday (7 days later)
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      hours_per_week = 40, 
      transferred_hours_verified = 0,
      enrollment_id,
    } = body;

    // CHECK FOR EXISTING ACTIVE ENROLLMENT (prevent double enrollment)
    const { data: existingEnrollment } = await supabase
      .from('student_enrollments')
      .select('id, status, enrollment_state')
      .eq('student_id', user.id)
      .eq('program_slug', 'barber-apprenticeship')
      .in('status', ['enrolled', 'active', 'orientation_complete'])
      .maybeSingle();

    if (existingEnrollment) {
      return NextResponse.json({
        error: 'You already have an active enrollment',
        code: 'ENROLLMENT_EXISTS',
        enrollment_id: existingEnrollment.id,
        status: existingEnrollment.status,
        redirect: '/apprentice',
      }, { status: 409 }); // 409 Conflict
    }

    // Validate hours per week (realistic range for apprenticeship)
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

    // Get Stripe instance
    const stripe = getStripe();

    // Get or create Stripe customer
    let stripeCustomerId: string;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email,
        name: profile?.full_name || undefined,
        metadata: {
          user_id: user.id,
          program: 'barber-apprenticeship',
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // Get billing cycle anchor (following Friday at 10 AM Indianapolis)
    const billingCycleAnchor = getBillingCycleAnchor();
    const firstBillingDateFormatted = formatFirstBillingDate();

    // Create Checkout Session with subscription mode
    // Setup fee collected as one-time item, weekly payments as subscription
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card', 'klarna', 'afterpay_clearpay'],
      line_items: [
        // Setup fee (one-time) - collected immediately
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Barber Apprenticeship - Setup Fee (35%)',
              description: 'Enrollment setup fee - covers onboarding, registration support, employer coordination, and program setup. Non-refundable.',
            },
            unit_amount: BARBER_PRICING.setupFee * 100, // $1,743 in cents = 174300
          },
          quantity: 1,
        },
        // Weekly payment (recurring) - using quantity for variable amount
        // Price is $0.01, quantity = weekly_payment_cents
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Barber Apprenticeship - Weekly Payment',
              description: `Weekly payment billed every Friday for ~${calculation.weeksRemaining} weeks`,
            },
            unit_amount: 1, // $0.01 base unit
            recurring: {
              interval: 'week',
              interval_count: 1,
            },
          },
          quantity: calculation.weeklyPaymentCents, // e.g., 6474 for $64.74/week
        },
      ],
      subscription_data: {
        billing_cycle_anchor: billingCycleAnchor,
        metadata: {
          user_id: user.id,
          enrollment_id: enrollment_id || '',
          program: 'barber-apprenticeship',
          hours_per_week: hours_per_week.toString(),
          transferred_hours_verified: transferred_hours_verified.toString(),
          hours_remaining: calculation.hoursRemaining.toString(),
          weeks_remaining: calculation.weeksRemaining.toString(),
          weekly_payment_cents: calculation.weeklyPaymentCents.toString(),
          weekly_payment_dollars: calculation.weeklyPaymentDollars.toFixed(2),
          full_price: BARBER_PRICING.fullPrice.toString(),
          setup_fee: BARBER_PRICING.setupFee.toString(),
          remaining_balance: BARBER_PRICING.remainingBalance.toString(),
          first_billing_date: firstBillingDateFormatted,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/programs/barber-apprenticeship/enrollment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/programs/barber-apprenticeship?canceled=true`,
      metadata: {
        user_id: user.id,
        enrollment_id: enrollment_id || '',
        program: 'barber-apprenticeship',
        checkout_type: 'barber_enrollment',
      },
      // Custom text for clarity
      custom_text: {
        submit: {
          message: `Setup fee ($1,743) due today. Weekly payments ($${calculation.weeklyPaymentDollars.toFixed(2)}/week) begin ${firstBillingDateFormatted}.`,
        },
      },
    });

    // Store checkout session info for tracking
    await supabase.from('payment_sessions').insert({
      user_id: user.id,
      stripe_session_id: session.id,
      program_slug: 'barber-apprenticeship',
      amount_total: BARBER_PRICING.setupFee + calculation.weeklyPaymentDollars,
      setup_fee: BARBER_PRICING.setupFee,
      weekly_payment: calculation.weeklyPaymentDollars,
      weeks_remaining: calculation.weeksRemaining,
      hours_per_week,
      transferred_hours_verified,
      status: 'pending',
      billing_cycle_anchor: new Date(billingCycleAnchor * 1000).toISOString(),
      first_billing_date: firstBillingDateFormatted,
    }).catch(() => {
      // Table may not exist yet, continue anyway
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      calculation: {
        setupFee: BARBER_PRICING.setupFee,
        weeklyPayment: calculation.weeklyPaymentDollars,
        weeklyPaymentCents: calculation.weeklyPaymentCents,
        weeksRemaining: calculation.weeksRemaining,
        hoursRemaining: calculation.hoursRemaining,
        firstBillingDate: firstBillingDateFormatted,
        billingDay: 'Friday',
      },
    });
  } catch (error) {
    logger.error('Barber checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/barber/checkout
 * 
 * Calculate payment plan without creating a session (for preview)
 * Use this to show estimated payments before checkout
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
    const billingCycleAnchor = getBillingCycleAnchor();
    const firstBillingDateFormatted = formatFirstBillingDate();

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
      totalWeeklyPayments: calculation.totalWeeklyPayments,
    },
    billing: {
      setupFeeDueAt: 'enrollment',
      firstWeeklyCharge: firstBillingDateFormatted,
      billingDay: 'Friday',
      billingTime: '10:00 AM Indianapolis time',
      billingCycleAnchorUnix: billingCycleAnchor,
    },
    summary: {
      dueToday: `$${BARBER_PRICING.setupFee.toLocaleString()} (setup fee)`,
      weeklyPayment: `$${calculation.weeklyPaymentDollars.toFixed(2)}/week`,
      duration: `~${calculation.weeksRemaining} weeks`,
      firstCharge: firstBillingDateFormatted,
    },
  });
  } catch (error) {
    logger.error('Barber checkout GET error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate payment plan', details: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/barber/checkout', _GET);
export const POST = withApiAudit('/api/barber/checkout', _POST);
