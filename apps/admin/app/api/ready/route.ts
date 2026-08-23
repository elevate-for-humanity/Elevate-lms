import { NextResponse } from 'next/server';
import { getRuntimeReadiness } from '@/lib/health/service-health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const readiness = getRuntimeReadiness();
  const agenticExecutorReady = process.env.ELEVATE_SERVICE !== 'admin'
    || process.env.ELEVATE_AGENTIC_EXECUTOR_STARTED === 'true';
  const ready = readiness.ready && agenticExecutorReady;
  const missing = agenticExecutorReady
    ? readiness.missing
    : [...readiness.missing, 'AGENTIC_EXECUTOR'];

  return NextResponse.json(
    {
      service: 'admin',
      ready,
      status: ready ? 'ready' : 'not_ready',
      commit: readiness.commit,
      buildId: readiness.buildId,
      builtAt: readiness.builtAt,
      missing,
      agenticExecutorReady,
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
