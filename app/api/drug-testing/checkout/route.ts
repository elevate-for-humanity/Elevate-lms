import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

const stripe = getStripe();

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { productName, price, type, category, email } = body as {
      productName: string;
      price: number;
      type: 'service' | 'course';
      category: string;
      email?: string;
    };

    if (!productName || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const origin =
      req.headers.get('origin') ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'affirm', 'klarna', 'afterpay_clearpay'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description:
                type === 'service'
                  ? 'Professional drug testing service with MRO review'
                  : 'Online training course with certificate',
              metadata: {
                type,
                category,
              },
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/drug-testing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        type === 'service'
          ? `${origin}/drug-testing`
          : `${origin}/drug-testing-training`,
      customer_email: email,
      metadata: {
        productName,
        type,
        category,
        price: price.toString(),
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    logger.error(
      '[Drug Testing] Checkout error:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Unable to create checkout session' },
      { status: 500 }
    );
  }
}
