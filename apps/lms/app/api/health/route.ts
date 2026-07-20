/**
 * LMS Health Endpoint
 * 
 * Returns health status with Supabase DB connectivity check.
 * Uses unified version utility for canonical SHA resolution.
 */

import { NextResponse } from 'next/server';
import { getCanonicalSha, getBuildTimestamp } from '@/lib/version/getAppVersion';
import { probeSupabaseDatabase } from '@/lib/supabase/db-probe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const dbProbe = await probeSupabaseDatabase();
  
  const isHealthy = dbProbe.ok;
  
  const health = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'lms',
    gitSha: getCanonicalSha(),
    buildTimestamp: getBuildTimestamp(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    database: {
      connected: dbProbe.ok,
      error: dbProbe.error || null,
    },
  };

  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
