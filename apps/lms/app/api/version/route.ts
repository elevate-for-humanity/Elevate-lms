/**
 * LMS Version Endpoint
 * 
 * Dependency-free version endpoint for deployment verification.
 * Uses unified version utility for canonical SHA resolution.
 */

import { NextResponse } from 'next/server';
import { getCanonicalSha, getBuildTimestamp, getBuildId } from '@/lib/version/getAppVersion';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      service: 'lms',
      gitSha: getCanonicalSha(),
      buildId: getBuildId(),
      builtAt: getBuildTimestamp(),
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    },
  );
}
