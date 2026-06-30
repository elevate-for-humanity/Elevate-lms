import { safeInternalError } from '@/lib/api/safe-error';
import { NextResponse } from 'next/server';

import { getStripe, stripe } from '@/lib/stripe/client';
import { toError, toErrorMessage } from '@/lib/safe';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function _POST(req: Request) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  try {
    const { priceId, productName } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
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
    return safeInternalError(err as Error, 'Internal server error');
  }
}
export const POST = withRuntime(withApiAudit('/api/checkout/product', _POST));
