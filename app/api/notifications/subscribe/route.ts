export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const subscription = await request.json();

    // Note: Store subscription in database
    // For now, just log it
    // logger.info('[Notifications] New subscription:', subscription);

    // In production, you would:
    // 1. Extract user ID from session/auth
    // 2. Store subscription in database with user ID
    // 3. Associate with user preferences

    return NextResponse.json({
      success: true,
      message: 'Subscription saved',
    });
  } catch (error) { 
    logger.error('[Notifications] Subscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/notifications/subscribe', _POST);
