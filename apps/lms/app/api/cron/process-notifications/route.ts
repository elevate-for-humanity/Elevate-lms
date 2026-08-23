import { NextRequest, NextResponse } from 'next/server';

import { withRuntime } from '@/lib/api/withRuntime';
import { processNotificationQueue, getQueueStats } from '@/lib/notifications/processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  return Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;
}

async function post(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processNotificationQueue();
    return NextResponse.json({ success: true, ...result, runtime: 'lms-failover', timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function get(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getQueueStats();
    return NextResponse.json({ success: true, stats, runtime: 'lms-failover', timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withRuntime(post);
export const GET = withRuntime(get);
