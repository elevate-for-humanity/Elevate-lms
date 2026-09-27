import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This tenant-payment endpoint belonged to the retired provider. The active
// QuickBooks and PayPal webhooks have their own signed routes; never grant
// tenant access or mark an order paid from this obsolete endpoint.
export async function POST() {
  return NextResponse.json(
    { error: 'Legacy tenant payment webhook is unavailable.' },
    { status: 503 },
  );
}
