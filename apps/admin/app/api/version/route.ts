import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    service: 'admin',
    gitSha: process.env.GIT_SHA || 'unknown',
    buildId: process.env.BUILD_ID || 'unknown',
    buildTimestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
    version: '1.0.0',
  });
}
