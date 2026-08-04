/**
 * GET /api/health
 *
 * Readiness probe - exposes all build identities for debugging.
 * Read at runtime (server-side), not bundled.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      service: 'marketing',
      status: 'healthy',
      ready: true,
      // Build identity (server runtime env — NOT bundled)
      commit: process.env.GIT_SHA ?? 'MISSING',
      github: process.env.GITHUB_SHA ?? 'MISSING',
      // Client identity (bundled into JS at build time)
      publicCommit: process.env.NEXT_PUBLIC_GIT_SHA ?? 'MISSING',
      // Build metadata
      buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? 'MISSING',
      buildTime: process.env.BUILD_TIMESTAMP ?? 'MISSING',
      // Runtime context
      nodeEnv: process.env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
