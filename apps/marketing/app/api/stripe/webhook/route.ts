/**
 * Stripe webhook — legacy path (DEPRECATED).
 *
 * This route existed at /api/stripe/webhook before we renamed to /api/webhooks/stripe.
 * The canonical handler is at /api/webhooks/stripe — update Stripe Dashboard to use that URL.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  return NextResponse.redirect(new URL('/api/webhooks/stripe', request.url), 307);
}
