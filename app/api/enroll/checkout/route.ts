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

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const enrollCheckoutSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  phone: z.string().regex(/^[\d\s\-()+ ]+$/).min(10).optional(),
  programSlug: z.string().min(1).max(100),
  fundingSource: z.enum(['self_pay', 'wioa', 'wrg', 'other_funded']).optional(),
});

async function _POST(req: Request) {
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

    const body = await req.json();
    const parsed = enrollCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }
    const { firstName, lastName, email, phone, programSlug, fundingSource } = parsed.data;

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }

    // Get program details
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name, slug, total_cost, credentialing_cost')
      .eq('slug', programSlug)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Funded students (WIOA, WRG) only pay for external credentials (OSHA 10 + CPR).
    // Self-pay students pay the full program cost.
    const isFunded = fundingSource && fundingSource !== 'self_pay';
    const chargeAmount = isFunded && program.credentialing_cost
      ? Number(program.credentialing_cost)
      : Number(program.total_cost) || 4980;
    const amount = Math.round(chargeAmount * 100); // cents

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
        program_interest: programSlug,
        city: 'Not provided',
        zip: '00000',
        status: 'pending_payment',
        source: 'enrollment-checkout',
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

    if (!stripe) {
      logger.error('Stripe not configured — STRIPE_SECRET_KEY missing');
      return NextResponse.json(
        { error: 'Payment processing is temporarily unavailable. Please contact admissions at info@elevateforhumanity.org.' },
        { status: 503 }
      );
    }

    // Create Stripe Checkout session
    // BNPL methods (afterpay_clearpay, klarna) are enabled for self-pay enrollments.
    // Afterpay: splits into 4 interest-free payments, min $1, max $4,000 per transaction.
    // Klarna: pay later / pay in installments, available for US customers.
    // Both require currency=usd and shipping_address_collection or explicit address.
    const isBnplEligible = !isFunded && amount >= 100; // BNPL min $1.00
    const paymentMethods: string[] = ['card'];
    if (isBnplEligible) {
      paymentMethods.push('afterpay_clearpay', 'klarna');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email.toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: isFunded
                ? `${program.name} — Credential Fees (OSHA 10 + CPR/First Aid)`
                : program.name,
              description: isFunded
                ? `CareerSafe OSHA 10-Hour Construction + CPR/AED/First Aid credentials. Program tuition covered by ${(fundingSource || '').toUpperCase()} funding.`
                : `Enrollment in ${program.name} — self-pay. Includes EPA 608 prep, OSHA 10-Hour, and ACT WorkKeys.`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: programSlug
        ? `${siteUrl}/programs/${programSlug}/apply/success?session_id={CHECKOUT_SESSION_ID}&provider=stripe`
        : `${siteUrl}/enroll/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: programSlug
        ? `${siteUrl}/programs/${programSlug}/apply?canceled=true&provider=stripe`
        : `${siteUrl}/apply?program=${programSlug}`,
      metadata: {
        payment_type: 'enrollment',
        kind: 'program_enrollment',
        funding_source: fundingSource || 'self_pay',
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
      payment_method_types: paymentMethods as any,
      // Required for Afterpay/Klarna — collect billing address
      billing_address_collection: isBnplEligible ? 'required' : 'auto',
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
export const POST = withApiAudit('/api/enroll/checkout', _POST);
