import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await req.formData();
    const customerEmail = formData.get('customerEmail') as string || user.email;

    // Get cart items with product details + LMS access flags from store_products
    const { data: cartItems, error: cartError } = await db
      .from('cart_items')
      .select(`
        id,
        quantity,
        product_id,
        product:products(id, name, price, stripe_price_id, slug)
      `)
      .eq('user_id', user.id);

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.redirect(new URL('/store/cart', req.url));
    }

    // Check store_products for LMS access metadata (grants_course_access, course_id)
    const productIds = cartItems.map((item: any) => item.product_id).filter(Boolean);
    const { data: storeProducts } = await db
      .from('store_products')
      .select('id, grants_course_access, course_id')
      .in('id', productIds);

    const storeProductMap: Record<string, { grants_course_access: string | null; course_id: string | null }> = {};
    for (const sp of storeProducts || []) {
      storeProductMap[sp.id] = sp;
    }

    // Collect LMS course IDs for items that grant access
    // grants_course_access is a text column — treat any truthy non-'false' value as true
    const lmsCourseIds: string[] = [];
    for (const item of cartItems) {
      const sp = storeProductMap[item.product_id];
      const grantsAccess = sp?.grants_course_access && sp.grants_course_access !== 'false';
      if (grantsAccess && sp.course_id) {
        lmsCourseIds.push(sp.course_id);
      }
    }

    // Resolve course slugs for webhook fulfillment
    let courseSlugs: string[] = [];
    if (lmsCourseIds.length > 0) {
      const { data: courses } = await db
        .from('training_courses')
        .select('id, slug')
        .in('id', lmsCourseIds);
      courseSlugs = (courses || []).map((c: any) => c.slug).filter(Boolean);
    }

    // Build line items for Stripe
    const lineItems = cartItems.map((item: any) => {
      if (item.product?.stripe_price_id) {
        return {
          price: item.product.stripe_price_id,
          quantity: item.quantity,
        };
      }
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product?.name || 'Product',
          },
          unit_amount: Math.round((item.product?.price || 0) * 100),
        },
        quantity: item.quantity,
      };
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Build metadata — include LMS fields so webhook can fulfill enrollment
    const sessionMetadata: Record<string, string> = {
      user_id: user.id,
      cart_item_ids: cartItems.map((item: any) => item.id).join(','),
    };
    if (courseSlugs.length > 0) {
      sessionMetadata.lms_access = 'true';
      sessionMetadata.course_slugs = courseSlugs.join(',');
      sessionMetadata.product_type = 'lms_course';
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: lineItems,
      success_url: `${siteUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/store/cart`,
      metadata: sessionMetadata,
      automatic_tax: {
        enabled: true,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    // Redirect to Stripe Checkout
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    logger.error('Cart checkout error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Checkout failed. Please try again.' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/store/cart-checkout', _POST);
