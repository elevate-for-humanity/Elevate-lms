import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This provider is retired. Do not accept an event as paid, verified, or
// fulfilled without a replacement provider and its own signature validation.
export async function POST() {
  return NextResponse.json({ error: 'Legacy identity webhook is unavailable.' }, { status: 503 });
}
