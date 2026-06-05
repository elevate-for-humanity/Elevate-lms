/**
 * Forward deprecated Stripe webhook endpoints to the canonical handler.
 * Preserves raw body and stripe-signature for multi-secret verification.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function forwardStripeWebhookToCanonical(
  request: NextRequest,
  deprecatedPath: string,
  rawBody?: string | ArrayBuffer,
): Promise<NextResponse> {
  logger.warn(`[${deprecatedPath}] Deprecated Stripe webhook — forwarding to /api/webhooks/stripe`);
  const url = new URL(request.url);
  url.pathname = '/api/webhooks/stripe';
  const body =
    rawBody != null
      ? typeof rawBody === 'string'
        ? new TextEncoder().encode(rawBody)
        : rawBody
      : await request.arrayBuffer();
  const headers = new Headers();
  request.headers.forEach((v, k) => headers.set(k, v));
  try {
    const res = await fetch(url.toString(), { method: 'POST', headers, body });
    const rb = await res.arrayBuffer();
    return new NextResponse(rb, { status: res.status, headers: res.headers });
  } catch (err) {
    logger.error(`[${deprecatedPath}] Forward to canonical webhook failed`, err as Error);
    return NextResponse.json({ error: 'Webhook forwarding failed' }, { status: 500 });
  }
}
