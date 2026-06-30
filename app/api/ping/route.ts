/**
 * GET /api/ping
 *
 * // PUBLIC ROUTE: Northflank liveness probe — no auth, no DB.
 * Returns 200 as soon as the Next.js runtime is accepting requests.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
