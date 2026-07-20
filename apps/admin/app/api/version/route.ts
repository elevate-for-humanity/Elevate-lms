import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    service: 'admin',
    gitSha: process.env.GITHUB_SHA || process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
    buildId: process.env.GITHUB_SHA || process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
    buildTimestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
    version: '1.0.0',
  });
}
