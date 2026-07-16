/**
 * app/api/version/route.ts
 *
 * Returns current build version including Git SHA for deployment verification.
 * This endpoint allows monitoring systems to verify which version is deployed.
 */

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface VersionInfo {
  service?: string;
  commit?: string;
  builtAt?: string;
  imageTag?: string;
}

export async function GET() {
  let versionInfo: VersionInfo = {};

  // Try to read version.json generated during build
  try {
    const versionPath = join(process.cwd(), 'public', 'version.json');
    const versionContent = readFileSync(versionPath, 'utf-8');
    versionInfo = JSON.parse(versionContent);
  } catch {
    // Fallback if version.json not available
    versionInfo = {
      service: process.env.SERVICE_NAME || 'lms',
      commit: process.env.NEXT_PUBLIC_BUILD_VERSION || process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
      builtAt: new Date().toISOString(),
    };
  }

  // Determine service name from environment or hostname
  const hostname = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL || '';
  let service = versionInfo.service || 'unknown';
  
  if (hostname.includes('admin')) {
    service = 'admin';
  } else if (hostname.includes('app')) {
    service = 'lms';
  } else if (process.env.SERVICE_NAME) {
    service = process.env.SERVICE_NAME;
  }

  return NextResponse.json({
    service,
    commit: versionInfo.commit || process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
    gitSha: process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
    buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
    deploymentId: process.env.NEXT_PUBLIC_DEPLOYMENT_ID || 'unknown',
    imageTag: versionInfo.imageTag || process.env.IMAGE_TAG || 'unknown',
    builtAt: versionInfo.builtAt || new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
    },
  });
}
