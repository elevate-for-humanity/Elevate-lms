// PUBLIC ROUTE: Tombstone 410 — no data access.
/**
 * TOMBSTONE — see /api/cash-advances/applications/route.ts
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Cash-advance management has moved. Use the admin portal directly.' }, { status: 410 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Cash-advance management has moved. Use the admin portal directly.' }, { status: 410 });
}
