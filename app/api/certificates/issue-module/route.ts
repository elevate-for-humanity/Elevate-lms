import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Certificate issuance moved to reduce bundle size
export async function POST() {
  return NextResponse.json(
    { error: 'Certificate issuance temporarily unavailable' },
    { status: 503 }
  );
}
