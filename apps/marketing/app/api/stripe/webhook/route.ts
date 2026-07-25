/**
 * Stripe webhook — legacy path (DEPRECATED).
 *
 * This route existed at /api/stripe/webhook before we renamed to /api/webhooks/stripe.
 * The canonical handler is at /api/webhooks/stripe — update Stripe Dashboard to use that URL.
 *
 * To avoid HTTP self-call issues in containerized deployments, we call the canonical
 * handler's exported POST function directly rather than fetching over HTTP.
 */
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Import the canonical handler's POST function
// The canonical route wraps it with withApiAudit, so we call the inner _POST directly
async function getCanonicalHandler() {
  try {
    const mod = await import('@/app/api/webhooks/stripe/route');
    // The canonical route exports POST = withApiAudit(_POST) — call the POST export directly
    return mod.POST;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  logger.warn('[stripe/webhook] Deprecated endpoint — forwarding to /api/webhooks/stripe.');

  const handler = await getCanonicalHandler();
  if (!handler) {
    logger.error('[stripe/webhook] Could not load canonical handler module');
    return NextResponse.json(
      { error: 'Canonical webhook handler not available' },
      { status: 500 }
    );
  }

  try {
    return await handler(request);
  } catch (err) {
    logger.error('[stripe/webhook] Canonical handler threw', err as Error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
