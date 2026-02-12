import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { stripe } from '@/lib/stripe/client';
import { toError, toErrorMessage } from '@/lib/safe';

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    );
  }

  try {
    const { priceId, productName } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/store`,
      metadata: {
        product_name: productName || 'Digital Product',
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    const error = toError(err);
    return NextResponse.json(
      { error: toErrorMessage(err) },
      { status: 500 }
    );
  }
}
