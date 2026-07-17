import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({ error: 'Use /api/partner/applications or /api/partner/applications/[id]/approve|deny.' }, { status: 308, headers: { Location: '/api/partner/applications' } });
}
export async function POST() {
  return NextResponse.json({ error: 'Use /api/partner/applications or /api/partner/applications/[id]/approve|deny.' }, { status: 308, headers: { Location: '/api/partner/applications' } });
}
