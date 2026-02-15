export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// Configure VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:elevateforhumanity.edu@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { title, body, targetAudience, url, icon } = await req.json();

    // Get target users
    const users = await getTargetUsers(supabase, targetAudience);

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No users found for target audience',
        },
        { status: 400 }
      );
    }

    const results = [];
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Get user's push subscriptions
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('active', true);

        if (!subscriptions || subscriptions.length === 0) {
          continue;
        }

        // Send to each subscription
        for (const subscription of subscriptions) {
          try {
            const payload = JSON.stringify({
              title,
              body,
              icon: icon || '/icon-192x192.png',
              badge: '/icon-192x192.png',
              url: url || '/',
              timestamp: Date.now(),
            });

            await webpush.sendNotification(
              subscription.subscription_data,
              payload
            );

            sent++;

            // Log notification
            await supabase.from('notification_logs').insert({
              user_id: user.id,
              title,
              body,
              type: 'push',
              status: 'sent',
              sent_at: new Date().toISOString(),
            });
          } catch (error) { /* Error handled silently */ 
            logger.error(
              `Error sending to subscription ${subscription.id}:`,
              error
            );
            failed++;

            // If subscription is invalid (410 Gone), mark as inactive
            if (error.statusCode === 410) {
              await supabase
                .from('push_subscriptions')
                .update({ active: true })
                .eq('id', subscription.id);
            }

            // Log failure
            await supabase.from('notification_logs').insert({
              user_id: user.id,
              title,
              body,
              type: 'push',
              status: 'failed',
              error_message: toErrorMessage(error),
            });
          }
        }
      } catch (error) { /* Error handled silently */ 
        logger.error(
          `Error processing user ${user.id}:`,
          error instanceof Error ? error : new Error(String(error))
        );
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: users.length,
        sent,
        failed,
      },
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Broadcast notification error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

async function getTargetUsers(supabase: any, targetAudience: string) {
  let query;

  switch (targetAudience) {
    case 'all-students':
      query = supabase
        .from('students')
        .select('id, email, first_name, last_name')
        .not('email', 'is', null);
      break;

    case 'active-students':
      query = supabase
        .from('students')
        .select('id, email, first_name, last_name')
        .eq('status', 'active')
        .not('email', 'is', null);
      break;

    case 'barber-students':
      query = supabase
        .from('students')
        .select('id, email, first_name, last_name')
        .eq('program_name', 'Barber Program')
        .eq('status', 'active')
        .not('email', 'is', null);
      break;

    case 'cna-students':
      query = supabase
        .from('students')
        .select('id, email, first_name, last_name')
        .eq('program_name', 'CNA Program')
        .eq('status', 'active')
        .not('email', 'is', null);
      break;

    case 'cdl-students':
      query = supabase
        .from('students')
        .select('id, email, first_name, last_name')
        .eq('program_name', 'CDL Program')
        .eq('status', 'active')
        .not('email', 'is', null);
      break;

    case 'all-staff':
      query = supabase
        .from('staff')
        .select('id, email, first_name, last_name')
        .not('email', 'is', null);
      break;

    default:
      return [];
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching users:', error);
    return [];
  }

  return data || [];
}
