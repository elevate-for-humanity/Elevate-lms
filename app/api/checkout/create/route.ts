
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/checkout/create/route.ts - Create Stripe checkout for course
import { getStripe, stripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';



export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment system not configured' },
      { status: 503 }
    );
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if course requires payment
    if (
      course.is_free ||
      !course.requires_payment ||
      course.student_price_cents === 0
    ) {
      return NextResponse.json(
        { error: 'This course is free' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id, payment_status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existing && existing.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Already enrolled and paid' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description || `Access to ${course.title}`,
              images: course.image_url ? [course.image_url] : [],
            },
            unit_amount: course.student_price_cents || course.price_cents || 0,
          },
          quantity: 1,
        },
      ],
      metadata: {
        // Standardized metadata for grant/license compliance
        payment_type: 'course_enrollment',
        funding_source: 'self_pay',
        user_id: user.id,
        course_id: courseId,
        enrollment_id: existing?.id || '',
        partner_owed_cents: course.partner_cost_cents?.toString() || '0',
        your_revenue_cents: course.your_revenue_cents?.toString() || '0',
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/programs/${course.slug}`,
    });

    // Create or update enrollment with pending payment
    if (existing) {
      await supabase
        .from('enrollments')
        .update({
          payment_status: 'pending',
          stripe_checkout_session_id: session.id,
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('enrollments').insert({
        user_id: user.id,
        course_id: courseId,
        status: 'pending',
        payment_status: 'pending',
        stripe_checkout_session_id: session.id,
        enrollment_type: 'standalone',
        funding_source: 'self_pay',
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Checkout error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
