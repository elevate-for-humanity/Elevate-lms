import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getProductBySlug } from '@/lib/store/products';

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // The authenticated server cart is the source of truth. Do not trust a client
  // payload for product identity, quantity, price, inventory, or shipping status.
  const { data: rawCart, error: cartError } = await supabase
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

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Payment system is temporarily unavailable.' }, { status: 503 });

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

  const products = cart.map((row) => row.product as CartProduct);
  const productIds = products.map((product) => product.id);
  const physicalProductIds = products.filter((product) => product.requires_shipping === true).map((product) => product.id);
  const digitalProductIds = products.filter((product) => product.requires_shipping !== true).map((product) => product.id);
  const courseSlugs = products
    .map((product) => getProductBySlug(product.slug)?.programId)
    .filter((value): value is string => Boolean(value && value !== 'all'));

  const metadata = {
    checkout_type: 'store_cart',
    user_id: user.id,
    product_id: productIds[0] ?? '',
    product_ids: productIds.join(','),
    digital_product_ids: digitalProductIds.join(','),
    physical_product_ids: physicalProductIds.join(','),
    course_slugs: [...new Set(courseSlugs)].join(','),
    lms_access: courseSlugs.length ? 'true' : 'false',
  };

  const origin = request.nextUrl.origin;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: user.email,
    client_reference_id: user.id,
    metadata,
    allow_promotion_codes: true,
    shipping_address_collection: physicalProductIds.length ? { allowed_countries: ['US'] } : undefined,
    success_url: `${origin}/store/cart-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/store/cart?checkout=cancelled`,
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 });
  }

  // HTML forms can follow a 303 directly; API callers still receive JSON when
  // they explicitly ask for JSON.
  const acceptsJson = request.headers.get('accept')?.includes('application/json');
  if (acceptsJson) return NextResponse.json({ checkoutUrl: session.url });
  return NextResponse.redirect(session.url, 303);
}
