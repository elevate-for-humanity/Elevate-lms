/**
 * POST /api/internal/missed-clockout
 *
 * Cron job: auto-close shifts that have been open longer than AUTO_CLOSE_HOURS
 * without a clock-out. Open shifts corrupt OJL totals, RAPIDS reporting, and
 * payroll. This job caps them, flags them for supervisor review, and notifies
 * both the apprentice and admin.
 *
 * Intended schedule: every 30 minutes (or hourly at minimum).
 * Gated by CRON_SECRET header.
 *
 * For each open shift older than AUTO_CLOSE_HOURS:
 *   1. Set clock_out_at = clock_in_at + AUTO_CLOSE_HOURS (capped, not real)
 *   2. Set auto_clocked_out = true, auto_clock_out_reason = 'missed_clock_out'
 *   3. Sync derived hours to hour_entries (pending approval)
 *   4. Write admin_alert with full context
 *   5. Notify apprentice via in-app notification
 *   6. Emit platform event for audit trail
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { emitEvent } from '@/lib/events/emit';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Shifts open longer than this are auto-closed
const AUTO_CLOSE_HOURS = 10;
// Cap the recorded hours at this value (prevents inflated OJL totals)
const MAX_AUTO_CLOSE_HOURS = 8;

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export const POST = withRuntime({ cron: true }, async () => {
  const db = await requireAdminClient();

  const cutoff = new Date(Date.now() - AUTO_CLOSE_HOURS * 60 * 60 * 1000).toISOString();

  // Find all open shifts older than AUTO_CLOSE_HOURS
  const { data: openShifts, error } = await db
    .from('progress_entries')
    .select(
      `
      id,
      apprentice_id,
      program_id,
      site_id,
      work_date,
      clock_in_at,
      hour_entry_id,
      apprentices!inner (
        user_id,
        profiles (
          full_name,
          email
        )
      ),
      apprentice_sites (
        name
      )
    `,
    )
    .is('clock_out_at', null)
    .not('clock_in_at', 'is', null)
    .lte('clock_in_at', cutoff)
    .eq('auto_clocked_out', false)
    .limit(100);

  if (error) {
    logger.error('[missed-clockout] DB query failed', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!openShifts?.length) {
    return NextResponse.json({ ok: true, closed: 0 });
  }

  let closed = 0;
  const failed: string[] = [];

  for (const shift of openShifts) {
    try {
      const clockIn = new Date(shift.clock_in_at!);
      const autoClockOut = new Date(clockIn.getTime() + MAX_AUTO_CLOSE_HOURS * 60 * 60 * 1000);
      const autoClockOutIso = autoClockOut.toISOString();
      const openHours = (Date.now() - clockIn.getTime()) / (1000 * 60 * 60);

      const apprentice = (shift as any).apprentices;
      const profile = apprentice?.profiles;
      const siteName = (shift as any).apprentice_sites?.name ?? 'unknown site';
      const userId: string | null = apprentice?.user_id ?? null;
      const apprenticeName: string = profile?.full_name ?? 'Apprentice';
      const apprenticeEmail: string | null = profile?.email ?? null;

      // 1. Auto-close the shift
      const { error: updateError } = await db
        .from('progress_entries')
        .update({
          clock_out_at: autoClockOutIso,
          auto_clocked_out: true,
          auto_clock_out_reason: 'missed_clock_out',
          status: 'submitted',
        })
        .eq('id', shift.id);

      if (updateError) {
        logger.error('[missed-clockout] Failed to close shift', { id: shift.id, updateError });
        failed.push(shift.id);
        continue;
      }

      // 2. Sync to hour_entries if not already synced
      if (!shift.hour_entry_id && userId) {
        const { data: hourEntry } = await db
          .from('hour_entries')
          .insert({
            user_id: userId,
            source_type: 'timeclock',
            work_date: shift.work_date,
            hours_claimed: MAX_AUTO_CLOSE_HOURS,
            status: 'pending',
            entered_by_email: userId,
            entered_at: new Date().toISOString(),
            program_slug: shift.program_id,
            notes: `Auto-closed shift (missed clock-out). Capped at ${MAX_AUTO_CLOSE_HOURS}h. Requires supervisor review.`,
            legacy_source: 'progress_entries',
            legacy_id: shift.id,
          })
          .select('id')
          .maybeSingle();

        if (hourEntry?.id) {
          await db
            .from('progress_entries')
            .update({ hour_entry_id: hourEntry.id })
            .eq('id', shift.id);
        }
      }

      // 3. Write admin alert with full context
      await db.from('admin_alerts').insert({
        alert_type: 'missed_clock_out',
        severity: 'warning',
        apprentice_id: shift.apprentice_id,
        progress_entry_id: shift.id,
        site_id: shift.site_id,
        message: `Auto-closed shift after ${Math.round(openHours)}h without clock-out. Capped at ${MAX_AUTO_CLOSE_HOURS}h. Supervisor review required.`,
        metadata: {
          apprentice_id: shift.apprentice_id,
          user_id: userId,
          apprentice_name: apprenticeName,
          site_id: shift.site_id,
          site_name: siteName,
          clock_in_at: shift.clock_in_at,
          auto_clock_out_at: autoClockOutIso,
          open_hours: Math.round(openHours * 10) / 10,
          capped_hours: MAX_AUTO_CLOSE_HOURS,
          work_date: shift.work_date,
          requires_supervisor_review: true,
        },
        created_at: new Date().toISOString(),
      });

      // 4. In-app notification to apprentice
      if (userId) {
        await db
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'timeclock',
            title: 'Shift auto-closed',
            message: `Your shift on ${shift.work_date} at ${siteName} was automatically closed after ${MAX_AUTO_CLOSE_HOURS} hours. Hours are pending supervisor approval. Please contact your supervisor.`,
            action_label: 'View timeclock',
            action_url: '/apprentice/timeclock',
            link: '/apprentice/timeclock',
            read: false,
            metadata: { progress_entry_id: shift.id, auto_closed: true },
            idempotency_key: `missed-clockout-${shift.id}`,
          })
          .catch(() => {});
      }

      // 5. Email apprentice
      if (apprenticeEmail) {
        await sendEmail({
          to: apprenticeEmail,
          subject: 'Action Required: Your shift was auto-closed',
          html: `
<h2>Shift Auto-Closed</h2>
<p>Hi ${apprenticeName},</p>
<p>Your shift on <strong>${shift.work_date}</strong> at <strong>${siteName}</strong> was automatically closed because no clock-out was recorded after ${AUTO_CLOSE_HOURS} hours.</p>
<p><strong>Hours recorded:</strong> ${MAX_AUTO_CLOSE_HOURS} hours (capped — pending supervisor review)</p>
<p>If this is incorrect, please contact your supervisor immediately so they can adjust your hours.</p>
<p><a href="https://www.elevateforhumanity.org/apprentice/timeclock">View your timeclock</a></p>
<p>— Elevate for Humanity</p>
          `.trim(),
          text: `Hi ${apprenticeName}, your shift on ${shift.work_date} at ${siteName} was auto-closed after ${AUTO_CLOSE_HOURS}h. ${MAX_AUTO_CLOSE_HOURS} hours recorded pending supervisor review. Contact your supervisor if incorrect.`,
        }).catch(() => {});
      }

      // 6. Email admin
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Missed Clock-Out: ${apprenticeName} — ${shift.work_date}`,
        html: `
<h2>Missed Clock-Out Auto-Closed</h2>
<p><strong>Apprentice:</strong> ${apprenticeName}</p>
<p><strong>Site:</strong> ${siteName}</p>
<p><strong>Date:</strong> ${shift.work_date}</p>
<p><strong>Clock-in:</strong> ${shift.clock_in_at}</p>
<p><strong>Open for:</strong> ${Math.round(openHours)} hours</p>
<p><strong>Hours recorded:</strong> ${MAX_AUTO_CLOSE_HOURS}h (capped, pending approval)</p>
<p><strong>Action required:</strong> Supervisor review and hour adjustment if needed.</p>
<p><a href="https://www.elevateforhumanity.org/admin/apprentices">Review in admin dashboard</a></p>
        `.trim(),
        text: `Missed clock-out auto-closed for ${apprenticeName} at ${siteName} on ${shift.work_date}. Open ${Math.round(openHours)}h. ${MAX_AUTO_CLOSE_HOURS}h recorded pending approval.`,
      }).catch(() => {});

      // 7. Platform event for audit trail
      await emitEvent('timeclock.missed_clock_out', 'compliance', {
        severity: 'warning',
        actor_type: 'cron',
        subject_id: shift.id,
        subject_type: 'progress_entry',
        actor_id: shift.apprentice_id,
        payload: {
          apprentice_id: shift.apprentice_id,
          site_id: shift.site_id,
          open_hours: Math.round(openHours * 10) / 10,
          capped_hours: MAX_AUTO_CLOSE_HOURS,
          work_date: shift.work_date,
        },
        message: `Shift auto-closed after ${Math.round(openHours)}h without clock-out`,
      });

      closed++;
    } catch (err) {
      logger.error('[missed-clockout] Failed to process shift', err as Error, { id: shift.id });
      failed.push(shift.id);
    }
  }

  logger.info('[missed-clockout] Run complete', { closed, failed: failed.length });
  return NextResponse.json({ ok: true, closed, failed: failed.length });
});
