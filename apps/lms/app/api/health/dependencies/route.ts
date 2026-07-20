/**
 * GET /api/health/dependencies
 *
 * Diagnostics endpoint - reports on external services (Supabase).
 * This endpoint is for diagnostics only, NOT for readiness probes.
 * Always returns HTTP 200 with diagnostic JSON.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startedAt = Date.now();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        service: process.env.SERVICE_NAME ?? 'lms',
        supabase: {
          configured: false,
          reachable: false,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    return NextResponse.json(
      {
        ok: !error,
        service: process.env.SERVICE_NAME ?? 'lms',
        supabase: {
          configured: true,
          reachable: !error,
          latencyMs: Date.now() - startedAt,
          error: error?.message ?? null,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: process.env.SERVICE_NAME ?? 'lms',
        supabase: {
          configured: true,
          reachable: false,
          latencyMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : 'Unknown Supabase error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
