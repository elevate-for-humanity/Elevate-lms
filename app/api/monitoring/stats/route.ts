import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import {
  getStats,
  getRecentAuthFailures,
  getRecentAdminActions,
  getFailedLoginsByIP,
} from '@/lib/monitoring';
import { requireOrgAdmin } from '@/lib/auth/require-org-admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * GET /api/monitoring/stats
 * Get monitoring statistics (admin only)
 */
export async function GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Require super_admin for monitoring access
    // In development, allow without auth
    if (process.env.NODE_ENV === 'production') {
      // Get org ID from query parameter or session
      const url = new URL(req.url);
      const orgId = url.searchParams.get('orgId');

      if (!orgId) {
        return NextResponse.json(
          { error: 'Organization ID required' },
          { status: 400 }
        );
      }

      const { role } = await requireOrgAdmin(req, orgId);

      if (role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Super admin access required' },
          { status: 403 }
        );
      }
    }

    const url = new URL(req.url);
    const timeWindow = parseInt(url.searchParams.get('window') || '3600000', 10); // Default 1 hour
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const stats = getStats(timeWindow);
    const authFailures = getRecentAuthFailures(limit);
    const adminActions = getRecentAdminActions(limit);
    const failedLoginsByIP = getFailedLoginsByIP(timeWindow);

    return NextResponse.json({
      stats,
      authFailures: authFailures.map((e) => ({
        timestamp: e.timestamp,
        endpoint: e.endpoint,
        statusCode: e.statusCode,
        userId: e.userId,
        ip: e.ip,
        message: e.message,
      })),
      adminActions: adminActions.map((e) => ({
        timestamp: e.timestamp,
        endpoint: e.endpoint,
        userId: e.userId,
        message: e.message,
        metadata: e.metadata,
      })),
      failedLoginsByIP: failedLoginsByIP.slice(0, 20), // Top 20 IPs
    });
  } catch (error) { 
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to get monitoring stats' },
      { status: 500 }
    );
  }
}
