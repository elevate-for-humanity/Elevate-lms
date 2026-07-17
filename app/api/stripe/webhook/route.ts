/**
 * DEPRECATED — canonical Stripe webhook is at /api/webhooks/stripe
 *
 * Forwards all traffic to the canonical handler so no events are lost.
 * ACTION REQUIRED: Update your Stripe Dashboard webhook endpoint to
 *   https://<your-domain>/api/webhooks/stripe  then delete this file.
 */
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function forwardToCanonical(request: NextRequest): Promise<NextResponse> {
  logger.warn('[stripe/webhook] Deprecated endpoint — forwarding to /api/webhooks/stripe. Update Stripe Dashboard webhook URL.');
  const url = new URL(request.url);
  url.pathname = '/api/webhooks/stripe';
  const body = await request.arrayBuffer();
  const headers = new Headers();
  request.headers.forEach((v, k) => headers.set(k, v));
  try {
    const res = await fetch(url.toString(), { method: 'POST', headers, body });
    const rb = await res.arrayBuffer();
    return new NextResponse(rb, { status: res.status, headers: res.headers });
  } catch (err) {
    logger.error('[stripe/webhook] Forward failed', err as Error);
    return NextResponse.json({ error: 'Webhook forwarding failed' }, { status: 500 });
  }
}

export const POST = forwardToCanonical;
