/**
 * DISABLED — see /api/cash-advances/applications/route.ts.
 */
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Cash advance functionality is disabled for production stabilization.' },
    { status: 410 },
  );
}
