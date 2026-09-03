import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CartProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | string;
  price_cents: number | null;
  currency: string | null;
  type: string | null;
  is_active: boolean | null;
  requires_shipping: boolean | null;
  track_inventory: boolean | null;
  inventory_quantity: number | null;
};

type CartRow = {
  id: string;
  quantity: number;
  product: CartProduct | null;
};

function productUnitAmountCents(product: CartProduct): number {
  const explicit = Number(product.price_cents || 0);
  if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit);
  const dollars = Number(product.price || 0);
  return Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : 0;
}

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user?.id || !user.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let db;
  try {
    db = await requireAdminClient();
  } catch {
    return NextResponse.json({ error: 'Checkout service is temporarily unavailable.' }, { status: 503 });
  }

  const requestBody = await request.json().catch(() => ({}));
  const requestedItems = Array.isArray(requestBody?.items)
    ? requestBody.items
        .filter((item: unknown): item is { slug: string; quantity?: number } =>
          Boolean(item && typeof item === 'object' && typeof (item as { slug?: unknown }).slug === 'string'),
        )
        .map((item: { slug: string; quantity?: number }) => ({
          slug: item.slug.trim().toLowerCase(),
          quantity: Number(item.quantity ?? 1),
        }))
    : [];

  // Server-side product rows are always the source of truth. The browser cart
  // sends only slugs and quantities; names, prices, availability, inventory,
  // shipping and product IDs are reloaded here before Stripe Checkout.
  const { data: storedCart, error: cartError } = await db
    .from('cart_items')
    .select(
      `id, quantity, product:products(
        id, slug, name, description, price, price_cents, currency, type,
        is_active, requires_shipping, track_inventory, inventory_quantity
      )`,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (cartError) {
    return NextResponse.json({ error: 'Unable to load your cart.' }, { status: 500 });
  }

  let cart = (storedCart ?? []) as unknown as CartRow[];

  // Public product pages use the browser cart so buyers can shop before signing
  // in. After authentication, resolve that cart against the canonical products
  // table instead of silently showing or checking out a different empty cart.
  if (cart.length === 0 && requestedItems.length > 0) {
    if (
      requestedItems.length > 25 ||
      requestedItems.some(
        (item: { slug: string; quantity: number }) =>
          !item.slug || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10,
      )
    ) {
      return NextResponse.json({ error: 'Cart contains an invalid item or quantity.' }, { status: 400 });
    }

    const requestedSlugs = [...new Set(requestedItems.map((item: { slug: string }) => item.slug))];
    const { data: resolvedProducts, error: productError } = await db
      .from('products')
      .select(
        'id, slug, name, description, price, price_cents, currency, type, is_active, requires_shipping, track_inventory, inventory_quantity',
      )
      .in('slug', requestedSlugs);

    if (productError) {
      return NextResponse.json({ error: 'Unable to validate the selected products.' }, { status: 500 });
    }

    const bySlug = new Map(
      ((resolvedProducts ?? []) as CartProduct[]).map((product) => [product.slug.toLowerCase(), product]),
    );
    const unresolved = requestedSlugs.filter((slug: string) => !bySlug.has(slug));
    if (unresolved.length) {
      return NextResponse.json(
        { error: 'One or more selected products are not available for secure checkout.' },
        { status: 409 },
      );
    }

    cart = requestedItems.map((item: { slug: string; quantity: number }, index: number) => ({
      id: `browser-cart-${index}`,
      quantity: item.quantity,
      product: bySlug.get(item.slug) ?? null,
    }));
  }

  if (cart.length < 1 || cart.length > 25) {
    return NextResponse.json({ error: 'Cart must contain 1-25 items' }, { status: 400 });
  }

  for (const row of cart) {
    const product = row.product;
    const quantity = Number(row.quantity || 0);
    if (!product?.id || product.is_active === false) {
      return NextResponse.json({ error: 'One or more products are no longer available.' }, { status: 409 });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return NextResponse.json({ error: `Invalid quantity for ${product.name}.` }, { status: 400 });
    }
    if (
      product.track_inventory === true &&
      product.inventory_quantity !== null &&
      quantity > Number(product.inventory_quantity)
    ) {
      return NextResponse.json({ error: `${product.name} does not have enough inventory.` }, { status: 409 });
    }
    if (productUnitAmountCents(product) < 1) {
      return NextResponse.json({ error: `${product.name} does not have a valid price.` }, { status: 409 });
    }
  }

  const products = cart.map((row) => row.product as CartProduct);
  const physicalProductIds = products
    .filter((product) => product.requires_shipping === true)
    .map((product) => product.id);

  const snapshot = cart.map(({ product, quantity }) => {
    const item = product as CartProduct;
    return {
      product_id: item.id,
      slug: item.slug,
      name: item.name,
      unit_price_cents: productUnitAmountCents(item),
      quantity,
      type: item.type,
      requires_shipping: Boolean(item.requires_shipping),
      track_inventory: Boolean(item.track_inventory),
    };
  });
  const totalCents = snapshot.reduce(
    (sum, item) => sum + item.unit_price_cents * item.quantity,
    0,
  );

  const { data: pendingOrder, error: orderError } = await db
    .from('store_orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      total_cents: totalCents,
      items: snapshot,
      notes: 'Server cart snapshot created before Stripe Checkout',
    })
    .select('id')
    .single();

  if (orderError || !pendingOrder?.id) {
    logger.error('[store/cart-checkout] pending order insert failed', orderError ?? undefined, {
      userId: user.id,
    });
    return NextResponse.json({ error: 'Unable to prepare your order.' }, { status: 500 });
  }

  const stripe = getStripe();
  if (!stripe) {
    await db.from('store_orders').delete().eq('id', pendingOrder.id).eq('status', 'pending');
    return NextResponse.json({ error: 'Payment system is temporarily unavailable.' }, { status: 503 });
  }

  const lineItems = cart.map(({ product, quantity }) => {
    const item = product as CartProduct;
    return {
      price_data: {
        currency: (item.currency || 'usd').toLowerCase(),
        product_data: {
          name: item.name,
          description: (item.description || '').slice(0, 500) || undefined,
          metadata: { store_product_id: item.id, store_product_slug: item.slug },
        },
        unit_amount: productUnitAmountCents(item),
      },
      quantity,
    };
  });

  const origin = request.nextUrl.origin;
  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        kind: 'store_purchase',
        checkout_type: 'store_cart',
        store_order_id: pendingOrder.id,
        user_id: user.id,
        item_count: String(snapshot.length),
        has_physical_items: physicalProductIds.length ? 'true' : 'false',
      },
      allow_promotion_codes: true,
      shipping_address_collection: physicalProductIds.length
        ? { allowed_countries: ['US'] }
        : undefined,
      success_url: `${origin}/store/cart-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store/cart?checkout=cancelled`,
    });

    if (!checkout.url) throw new Error('Stripe did not return a checkout URL.');

    const { error: sessionUpdateError } = await db
      .from('store_orders')
      .update({ stripe_session_id: checkout.id, updated_at: new Date().toISOString() })
      .eq('id', pendingOrder.id)
      .eq('status', 'pending');
    if (sessionUpdateError) {
      logger.error('[store/cart-checkout] failed to persist Stripe session ID', sessionUpdateError, {
        orderId: pendingOrder.id,
        stripeSessionId: checkout.id,
      });
    }

    const acceptsJson = request.headers.get('accept')?.includes('application/json');
    if (acceptsJson) {
      return NextResponse.json({
        checkoutUrl: checkout.url,
        orderId: pendingOrder.id,
        sessionId: checkout.id,
      });
    }
    return NextResponse.redirect(checkout.url, 303);
  } catch (error) {
    await db.from('store_orders').delete().eq('id', pendingOrder.id).eq('status', 'pending');
    logger.error(
      '[store/cart-checkout] Stripe session creation failed',
      error instanceof Error ? error : new Error(String(error)),
      { orderId: pendingOrder.id, userId: user.id },
    );
    return NextResponse.json({ error: 'Unable to start secure checkout. Please try again.' }, { status: 500 });
  }
}
