/** Containers Health Endpoint */
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const checks: CapabilityHealth['checks'] = [];
  let status: CapabilityHealth['status'] = 'healthy';
  const hasNorthflank = !!process.env.NORTHFLANK_API_TOKEN;
  checks.push({ name: 'Northflank API', passed: hasNorthflank, message: hasNorthflank ? 'Northflank API configured' : 'No Northflank API token - containers disabled' });
  if (!hasNorthflank) status = 'unavailable';
  const hasProjectId = !!process.env.NORTHFLANK_PROJECT_ID;
  checks.push({ name: 'Northflank Project', passed: hasProjectId, message: hasProjectId ? 'Project ID configured' : 'No project ID' });
  const hasDocker = !!process.env.DOCKER_TOKEN;
  checks.push({ name: 'Docker Registry', passed: true, message: hasDocker ? 'Docker registry configured' : 'Docker registry not configured (optional)' });
  checks.push({ name: 'Container Resources', passed: hasNorthflank && hasProjectId, message: hasNorthflank && hasProjectId ? 'Container management available' : 'Container management requires Northflank setup' });

  const response: CapabilityHealth = { capability: 'containers', status, configured: hasNorthflank && hasProjectId, checks, checkedAt: new Date().toISOString() };
  return NextResponse.json(response, { status: status === 'unavailable' ? 503 : 200 });
}
