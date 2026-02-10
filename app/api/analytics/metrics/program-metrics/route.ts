export const runtime = 'edge';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { calculateProgramMetrics } from '@/lib/reporting/enterprise-dashboard';
import { logger } from '@/lib/logger';
import { apiRequireAdmin } from '@/lib/authGuards';

export async function GET() {
  try {
    const adminCheck = await apiRequireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
    const metrics = await calculateProgramMetrics();
    return NextResponse.json(metrics);
  } catch (error) { /* Error handled silently */ 
    logger.error('Error fetching program metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program metrics' },
      { status: 500 }
    );
  }
}
