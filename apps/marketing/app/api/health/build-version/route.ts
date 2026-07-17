/**
 * app/api/health/build-version/route.ts
 *
 * Returns current build version including Git SHA for deployment verification.
 * The version.json file is generated during CI/CD build.
 */

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface VersionInfo {
  service?: string;
  commit?: string;
  builtAt?: string;
}

export async function GET() {
  let versionInfo: VersionInfo = {};

  try {
    // Read version.json generated during build
    const versionPath = join(process.cwd(), 'public', 'version.json');
    const versionContent = readFileSync(versionPath, 'utf-8');
    versionInfo = JSON.parse(versionContent);
  } catch {
    // Fallback if version.json not available
    versionInfo = {
      service: process.env.SERVICE_NAME || 'unknown',
      commit: process.env.NEXT_PUBLIC_BUILD_VERSION || process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
      builtAt: new Date().toISOString(),
    };
  }

  return NextResponse.json({
    service: versionInfo.service || 'lms',
    commit: versionInfo.commit || 'unknown',
    buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
    deploymentId: process.env.NEXT_PUBLIC_DEPLOYMENT_ID || 'unknown',
    builtAt: versionInfo.builtAt || new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
