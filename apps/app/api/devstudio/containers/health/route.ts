/**
 * Containers Health Endpoint
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
  
  // Check Northflank API
  const hasNorthflank = !!process.env.NORTHFLANK_API_TOKEN;
  checks.push({
    name: 'Northflank API',
    passed: hasNorthflank,
    message: hasNorthflank ? 'Northflank API configured' : 'No Northflank API token - containers disabled',
  });
  if (!hasNorthflank) status = 'unavailable';
  
  // Check Northflank Project ID
  const hasProjectId = !!process.env.NORTHFLANK_PROJECT_ID;
  checks.push({
    name: 'Northflank Project',
    passed: hasProjectId,
    message: hasProjectId ? 'Project ID configured' : 'No project ID',
  });
  
  // Check Docker token (optional)
  const hasDocker = !!process.env.DOCKER_TOKEN;
  checks.push({
    name: 'Docker Registry',
    passed: true, // Optional
    message: hasDocker ? 'Docker registry configured' : 'Docker registry not configured (optional)',
  });
  
  // Check container quota
  checks.push({
    name: 'Container Resources',
    passed: hasNorthflank && hasProjectId,
    message: hasNorthflank && hasProjectId 
      ? 'Container management available' 
      : 'Container management requires Northflank setup',
  });
  
  const response: CapabilityHealth = {
    capability: 'containers',
    status,
    configured: hasNorthflank && hasProjectId,
    checks,
    checkedAt: new Date().toISOString(),
  };
  
  return NextResponse.json(response, {
    status: status === 'unavailable' ? 503 : 200,
  });
}
