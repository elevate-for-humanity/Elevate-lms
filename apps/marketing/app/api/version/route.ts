/**
 * GET /api/version
 *
 * Exposes build metadata to confirm deployed version.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      service: process.env.SERVICE_NAME || 'marketing',
      gitSha:
        process.env.GIT_SHA ||
        process.env.COMMIT_SHA ||
        process.env.NEXT_PUBLIC_GIT_SHA ||
        'unknown',
      buildId: process.env.BUILD_ID ?? 'unknown',
      node: process.version,
      environment: process.env.NODE_ENV,
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
