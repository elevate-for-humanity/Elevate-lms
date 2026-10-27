import { NextRequest, NextResponse } from 'next/server';

import { withRuntime } from '@/lib/api/withRuntime';
import {
  processNotificationQueue,
  getQueueStats,
  NOTIFICATION_DELIVERY_CONTRACT,
} from '@/lib/notifications/processor';

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
    const success = result.errors.length === 0 && result.failed === 0;
    return NextResponse.json(
      {
        success,
        deliveryContract: NOTIFICATION_DELIVERY_CONTRACT,
        ...result,
        runtime: 'lms-failover',
        timestamp: new Date().toISOString(),
      },
      { status: success ? 200 : 503 },
    );
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
    return NextResponse.json({
      success: true,
      stats,
      deliveryContract: NOTIFICATION_DELIVERY_CONTRACT,
      runtime: 'lms-failover',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withRuntime(post);
export const GET = withRuntime(get);
