import { NextResponse } from 'next/server';
import { GET as checkQuickBooks } from '../../health/quickbooks/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const health = await checkQuickBooks();
  const result = await health.json();
  return NextResponse.json(
    { available: health.ok && result.ready === true },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
