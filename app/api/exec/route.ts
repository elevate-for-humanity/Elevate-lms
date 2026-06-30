import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST() {
  return NextResponse.json({ error: 'Direct exec is disabled. Use guarded Dev Studio shell APIs.' }, { status: 410 });
}
