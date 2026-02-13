import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;
import { stripe } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId, courseId, courseName, successUrl, cancelUrl } = body;

    if (!priceId || !courseId || !courseName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${request.nextUrl.origin}/supersonic-fast-cash/careers/training?success=true`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/supersonic-fast-cash/careers/training?canceled=true`,
      metadata: {
        courseId,
        courseName,
      },
      customer_email: body.email, // Optional: pre-fill email if provided
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) { /* Error handled silently */ 
    logger.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
