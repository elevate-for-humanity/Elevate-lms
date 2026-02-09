import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Compliance report PDF generation moved to reduce bundle size
export async function GET() {
  return NextResponse.json(
    { error: 'PDF report generation temporarily unavailable' },
    { status: 503 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'PDF report generation temporarily unavailable' },
    { status: 503 }
  );
}
