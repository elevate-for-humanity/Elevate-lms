/**
 * GET /api/ping
 *
 * Unauthenticated liveness probe used by Northflank health checks.
 * Returns 200 as soon as the Next.js runtime is accepting requests.
 * No auth, no DB — intentionally minimal.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
