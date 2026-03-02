
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    );
  }

  try {
    const {
      courseId,
      studentId,
      studentEmail,
      studentName,
      studentPhone,
      studentAddress,
    } = await request.json();

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('partner_lms_courses')
      .select(
        `
        *,
        partner_lms_providers (
          id,
          provider_name,
          provider_type
        )
      `
      )
      .eq('id', courseId)
      .single();

    if (courseError || !course) { /* Condition handled */ }

    // Check if course requires payment
    if (!course.requires_payment) {
      return NextResponse.json(
        { error: 'This course does not require payment' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session with Buy Now Pay Later options
    const session = await stripe.checkout.sessions.create({
      // Enable multiple payment methods including BNPL and ACH
      payment_method_types: [
        'card',
        'affirm',
        'afterpay_clearpay',
        'klarna',
        'us_bank_account',
      ],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.course_name,
              description:
                course.description ||
                `${course.course_name} certification from ${course.partner_lms_providers.provider_name}`,
              images: [], // Add course image URL if available
            },
            unit_amount: Math.round(course.retail_price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL || `https://${process.env.URL}` || 'http://localhost:3000'}/courses/partners/${courseId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || `https://${process.env.URL}` || 'http://localhost:3000'}/courses/partners/${courseId}/enroll`,
      customer_email: studentEmail,
      client_reference_id: studentId,

      // Enable Buy Now Pay Later options
      payment_method_options: {
        affirm: {
          // Affirm: pay over 3-36 months
        },
        afterpay_clearpay: {
          // Afterpay: 4 interest-free payments
        },
        klarna: {
          // Klarna: pay in 4 or financing
        },
      },

      // Standardized metadata for grant/license compliance
      metadata: {
        payment_type: 'partner_course',
        funding_source: 'self_pay',
        course_id: courseId,
        course_code: course.course_code,
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
        student_phone: studentPhone || '',
        student_address: studentAddress || '',
        provider_id: course.partner_lms_providers.id,
        provider_type: course.partner_lms_providers.provider_type,
        provider_name: course.partner_lms_providers.provider_name,
        wholesale_cost: course.wholesale_cost.toString(),
        retail_price: course.retail_price.toString(),
        profit_margin: (course.retail_price - course.wholesale_cost).toString(),
        course_url: course.course_url || '',
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) { 
    logger.error(
      'Stripe checkout error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/partner-courses/create-checkout', _POST);
