import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ error: 'Terminal websocket connect moved to guarded Dev Studio runtime APIs and is disabled here.' }, { status: 410 });
}
