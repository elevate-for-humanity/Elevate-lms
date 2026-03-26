/**
 * CANONICAL PROGRAM ENROLLMENT CHECKOUT
 * 
 * This is the single, canonical endpoint for ALL program enrollments.
 * Every program (Barber, HVAC, CPR, etc.) must use this endpoint.
 * 
 * Metadata contract:
 *   kind: 'program_enrollment'
 *   program_id: UUID from programs.id
 *   student_id: auth user id
 *   program_slug: slug for routing
 *   funding_source: 'self_pay' | 'workone' | 'wioa' | 'grant' | 'employer'
 * 
 * The webhook handler provisions student_enrollments on checkout.session.completed.
 */


import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

type FundingSource = 'self_pay' | 'workone' | 'wioa' | 'grant' | 'employer';

interface CheckoutRequest {
  program_id: string;
  funding_source?: FundingSource;
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    
    // Require authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CheckoutRequest = await request.json();
    const { program_id, funding_source = 'self_pay' } = body;

    if (!program_id) {
      return NextResponse.json(
        { error: 'program_id is required' },
        { status: 400 }
      );
    }

    // Validate funding_source
    const validFundingSources: FundingSource[] = ['self_pay', 'workone', 'wioa', 'grant', 'employer'];
    if (!validFundingSources.includes(funding_source)) {
      return NextResponse.json(
        { error: 'Invalid funding_source' },
        { status: 400 }
      );
    }

    // Get program details
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, title, slug, total_cost, status')
      .eq('id', program_id)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    if (program.status !== 'active') {
      return NextResponse.json(
        { error: 'Program is not available for enrollment' },
        { status: 400 }
      );
    }

    // Check for existing active enrollment
    const { data: existingEnrollment } = await supabase
      .from('student_enrollments')
      .select('id, status')
      .eq('student_id', user.id)
      .eq('program_id', program_id)
      .in('status', ['active', 'pending'])
      .single();

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this program' },
        { status: 409 }
      );
    }

    // Calculate amount based on funding source
    const stickerPrice = program.total_cost ? Number(program.total_cost) : 0;
    let amountToCharge = stickerPrice;

    // Funded enrollments charge $0 (or use 100% coupon)
    if (funding_source !== 'self_pay') {
      amountToCharge = 0;
    }

    const amountCents = Math.round(amountToCharge * 100);

    // Get user profile for customer details
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const customerEmail = profile?.email || user.email || '';

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (amountCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: program.title,
            description: `Enrollment in ${program.title}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      });
    } else {
      // For $0 checkouts, create a free line item
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: program.title,
            description: `Enrollment in ${program.title} (Funded by ${funding_source.replace('_', ' ')})`,
          },
          unit_amount: 0,
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout session with canonical metadata
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      customer_email: customerEmail,
      line_items: lineItems,
      success_url: `${siteUrl}/enroll/success?session_id={CHECKOUT_SESSION_ID}&program=${program.slug}`,
      cancel_url: `${siteUrl}/programs/${program.slug}`,
      metadata: {
        // CANONICAL METADATA CONTRACT
        kind: 'program_enrollment',
        program_id: program.id,
        student_id: user.id,
        program_slug: program.slug,
        funding_source: funding_source,
      },
      payment_intent_data: amountCents > 0 ? {
        metadata: {
          kind: 'program_enrollment',
          program_id: program.id,
          student_id: user.id,
        },
      } : undefined,
    };

    // Only add payment method types for paid checkouts
    if (amountCents > 0) {
      sessionParams.payment_method_types = ['card'];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    logger.info('Program enrollment checkout created', {
      sessionId: session.id,
      programId: program.id,
      programSlug: program.slug,
      studentId: user.id,
      fundingSource: funding_source,
      amountCents,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    logger.error('Program enrollment checkout error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * GET - Return API documentation
 */
async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return NextResponse.json({
    name: 'Program Enrollment Checkout API',
    description: 'Canonical endpoint for all program enrollments',
    method: 'POST',
    authentication: 'Required (user must be logged in)',
    request: {
      program_id: 'UUID - Required - The program ID from programs.id',
      funding_source: 'Optional - One of: self_pay, workone, wioa, grant, employer (default: self_pay)',
    },
    response: {
      success: 'boolean',
      url: 'Stripe checkout URL to redirect user',
      session_id: 'Stripe session ID for tracking',
    },
    webhook_provisioning: 'On checkout.session.completed, student_enrollments is created with status=active',
  });
}
export const GET = withApiAudit('/api/programs/enroll/checkout', _GET);
export const POST = withApiAudit('/api/programs/enroll/checkout', _POST);
