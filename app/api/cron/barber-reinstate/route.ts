/**
 * GET /api/cron/barber-reinstate
 * Reinstate barber subscriptions that were suspended and have since paid.
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

  // Suspended subscriptions with a resolved payment (reinstate_after date passed)
  const { data: toReinstate, error } = await db
    .from('barber_subscriptions')
    .select('id, student_id, reinstate_after, profiles!barber_subscriptions_student_id_fkey(full_name, email)')
    .eq('status', 'suspended')
    .not('reinstate_after', 'is', null)
    .lte('reinstate_after', new Date().toISOString())
    .limit(50);

  if (error) {
    logger.error('[cron/barber-reinstate] DB error', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!toReinstate?.length) return NextResponse.json({ ok: true, reinstated: 0 });

  let reinstated = 0;
  for (const sub of toReinstate) {
    const profile = (sub as any).profiles;
    const nextBilling = new Date();
    nextBilling.setDate(nextBilling.getDate() + 30);

    const { error: updateErr } = await db
      .from('barber_subscriptions')
      .update({
        status: 'active',
        reinstate_after: null,
        next_billing_date: nextBilling.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id);

    if (updateErr) {
      logger.error('[cron/barber-reinstate] Update failed', updateErr, { sub_id: sub.id });
      continue;
    }

    // Restore program enrollment
    await db
      .from('program_enrollments')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('user_id', sub.student_id)
      .eq('status', 'suspended')
      .catch((e: unknown) => logger.warn('[cron/barber-reinstate] Enrollment restore failed', { error: String(e) }));

    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        subject: 'Your barber program access has been restored',
        html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>Your barber program subscription has been reinstated. You now have full access to your courses and resources.</p><p><a href="https://www.elevateforhumanity.org/lms/courses">Go to your courses →</a></p><p>— Elevate for Humanity</p>`,
      }).catch((e: unknown) => logger.warn('[cron/barber-reinstate] Email failed', { sub_id: sub.id, error: String(e) }));
    }

    reinstated++;
  }

  logger.info('[cron/barber-reinstate] Done', { reinstated });
  return NextResponse.json({ ok: true, reinstated });
});
