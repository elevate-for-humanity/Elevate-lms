/**
 * POST /api/internal/at-risk-detection
 *
 * Proactive at-risk detection cron — runs daily at 8 AM.
 * Reads student_risk_status, writes admin_alerts for newly at-risk students,
 * escalates existing unacknowledged alerts, and emits platform events.
 *
 * Escalation ladder:
 *   L1 (initial)  — alert created, apprentice notified
 *   L2 (24h+)     — supervisor notified via email
 *   L3 (72h+)     — admin notified, platform event severity=critical
 *
 * Idempotent: uses idempotency_key on notifications to avoid duplicate sends.
 * Gated by CRON_SECRET header via withRuntime({ cron: true }).
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { emitEvent } from '@/lib/platform/events';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

// Thresholds for escalation
const L2_HOURS = 24;
const L3_HOURS = 72;

export const POST = withRuntime({ cron: true }, async () => {
  const db = await requireAdminClient();

  // ── Load at-risk students from the view ───────────────────────────────────
  const { data: riskRows, error: riskErr } = await db
    .from('student_risk_status')
    .select('id, user_id, status, days_since_activity, overdue_count, progress_percentage, last_activity_date, program_id')
    .eq('status', 'at_risk')
    .order('overdue_count', { ascending: false })
    .limit(200);

  if (riskErr) {
    logger.error('[at-risk-detection] Failed to load student_risk_status', riskErr);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // ── Escalate existing unacknowledged alerts ───────────────────────────────
  const l2Cutoff = new Date(Date.now() - L2_HOURS * 60 * 60 * 1000).toISOString();
  const l3Cutoff = new Date(Date.now() - L3_HOURS * 60 * 60 * 1000).toISOString();

  const { data: existingAlerts } = await db
    .from('admin_alerts')
    .select('id, alert_type, escalation_level, created_at, escalated_at, apprentice_id, message, metadata')
    .eq('alert_type', 'at_risk_student')
    .is('resolved_at', null)
    .is('acknowledged_at', null);

  let escalated = 0;
  for (const alert of existingAlerts ?? []) {
    const alertAge = Date.now() - new Date(alert.created_at).getTime();
    const alertAgeHours = alertAge / (1000 * 60 * 60);

    if (alert.escalation_level === 1 && alert.created_at <= l2Cutoff) {
      // Escalate to L2 — notify supervisor
      await db.from('admin_alerts')
        .update({ escalation_level: 2, escalated_at: new Date().toISOString() })
        .eq('id', alert.id);

      sendEmail({
        to: ADMIN_EMAIL,
        subject: `[L2 Escalation] At-Risk Student — ${alertAgeHours.toFixed(0)}h unresolved`,
        html: `<p>An at-risk student alert has been unresolved for ${alertAgeHours.toFixed(0)} hours.</p><p>${alert.message}</p><p><a href="https://www.elevateforhumanity.org/admin/students?filter=at-risk">Review in admin dashboard</a></p>`,
      }).catch(() => {});

      escalated++;
    } else if (alert.escalation_level === 2 && alert.created_at <= l3Cutoff) {
      // Escalate to L3 — critical platform event + admin email
      await db.from('admin_alerts')
        .update({ escalation_level: 3, escalated_at: new Date().toISOString() })
        .eq('id', alert.id);

      sendEmail({
        to: ADMIN_EMAIL,
        subject: `[L3 CRITICAL] At-Risk Student — ${alertAgeHours.toFixed(0)}h unresolved`,
        html: `<p><strong>CRITICAL:</strong> An at-risk student alert has been unresolved for ${alertAgeHours.toFixed(0)} hours with no supervisor action.</p><p>${alert.message}</p><p>Immediate intervention required.</p><p><a href="https://www.elevateforhumanity.org/admin/students?filter=at-risk">Review now</a></p>`,
      }).catch(() => {});

      await emitEvent('student.at_risk_critical', 'compliance', {
        severity: 'critical',
        actor_type: 'cron',
        subject_id: alert.apprentice_id ?? alert.id,
        subject_type: 'student',
        payload: { alert_id: alert.id, escalation_level: 3, hours_unresolved: alertAgeHours },
        message: `At-risk student alert unresolved for ${alertAgeHours.toFixed(0)}h — L3 escalation`,
      });

      escalated++;
    }
  }

  // ── Create new alerts for newly detected at-risk students ─────────────────
  if (!riskRows?.length) {
    logger.info('[at-risk-detection] No at-risk students found', { escalated });
    return NextResponse.json({ ok: true, detected: 0, escalated });
  }

  // Load profiles for enrichment
  const userIds = [...new Set(riskRows.map((r: any) => r.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

  // Find which students already have an open at-risk alert (avoid duplicates)
  const { data: openAlerts } = await db
    .from('admin_alerts')
    .select('apprentice_id')
    .eq('alert_type', 'at_risk_student')
    .is('resolved_at', null);
  const alreadyAlerted = new Set((openAlerts ?? []).map((a: any) => a.apprentice_id).filter(Boolean));

  let detected = 0;
  for (const row of riskRows) {
    if (!row.user_id || alreadyAlerted.has(row.user_id)) continue;

    const profile = profileMap[row.user_id];
    const name = profile?.full_name ?? 'Unknown Student';
    const email = profile?.email ?? null;
    const daysInactive = parseInt(String(row.days_since_activity ?? '0'), 10);
    const overdue = row.overdue_count ?? 0;
    const progress = Math.round(Number(row.progress_percentage ?? 0));

    const message = `${name} is at risk: ${daysInactive} days inactive, ${overdue} overdue items, ${progress}% progress`;

    // Write admin alert
    await Promise.resolve(
      db.from('admin_alerts').insert({
        alert_type: 'at_risk_student',
        severity: overdue > 3 ? 'high' : 'warning',
        apprentice_id: row.user_id,
        message,
        escalation_level: 1,
        details: {
          days_since_activity: daysInactive,
          overdue_count: overdue,
          progress_percentage: progress,
          last_activity_date: row.last_activity_date,
          program_id: row.program_id,
        },
        metadata: { user_id: row.user_id, program_id: row.program_id },
      })
    ).catch(() => {});

    // In-app notification to student
    await Promise.resolve(
      db.from('notifications').insert({
        user_id: row.user_id,
        type: 'at_risk',
        title: 'Action required: You may be falling behind',
        message: `You have ${overdue} overdue item${overdue !== 1 ? 's' : ''} and haven't logged activity in ${daysInactive} day${daysInactive !== 1 ? 's' : ''}. Please contact your instructor.`,
        action_label: 'View progress',
        action_url: '/lms/courses',
        link: '/lms/courses',
        read: false,
        idempotency_key: `at-risk-${row.user_id}-${new Date().toISOString().split('T')[0]}`,
      })
    ).catch(() => {});

    // Email student
    if (email) {
      sendEmail({
        to: email,
        subject: 'Action Required: You may be falling behind in your program',
        html: `<p>Hi ${name},</p><p>Our records show you have <strong>${overdue} overdue item${overdue !== 1 ? 's' : ''}</strong> and haven't logged activity in <strong>${daysInactive} day${daysInactive !== 1 ? 's' : ''}</strong>.</p><p>Please log in and contact your instructor as soon as possible to get back on track.</p><p><a href="https://www.elevateforhumanity.org/lms/courses">View your courses</a></p><p>— Elevate for Humanity</p>`,
      }).catch(() => {});
    }

    // Platform event
    await emitEvent('student.at_risk_detected', 'compliance', {
      severity: overdue > 3 ? 'error' : 'warning',
      actor_type: 'cron',
      subject_id: row.user_id,
      subject_type: 'student',
      payload: { days_since_activity: daysInactive, overdue_count: overdue, progress_percentage: progress },
      message,
    });

    detected++;
  }

  logger.info('[at-risk-detection] Run complete', { detected, escalated });
  return NextResponse.json({ ok: true, detected, escalated });
});
