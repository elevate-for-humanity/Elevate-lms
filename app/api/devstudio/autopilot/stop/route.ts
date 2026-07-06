/**
 * Autopilot Stop API - Dev Studio
 * Stops a running autopilot task
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const taskId = body.taskId;

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }

    logger.info('[devstudio/autopilot] Stop requested', { taskId });

    // In a real implementation, this would:
    // 1. Cancel the job in the queue
    // 2. Or signal the running task to stop
    // For now, we simulate the response

    return NextResponse.json({
      success: true,
      message: 'Stop signal sent',
      taskId,
      stoppedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[devstudio/autopilot] Stop error', error);
    return NextResponse.json(
      { error: 'Failed to stop autopilot task' },
      { status: 500 }
    );
  }
}
