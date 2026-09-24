import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Retired legacy testing-payment webhook.
 * Current testing payments are confirmed by /api/webhooks/quickbooks and
 * fulfilled through billing_fulfillment_jobs.
 */
export async function POST() {
  return NextResponse.json(
    { received: false, retired: true, replacement: '/api/webhooks/quickbooks' },
    { status: 410 },
  );
}
