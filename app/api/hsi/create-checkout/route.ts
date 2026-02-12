
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    );
  }

  try {
    const {
      courseType,
      studentId,
      studentEmail,
      studentName,
      studentPhone,
      studentAddress,
    } = await request.json();

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('hsi_course_products')
      .select('*')
      .eq('course_type', courseType)
      .single();

    if (courseError || !course) { /* Condition handled */ }

    // Create Stripe checkout session with Buy Now Pay Later options
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        'card',
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
              description: course.description,
            },
            unit_amount: Math.round(course.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL || `https://${process.env.URL}` || 'http://localhost:3000'}/courses/hsi/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || `https://${process.env.URL}` || 'http://localhost:3000'}/programs/cpr-first-aid-hsi`,
      customer_email: studentEmail,
      client_reference_id: studentId,
      // Enable Buy Now Pay Later options
      payment_method_options: {
        afterpay_clearpay: {
          enabled: true,
        },
        klarna: {
          enabled: true,
        },
      },
      metadata: {
        // Standardized metadata for grant/license compliance
        payment_type: 'hsi_enrollment',
        funding_source: 'self_pay',
        provider: 'hsi',
        course_type: courseType,
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
        student_phone: studentPhone || '',
        student_address: studentAddress || '',
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) { /* Error handled silently */ 
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
