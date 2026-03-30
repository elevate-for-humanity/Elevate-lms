/**
 * DEPRECATED — superseded by /api/webhooks/stripe (canonical).
 *
 * This endpoint returns 410 Gone. Remove it from Stripe dashboard webhook
 * configuration and point all events to /api/webhooks/stripe instead.
 *
 * Kept as a stub so any misconfigured Stripe account gets a clear error
 * rather than a 404 that Stripe would retry indefinitely.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    { error: 'DEPRECATED_WEBHOOK_ROUTE', canonical: '/api/webhooks/stripe' },
    { status: 410 },
  );
}
