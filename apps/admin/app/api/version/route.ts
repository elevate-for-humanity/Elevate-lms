import { NextResponse } from 'next/server';
import { getCanonicalSha, getBuildTimestamp, getBuildId } from '@/lib/version/getAppVersion';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      service: 'admin',
      gitSha: getCanonicalSha(),
      buildId: getBuildId(),
      builtAt: getBuildTimestamp(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
