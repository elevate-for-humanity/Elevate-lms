/**
 * GET /api/cron/missed-checkins
 *
 * Runs nightly (cron-scheduler.yml). Finds all open shifts where
 * clock_in_at is older than AUTO_CLOSE_HOURS and no clock_out_at exists.
 *
 * For each open shift:
 *   1. Auto-close with clock_out_at = clock_in_at + AUTO_CLOSE_HOURS
 *   2. Sync to hour_entries (marked pending — requires admin review)
 *   3. Raise admin_alert (missing_clock_out)
 *   4. Email student
 *   5. Email admin
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { syncProgressEntryToHourEntries } from '@/lib/timeclock/sync-to-hour-entries';
import { sendEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AUTO_CLOSE_HOURS = 10;
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export const GET = withRuntime({ cron: true }, async () => {
  const db = await requireAdminClient();
  const cutoff = new Date(Date.now() - AUTO_CLOSE_HOURS * 3600 * 1000).toISOString();

  const { data: openShifts, error } = await db
    .from('progress_entries')
    .select('id, apprentice_id, clock_in_at, work_date, site_id')
    .is('clock_out_at', null)
    .lt('clock_in_at', cutoff)
    .eq('auto_clocked_out', false);

  if (error) {
    logger.error('[missed-checkins] query failed', { error });
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  const shifts = openShifts ?? [];
  if (shifts.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No open shifts found' });
  }

  const apprenticeIds = [...new Set(shifts.map((s: any) => s.apprentice_id).filter(Boolean))];
  const { data: apprentices } = await db
    .from('apprentices')
    .select('id, user_id')
    .in('id', apprenticeIds);

  const userIds = [...new Set((apprentices ?? []).map((a: any) => a.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] };

  const apprenticeMap: Record<string, { userId: string; name: string; email: string }> = {};
  (apprentices ?? []).forEach((a: any) => {
    const profile = (profiles ?? []).find((p: any) => p.id === a.user_id);
    if (profile) {
      apprenticeMap[a.id] = {
        userId: a.user_id,
        name: profile.full_name || 'Apprentice',
        email: profile.email || '',
      };
    }
  });

  let processed = 0;
  const results: any[] = [];

  for (const shift of shifts) {
    try {
      const clockInAt = new Date(shift.clock_in_at);
      const autoClockOut = new Date(clockInAt.getTime() + AUTO_CLOSE_HOURS * 3600 * 1000);
      const autoClockOutIso = autoClockOut.toISOString();

      const { error: updateErr } = await db
        .from('progress_entries')
        .update({
          clock_out_at: autoClockOutIso,
          auto_clocked_out: true,
          auto_clock_out_reason: `Auto-closed by missed-checkins cron after ${AUTO_CLOSE_HOURS}h`,
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', shift.id);

      if (updateErr) {
        logger.error('[missed-checkins] auto-close failed', { shiftId: shift.id, error: updateErr });
        continue;
      }

      await syncProgressEntryToHourEntries(db, shift.id).catch((err) =>
        logger.error('[missed-checkins] sync failed', { shiftId: shift.id, err }),
      );

      const apprentice = apprenticeMap[shift.apprentice_id];
      await db.from('admin_alerts').insert({
        alert_type: 'missing_clock_out',
        severity: 'warning',
        apprentice_id: shift.apprentice_id,
        progress_entry_id: shift.id,
        message: `Auto-closed shift after ${AUTO_CLOSE_HOURS}h without clock-out`,
        metadata: {
          shift_id: shift.id,
          clock_in_at: shift.clock_in_at,
          auto_clock_out_at: autoClockOutIso,
          hours_elapsed: AUTO_CLOSE_HOURS,
          user_id: apprentice?.userId,
        },
        resolved: false,
        created_at: new Date().toISOString(),
      });

      if (apprentice?.email) {
        await sendEmail({
          to: apprentice.email,
          subject: 'Your shift was automatically closed — action required',
          html: `
            <p>Hi ${apprentice.name},</p>
            <p>Your shift on <strong>${shift.work_date}</strong> was automatically closed after ${AUTO_CLOSE_HOURS} hours because no clock-out was recorded.</p>
            <p><strong>Your hours have been submitted for admin review.</strong> If the auto-close time is incorrect, please contact your instructor.</p>
            <p>Always clock out at the end of your shift from your apprentice portal.</p>
            <p>— Elevate for Humanity</p>
          `,
        }).catch((err) => logger.warn('[missed-checkins] student email failed', { err }));
      }

      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Missed clock-out: ${apprentice?.name ?? shift.apprentice_id}`,
        html: `
          <p><strong>Missed clock-out auto-closed</strong></p>
          <ul>
            <li>Apprentice: ${apprentice?.name ?? shift.apprentice_id}</li>
            <li>Date: ${shift.work_date}</li>
            <li>Clock-in: ${new Date(shift.clock_in_at).toLocaleString()}</li>
            <li>Auto clock-out: ${autoClockOut.toLocaleString()}</li>
            <li>Hours logged (pending review): ${AUTO_CLOSE_HOURS}</li>
          </ul>
          <p>Review in <a href="https://www.elevateforhumanity.org/admin/timeclock?tab=pending">Admin Timeclock → Pending Approval</a></p>
        `,
      }).catch((err) => logger.warn('[missed-checkins] admin email failed', { err }));

      processed++;
      results.push({ shiftId: shift.id, apprenticeId: shift.apprentice_id, autoClockOut: autoClockOutIso });
    } catch (err) {
      logger.error('[missed-checkins] shift processing failed', { shiftId: shift.id, err });
    }
  }

  logger.info('[missed-checkins] complete', { processed, total: shifts.length });
  return NextResponse.json({ processed, total: shifts.length, results });
});
