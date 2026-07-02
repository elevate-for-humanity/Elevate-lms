/**
 * Autopilot Run API - Dev Studio
 * Triggers a manual autopilot run
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    // Check if autopilot is enabled
    const autopilotSecretSet = Boolean(process.env.AUTOPILOT_SECRET);
    if (!autopilotSecretSet) {
      return NextResponse.json(
        { error: 'Autopilot not configured. Set AUTOPILOT_SECRET to enable.' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const taskType = body.task || 'platform-tick';

    logger.info('[devstudio/autopilot] Manual run triggered', { taskType });

    // In a real implementation, this would:
    // 1. Create a job in a queue (e.g., Upstash Redis)
    // 2. Or directly invoke the autopilot function
    // For now, we simulate the response

    return NextResponse.json({
      success: true,
      message: 'Autopilot run initiated',
      taskId: crypto.randomUUID(),
      taskType,
      status: 'queued',
      startedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[devstudio/autopilot] Run error', error);
    return NextResponse.json(
      { error: 'Failed to start autopilot run' },
      { status: 500 }
    );
  }
}
