import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The previous payment webhook has been retired. Never acknowledge a payment
// or advance apprentice access based on an event sent to this old URL.
export async function POST() {
  return NextResponse.json(
    { error: 'Legacy subscription webhook is unavailable.' },
    { status: 503 },
  );
}

export async function GET() {
  return NextResponse.json({ error: 'Legacy subscription webhook is unavailable.' }, { status: 410 });
}
