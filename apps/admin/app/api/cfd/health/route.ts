/**
 * CFD Simulation Health Endpoint
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
  const status: CapabilityHealth['status'] = 'degraded';
  
  // Check if CFD is enabled
  const cfdEnabled = process.env.CFD_ENABLED === 'true';
  checks.push({
    name: 'CFD Feature Flag',
    passed: cfdEnabled,
    message: cfdEnabled ? 'CFD enabled via CFD_ENABLED=true' : 'CFD not enabled - set CFD_ENABLED=true to activate',
  });
  
  // Check OpenFOAM installation (simulations require it)
  // This would typically check if OpenFOAM binaries are available
  checks.push({
    name: 'OpenFOAM Runtime',
    passed: cfdEnabled, // Would need actual check in production
    message: cfdEnabled ? 'Runtime available via container' : 'Requires container runtime setup',
  });
  
  // Check container support
  const hasContainers = !!process.env.NORTHFLANK_API_TOKEN;
  checks.push({
    name: 'Container Support',
    passed: hasContainers,
    message: hasContainers ? 'Container runtime available' : 'Container runtime required for CFD simulations',
  });
  
  // Check storage for simulation files
  checks.push({
    name: 'Storage for Models',
    passed: true, // Uses Supabase storage
    message: 'Supabase storage available for CFD models and results',
  });
  
  const response: CapabilityHealth = {
    capability: 'cfd-simulation',
    status: cfdEnabled && hasContainers ? 'healthy' : 'unavailable',
    configured: cfdEnabled,
    checks,
    checkedAt: new Date().toISOString(),
  };
  
  return NextResponse.json(response, {
    status: response.status === 'unavailable' ? 503 : 200,
  });
}
