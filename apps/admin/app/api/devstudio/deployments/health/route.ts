/** Deployments Health Endpoint */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';

interface CapabilityHealth {
  capability: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  configured: boolean;
  checks: Array<{ name: string; passed: boolean; message: string }>;
  checkedAt: string;
}

export const dynamic = 'force-dynamic';

function statusCodeForHealth(status: CapabilityHealth['status']): number {
  return status === 'unavailable' ? 503 : 200;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const checks: CapabilityHealth['checks'] = [];
  let status: CapabilityHealth['status'] = 'healthy';
  const hasGithub = !!process.env.GITHUB_TOKEN;
  checks.push({ name: 'GitHub Integration', passed: hasGithub, message: hasGithub ? 'GitHub token configured' : 'No GitHub token - deployments disabled' });
  if (!hasGithub) status = 'degraded';
  const hasNorthflank = !!process.env.NORTHFLANK_API_TOKEN;
  checks.push({ name: 'Northflank Integration', passed: hasNorthflank, message: hasNorthflank ? 'Northflank API configured' : 'No Northflank token - container deployments disabled' });
  checks.push({ name: 'Deployment Workflow', passed: hasGithub && hasNorthflank, message: hasGithub && hasNorthflank ? 'Full deployment pipeline ready' : 'Partial deployment - some features may not work' });
  const hasGithubSecrets = !!process.env.GH_TOKEN || !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  checks.push({ name: 'GitHub Actions Secrets', passed: hasGithubSecrets, message: hasGithubSecrets ? 'GitHub secrets configured' : 'Secrets may be missing' });

  const response: CapabilityHealth = { capability: 'deployments', status, configured: hasGithub && hasNorthflank, checks, checkedAt: new Date().toISOString() };
  return NextResponse.json(response, { status: statusCodeForHealth(response.status) });
}
