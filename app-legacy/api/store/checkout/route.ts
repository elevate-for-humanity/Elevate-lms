// PUBLIC ROUTE: Store checkout — licensing gate via validateCheckoutAuthorization + rate limit
import { createCheckoutSession } from '@/lib/store/stripe';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { validateCheckoutAuthorization } from '@/lib/store/licensing-mode';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { DIGITAL_PRODUCTS } from '@/lib/store/digital-products';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'payment');
    if (rateLimited) return rateLimited;

    const { productId, email, adminSessionId, approvedLinkId } = await req.json();

    // SECTION 1: Licensing mode check
    const authCheck = await validateCheckoutAuthorization(adminSessionId, approvedLinkId);
    if (!authCheck.authorized) {
      logger.warn('Unauthorized checkout attempt', { productId, email, reason: authCheck.reason });
      return safeError(authCheck.reason || 'Unauthorized', 403);
    }

    if (!productId) return safeError('Product ID required', 400);

    const supabase = await createClient();

    // productId may be a UUID or a slug — try both.
    // BuyButton components send slugs (e.g. "capital-readiness-guide");
    // cart checkout sends UUIDs from the DB.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq(isUuid ? 'id' : 'slug', productId)
      .eq('is_active', true)
      .maybeSingle();

    // If not in DB, fall back to static DIGITAL_PRODUCTS (e.g. capital-readiness-guide)
    let resolvedId: string;
    let resolvedTitle: string;
    let resolvedPrice: number;
    let resolvedStripePriceId: string | undefined;

    if (error || !product) {
      const digital = DIGITAL_PRODUCTS.find(
        (p) => p.id === productId || p.slug === productId,
      );
      if (!digital) return safeError('Product not found', 404);
      resolvedId = digital.id;
      resolvedTitle = digital.name;
      resolvedPrice = digital.price; // already in cents
      resolvedStripePriceId = digital.stripePriceId;
    } else {
      resolvedId = product.id;
      resolvedTitle = product.title ?? product.name;
      // DB stores price in dollars; createCheckoutSession expects cents
      resolvedPrice = Math.round((product.price ?? 0) * 100);
      resolvedStripePriceId = product.stripe_price_id ?? undefined;
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      productId: resolvedId,
      productTitle: resolvedTitle,
      price: resolvedPrice,
      stripePriceId: resolvedStripePriceId,
      email,
      successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/store/cancel`,
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error('Checkout error:', error instanceof Error ? error : new Error(String(error)));
    return safeInternalError(error as Error, 'Checkout failed');
  }
}
export const POST = withApiAudit('/api/store/checkout', _POST);
