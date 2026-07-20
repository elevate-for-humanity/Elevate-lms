/**
 * app/api/version/route.ts
 *
 * Dependency-free version endpoint for deployment verification.
 * Returns service identity and build information without importing
 * Supabase, auth, database, or other runtime dependencies.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    service: 'lms',
    gitSha: process.env.GITHUB_SHA || process.env.NEXT_PUBLIC_GIT_SHA || process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
    buildId: process.env.GITHUB_SHA || process.env.NEXT_PUBLIC_BUILD_ID || process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
    buildTimestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}
