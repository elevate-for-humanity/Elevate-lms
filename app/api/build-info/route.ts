import { NextResponse } from 'next/server';

export async function GET() {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || process.env.BUILD_ID || 'unknown';
  const gitSha = process.env.GITHUB_SHA || process.env.NEXT_PUBLIC_GIT_SHA || 'unknown';
  const deployedAt = process.env.NEXT_PUBLIC_DEPLOYED_AT || new Date().toISOString();
  
  return NextResponse.json({
    buildId,
    gitSha,
    deployedAt,
    timestamp: Date.now(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    service: 'marketing',
  });
}
