import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Removed payment endpoint.
 * Testing payments are handled only by the canonical QuickBooks billing flow.
 * This route performs no forwarding, redirecting, or payment processing.
 */
export async function POST() {
  return NextResponse.json({ error: 'Endpoint removed.' }, { status: 410 });
}
