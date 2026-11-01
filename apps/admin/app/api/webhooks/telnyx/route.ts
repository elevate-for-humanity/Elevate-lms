import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Historical events remain in the database. This public compatibility route
// must never authenticate with Telnyx, process events, or send notifications.
export async function POST(_request?: Request) {
  return NextResponse.json(
    { error: 'Telnyx is retired. Use Twilio and Elevate PBX.', provider: 'telnyx', retired: true },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
