/**
 * GET /api/health
 *
 * Dependency-aware service health. Northflank readiness uses /api/ready so a
 * downstream outage is reported truthfully without evicting every runnable pod.
 */

import { NextResponse } from 'next/server';
import { checkSupabaseHealth, getRuntimeReadiness } from '@/lib/health/service-health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const readiness = getRuntimeReadiness();
  const supabase = await checkSupabaseHealth();
  const healthy = readiness.ready && supabase.ok;

  return NextResponse.json(
    {
      service: 'lms',
      status: healthy ? 'healthy' : readiness.ready ? 'degraded' : 'unhealthy',
      healthy,
      ready: readiness.ready,
      canonicalDashboard: '/lms/dashboard',
      healthContract: 'lms-v4',
      commit: readiness.commit,
      buildId: readiness.buildId,
      builtAt: readiness.builtAt,
      configuration: {
        ok: readiness.ready,
        missing: readiness.missing,
      },
      dependencies: {
        supabase,
      },
      environment: process.env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
        'X-EFH-Service': 'lms',
        'X-EFH-Commit': readiness.commit,
      },
    },
  );
}
