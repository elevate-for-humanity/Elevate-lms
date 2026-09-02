import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { POST as canonicalStripeWebhook } from '../../webhooks/stripe/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Backward-compatible Stripe destination.
 * New Dashboard configuration must use /api/webhooks/stripe.
 */
export async function POST(request: NextRequest) {
  return canonicalStripeWebhook(request);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/barber/webhook',
    canonicalEndpoint: '/api/webhooks/stripe',
  });
}
