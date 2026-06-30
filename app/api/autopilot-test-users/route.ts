import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ error: 'Autopilot test-user creation is disabled in production. Use seeded test fixtures in non-production.' }, { status: 410 });
}
export async function POST() {
  return NextResponse.json({ error: 'Autopilot test-user creation is disabled in production. Use seeded test fixtures in non-production.' }, { status: 410 });
}
