/**
 * GET /api/cron/onboarding-followup
 * Follow up with users who started onboarding but haven't completed it in 48h.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STALE_HOURS = 48;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - STALE_HOURS * 3600000).toISOString();
  const today = new Date().toISOString().split('T')[0];

  // Users with incomplete onboarding steps, last updated > 48h ago
  const { data: incomplete, error } = await db
    .from('onboarding_progress')
    .select('user_id, step, status, updated_at, profiles!onboarding_progress_user_id_fkey(full_name, email)')
    .neq('status', 'completed')
    .lt('updated_at', cutoff)
    .order('user_id')
    .limit(100);

  if (error) {
    logger.error('[cron/onboarding-followup] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Deduplicate by user_id — only send one email per user
  const seen = new Set<string>();
  let followed_up = 0;

  for (const row of incomplete ?? []) {
    if (seen.has(row.user_id)) continue;
    seen.add(row.user_id);

    const profile = (row as any).profiles;
    if (!profile?.email) continue;

    await db.from('notifications').insert({
      user_id: row.user_id,
      type: 'action_required',
      title: 'Complete your onboarding',
      message: 'You have incomplete onboarding steps. Complete them to access all platform features.',
      action_url: '/onboarding',
      link: '/onboarding',
      read: false,
      idempotency_key: `onboarding-followup-${row.user_id}-${today}`,
    }).onConflict('idempotency_key').ignore().catch(() => {});

    await sendEmail({
      to: profile.email,
      subject: 'Complete your Elevate onboarding',
      html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>You started your onboarding but haven't finished yet. Complete your setup to unlock all features.</p><p><a href="https://www.elevateforhumanity.org/onboarding">Complete onboarding →</a></p><p>— Elevate for Humanity</p>`,
    }).catch((e: unknown) => logger.warn('[cron/onboarding-followup] Email failed', { user_id: row.user_id, error: String(e) }));

    followed_up++;
  }

  logger.info('[cron/onboarding-followup] Done', { followed_up });
  return NextResponse.json({ ok: true, followed_up });
});
