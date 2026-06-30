import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, service: 'tax', endpoints: ['/api/tax/book-appointment', '/api/tax/file-return', '/api/tax/jotform-webhook'] });
}
