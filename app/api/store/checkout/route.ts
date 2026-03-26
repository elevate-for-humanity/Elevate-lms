import { createCheckoutSession } from '@/lib/store/stripe';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { validateCheckoutAuthorization } from '@/lib/store/licensing-mode';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const { productId, email, adminSessionId, approvedLinkId } = await req.json();

    // SECTION 1: Licensing mode check
    const authCheck = await validateCheckoutAuthorization(adminSessionId, approvedLinkId);
    if (!authCheck.authorized) {
      logger.warn('Unauthorized checkout attempt', { productId, email, reason: authCheck.reason });
      return Response.json({ error: authCheck.reason }, { status: 403 });
    }

    if (!productId) {
      return Response.json({ error: 'Product ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get product details
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      productId: product.id,
      productTitle: product.title,
      price: product.price,
      email,
      successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/store/cancel`,
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) { 
    logger.error(
      'Checkout error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return Response.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/store/checkout', _POST);
