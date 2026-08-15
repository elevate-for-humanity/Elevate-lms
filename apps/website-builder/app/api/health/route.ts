import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'elevate-website-builder',
    build: process.env.GIT_SHA || process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
  });
}
