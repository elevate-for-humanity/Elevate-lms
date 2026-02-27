export const runtime = 'edge';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { calculateOverallMetrics } from '@/lib/reporting/enterprise-dashboard';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const metrics = await calculateOverallMetrics();
    return NextResponse.json(metrics);
  } catch (error) { 
    logger.error('Error fetching overall metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overall metrics' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/analytics/metrics/overall-metrics', _GET);
