import { NextResponse } from 'next/server';

import { runAutomationTasks } from '@/lib/automation/enrollment-automation';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

/**
 * Cron job endpoint for enrollment automation
 * Called by scheduled cron or external scheduler
 */
async function _GET(req: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 503 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await runAutomationTasks();

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        err: 'Automation failed',
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const GET = withRuntime(withApiAudit('/api/cron/enrollment-automation', _GET, { actor_type: 'cron' }));
