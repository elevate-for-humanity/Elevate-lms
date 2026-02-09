import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// MOU signing moved to reduce bundle size
export async function POST() {
  return NextResponse.json(
    { error: 'MOU signing temporarily unavailable', message: 'Please contact support' },
    { status: 503 }
  );
}
