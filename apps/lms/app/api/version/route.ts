/**
 * app/api/version/route.ts
 *
 * Dependency-free version endpoint for deployment verification.
 * Returns service identity and build information without importing
 * Supabase, auth, database, or other runtime dependencies.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// IMPORTANT: GITHUB_SHA is primary (set by CI workflow)
// COMMIT_SHA is NOT used as primary - Northflank may cache stale values
const gitSha =
  process.env.GITHUB_SHA ??
  process.env.GIT_SHA ??
  process.env.NEXT_PUBLIC_GIT_SHA ??
  process.env.NEXT_PUBLIC_BUILD_VERSION ??
  'unknown';

export async function GET() {
  return NextResponse.json(
    {
      service: 'lms',
      gitSha,
      buildId: process.env.GITHUB_SHA ?? process.env.NEXT_PUBLIC_BUILD_VERSION ?? 'unknown',
      builtAt: process.env.BUILD_TIMESTAMP ?? 'unknown',
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
