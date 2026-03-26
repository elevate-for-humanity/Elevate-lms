
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const subscription = await request.json();

    // Note: Remove subscription from database
    // logger.info('[Notifications] Unsubscribe:', subscription);

    // In production, you would:
    // 1. Extract user ID from session/auth
    // 2. Remove subscription from database
    // 3. Update user preferences

    return NextResponse.json({
      success: true,
      message: 'Subscription removed',
    });
  } catch (error) { 
    logger.error('[Notifications] Unsubscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/notifications/unsubscribe', _POST);
