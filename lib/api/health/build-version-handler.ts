import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

interface VersionInfo {
  service?: string;
  commit?: string;
  builtAt?: string;
}

export function buildVersionHandler(fallbackService: string) {
  return async function GET() {
    let versionInfo: VersionInfo = {};

    try {
      const versionPath = join(process.cwd(), 'public', 'version.json');
      versionInfo = JSON.parse(readFileSync(versionPath, 'utf-8')) as VersionInfo;
    } catch {
      versionInfo = {
        service: process.env.SERVICE_NAME || fallbackService,
        commit: process.env.NEXT_PUBLIC_BUILD_VERSION || process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
        builtAt: new Date().toISOString(),
      };
    }

    return NextResponse.json(
      {
        service: versionInfo.service || fallbackService,
        commit: versionInfo.commit || 'unknown',
        buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
        deploymentId: process.env.NEXT_PUBLIC_DEPLOYMENT_ID || 'unknown',
        builtAt: versionInfo.builtAt || new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } },
    );
  };
}
