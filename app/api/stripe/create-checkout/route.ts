
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServerSupabaseClient } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
import { paymentRateLimit } from '@/lib/rate-limit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    // Rate limiting
    if (paymentRateLimit) {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const limiter = paymentRateLimit.get();
      const { success } = limiter ? await limiter.limit(ip) : { success: true };
      
      if (!success) {
        return NextResponse.json(
          { error: 'Too many payment requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { courseId, priceId, successUrl, cancelUrl } = body;

    if (!courseId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    
    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('training_courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // Create or retrieve Stripe price
    let stripePriceId = priceId;
    
    if (!stripePriceId && course.price > 0) {
      // Create a new price in Stripe
      const price = await stripe.prices.create({
        unit_amount: Math.round(course.price * 100), // Convert to cents
        currency: 'usd',
        product_data: {
          name: course.course_name,
          description: course.description || undefined,
        },
      });
      stripePriceId = price.id;
    }

    if (!stripePriceId) {
      return NextResponse.json(
        { error: 'Unable to create payment' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user?.email || undefined,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        courseId: course.id,
        userId: user?.id || '',
        courseTitle: course.course_name,
      },
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

    return NextResponse.json({ url: session.url });
  } catch (error) { 
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
