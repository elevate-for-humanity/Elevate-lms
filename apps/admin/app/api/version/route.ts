import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const gitSha =
  process.env.GIT_SHA ??
  process.env.GITHUB_SHA ??
  process.env.COMMIT_SHA ??
  process.env.NEXT_PUBLIC_GIT_SHA ??
  'unknown';

export async function GET() {
  return NextResponse.json(
    {
      service: 'admin',
      gitSha,
      buildId: process.env.GITHUB_SHA ?? process.env.NEXT_PUBLIC_BUILD_VERSION ?? 'unknown',
      builtAt: process.env.BUILD_TIMESTAMP ?? 'unknown',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
