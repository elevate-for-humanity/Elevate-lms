import { logger } from '@/lib/logger';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Barber Apprenticeship pricing (configured in Stripe Dashboard)
const PRICING = {
  full: {
    amount: 498000, // $4,980.00 in cents
    description: 'Barber Apprenticeship - Full Payment',
  },
  deposit: {
    amount: 99900, // $999.00 deposit
    description: 'Barber Apprenticeship - Deposit',
  },
  installment: {
    amount: 498000, // Full amount, Stripe handles installments
    description: 'Barber Apprenticeship - Payment Plan',
  },
};

type PaymentOption = 'full' | 'deposit' | 'installment';

export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment system not configured' },
      { status: 503 }
    );
  }

  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
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
        { status: 400 }
      );
    }

    // CRITICAL: Verify application exists and is submitted
    const { data: application, error: appError } = await db
      .from('applications')
      .select('id, status, program_slug, user_id')
      .eq('id', application_id)
      .eq('user_id', user.id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found. You must apply before payment.' },
        { status: 400 }
      );
    }

    if (application.status !== 'submitted' && application.status !== 'approved') {
      return NextResponse.json(
        { error: 'Application must be submitted before payment.' },
        { status: 400 }
      );
    }

    // Verify this is an apprenticeship program
    const apprenticeshipPrograms = ['barber-apprenticeship', 'barber', 'cosmetology-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship'];
    if (!apprenticeshipPrograms.includes(application.program_slug)) {
      return NextResponse.json(
        { error: 'This payment flow is for apprenticeship programs only.' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await db
      .from('program_enrollments')
      .select('id, status')
      .eq('application_id', application_id)
      .single();

    if (existingEnrollment && ['enrolled_pending_approval', 'active'].includes(existingEnrollment.status)) {
      return NextResponse.json(
        { error: 'You are already enrolled in this program.' },
        { status: 400 }
      );
    }

    // Get user email for Stripe
    const { data: profile } = await db
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const customerEmail = profile?.email || user.email;
    const pricing = PRICING[payment_option];

    // Build Stripe Checkout Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: payment_option === 'installment' ? 'payment' : 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: pricing.description,
              description: 'Payment secures your enrollment. Training access unlocks after approval and shop assignment.',
            },
            unit_amount: pricing.amount,
          },
          quantity: 1,
        },
      ],
      // CRITICAL: Metadata for webhook processing
      metadata: {
        kind: 'apprenticeship_enrollment',
        program: 'barber_apprenticeship',
        student_id: user.id,
        application_id: application_id,
        payment_option: payment_option,
        enrollment_flow: 'self_pay',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/enroll/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/enroll/payment?application_id=${application_id}&canceled=true`,
      // Enable installments/BNPL for installment option
      ...(payment_option === 'installment' && {
        payment_method_types: ['card', 'affirm', 'klarna'],
      }),
    };

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Log the checkout attempt
    await db.from('payment_logs').insert({
      user_id: user.id,
      application_id: application_id,
      stripe_session_id: session.id,
      payment_option: payment_option,
      amount: pricing.amount,
      status: 'checkout_started',
      metadata: sessionConfig.metadata,
    });

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    });

  } catch (error) {
    logger.error('Apprenticeship checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
