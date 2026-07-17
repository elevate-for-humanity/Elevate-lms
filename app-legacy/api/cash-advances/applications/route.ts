// PUBLIC ROUTE: Tombstone 410 — no data access.
/**
 * TOMBSTONE — cash-advance application management belongs in the finance repo.
 * The admin portal reads cash_advances directly from Supabase.
 * These routes are not called by any LMS page.
 */
import { NextResponse } from 'next/server';

const GONE = { error: 'Cash-advance management has moved. Use the admin portal directly.' };

export async function GET() {
  return NextResponse.json(GONE, { status: 410 });
}

export async function POST() {
  return NextResponse.json(GONE, { status: 410 });
}
