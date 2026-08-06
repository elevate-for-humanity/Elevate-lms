/**
 * GET /api/health/build-version
 *
 * Returns build identity for deployment verification.
 * Always returns 200 with available data — never throws 5xx.
 */

import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const commitSha =
    process.env.GIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.NEXT_PUBLIC_GIT_SHA ??
    'unknown';

  let builtAt: string | null = null;

  try {
    const versionPath = join(process.cwd(), 'public', 'version.json');
    if (existsSync(versionPath)) {
      const versionData = JSON.parse(readFileSync(versionPath, 'utf-8'));
      builtAt = versionData.builtAt ?? versionData.built_at ?? null;
    }
  } catch {
    // version.json not available — fine
  }

  return NextResponse.json(
    {
      service: 'admin',
      commit: commitSha,
      shortSha: commitSha === 'unknown' ? 'unknown' : commitSha.slice(0, 12),
      version: process.env.APP_VERSION ?? commitSha.slice(0, 12),
      builtAt: builtAt ?? process.env.BUILD_TIMESTAMP ?? null,
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
