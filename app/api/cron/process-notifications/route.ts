import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { processNotificationQueue, getQueueStats } from '@/lib/notifications/processor';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Cron endpoint to process notification queue.
 * Should be called every 1-5 minutes by a scheduled function.
 * 
 * Security: Requires CRON_SECRET header to prevent unauthorized access.
 */
async function _POST(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processNotificationQueue();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Notification processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check queue status (admin only)
 */
async function _GET(request: NextRequest) {
  // Verify cron secret or admin auth
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getQueueStats();

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/cron/process-notifications', _GET);
export const POST = withApiAudit('/api/cron/process-notifications', _POST);
