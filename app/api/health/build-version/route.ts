/**
 * app/api/health/build-version/route.ts
 * 
 * Returns current build version for client-side build mismatch detection.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION || 
                       process.env.NEXT_PUBLIC_DEPLOYMENT_ID ||
                       Date.now().toString(36);
  
  const buildTimestamp = Date.now();
  
  return NextResponse.json({
    buildVersion,
    buildTimestamp,
    deployedAt: new Date(buildTimestamp).toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

