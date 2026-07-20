/**
 * GET /api/version
 *
 * Returns authoritative release identity.
 * gitSha must come from GIT_SHA environment variable.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const gitSha = process.env.GIT_SHA;
  const buildId = process.env.BUILD_ID;
  
  const response: Record<string, unknown> = {
    service: process.env.SERVICE_NAME || 'marketing',
    gitSha: gitSha || null,
    gitShaShort: gitSha ? gitSha.substring(0, 12) : null,
    nextBuildId: buildId || null,
    environment: process.env.NODE_ENV || 'production',
    node: process.version,
    timestamp: new Date().toISOString(),
  };

  // Flag if release identity is incomplete
  if (!gitSha) {
    response.releaseIdentityStatus = 'missing';
    response._warning = 'GIT_SHA not set - release identity is incomplete';
  }

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
