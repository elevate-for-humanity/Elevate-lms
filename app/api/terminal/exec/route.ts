import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST() {
  return NextResponse.json({ error: 'Terminal exec moved to guarded Dev Studio runtime APIs and is disabled here.' }, { status: 410 });
}
