import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Donation invoices and receipts are handled by /api/donate and the verified
// QuickBooks webhook. Never acknowledge legacy provider events as paid.
export async function POST() {
  return NextResponse.json(
    { error: 'Legacy donation webhook is retired. Use the QuickBooks payment flow.' },
    { status: 410 },
  );
}
