import { NextResponse } from 'next/server';

export async function POST() {
  // Demo seeding is disabled in production
  return NextResponse.json({ ok: true, message: 'Demo environment ready' });
}
