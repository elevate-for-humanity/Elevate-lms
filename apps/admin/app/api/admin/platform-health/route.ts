/**
 * GET /api/admin/platform-health
 *
 * Returns platform health snapshot for the admin dashboard.
 * Calls getPlatformHealth() from lib/platform/platform-health.ts
 */

import { NextResponse } from 'next/server';
import { getPlatformHealth } from '@/lib/platform/platform-health';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const snapshot = await getPlatformHealth();
  return NextResponse.json(snapshot, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}
