import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { stripe } from '@/lib/stripe/client';
import { getCatalogProduct } from '@/lib/store/db';
import { STRIPE_PRICE_IDS, isPriceConfigured } from '@/lib/stripe/price-map';
import { toErrorMessage } from '@/lib/safe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { paymentRateLimit } from '@/lib/rate-limit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    // Rate limiting
    if (paymentRateLimit) {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const limiter = paymentRateLimit.get();
      const { success } = limiter ? await limiter.limit(ip) : { success: true };
      
      if (!success) {
        return NextResponse.json(
          { error: 'Too many payment requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        {
          error: 'Payment system not configured. Please contact support.',
        },
        { status: 503 }
      );
    }

    // Get authenticated user and tenant
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let tenantId: string | null = null;
    if (user) {
      const { data: membership } = await db
        .from('tenant_memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
      tenantId = membership?.tenant_id || null;
    }

    const contentType = req.headers.get('content-type') || '';
    let productId: string | null = null;
    let customerEmail: string | null = null;

    // Support both form POST and JSON
    if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const form = await req.formData();
      productId = String(form.get('productId') || '');
      customerEmail = form.get('customerEmail')
        ? String(form.get('customerEmail'))
        : null;
    } else {
      const body = await req.json().catch(() => ({}));
      productId = body?.productId ?? null;
      customerEmail = body?.customerEmail ?? null;
    }

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    // DB-backed product lookup with hardcoded fallback
    let product: Awaited<ReturnType<typeof getCatalogProduct>> = null;
    try { product = await getCatalogProduct(productId); } catch { /* DB unavailable */ }
    if (!product) {
      const { getProductBySlug } = await import('@/app/data/store-products');
      const legacy = getProductBySlug(productId);
      if (legacy) {
        product = {
          id: legacy.id,
          slug: legacy.slug,
          name: legacy.name,
          description: legacy.description,
          price: legacy.price,
          billingType: legacy.billingType as any || 'one_time',
          licenseType: legacy.licenseType as any,
          features: legacy.features || [],
          appsIncluded: legacy.appsIncluded,
          stripePriceId: legacy.stripePriceId,
          stripeProductId: undefined,
          isActive: true,
        };
      }
    }
    if (!product) {
      return NextResponse.json({ error: 'Invalid productId' }, { status: 400 });
    }

    // Check if Stripe Price ID is configured
    if (!isPriceConfigured(productId)) {
      // Error logged
      return NextResponse.json(
        {
          error: 'Product not available for purchase. Please contact support.',
        },
        { status: 500 }
      );
    }

    const priceId = STRIPE_PRICE_IDS[productId];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Map product slug to plan name for license activation
    const planNameMap: Record<string, string> = {
      starter: 'starter',
      professional: 'professional',
      enterprise: 'enterprise',
    };
    const planName = planNameMap[productId] || 'starter';

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: product.billingType === 'subscription' ? 'subscription' : 'payment',
      // Let Stripe automatically handle payment methods (includes cards + BNPL)
      // DO NOT set payment_method_types - this enables Klarna, Afterpay, Zip, etc.
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/dashboard/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/platform/${product.slug}`,
      metadata: {
        // Standardized metadata for grant/license compliance
        payment_type: 'license_purchase',
        funding_source: 'self_pay',
        productId: product.id,
        licenseType: product.licenseType,
        appsIncluded: JSON.stringify(product.appsIncluded),
        tenant_id: tenantId || '',
        plan_name: planName,
        stripe_price_id: priceId,
      },
      // Enable automatic tax calculation if configured
      automatic_tax: {
        enabled: true, // Set to true after configuring Stripe Tax
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
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Internal server err' },
      { status: 500 }
    );
  }
}
