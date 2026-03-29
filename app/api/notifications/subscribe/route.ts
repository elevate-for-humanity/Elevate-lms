
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await request.json();

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription: endpoint required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh ?? null,
          auth: subscription.keys?.auth ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      );

    if (error) {
      logger.error('[Notifications] Failed to store push subscription:', error);
      return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    logger.error('[Notifications] Subscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/notifications/subscribe', _POST);
