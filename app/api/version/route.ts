import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const buildId = process.env.NEXT_BUILD_ID || 'local-dev';
  const gitSha = process.env.GIT_SHA || 'unknown';
  const imageTag = process.env.IMAGE_TAG || 'local';
  const imageDigest = process.env.IMAGE_DIGEST || 'unknown';
  const builtAt = process.env.BUILD_TIMESTAMP || new Date().toISOString();
  const deployedAt = process.env.DEPLOYED_AT || new Date().toISOString();
  const environment = process.env.NODE_ENV || 'development';
  const service = 'marketing';

  const version = {
    service,
    environment,
    gitSha,
    buildId,
    imageTag,
    imageDigest,
    builtAt,
    deployedAt,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(version, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Build-Id': buildId,
      'X-Git-SHA': gitSha,
      'X-Service': service,
    },
  });
}
