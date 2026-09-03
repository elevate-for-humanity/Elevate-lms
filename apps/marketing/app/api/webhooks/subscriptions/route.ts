import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { POST as canonicalStripeWebhook } from '../stripe/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return canonicalStripeWebhook(request);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/webhooks/subscriptions',
    canonicalEndpoint: '/api/webhooks/stripe',
  });
}
