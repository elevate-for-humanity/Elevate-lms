import { NextRequest, NextResponse } from 'next/server';

import { stripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { createClient } from '@/lib/supabase/server';
export const maxDuration = 60;

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'payment');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    if (!stripe) return safeError('Payment processing is not configured', 503);

    const body = await request.json().catch(() => ({})) as { items?: { id: string; quantity: number }[] };
    const items = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return safeError('Invalid items', 400);
    }

    const normalized = items
      .filter((i) => i?.id && Number.isFinite(i.quantity) && i.quantity > 0)
      .map((i) => ({ id: i.id, quantity: Math.floor(i.quantity) }));

    if (normalized.length === 0) return safeError('Invalid items', 400);

    // Recompute total server-side — never trust client-supplied price
    const supabase = await createClient();
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, is_active')
      .in('id', normalized.map((i) => i.id));

    if (productsError) return safeInternalError(productsError, 'Failed to validate products');

    const productMap = new Map((products ?? []).map((p: any) => [p.id, p]));
    let totalCents = 0;
    for (const item of normalized) {
      const p: any = productMap.get(item.id);
      if (!p || !p.is_active) return safeError('One or more products are unavailable', 400);
      totalCents += Math.round((p.price ?? 0) * 100) * item.quantity;
    }
    if (totalCents <= 0) return safeError('Invalid total amount', 400);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { items: JSON.stringify(normalized) },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    return safeInternalError(err as Error, 'Failed to create payment intent');
  }
}
export const POST = withApiAudit('/api/store/create-payment-intent', _POST);
