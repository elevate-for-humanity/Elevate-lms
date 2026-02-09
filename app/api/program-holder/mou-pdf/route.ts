import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// MOU PDF generation moved to reduce bundle size
export async function GET() {
  return NextResponse.json(
    { error: 'PDF generation temporarily unavailable', message: 'Please contact support for MOU documents' },
    { status: 503 }
  );
}
