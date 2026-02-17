/**
 * @deprecated Use canonical enrollment routes:
 *   - /api/enroll (student enrollment)
 *   - /api/enrollment/submit (comprehensive wizard)
 *   - /api/enrollments/create-enforced (admin/partner)
 */
/**
 * CANONICAL ENROLLMENT CHECKOUT ENDPOINT
 * 
 * This is the SOURCE OF TRUTH for program enrollments.
 * All "Enroll" CTAs should route through this endpoint.
 * 
 * Creates Stripe Checkout Sessions with required metadata:
 * - payment_type: 'enrollment'
 * - enrollment_id, program_id, program_slug
 * - student info (first_name, last_name, email)
 * 
 * The webhook at /api/webhooks/stripe/route.ts expects this metadata
 * to properly process enrollment payments.
 * 
 * Payment Links are supported via fallback handler but should NOT be
 * used for enrollments - they lack guaranteed metadata.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

interface CheckoutRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  programSlug: string;
}

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const body: CheckoutRequest = await req.json();
    const { firstName, lastName, email, phone, programSlug } = body;

    if (!firstName || !lastName || !email || !programSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get program details
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name, slug, total_cost')
      .eq('slug', programSlug)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Get or create Stripe price for this program
    const amount = program.total_cost
      ? Math.round(Number(program.total_cost) * 100)
      : 498000; // Default $4,980

    // Create or get user profile
    let userId: string | null = null;

    // Check if user exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
    }

    // Create application record
    const { data: application, error: appError } = await supabase
      .from('applications')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        phone: phone ?? null,
        program_id: programSlug,
        status: 'pending_payment',
      })
      .select('id')
      .single();

    if (appError) {
      logger.error('Application creation error', appError);
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      );
    }

    // Create pending enrollment record (will be activated after payment)
    let enrollmentId = application.id; // Default to application ID
    
    if (userId) {
      const { data: enrollment } = await supabase
        .from('program_enrollments')
        .insert({
          student_id: userId,
          program_id: program.id,
          funding_source: 'SELF_PAY',
          status: 'PENDING_PAYMENT',
        })
        .select('id')
        .single();
      
      if (enrollment) {
        enrollmentId = enrollment.id;
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email.toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: program.name,
              description: `Enrollment in ${program.name} program`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/enroll/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/apply?program=${programSlug}`,
      metadata: {
        // Standardized metadata for grant/license compliance
        payment_type: 'enrollment',
        funding_source: 'self_pay',
        student_id: userId || application.id,
        program_id: program.id,
        program_slug: program.slug,
        application_id: application.id,
        enrollment_id: enrollmentId,
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        phone: phone || '',
      },
      // Enable all payment methods including BNPL
      payment_method_types: ['card', 'affirm', 'klarna', 'afterpay_clearpay'],
      // Enable automatic tax if configured
      automatic_tax: {
        enabled: true,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    // Update application with stripe session ID
    await supabase
      .from('applications')
      .update({
        stripe_session_id: session.id,
      })
      .eq('id', application.id);

    logger.info('Checkout session created', {
      sessionId: session.id,
      applicationId: application.id,
      email: email.toLowerCase(),
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    logger.error('Checkout creation err', err);
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Internal server err' },
      { status: 500 }
    );
  }
}
