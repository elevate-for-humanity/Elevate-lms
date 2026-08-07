import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getProductBySlug } from '@/lib/store/products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.elevateforhumanity.org';

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !user.email) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const requested = Array.isArray(body.items) ? body.items : [];
  if (requested.length < 1 || requested.length > 25) return NextResponse.json({ error: 'Cart must contain 1-25 items' }, { status: 400 });

  const items: Array<{ product: NonNullable<ReturnType<typeof getProductBySlug>>; quantity: number }> = [];
  for (const row of requested) {
    const slug = typeof row?.slug === 'string' ? row.slug : '';
    const quantity = Number.isInteger(row?.quantity) ? Math.min(Math.max(row.quantity, 1), 10) : 1;
    const product = getProductBySlug(slug);
    if (!product || !product.inStock) return NextResponse.json({ error: `Product unavailable: ${slug || 'unknown'}` }, { status: 400 });
    items.push({ product, quantity });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });

  const lineItems = items.map(({ product, quantity }) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: product.name,
        description: product.description.slice(0, 500),
        metadata: { store_product_id: product.id, store_product_slug: product.slug },
      },
      unit_amount: Math.round((product.salePrice ?? product.price) * 100),
    },
    quantity,
  }));

  const productIds = items.map(({ product }) => product.id);
  const digitalProductIds = items.filter(({ product }) => product.digital).map(({ product }) => product.id);
  const physicalProductIds = items.filter(({ product }) => !product.digital).map(({ product }) => product.id);
  const courseSlugs = items.map(({ product }) => product.programId).filter((value): value is string => Boolean(value && value !== 'all'));

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

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: user.email,
    client_reference_id: user.id,
    metadata,
    shipping_address_collection: physicalProductIds.length ? { allowed_countries: ['US'] } : undefined,
    success_url: `${SITE_URL}/store/cart-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/store/cart?checkout=cancelled`,
  });

  if (!session.url) return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 });
  return NextResponse.json({ checkoutUrl: session.url });
}
