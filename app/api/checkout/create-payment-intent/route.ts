// Creates a Stripe PaymentIntent for the Stripe Elements checkout flow.
// Called by CheckoutFlow.tsx before confirming a card payment client-side.
// Returns { clientSecret } which the client passes to stripe.confirmCardPayment().
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'payment');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
    }

    const body = await req.json();
    const { courseId, amount } = body;

    if (!courseId || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'courseId and a positive amount are required' }, { status: 400 });
    }

    // Verify the course exists
    const { data: course } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .maybeSingle();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // already in cents from caller
      currency: 'usd',
      metadata: {
        courseId,
        userId: user.id,
        courseTitle: course.title,
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    logger.error('create-payment-intent error:', err);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/checkout/create-payment-intent', _POST);
