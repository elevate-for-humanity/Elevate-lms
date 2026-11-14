import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    { service: 'telnyx', ready: false, retired: true, replacement: 'twilio-asterisk' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
