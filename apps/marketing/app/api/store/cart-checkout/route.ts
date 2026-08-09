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

  // Server-side cart + product rows are the source of truth. Never trust client
  // product IDs, prices, inventory, shipping requirements, or quantities.
  const { data: rawCart, error: cartError } = await db
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

  const cart = (rawCart ?? []) as unknown as CartRow[];
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
