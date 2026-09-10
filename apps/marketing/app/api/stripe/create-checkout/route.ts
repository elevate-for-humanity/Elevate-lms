import { safeInternalError } from '@/lib/api/safe-error';
import { NextResponse } from 'next/server';
import { getStripe, stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { paymentRateLimit } from '@/lib/rate-limit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { ensureCanonicalStripePrice } from '@/lib/stripe/resolve-canonical-price';

import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handler(req: Request) {
  try {

    // Rate limiting
    if (paymentRateLimit) {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const limiter = paymentRateLimit.get();
      const { success } = limiter ? await limiter.limit(ip) : { success: true };

      if (!success) {
        return NextResponse.json(
          { error: 'Too many payment requests. Please try again later.' },
          { status: 429 },
        );
      }
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
    }

    const body = await req.json();
    const { courseId, priceId, successUrl, cancelUrl, couponCode } = body;

    if (!courseId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('lms_courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Create or retrieve Stripe price
    let stripePriceId = priceId;

    if (!stripePriceId && course.price > 0) {
      const unitAmount = Math.round(course.price * 100);
      const price = await ensureCanonicalStripePrice(stripe, {
        lookupKey: `lms_course_${course.id}_${unitAmount}_usd`,
        productLookupKey: `lms_course_${course.id}`,
        productName: course.title,
        unitAmount,
        productMetadata: { course_id: String(course.id), kind: 'lms_course' },
        priceMetadata: { course_id: String(course.id) },
      });
      stripePriceId = price.id;
    }

    if (!stripePriceId) {
      return NextResponse.json({ error: 'Unable to create payment' }, { status: 500 });
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
        courseTitle: course.title,
      },
      // Education/course tuition is intentionally excluded from Stripe Tax.
      // Taxable platform/store products use their separate checkout route.
      automatic_tax: { enabled: false },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return safeInternalError(error as Error, 'Internal server error');
  }
}
export const POST = withRuntime(withApiAudit('/api/stripe/create-checkout', handler));
