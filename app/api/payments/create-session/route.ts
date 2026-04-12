

import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';



import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

interface CheckoutRequest {
  programId: string;
  paymentType?: 'full' | 'plan';
  preferredMethod?: string;
  couponCode?: string;
}

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      {
        error: 'Payment system is currently unavailable',
        message: 'Please contact support at 317-314-3757',
        code: 'STRIPE_NOT_CONFIGURED',
      },
      { status: 503 }
    );
  }

  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please sign in to continue with payment',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CheckoutRequest = await request.json();
    const {
      programId,
      paymentType = 'full',
      preferredMethod,
      couponCode,
    } = body;

    // Validate required fields
    if (!programId) {
      return NextResponse.json(
        {
          error: 'Program ID is required',
          code: 'MISSING_PROGRAM_ID',
        },
        { status: 400 }
      );
    }

    // Get program details from database
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      return NextResponse.json(
        {
          error: 'Program not found',
          message: 'The requested program does not exist',
          code: 'PROGRAM_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const price = program.tuition || 0;

    // Validate price
    if (price <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid program price',
          message: 'This program is free or has no price set',
          code: 'INVALID_PRICE',
        },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    let customerId: string | undefined = profile?.stripe_customer_id;

    if (!customerId && profile?.email) {
      try {
        const customer = await stripe.customers.create({
          email: profile.email,
          name: profile.full_name || undefined,
          metadata: {
            user_id: user.id,
            source: 'elevate_for_humanity',
          },
        });

        customerId = customer.id;

        // Save customer ID to database
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customer.id })
          .eq('id', user.id);
      } catch (customerError) {
          logger.error("Unhandled error", customerError instanceof Error ? customerError : undefined);
      }
    }

    // Configure payment methods based on amount
    const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
      ['card', 'link'];

    // Add BNPL options based on amount
    // Using Klarna, Afterpay, Zip for BNPL
    if (price >= 35 && price <= 1000) {
      paymentMethodTypes.push('klarna', 'afterpay_clearpay');
    }
    if (price <= 7500) {
      paymentMethodTypes.push('cashapp');
    }

    // Add bank account and PayPal
    paymentMethodTypes.push('us_bank_account', 'paypal');

    // Base URL for redirects
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    // Look up the most recent application for this user+program so we can
    // embed application_id in metadata — required for reconciliation.
    const { data: application } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('program_id', programId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Common session configuration
    const commonConfig: Partial<Stripe.Checkout.SessionCreateParams> = {
      payment_method_types: paymentMethodTypes,
      customer: customerId,
      client_reference_id: user.id,
      success_url: `${baseUrl}/enroll/success?session_id={CHECKOUT_SESSION_ID}&program=${program.slug}`,
      cancel_url: `${baseUrl}/programs/${program.slug}/enroll`,
      metadata: {
        kind: 'program_enrollment',
        program_id: programId,
        program_name: program.title || program?.title || program?.name,
        program_slug: program.slug,
        payment_type: paymentType,
        user_id: user.id,
        student_id: user.id,
        user_email: profile?.email || '',
        // application_id enables reconciliation — present when application exists
        ...(application?.id ? { application_id: application.id } : {}),
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      custom_text: {
        submit: {
          message: 'Start your career transformation today!',
        },
      },
    };

    let sessionConfig: Stripe.Checkout.SessionCreateParams;

    // Configure based on payment type
    if (paymentType === 'plan' && price >= 500) {
      // Payment Plan - 4 monthly installments
      const monthlyAmount = Math.ceil(price / 4);

      sessionConfig = {
        ...commonConfig,
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${program.title || program?.title || program?.name} - Payment Plan`,
                description: `4-month payment plan for ${program.title || program?.title || program?.name}. Total: $${price}`,
                images: program.image_url ? [program.image_url] : undefined,
                metadata: {
                  program_id: programId,
                  payment_type: 'plan',
                },
              },
              unit_amount: monthlyAmount * 100,
              recurring: {
                interval: 'month',
                interval_count: 1,
              },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            program_id: programId,
            program_name: program.title || program?.title || program?.name,
            total_amount: price.toString(),
            installments: '4',
            installment_amount: monthlyAmount.toString(),
            payment_type: 'plan',
          },
          description: `${program.title || program?.title || program?.name} - 4 Monthly Payments`,
        },
      } as Stripe.Checkout.SessionCreateParams;
    } else {
      // One-time Payment
      sessionConfig = {
        ...commonConfig,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: program.title || program?.title || program?.name,
                description: `Enrollment in ${program.title || program?.title || program?.name} training program`,
                images: program.image_url ? [program.image_url] : undefined,
                metadata: {
                  program_id: programId,
                  payment_type: 'full',
                },
              },
              unit_amount: price * 100,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: {
            program_id: programId,
            program_name: program.title || program?.title || program?.name,
            user_id: user.id,
            payment_type: 'full',
          },
          description: `${program.title || program?.title || program?.name} - Full Payment`,
        },
      } as Stripe.Checkout.SessionCreateParams;
    }

    // Apply coupon if provided
    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          sessionConfig.discounts = [{ coupon: couponCode }];
        }
      } catch (couponError) {
          logger.error("Unhandled error", couponError instanceof Error ? couponError : undefined);
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Log payment attempt in database
    try {
      await supabase.from('payment_logs').insert({
        user_id: user.id,
        program_id: programId,
        session_id: session.id,
        amount: price,
        payment_type: paymentType,
        status: 'pending',
        stripe_customer_id: customerId,
        metadata: {
          program_name: program.title || program?.title || program?.name,
          program_slug: program.slug,
          preferred_method: preferredMethod,
        },
      });
    } catch (logError) {
        logger.error("Unhandled error", logError instanceof Error ? logError : undefined);
    }

    // Return checkout URL
    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      amount: price,
      paymentType,
    });
  } catch (err: any) {
    // Error: $1

    // Handle specific Stripe errors
    if (err.type === 'StripeCardError') {
      return NextResponse.json(
        {
          err: 'Card err',
          message: toErrorMessage(err),
          code: 'CARD_ERROR',
        },
        { status: 400 }
      );
    }

    if (err.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: toErrorMessage(err),
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    if (err.type === 'StripeAPIError') {
      return NextResponse.json(
        {
          error: 'Payment system error',
          message:
            'Our payment system is temporarily unavailable. Please try again.',
          code: 'API_ERROR',
        },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Payment processing failed',
        message:
          'An unexpected error occurred. Please try again or contact support at 317-314-3757',
        code: 'UNKNOWN_ERROR',
        details:
          process.env.NODE_ENV === 'development'
            ? toErrorMessage(err)
            : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve session status
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
if (!stripe) {
    return NextResponse.json(
      { error: 'Payment system not configured' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      customer_email: session.customer_details?.email,
    });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/payments/create-session', _GET);
export const POST = withApiAudit('/api/payments/create-session', _POST);
