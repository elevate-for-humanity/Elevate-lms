import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST() {
  return NextResponse.json({ error: 'Git clone moved to guarded Dev Studio/GitHub APIs and is disabled here.' }, { status: 410 });
}
