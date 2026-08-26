import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { getCatalogProduct } from '@/lib/store/db';
import { STRIPE_PRICE_IDS } from '@/lib/stripe/price-map';
import { createClient } from '@/lib/supabase/server';
import { paymentRateLimit } from '@/lib/rate-limit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { injectFailureRedirect } from '@/lib/api/failure-injection';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function handler(req: Request) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim() || PLATFORM_DEFAULTS.siteUrl;
  const storeUrl = `${siteUrl}/store`;

  try {
    const injected = injectFailureRedirect(req, `${storeUrl}?error=checkout-failed`);
    if (injected) return injected;

    if (paymentRateLimit) {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const limiter = paymentRateLimit.get();
      const { success } = limiter ? await limiter.limit(ip) : { success: true };
      if (!success) return NextResponse.redirect(new URL(`${storeUrl}?error=rate-limited`, req.url), 303);
    }

    const stripe = getStripe();
    if (!stripe) return NextResponse.redirect(new URL(`${storeUrl}?error=payment-unavailable`, req.url), 303);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let tenantId: string | null = null;
    if (user) {
      const { data: membership } = await supabase
        .from('tenant_memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .maybeSingle();
      tenantId = membership?.tenant_id || null;
    }

    const contentType = req.headers.get('content-type') || '';
    let productId: string | null = null;
    let customerEmail: string | null = null;
    let couponCode: string | null = null;
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      productId = String(form.get('productId') || '');
      customerEmail = form.get('customerEmail') ? String(form.get('customerEmail')) : null;
      couponCode = form.get('couponCode') ? String(form.get('couponCode')) : null;
    } else {
      const body = await req.json().catch(() => ({}));
      productId = body?.productId ?? null;
      customerEmail = body?.customerEmail ?? null;
      couponCode = body?.couponCode ?? null;
    }

    if (!productId) return NextResponse.redirect(new URL(`${storeUrl}?error=invalid-product`, req.url), 303);

    let product: Awaited<ReturnType<typeof getCatalogProduct>> = null;
    try { product = await getCatalogProduct(productId); } catch { /* handled below */ }
    if (!product) return NextResponse.redirect(new URL(`${storeUrl}?error=invalid-product`, req.url), 303);

    const productUrl = `${siteUrl}/platform/${product.slug}`;
    // Keep the amount charged aligned with the Supabase catalog. The static map
    // is only a migration fallback for legacy rows without stripe_price_id.
    const priceId = product.stripePriceId || STRIPE_PRICE_IDS[productId] || null;
    if (!priceId) return NextResponse.redirect(new URL(`${productUrl}?error=payment-unavailable`, req.url), 303);
    const planName = ({ starter: 'starter', professional: 'professional', enterprise: 'enterprise' } as Record<string, string>)[productId] || 'starter';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: product.billingType === 'subscription' ? 'subscription' : 'payment',
      customer_email: customerEmail || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: productUrl,
      metadata: {
        payment_type: 'license_purchase',
        funding_source: 'self_pay',
        productId: product.id,
        licenseType: product.licenseType,
        appsIncluded: JSON.stringify(product.appsIncluded),
        tenant_id: tenantId || '',
        plan_name: planName,
        stripe_price_id: priceId,
        coupon_code: couponCode || '',
      },
      automatic_tax: { enabled: true },
      ...(couponCode ? { discounts: [{ coupon: couponCode }] } : {}),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) return NextResponse.redirect(new URL(`${productUrl}?error=checkout-failed`, req.url), 303);
    return NextResponse.redirect(session.url, 303);
  } catch {
    return NextResponse.redirect(new URL(`${storeUrl}?error=checkout-failed`, req.url), 303);
  }
}

export const POST = withRuntime(withApiAudit('/api/stripe/checkout', handler));
