import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SyncItem {
  slug: string;
  quantity: number;
}

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items: SyncItem[] = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const slugs = [...new Set(items.map((item) => item.slug).filter(Boolean))];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, slug, price')
      .in('slug', slugs);

    if (productsError) {
      logger.error('Cart sync products lookup failed', productsError);
      return NextResponse.json({ error: 'Could not load products' }, { status: 500 });
    }

    const productBySlug = new Map((products ?? []).map((p) => [p.slug, p]));
    const missing = slugs.filter((slug) => !productBySlug.has(slug));

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Some items are not available for cart checkout: ${missing.join(', ')}. Use Subscribe on the app page for subscriptions.`,
          missing,
        },
        { status: 400 },
      );
    }

    for (const item of items) {
      const product = productBySlug.get(item.slug);
      if (!product) continue;

      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + item.quantity })
          .eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: product.id,
          quantity: item.quantity,
          price: product.price,
        });
      }
    }

    return NextResponse.json({ ok: true, synced: items.length });
  } catch (err) {
    logger.error('Cart sync error', err instanceof Error ? err : undefined);
    return NextResponse.json({ error: 'Failed to sync cart' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/store/cart/sync', _POST);
