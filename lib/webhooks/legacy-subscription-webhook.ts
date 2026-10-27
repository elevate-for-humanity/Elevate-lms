import { NextResponse } from 'next/server';

// Retired payment endpoints must never accept an event or advance access.
export async function POST() {
  return NextResponse.json(
    { error: 'Legacy subscription webhook is unavailable.' },
    { status: 503 },
  );
}

export async function GET() {
  return NextResponse.json({ error: 'Legacy subscription webhook is unavailable.' }, { status: 410 });
}
