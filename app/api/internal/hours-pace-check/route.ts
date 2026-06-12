/**
 * POST /api/internal/hours-pace-check
 *
 * Weekly cron: identify apprentices behind their required OJL hours pace.
 *
 * Pace formula:
 *   weeks_elapsed = (today - enrollment_start) / 7
 *   expected_hours = (required_ojl_hours / total_program_weeks) * weeks_elapsed
 *   deficit = expected_hours - actual_approved_hours
 *
 * If deficit > PACE_WARNING_THRESHOLD_HOURS, the apprentice is flagged:
 *   1. admin_alert written with full pace context
 *   2. Apprentice notified in-app
 *   3. Apprentice emailed
 *   4. Admin emailed
 *   5. Platform event emitted
 *
 * Intended schedule: weekly (Monday morning).
 * Gated by CRON_SECRET header.
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { emitEvent } from '@/lib/events/emit';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Warn when an apprentice is more than this many hours behind expected pace.
// 10h ≈ one missed full work day — meaningful but not catastrophic.
const PACE_WARNING_THRESHOLD_HOURS = 10;

// Last-resort fallbacks used only when both enrollment.required_hours and
// program.min_ojl_hours are NULL (data quality gap, not a program default).
// These are NOT program definitions — fix the program row in the DB instead.
const FALLBACK_PROGRAM_WEEKS = 104;    // 2-year DOL apprenticeship minimum
const FALLBACK_REQUIRED_OJL_HOURS = 2000; // Indiana barber DOL baseline

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export const POST = withRuntime({ cron: true }, async () => {
  const db = await requireAdminClient();

  // Load all active apprenticeship enrollments with start date and required hours.
  // Pull all three week-duration columns from programs — use the first non-null one.
  const { data: enrollments, error: enrollError } = await db
    .from('student_enrollments')
    .select(
      `
      id,
      student_id,
      program_id,
      program_slug,
      required_hours,
      transfer_hours,
      started_at,
      created_at,
      shop_id,
      profiles!inner (
        full_name,
        email
      ),
      programs (
        name,
        min_ojl_hours,
        duration_weeks,
        estimated_weeks,
        length_weeks
      )
    `,
    )
    .in('status', ['active', 'enrolled', 'in_progress'])
    .not('started_at', 'is', null)
    .limit(500);

  if (enrollError) {
    logger.error('[hours-pace-check] Failed to load enrollments', enrollError);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!enrollments?.length) {
    return NextResponse.json({ ok: true, checked: 0, flagged: 0 });
  }

  // Load approved OJL hours per student in one query
  const studentIds = enrollments.map((e) => e.student_id);
  const { data: hourRows } = await db
    .from('hour_entries')
    .select('user_id, hours_claimed, accepted_hours, status, source_type')
    .in('user_id', studentIds)
    .in('source_type', ['ojl', 'timeclock', 'host_shop', 'manual'])
    .in('status', ['approved', 'pending']);

  // Build per-student hour totals
  const approvedByStudent: Record<string, number> = {};
  const pendingByStudent: Record<string, number> = {};
  for (const row of hourRows ?? []) {
    if (!row.user_id) continue;
    if (row.status === 'approved') {
      approvedByStudent[row.user_id] =
        (approvedByStudent[row.user_id] ?? 0) +
        (Number(row.accepted_hours) || Number(row.hours_claimed) || 0);
    } else {
      pendingByStudent[row.user_id] =
        (pendingByStudent[row.user_id] ?? 0) + (Number(row.hours_claimed) || 0);
    }
  }

  const now = Date.now();
  let flagged = 0;
  const results: Array<{ student_id: string; deficit: number; status: string }> = [];

  for (const enrollment of enrollments) {
    try {
      const profile = (enrollment as any).profiles;
      const program = (enrollment as any).programs;

      const startDate = new Date(enrollment.started_at ?? enrollment.created_at);
      const weeksElapsed = Math.max((now - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000), 0);

      if (weeksElapsed < 1) {
        // Too early to pace-check
        results.push({ student_id: enrollment.student_id, deficit: 0, status: 'too_early' });
        continue;
      }

      // Required OJL hours: enrollment override → program.min_ojl_hours → fallback.
      // enrollment.required_hours is set per-student (e.g. transfer credit adjustments).
      // program.min_ojl_hours is the DOL-registered program requirement.
      const requiredOjlHours =
        enrollment.required_hours ??
        program?.min_ojl_hours ??
        FALLBACK_REQUIRED_OJL_HOURS;

      // Program duration: duration_weeks is the canonical insert column.
      // estimated_weeks and length_weeks are legacy aliases — use whichever is set.
      const programWeeks =
        program?.duration_weeks ??
        program?.estimated_weeks ??
        program?.length_weeks ??
        FALLBACK_PROGRAM_WEEKS;

      const transferHours = enrollment.transfer_hours ?? 0;
      const approvedHours = (approvedByStudent[enrollment.student_id] ?? 0) + transferHours;
      const pendingHours = pendingByStudent[enrollment.student_id] ?? 0;

      // Pace: how many hours should they have by now?
      const expectedHours = (requiredOjlHours / programWeeks) * weeksElapsed;
      const deficit = expectedHours - approvedHours;

      // Remaining weeks and required weekly pace to finish on time
      const remainingWeeks = Math.max(programWeeks - weeksElapsed, 1);
      const remainingHours = Math.max(requiredOjlHours - approvedHours, 0);
      const requiredPacePerWeek = remainingHours / remainingWeeks;

      if (deficit <= PACE_WARNING_THRESHOLD_HOURS) {
        results.push({ student_id: enrollment.student_id, deficit, status: 'on_pace' });
        continue;
      }

      const apprenticeName: string = profile?.full_name ?? 'Apprentice';
      const apprenticeEmail: string | null = profile?.email ?? null;
      const programName: string = program?.name ?? enrollment.program_slug ?? 'Apprenticeship';

      // 1. Admin alert
      await db.from('admin_alerts').insert({
        alert_type: 'low_hours_pace',
        severity: deficit > 40 ? 'error' : 'warning',
        apprentice_id: enrollment.student_id,
        message: `${apprenticeName} is ${Math.round(deficit)}h behind OJL pace. Needs ${requiredPacePerWeek.toFixed(1)}h/week to complete on time.`,
        metadata: {
          student_id: enrollment.student_id,
          enrollment_id: enrollment.id,
          program_name: programName,
          required_ojl_hours: requiredOjlHours,
          program_weeks: programWeeks,
          // Source of required_hours so investigations know if it's enrollment-specific or program default
          required_hours_source: enrollment.required_hours != null ? 'enrollment' : program?.min_ojl_hours != null ? 'program' : 'fallback',
          approved_hours: Math.round(approvedHours * 10) / 10,
          pending_hours: Math.round(pendingHours * 10) / 10,
          transfer_hours: transferHours,
          expected_hours_by_now: Math.round(expectedHours * 10) / 10,
          deficit_hours: Math.round(deficit * 10) / 10,
          weeks_elapsed: Math.round(weeksElapsed * 10) / 10,
          remaining_weeks: Math.round(remainingWeeks * 10) / 10,
          required_pace_hours_per_week: Math.round(requiredPacePerWeek * 10) / 10,
          shop_id: enrollment.shop_id,
        },
        created_at: new Date().toISOString(),
      });

      // 2. In-app notification
      await Promise.resolve(
        db
          .from('notifications')
          .insert({
            user_id: enrollment.student_id,
            type: 'compliance',
            title: 'Hours pace warning',
            message: `You are ${Math.round(deficit)} hours behind your required OJL pace. You need to log ${requiredPacePerWeek.toFixed(1)} hours per week to complete on time.`,
            action_label: 'View hours',
            action_url: '/apprentice/hours',
            link: '/apprentice/hours',
            read: false,
            metadata: {
              enrollment_id: enrollment.id,
              deficit_hours: Math.round(deficit),
              required_pace_per_week: requiredPacePerWeek.toFixed(1),
            },
            idempotency_key: `pace-warning-${enrollment.id}-${new Date().toISOString().slice(0, 10)}`,
          })
      ).catch(() => {});

      // 3. Email apprentice
      if (apprenticeEmail) {
        await sendEmail({
          to: apprenticeEmail,
          subject: `Action Required: You are behind on your ${programName} hours`,
          html: `
<h2>Hours Pace Warning</h2>
<p>Hi ${apprenticeName},</p>
<p>You are currently <strong>${Math.round(deficit)} hours behind</strong> your required OJL pace for <strong>${programName}</strong>.</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#f8fafc;">
    <td style="padding:8px 12px;font-weight:bold;">Hours approved so far</td>
    <td style="padding:8px 12px;">${Math.round(approvedHours * 10) / 10}h</td>
  </tr>
  <tr>
    <td style="padding:8px 12px;font-weight:bold;">Expected by now</td>
    <td style="padding:8px 12px;">${Math.round(expectedHours * 10) / 10}h</td>
  </tr>
  <tr style="background:#fef2f2;">
    <td style="padding:8px 12px;font-weight:bold;">Deficit</td>
    <td style="padding:8px 12px;color:#dc2626;font-weight:bold;">${Math.round(deficit * 10) / 10}h behind</td>
  </tr>
  <tr>
    <td style="padding:8px 12px;font-weight:bold;">Required pace to finish on time</td>
    <td style="padding:8px 12px;">${requiredPacePerWeek.toFixed(1)}h per week</td>
  </tr>
  <tr style="background:#f8fafc;">
    <td style="padding:8px 12px;font-weight:bold;">Total required</td>
    <td style="padding:8px 12px;">${requiredOjlHours}h</td>
  </tr>
</table>
<p>Please speak with your supervisor about scheduling additional hours. If you believe your hours are not being recorded correctly, contact Elevate for Humanity.</p>
<p><a href="https://www.elevateforhumanity.org/apprentice/hours">View your hours dashboard</a></p>
<p>— Elevate for Humanity</p>
          `.trim(),
          text: `Hi ${apprenticeName}, you are ${Math.round(deficit)}h behind your OJL pace for ${programName}. You need ${requiredPacePerWeek.toFixed(1)}h/week to finish on time. Contact your supervisor.`,
        }).catch(() => {});
      }

      // 4. Email admin
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Hours Pace Warning: ${apprenticeName} — ${Math.round(deficit)}h behind`,
        html: `
<h2>Apprentice Behind OJL Pace</h2>
<p><strong>Apprentice:</strong> ${apprenticeName}</p>
<p><strong>Program:</strong> ${programName}</p>
<p><strong>Approved hours:</strong> ${Math.round(approvedHours * 10) / 10}h</p>
<p><strong>Expected by now:</strong> ${Math.round(expectedHours * 10) / 10}h</p>
<p><strong>Deficit:</strong> ${Math.round(deficit * 10) / 10}h</p>
<p><strong>Required pace:</strong> ${requiredPacePerWeek.toFixed(1)}h/week to finish on time</p>
<p><strong>Weeks elapsed:</strong> ${Math.round(weeksElapsed)}</p>
<p><a href="https://www.elevateforhumanity.org/admin/apprentices">Review in admin dashboard</a></p>
        `.trim(),
        text: `${apprenticeName} is ${Math.round(deficit)}h behind OJL pace for ${programName}. Needs ${requiredPacePerWeek.toFixed(1)}h/week.`,
      }).catch(() => {});

      // 5. Platform event
      await emitEvent('apprentice.low_hours_pace', 'compliance', {
        severity: deficit > 40 ? 'warning' : 'info',
        actor_type: 'cron',
        subject_id: enrollment.id,
        subject_type: 'enrollment',
        actor_id: enrollment.student_id,
        payload: {
          student_id: enrollment.student_id,
          program_name: programName,
          deficit_hours: Math.round(deficit * 10) / 10,
          required_pace_per_week: Math.round(requiredPacePerWeek * 10) / 10,
        },
        message: `${apprenticeName} is ${Math.round(deficit)}h behind OJL pace`,
      });

      flagged++;
      results.push({ student_id: enrollment.student_id, deficit: Math.round(deficit), status: 'flagged' });
    } catch (err) {
      logger.error('[hours-pace-check] Failed to process enrollment', err as Error, {
        enrollment_id: enrollment.id,
      });
      results.push({ student_id: enrollment.student_id, deficit: 0, status: 'error' });
    }
  }

  logger.info('[hours-pace-check] Run complete', {
    checked: enrollments.length,
    flagged,
  });

  return NextResponse.json({
    ok: true,
    checked: enrollments.length,
    flagged,
  });
});
