import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { reconcileOpenHandsTasks } from '@/lib/devstudio/openhands/runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function _GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const taskId = new URL(request.url).searchParams.get('task_id')?.trim() ?? '';
  // Scheduled reconciliation has no individual task ID. Preserve the
  // authenticated single-task path for targeted operator diagnostics.
  if (taskId && !UUID_RE.test(taskId)) {
    return NextResponse.json({ error: 'Invalid task_id' }, { status: 400 });
  }

  const result = await reconcileOpenHandsTasks(taskId ? 1 : 10, taskId || undefined);
  return NextResponse.json({ success: result.errors.length === 0, task_id: taskId || null, ...result });
}

export const GET = withRuntime(_GET);
