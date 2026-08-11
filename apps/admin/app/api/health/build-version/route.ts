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

type VersionData = {
  commit?: string;
  sha?: string;
  builtAt?: string;
  built_at?: string;
  service?: string;
};

export async function GET() {
  let versionData: VersionData = {};

  try {
    const versionPath = join(process.cwd(), 'public', 'version.json');
    if (existsSync(versionPath)) {
      versionData = JSON.parse(readFileSync(versionPath, 'utf-8')) as VersionData;
    }
  } catch {
    versionData = {};
  }

  const commitSha =
    versionData.commit ??
    versionData.sha ??
    process.env.GIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.BUILD_SHA ??
    process.env.NEXT_PUBLIC_GIT_SHA ??
    'unknown';

  return NextResponse.json(
    {
      service: versionData.service ?? 'admin',
      commit: commitSha,
      shortSha: commitSha === 'unknown' ? 'unknown' : commitSha.slice(0, 12),
      version: process.env.APP_VERSION ?? (commitSha === 'unknown' ? 'unknown' : commitSha.slice(0, 12)),
      builtAt: versionData.builtAt ?? versionData.built_at ?? process.env.BUILD_TIMESTAMP ?? null,
      environment: process.env.NODE_ENV,
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
