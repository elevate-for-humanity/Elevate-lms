export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Configure web-push with VAPID keys
// In production, these should be in environment variables
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject =
  process.env.VAPID_SUBJECT || 'mailto:info@elevateforhumanity.org';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const { subscription, notification } = await request.json();

    if (!subscription || !notification) {
      return NextResponse.json(
        { success: false, error: 'Missing subscription or notification data' },
        { status: 400 }
      );
    }

    // Send push notification
    await webpush.sendNotification(subscription, JSON.stringify(notification));

    // Log notification to database
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('push_notifications_log').insert({
        sender_id: user?.id,
        title: notification.title,
        body: notification.body,
        url: notification.url,
        sent_at: new Date().toISOString(),
        status: 'sent',
      }).catch(() => {});
    } catch (err) {
        logger.error("Unhandled error", err instanceof Error ? err : undefined);
      }

    return NextResponse.json({
      success: true,
      message: 'Notification sent',
    });
  } catch (error) { 
    logger.error('[Notifications] Send error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
