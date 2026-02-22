import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
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

    // Get cart items with product details
    const { data: cartItems, error: cartError } = await db
      .from('cart_items')
      .select(`
        id,
        quantity,
        product_id,
        product:products(id, name, price, stripe_price_id)
      `)
      .eq('user_id', user.id);

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.redirect(new URL('/store/cart', req.url));
    }

    // Build line items for Stripe
    const lineItems = cartItems.map((item: any) => {
      // If product has a Stripe price ID, use it
      if (item.product?.stripe_price_id) {
        return {
          price: item.product.stripe_price_id,
          quantity: item.quantity,
        };
      }
      
      // Otherwise create price data inline
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

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: lineItems,
      success_url: `${siteUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/store/cart`,
      metadata: {
        user_id: user.id,
        cart_item_ids: cartItems.map((item: any) => item.id).join(','),
      },
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
