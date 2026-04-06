// AUTH: Intentionally public — no authentication required
import { NextResponse } from 'next/server';

// Disabled — this endpoint was empty and should not be publicly accessible.
export async function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
