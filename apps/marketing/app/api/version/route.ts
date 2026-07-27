/**
 * GET /api/version
 *
 * Returns authoritative release identity.
 * gitSha must come from GIT_SHA environment variable.
 * 
 * EVIDENCE: This endpoint is the final verification point for SHA propagation.
 */

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // EVIDENCE: Capture all relevant environment variables
  const envEvidence = {
    GIT_SHA: process.env.GIT_SHA,
    GITHUB_SHA: process.env.GITHUB_SHA,
    BUILD_TIMESTAMP: process.env.BUILD_TIMESTAMP,
    BUILD_ID: process.env.BUILD_ID,
    NEXT_PUBLIC_GIT_SHA: process.env.NEXT_PUBLIC_GIT_SHA,
    NEXT_PUBLIC_BUILD_VERSION: process.env.NEXT_PUBLIC_BUILD_VERSION,
    SERVICE_NAME: process.env.SERVICE_NAME,
    NODE_ENV: process.env.NODE_ENV,
  };
  
  const gitSha = process.env.GIT_SHA;
  const buildId = process.env.BUILD_ID;
  
  // EVIDENCE: Try to read version.json from public folder
  let versionJsonContent = null;
  try {
    const versionPath = join(process.cwd(), 'public', 'version.json');
    versionJsonContent = JSON.parse(readFileSync(versionPath, 'utf-8'));
  } catch {
    versionJsonContent = null;
  }
  
  const response: Record<string, unknown> = {
    service: process.env.SERVICE_NAME || 'marketing',
    gitSha: gitSha || null,
    gitShaShort: gitSha ? gitSha.substring(0, 12) : null,
    nextBuildId: buildId || null,
    environment: process.env.NODE_ENV || 'production',
    node: process.version,
    timestamp: new Date().toISOString(),
    
    // EVIDENCE: Include environment evidence for debugging
    _envEvidence: envEvidence,
    _versionJson: versionJsonContent,
    _cwd: process.cwd(),
  };

  // Flag if release identity is incomplete
  if (!gitSha) {
    response.releaseIdentityStatus = 'missing';
    response._warning = 'GIT_SHA not set - release identity is incomplete';
    response._debugHint = 'Check Docker ARG/ENV mapping and Northflank buildArguments';
  }

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
