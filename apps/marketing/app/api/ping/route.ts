/**
 * GET /api/ping
 *
 * Unauthenticated liveness probe used by Northflank health checks.
 * Returns 200 as soon as the Next.js runtime is accepting requests.
 * No auth, no DB - intentionally minimal.
 * 
 * REQUIRED for "no healthy upstream" fix.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    { 
      ok: true, 
      service: 'marketing',
      timestamp: new Date().toISOString() 
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    }
  );
}
