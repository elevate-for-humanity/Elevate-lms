export const runtime = 'edge';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { calculateFunderMetrics } from '@/lib/reporting/enterprise-dashboard';
import { logger } from '@/lib/logger';
import { apiRequireAdmin } from '@/lib/authGuards';

export async function GET() {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
    const metrics = await calculateFunderMetrics();
    return NextResponse.json(metrics);
  } catch (error) { /* Error handled silently */ 
    logger.error('Error fetching funder metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funder metrics' },
      { status: 500 }
    );
  }
}
