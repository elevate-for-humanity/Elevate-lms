/**
 * GET /api/admin/platform-health
 *
 * Returns a full platform health snapshot from lib/platform/platform-health.ts.
 * Single endpoint replacing the 6 separate monitoring calls.
 *
 * Used by: Mission Control (30s polling), System Health page, alerting.
 *
 * Response is cached for 10s to prevent thundering herd from multiple
 * dashboard tabs polling simultaneously.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getPlatformHealth } from '@/lib/platform/platform-health';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const snapshot = await getPlatformHealth();

  return NextResponse.json(snapshot, {
    headers: {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=20',
    },
  });
}
