/**
 * DISABLED — cash-advance functionality is not part of the production learner journey.
 * Tables/data are preserved, but all LMS API access is intentionally unavailable.
 */
import { NextResponse } from 'next/server';

const DISABLED = {
  error: 'Cash advance functionality is disabled for production stabilization.',
};

export async function GET() {
  return NextResponse.json(DISABLED, { status: 410 });
}

export async function POST() {
  return NextResponse.json(DISABLED, { status: 410 });
}
