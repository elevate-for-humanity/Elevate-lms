import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;
import { stripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;


    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      );
    }

    const { amount } = await request.json();

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Invalid donation amount' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Donation to Elevate for Humanity',
              description:
                'Support free career training for underserved communities',
              images: ['https://www.elevateforhumanity.org/images/logo.png'],
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/donate/success?amount=${amount}`,
      cancel_url: `${request.headers.get('origin')}/donate?canceled=true`,
      metadata: {
        type: 'donation',
        amount: amount.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
