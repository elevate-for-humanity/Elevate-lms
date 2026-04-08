import { NextResponse } from 'next/server';

import { stripe } from '@/lib/stripe/client';
import { getCatalogProduct } from '@/lib/store/db';
import { STRIPE_PRICE_IDS, isPriceConfigured } from '@/lib/stripe/price-map';
import { createClient } from '@/lib/supabase/server';
import { paymentRateLimit } from '@/lib/rate-limit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { injectFailureRedirect } from '@/lib/api/failure-injection';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function handler(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const storeUrl = `${siteUrl}/store`;

    const injected = injectFailureRedirect(req, `${storeUrl}?error=checkout-failed`);
    if (injected) return injected;

    // Rate limiting
    if (paymentRateLimit) {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const limiter = paymentRateLimit.get();
      const { success: rateLimitOk } = limiter ? await limiter.limit(ip) : { success: true };

      if (!rateLimitOk) {
        return NextResponse.redirect(new URL(`${storeUrl}?error=rate-limited`, req.url), 303);
      }
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.redirect(new URL(`${storeUrl}?error=payment-unavailable`, req.url), 303);
    }

    // Get authenticated user and tenant
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let tenantId: string | null = null;
    if (user) {
      const { data: membership } = await supabase
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
      return NextResponse.redirect(new URL(`${storeUrl}?error=invalid-product`, req.url), 303);
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
      return NextResponse.redirect(new URL(`${storeUrl}?error=invalid-product`, req.url), 303);
    }

    // From here we have a product slug — use it for error redirects
    const productUrl = `${siteUrl}/platform/${product.slug}`;

    // Check if Stripe Price ID is configured
    if (!isPriceConfigured(productId)) {
      return NextResponse.redirect(new URL(`${productUrl}?error=payment-unavailable`, req.url), 303);
    }

    const priceId = STRIPE_PRICE_IDS[productId];

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
      return NextResponse.redirect(new URL(`${productUrl}?error=checkout-failed`, req.url), 303);
    }

    // Redirect to Stripe Checkout
    return NextResponse.redirect(session.url, 303);
  } catch (err: unknown) {
    return NextResponse.redirect(new URL(`${storeUrl}?error=checkout-failed`, req.url), 303);
  }
}
export const POST = withRuntime(withApiAudit('/api/stripe/checkout', handler));
