import { NextResponse } from 'next/server';
import { getRuntimeReadiness } from '@/lib/health/service-health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const readiness = getRuntimeReadiness();

  return NextResponse.json(
    {
      service: 'marketing',
      ready: readiness.ready,
      status: readiness.ready ? 'ready' : 'not_ready',
      commit: readiness.commit,
      buildId: readiness.buildId,
      builtAt: readiness.builtAt,
      missing: readiness.missing,
      timestamp: new Date().toISOString(),
    },
    {
      status: readiness.ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
