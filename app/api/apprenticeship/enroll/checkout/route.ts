import { logger } from '@/lib/logger';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// Program-specific pricing (amounts in cents)
const PROGRAM_PRICING: Record<string, { full: number; deposit: number }> = {
  'barber-apprenticeship': {
    full: 498000,    // $4,980.00
    deposit: 99900,  // $999.00
  },
  'esthetician-apprenticeship': {
    full: 550000,    // $5,500.00
    deposit: 60000,  // $600.00 BNPL start
  },
  'cosmetology-apprenticeship': {
    full: 550000,    // $5,500.00
    deposit: 60000,  // $600.00 BNPL start
  },
  'nail-technician-apprenticeship': {
    full: 350000,    // $3,500.00
    deposit: 35000, // $350.00 BNPL start
  },
};

type PaymentOption = 'full' | 'deposit' | 'installment';

function getProgramPricing(programSlug: string): { full: number; deposit: number } {
  return PROGRAM_PRICING[programSlug] || PROGRAM_PRICING['barber-apprenticeship'];
}

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { application_id, payment_option } = body as {
      application_id: string;
      payment_option: PaymentOption;
    };

    // Validate payment option
    if (!['full', 'deposit', 'installment'].includes(payment_option)) {
      return NextResponse.json(
        { error: 'Invalid payment option. Must be: full, deposit, or installment' },
        { status: 400 },
      );
    }

    // CRITICAL: Verify application exists and is submitted
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, status, program_slug, user_id')
      .eq('id', application_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'No eligible application was found for this payment request.' },
        { status: 400 },
      );
    }

    if (application.status !== 'submitted' && application.status !== 'approved') {
      return NextResponse.json(
        { error: 'Application must be submitted before payment.' },
        { status: 400 },
      );
    }

    // Verify this is an apprenticeship program
    const apprenticeshipPrograms = [
      'barber-apprenticeship',
      'barber',
      'cosmetology-apprenticeship',
      'esthetician-apprenticeship',
      'nail-technician-apprenticeship',
    ];
    if (!apprenticeshipPrograms.includes(application.program_slug)) {
      return NextResponse.json(
        { error: 'This payment flow is for apprenticeship programs only.' },
        { status: 400 },
      );
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('program_enrollments')
      .select('id, status')
      .eq('application_id', application_id)
      .maybeSingle();

    if (
      existingEnrollment &&
      ['enrolled_pending_approval', 'active'].includes(existingEnrollment.status)
    ) {
      return NextResponse.json(
        { error: 'You are already enrolled in this program.' },
        { status: 400 },
      );
    }

    // Get user email for Stripe
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .maybeSingle();

    const customerEmail = profile?.email || user.email;
    
    // Get program-specific pricing
    const programSlug = application.program_slug || 'barber-apprenticeship';
    const programPricing = getProgramPricing(programSlug);
    const programLabel = programSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    const pricingConfig = {
      amount: payment_option === 'deposit' ? programPricing.deposit : programPricing.full,
      description: `${programLabel} - ${payment_option === 'deposit' ? 'BNPL Deposit' : payment_option === 'full' ? 'Full Payment' : 'Payment Plan'}`,
    };

    // Build Stripe Checkout Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: payment_option === 'installment' ? 'payment' : 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pricingConfig.description,
              description:
                'Payment secures your enrollment. Training access unlocks after approval and shop assignment.',
            },
            unit_amount: pricingConfig.amount,
          },
          quantity: 1,
        },
      ],
      // CRITICAL: Metadata for webhook processing
      metadata: {
        kind: 'apprenticeship_enrollment',
        program: programSlug,
        student_id: user.id,
        application_id: application_id,
        payment_option: payment_option,
        enrollment_flow: 'self_pay',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/enroll/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/enroll/payment?application_id=${application_id}&program=${programSlug}&canceled=true`,
      // Enable installments/BNPL for installment option
      ...(payment_option === 'installment' && {
        payment_method_types: ['card', 'klarna', 'afterpay_clearpay'],
      }),
    };

    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 });
    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Log the checkout attempt
    await supabase.from('payment_logs').insert({
      user_id: user.id,
      application_id: application_id,
      stripe_session_id: session.id,
      payment_option: payment_option,
      amount: pricingConfig.amount,
      status: 'checkout_started',
      metadata: sessionConfig.metadata,
    });

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    logger.error('Apprenticeship checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/apprenticeship/enroll/checkout', _POST);
