/**
 * GET /api/version
 * Returns deterministic build identity and never caches the response.
 */
import { NextResponse } from 'next/server';
import { getBuildTimestamp } from '@/lib/version/getAppVersion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function val(input: string | undefined, fallback = 'unknown'): string {
  return input?.trim() || fallback;
}

export async function GET() {
  const commitSha = val(
    process.env.GIT_SHA ?? process.env.GITHUB_SHA ?? process.env.NEXT_PUBLIC_GIT_SHA,
  );

  const buildId = val(
    process.env.NEXT_PUBLIC_BUILD_ID,
    commitSha !== 'unknown' ? `elevate-${commitSha}` : 'unknown',
  );

  return NextResponse.json(
    {
      service: 'lms',
      commitSha,
      buildId,
      builtAt: getBuildTimestamp(),
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
