import { NextResponse } from 'next/server';

import { stripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;


  // Rate limiting: 10 checkouts per minute per IP
  const identifier = getClientIdentifier(req.headers);
  const rateLimitResult = rateLimit(identifier, RateLimitPresets.STRICT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    );
  }

  try {
    const { productId, creatorId } = await req.json();

    if (!productId || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Price must come from DB — never trust client-supplied priceCents
    const db = createAdminClient();
    if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { data: product, error: productError } = await db
      .from('marketplace_products')
      .select('id, title, price_cents, creator_id, is_published')
      .eq('id', productId)
      .eq('creator_id', creatorId)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.is_published) {
      return NextResponse.json({ error: 'Product not available' }, { status: 403 });
    }

    if (!product.price_cents || product.price_cents <= 0) {
      return NextResponse.json({ error: 'Invalid product price' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: product.price_cents,
            product_data: {
              name: product.title || 'Digital Product',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'marketplace',
        product_id: productId,
        creator_id: creatorId,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/marketplace/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/marketplace/product/${productId}`,
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
export const POST = withApiAudit('/api/checkout/marketplace', _POST);
