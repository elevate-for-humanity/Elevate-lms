import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    if (error) {
      logger.error('[Notifications] Failed to remove push subscription', normalizeError(error, 'Failed to remove subscription'), getErrorContext(error));
      return NextResponse.json(
        { success: false, error: 'Failed to remove subscription' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: 'Subscription removed' });
  } catch (error) {
    logger.error('[Notifications] Unsubscribe error', normalizeError(error, 'Unsubscribe error'), getErrorContext(error));
    return NextResponse.json(
      { success: false, error: 'Failed to remove subscription' },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/notifications/unsubscribe', _POST);
