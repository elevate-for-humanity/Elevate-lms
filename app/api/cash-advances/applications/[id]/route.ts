/**
 * DISABLED — see /api/cash-advances/applications/route.ts.
 */
import { NextResponse } from 'next/server';

const DISABLED = {
  error: 'Cash advance functionality is disabled for production stabilization.',
};

export async function GET() {
  return NextResponse.json(DISABLED, { status: 410 });
}

export async function PATCH() {
  return NextResponse.json(DISABLED, { status: 410 });
}
