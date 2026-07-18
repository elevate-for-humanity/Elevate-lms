import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'marketing',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_BUILD_ID || 'dev',
  });
}
