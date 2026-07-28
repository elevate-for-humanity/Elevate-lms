/**
 * Deployments Health Endpoint
 */

import { NextResponse } from 'next/server';

interface CapabilityHealth {
  capability: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  configured: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
  checkedAt: string;
}

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<CapabilityHealth>> {
  const checks: CapabilityHealth['checks'] = [];
  let status: CapabilityHealth['status'] = 'healthy';
  
  // Check GitHub token
  const hasGithub = !!process.env.GITHUB_TOKEN;
  checks.push({
    name: 'GitHub Integration',
    passed: hasGithub,
    message: hasGithub ? 'GitHub token configured' : 'No GitHub token - deployments disabled',
  });
  if (!hasGithub) status = 'degraded';
  
  // Check Northflank API
  const hasNorthflank = !!process.env.NORTHFLANK_API_TOKEN;
  checks.push({
    name: 'Northflank Integration',
    passed: hasNorthflank,
    message: hasNorthflank ? 'Northflank API configured' : 'No Northflank token - container deployments disabled',
  });
  
  // Check deployment workflow
  checks.push({
    name: 'Deployment Workflow',
    passed: hasGithub && hasNorthflank,
    message: hasGithub && hasNorthflank 
      ? 'Full deployment pipeline ready' 
      : 'Partial deployment - some features may not work',
  });
  
  // Check GitHub Actions secrets
  const hasGithubSecrets = !!process.env.GH_TOKEN || !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  checks.push({
    name: 'GitHub Actions Secrets',
    passed: hasGithubSecrets,
    message: hasGithubSecrets ? 'GitHub secrets configured' : 'Secrets may be missing',
  });
  
  const response: CapabilityHealth = {
    capability: 'deployments',
    status,
    configured: hasGithub && hasNorthflank,
    checks,
    checkedAt: new Date().toISOString(),
  };
  
  return NextResponse.json(response, {
    status: status === 'unavailable' ? 503 : 200,
  });
}
