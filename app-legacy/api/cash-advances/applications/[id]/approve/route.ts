// PUBLIC ROUTE: Tombstone 410 — no data access.
/**
 * TOMBSTONE — see /api/cash-advances/applications/route.ts
 */
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Cash-advance management has moved. Use the admin portal directly.' }, { status: 410 });
}
