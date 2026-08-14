import { NextResponse } from 'next/server';
import { runPlatformAutopilotTick } from '@/lib/autopilot/platform-autopilot';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runPlatformAutopilotTick();
  logger.info('[cron] autopilot-tick', result);

  return NextResponse.json({
    success: result.ok,
    ...result,
    timestamp: new Date().toISOString(),
  });
}

export const GET = withRuntime(_GET);
