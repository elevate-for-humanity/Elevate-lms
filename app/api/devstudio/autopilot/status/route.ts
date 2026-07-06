/**
 * Autopilot Status API - Dev Studio
 * Returns current autopilot status and configuration
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface AutopilotStatus {
  enabled: boolean;
  running: boolean;
  lastRun: string | null;
  nextRun: string | null;
  tasksCompleted: number;
  tasksFailed: number;
  containerId: string | null;
  featureFlags: {
    autopilotCronEnabled: boolean;
    autopilotSecretSet: boolean;
  };
}

export async function GET() {
  try {
    await requireAdmin();

    const autopilotCronEnabled = process.env.AUTOPILOT_CRON_ENABLED === 'true';
    const autopilotSecretSet = Boolean(process.env.AUTOPILOT_SECRET);

    const status: AutopilotStatus = {
      enabled: autopilotSecretSet,
      running: false,
      lastRun: null,
      nextRun: autopilotCronEnabled ? getNextRunTime() : null,
      tasksCompleted: 0,
      tasksFailed: 0,
      containerId: process.env.NORTHFLANK_LMS_SERVICE_ID || null,
      featureFlags: {
        autopilotCronEnabled,
        autopilotSecretSet,
      },
    };

    logger.info('[devstudio/autopilot] Status retrieved', status);

    return NextResponse.json(status);
  } catch (error) {
    logger.error('[devstudio/autopilot] Status error', error);
    return NextResponse.json(
      { error: 'Failed to get autopilot status' },
      { status: 500 }
    );
  }
}

function getNextRunTime(): string | null {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setMinutes(Math.ceil(nextRun.getMinutes() / 15) * 15);
  nextRun.setSeconds(0);
  return nextRun.toISOString();
}
