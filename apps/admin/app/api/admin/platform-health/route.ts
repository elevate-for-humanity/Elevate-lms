/**
 * GET /api/admin/platform-health
 * Returns the admin platform health snapshot to authorized platform staff.
 */

import { NextResponse } from 'next/server';
import { getPlatformHealth } from '@/lib/platform/platform-health';
import { withAuth } from '@/lib/with-auth';
import { API_ADMIN_ROLES } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withAuth(async () => {
  try {
    const snapshot = await getPlatformHealth();
    return NextResponse.json(snapshot, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    console.error('[admin/platform-health] health snapshot failed', error);
    return NextResponse.json({ error: 'Unable to load platform health' }, { status: 500 });
  }
}, { roles: API_ADMIN_ROLES });
