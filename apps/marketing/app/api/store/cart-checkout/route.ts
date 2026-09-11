import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';

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
    return NextResponse.json(
      { error: 'Checkout service is temporarily unavailable.' },
      { status: 503 },
    );
  }

  const requestBody = await request.json().catch(() => ({}));
  const checkoutAttemptId =
    typeof requestBody?.checkoutAttemptId === 'string' &&
    /^[0-9a-f-]{36}$/i.test(requestBody.checkoutAttemptId)
      ? requestBody.checkoutAttemptId
      : null;
  if (!checkoutAttemptId)
    return NextResponse.json(
      { error: 'A valid checkout attempt ID is required.' },
      { status: 400 },
    );
  const requestedItems = Array.isArray(requestBody?.items)
    ? requestBody.items
        .filter((item: unknown): item is { slug: string; quantity?: number } =>
          Boolean(
            item &&
            typeof item === 'object' &&
            typeof (item as { slug?: unknown }).slug === 'string',
          ),
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
      return NextResponse.json(
        { error: 'Cart contains an invalid item or quantity.' },
        { status: 400 },
      );
    }

    const requestedSlugs = [...new Set(requestedItems.map((item: { slug: string }) => item.slug))];
    const { data: resolvedProducts, error: productError } = await db
      .from('products')
      .select(
        'id, slug, name, description, price, price_cents, currency, type, is_active, requires_shipping, track_inventory, inventory_quantity',
      )
      .in('slug', requestedSlugs);

    if (productError) {
      return NextResponse.json(
        { error: 'Unable to validate the selected products.' },
        { status: 500 },
      );
    }

    const bySlug = new Map(
      ((resolvedProducts ?? []) as CartProduct[]).map((product) => [
        product.slug.toLowerCase(),
        product,
      ]),
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
      return NextResponse.json(
        { error: 'One or more products are no longer available.' },
        { status: 409 },
      );
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return NextResponse.json({ error: `Invalid quantity for ${product.name}.` }, { status: 400 });
    }
    if (
      product.track_inventory === true &&
      product.inventory_quantity !== null &&
      quantity > Number(product.inventory_quantity)
    ) {
      return NextResponse.json(
        { error: `${product.name} does not have enough inventory.` },
        { status: 409 },
      );
    }
    if (productUnitAmountCents(product) < 1) {
      return NextResponse.json(
        { error: `${product.name} does not have a valid price.` },
        { status: 409 },
      );
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
  const totalCents = snapshot.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0);

  const priorOrder = await db
    .from('store_orders')
    .select('id,user_id,total_cents')
    .eq('checkout_attempt_id', checkoutAttemptId)
    .maybeSingle();
  if (priorOrder.error)
    return NextResponse.json({ error: 'Unable to verify this checkout attempt.' }, { status: 500 });
  if (
    priorOrder.data &&
    (priorOrder.data.user_id !== user.id || Number(priorOrder.data.total_cents) !== totalCents)
  )
    return NextResponse.json(
      { error: 'This checkout attempt belongs to a different cart.' },
      { status: 409 },
    );
  const orderResult = priorOrder.data
    ? { data: { id: priorOrder.data.id }, error: null }
    : await db
        .from('store_orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total_cents: totalCents,
          items: snapshot,
          checkout_attempt_id: checkoutAttemptId,
          notes: 'Server cart snapshot created before QuickBooks invoice',
        })
        .select('id')
        .single();
  const { data: pendingOrder, error: orderError } = orderResult;
  if (priorOrder.data)
    await db
      .from('store_orders')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', priorOrder.data.id)
      .eq('status', 'failed');

  if (orderError || !pendingOrder?.id) {
    logger.error('[store/cart-checkout] pending order insert failed', orderError ?? undefined, {
      userId: user.id,
    });
    return NextResponse.json({ error: 'Unable to prepare your order.' }, { status: 500 });
  }

  const lineItems = cart.map(({ product, quantity }) => {
    const item = product as CartProduct;
    return {
      canonicalKey: `store-${item.slug}`,
      name: item.name,
      description: (item.description || '').slice(0, 500) || undefined,
      unitAmountCents: productUnitAmountCents(item),
      quantity,
    };
  });

  try {
    const { data: profile } = await db
      .from('profiles')
      .select('full_name,address,city,state,zip_code')
      .eq('id', user.id)
      .maybeSingle();
    if (
      physicalProductIds.length &&
      (!profile?.address || !profile?.city || !profile?.state || !profile?.zip_code)
    ) {
      await db
        .from('store_orders')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', pendingOrder.id)
        .eq('status', 'pending');
      return NextResponse.json(
        {
          error:
            'Add a complete shipping address to your profile before purchasing physical products.',
        },
        { status: 422 },
      );
    }
    const invoice = await createQuickBooksBillingProvider(db).createManualInvoice({
      idempotencyKey: `store-order:${pendingOrder.id}`,
      customer: {
        externalKey: `user:${user.id}`,
        displayName: profile?.full_name || user.email,
        email: user.email,
      },
      lines: lineItems,
      dueDate: new Date().toISOString().slice(0, 10),
      memo: `Elevate store order ${pendingOrder.id}`,
      fulfillment: {
        type: 'store_order',
        payload: {
          store_order_id: pendingOrder.id,
          user_id: user.id,
          amount_cents: totalCents,
          shipping_address: physicalProductIds.length
            ? {
                address: profile?.address,
                city: profile?.city,
                state: profile?.state,
                zip_code: profile?.zip_code,
              }
            : null,
        },
      },
    });
    if (!invoice.paymentUrl)
      throw new Error('QuickBooks created the invoice but online payment links are not enabled.');

    const { error: sessionUpdateError } = await db
      .from('store_orders')
      .update({
        billing_provider: 'quickbooks',
        provider_invoice_id: invoice.providerInvoiceId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingOrder.id)
      .eq('status', 'pending');
    if (sessionUpdateError) {
      logger.error(
        '[store/cart-checkout] failed to persist QuickBooks invoice ID',
        sessionUpdateError,
        {
          orderId: pendingOrder.id,
          providerInvoiceId: invoice.providerInvoiceId,
        },
      );
    }

    const acceptsJson = request.headers.get('accept')?.includes('application/json');
    if (acceptsJson) {
      return NextResponse.json({
        checkoutUrl: invoice.paymentUrl,
        orderId: pendingOrder.id,
        invoiceId: invoice.providerInvoiceId,
      });
    }
    return NextResponse.redirect(invoice.paymentUrl, 303);
  } catch (error) {
    await db
      .from('store_orders')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', pendingOrder.id)
      .in('status', ['pending', 'failed']);
    logger.error(
      '[store/cart-checkout] QuickBooks invoice creation failed',
      error instanceof Error ? error : new Error(String(error)),
      { orderId: pendingOrder.id, userId: user.id },
    );
    return NextResponse.json(
      { error: 'Unable to start secure checkout. Please try again.' },
      { status: 500 },
    );
  }
}
