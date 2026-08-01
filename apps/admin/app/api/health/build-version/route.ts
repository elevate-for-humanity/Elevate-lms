/**
 * GET /api/health/build-version
 *
 * Returns build identity for health checks.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const commitSha =
    process.env.GIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.NEXT_PUBLIC_GIT_SHA ??
    'unknown';

  return NextResponse.json(
    {
      service: 'admin',
      commitSha,
      shortSha: commitSha === 'unknown' ? 'unknown' : commitSha.slice(0, 12),
      version: process.env.APP_VERSION ?? commitSha.slice(0, 12),
      builtAt: process.env.BUILD_TIMESTAMP ?? null,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
