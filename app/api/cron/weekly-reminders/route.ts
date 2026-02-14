export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Initialize web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@elevateforhumanity.org';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Cron endpoint for weekly hour logging reminders
// Should be called by a cron job service (e.g., scheduled cron, GitHub Actions)
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json({ 
      error: 'Push notifications not configured',
      message: 'VAPID keys not set' 
    }, { status: 500 });
  }

  try {
    // Create admin Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all apprentices who haven't logged hours this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    // Get apprentices with push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select(`
        id,
        user_id,
        endpoint,
        p256dh,
        auth
      `);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        message: 'No push subscriptions found',
        sent: 0 
      });
    }

    // Get users who are apprentices
    const { data: apprentices } = await supabase
      .from('partner_users')
      .select('user_id')
      .eq('role', 'apprentice');

    const apprenticeIds = new Set(apprentices?.map(a => a.user_id) || []);

    // Get users who have logged hours this week
    const { data: recentLogs } = await supabase
      .from('progress_entries')
      .select('apprentice_id')
      .gte('created_at', weekStart.toISOString());

    const usersWithLogs = new Set(recentLogs?.map(l => l.apprentice_id) || []);

    // Filter to apprentices who haven't logged this week
    const subscriptionsToNotify = subscriptions.filter(sub => 
      apprenticeIds.has(sub.user_id) && !usersWithLogs.has(sub.user_id)
    );

    let sent = 0;
    let failed = 0;

    // Send notifications
    for (const subscription of subscriptionsToNotify) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        const payload = JSON.stringify({
          title: 'Log Your Hours',
          body: "Don't forget to log your training hours for this week!",
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          url: '/pwa/barber/log-hours',
          tag: 'weekly-reminder',
          actions: [
            { action: 'log', title: 'Log Hours' },
            { action: 'dismiss', title: 'Dismiss' },
          ],
        });

        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (error: any) {
        console.error('Push notification failed:', error);
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
      message: 'Weekly reminders sent',
      sent,
      failed,
      total: subscriptionsToNotify.length,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
