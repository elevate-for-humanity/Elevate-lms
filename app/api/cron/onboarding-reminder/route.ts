// pre-auth-registry: exempt — cron route, runs as service role with no user session
/**
 * GET /api/cron/onboarding-reminder
 * Remind new users (< 7 days old) who haven't started onboarding at all.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const today = new Date().toISOString().split('T')[0];

  // New users created 1–7 days ago with no onboarding_progress rows
  const { data: newUsers, error } = await db
    .from('profiles')
    .select('id, full_name, email, created_at')
    .gte('created_at', sevenDaysAgo)
    .lt('created_at', oneDayAgo)
    .not('email', 'is', null)
    .limit(100);

  if (error) {
    logger.error('[cron/onboarding-reminder] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!newUsers?.length) return NextResponse.json({ ok: true, reminded: 0 });

  // Check which have started onboarding
  const userIds = newUsers.map(u => u.id);
  const { data: started } = await db
    .from('onboarding_progress')
    .select('user_id')
    .in('user_id', userIds);

  const startedSet = new Set((started ?? []).map((r: any) => r.user_id));
  const notStarted = newUsers.filter(u => !startedSet.has(u.id));

  let reminded = 0;
  for (const user of notStarted) {
    await db.from('notifications').insert({
      user_id: user.id,
      type: 'action_required',
      title: 'Welcome — complete your setup',
      message: 'Get started by completing your onboarding to access your courses and resources.',
      action_url: '/onboarding',
      link: '/onboarding',
      read: false,
      idempotency_key: `onboarding-reminder-${user.id}-${today}`,
    })

    await sendEmail({
      to: user.email,
      subject: 'Welcome to Elevate — complete your setup',
      html: `<p>Hi ${user.full_name ?? 'there'},</p><p>Welcome to Elevate for Humanity! You haven't completed your account setup yet. It only takes a few minutes.</p><p><a href="https://www.elevateforhumanity.org/onboarding">Complete setup →</a></p><p>— Elevate for Humanity</p>`,
    }).catch((e: unknown) => logger.warn('[cron/onboarding-reminder] Email failed', { user_id: user.id, error: String(e) }));

    reminded++;
  }

  logger.info('[cron/onboarding-reminder] Done', { reminded, new_users: newUsers.length, not_started: notStarted.length });
  return NextResponse.json({ ok: true, reminded, new_users: newUsers.length, not_started: notStarted.length });
});
