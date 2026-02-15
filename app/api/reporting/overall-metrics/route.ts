export const runtime = 'edge';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { calculateOverallMetrics } from '@/lib/reporting/enterprise-dashboard';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

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
