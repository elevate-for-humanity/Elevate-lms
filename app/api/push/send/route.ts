import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

// Initialize web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@elevateforhumanity.org';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    // Verify internal API key or service role
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.INTERNAL_API_KEY;
    
    // Allow calls from server-side code
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      // Check if called from same origin (internal call)
      const origin = request.headers.get('origin');
      if (origin && !origin.includes('localhost') && !origin.includes(process.env.NEXT_PUBLIC_APP_URL || '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ 
        error: 'Push notifications not configured',
      }, { status: 500 });
    }

    const payload: NotificationPayload = await request.json();

    if (!payload.userId || !payload.title || !payload.body) {
      return NextResponse.json({ 
        error: 'userId, title, and body are required' 
      }, { status: 400 });
    }

    // Create admin Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', payload.userId);

    if (subError) {
      logger.error('Error fetching subscriptions:', subError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        message: 'No push subscriptions found for user',
        sent: 0 
      });
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: '/icon-192.png',
      url: payload.url || '/',
      tag: payload.tag || 'default',
      timestamp: Date.now(),
    });

    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);
        sent++;
      } catch (error: any) {
        logger.error('Push notification failed:', error);
        failed++;

        // Remove invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscriptions.length,
    });
  } catch (error) {
    logger.error('Send notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/push/send', _POST);
