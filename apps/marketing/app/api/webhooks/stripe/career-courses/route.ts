import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// The former processor grants course access from a retired payment provider.
// An authorized QuickBooks or PayPal event must be verified before access is granted.
export async function POST() {
  return NextResponse.json({ error: 'Legacy payment webhook retired.' }, { status: 503 });
}
