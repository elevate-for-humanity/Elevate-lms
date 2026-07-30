/**
 * GET /api/version
 *
 * Returns deterministic build identity: commit SHA, BUILD_ID, timestamp.
 * This endpoint is the source of truth for production parity checks.
 * NEVER cache this response — use Cache-Control: no-store.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function val(input: string | undefined, fallback = 'unknown'): string {
  return input?.trim() || fallback;
}

export async function GET() {
  const commitSha = val(
    process.env.GIT_SHA ??
      process.env.GITHUB_SHA ??
      process.env.NEXT_PUBLIC_GIT_SHA,
  );

  const buildId = val(
    process.env.NEXT_PUBLIC_BUILD_ID,
    commitSha !== 'unknown' ? `elevate-${commitSha}` : 'unknown',
  );

  return NextResponse.json(
    {
      service: 'admin',
      commitSha,
      buildId,
      builtAt: val(process.env.BUILD_TIMESTAMP),
      nodeEnvironment: val(process.env.NODE_ENV),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
  );
}
