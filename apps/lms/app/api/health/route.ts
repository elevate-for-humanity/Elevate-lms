/**
 * GET /api/health
 *
 * Readiness probe - verifies application is initialized and ready to serve
 * requests. This intentionally performs no external dependency checks so
 * Northflank readiness cannot remove every pod because of a downstream outage.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const commit = process.env.GIT_SHA ?? process.env.GITHUB_SHA ?? 'unknown';

  return NextResponse.json(
    {
      service: 'lms',
      status: 'healthy',
      ready: true,
      canonicalDashboard: '/lms/dashboard',
      healthContract: 'lms-v2',
      commit,
      buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? 'unknown',
      builtAt: process.env.BUILD_TIMESTAMP ?? 'unknown',
      environment: process.env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-EFH-Service': 'lms',
        'X-EFH-Commit': commit,
      },
    },
  );
}
