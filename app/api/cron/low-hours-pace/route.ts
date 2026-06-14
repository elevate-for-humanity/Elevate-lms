/**
 * GET /api/cron/low-hours-pace
 *
 * Weekly cron (cron-scheduler.yml). Checks every active apprentice's
 * OJL pace against their program's required hours and start date.
 *
 * If an apprentice is more than 10% behind required pace:
 *   1. Raise admin_alert (low_hours_pace)
 *   2. Email student with specific deficit and catch-up guidance
 *   3. Email admin with full list of at-risk apprentices
 *
 * Pace formula:
 *   weeks_elapsed = (today - start_date) / 7
 *   expected_hours = (required_ojl / total_weeks) * weeks_elapsed
 *   deficit = expected_hours - actual_ojl_hours
 *   behind = deficit > (required_ojl * 0.10)
 */

import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getApprovedHoursByType } from '@/lib/hours/get-approved-hours';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';
const FROM_EMAIL = 'noreply@elevateforhumanity.org';
const BEHIND_THRESHOLD = 0.10; // 10% behind pace triggers alert

// Required OJL hours by program slug
const PROGRAM_REQUIREMENTS: Record<string, { ojl: number; rti: number; totalWeeks: number }> = {
  'barber-apprenticeship':          { ojl: 1500, rti: 500,  totalWeeks: 104 },
  'cosmetology-apprenticeship':     { ojl: 1500, rti: 500,  totalWeeks: 104 },
  'esthetician-apprenticeship':     { ojl: 525,  rti: 175,  totalWeeks: 52  },
  'nail-technician-apprenticeship': { ojl: 400,  rti: 100,  totalWeeks: 52  },
  'culinary-apprenticeship':        { ojl: 3000, rti: 500,  totalWeeks: 156 },
  'electrical':                     { ojl: 7000, rti: 1000, totalWeeks: 260 },
  'hvac-technician':                { ojl: 2000, rti: 500,  totalWeeks: 104 },
};

export const GET = withRuntime({ cron: true }, async () => {
  const db = await requireAdminClient();

  // Load all active enrollments with start date
  const { data: enrollments, error } = await db
    .from('program_enrollments')
    .select('id, user_id, program_slug, enrolled_at, enrollment_state')
    .eq('enrollment_state', 'active')
    .not('enrolled_at', 'is', null);

  if (error) {
    logger.error('[low-hours-pace] query failed', { error });
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  const rows = enrollments ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ checked: 0, atRisk: 0 });
  }

  // Load profiles for names/emails
  const userIds = [...new Set(rows.map((r: any) => r.user_id).filter(Boolean))];
  const { data: profiles } = await db
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  const profileMap: Record<string, { name: string; email: string }> = {};
  (profiles ?? []).forEach((p: any) => {
    profileMap[p.id] = { name: p.full_name || 'Apprentice', email: p.email || '' };
  });

  const today = new Date();
  const atRiskList: any[] = [];
  let checked = 0;

  for (const enroll of rows) {
    const req = PROGRAM_REQUIREMENTS[enroll.program_slug];
    if (!req) continue; // Unknown program — skip

    const startDate = new Date(enroll.enrolled_at);
    const weeksElapsed = Math.max(1, (today.getTime() - startDate.getTime()) / (7 * 86400 * 1000));
    const weeksRemaining = Math.max(0, req.totalWeeks - weeksElapsed);

    // Don't alert in first 2 weeks or if program is complete
    if (weeksElapsed < 2 || weeksRemaining <= 0) continue;

    // Get actual approved OJL hours
    let actualOjl: number;
    try {
      const hours = await getApprovedHoursByType(db as any, enroll.user_id);
      actualOjl = hours.ojl;
    } catch {
      continue;
    }

    const expectedOjl = (req.ojl / req.totalWeeks) * weeksElapsed;
    const deficit = expectedOjl - actualOjl;
    const deficitPct = deficit / req.ojl;

    checked++;

    if (deficitPct <= BEHIND_THRESHOLD) continue; // On pace

    const profile = profileMap[enroll.user_id];
    const weeklyNeeded = weeksRemaining > 0 ? Math.ceil((req.ojl - actualOjl) / weeksRemaining) : 0;

    atRiskList.push({
      userId: enroll.user_id,
      name: profile?.name ?? enroll.user_id,
      email: profile?.email ?? '',
      programSlug: enroll.program_slug,
      actualOjl: Math.round(actualOjl),
      expectedOjl: Math.round(expectedOjl),
      deficit: Math.round(deficit),
      deficitPct: Math.round(deficitPct * 100),
      weeksRemaining: Math.round(weeksRemaining),
      weeklyNeeded,
      requiredOjl: req.ojl,
    });

    // Raise admin alert
    await Promise.resolve(
      db.from('admin_alerts').insert({
        alert_type: 'low_hours_pace',
        severity: deficitPct > 0.25 ? 'critical' : 'warning',
        resolved: false,
        details: {
          apprentice_id: enroll.user_id,
          program_slug: enroll.program_slug,
          ojl_logged: Math.round(actualOjl),
          ojl_required: req.ojl,
          expected_at_this_point: Math.round(expectedOjl),
          deficit: Math.round(deficit),
          weeks_remaining: Math.round(weeksRemaining),
          weekly_hours_needed: weeklyNeeded,
        },
        created_at: new Date().toISOString(),
      })
    ).catch((err: any) => logger.warn('[low-hours-pace] alert insert failed', { err }));

    // Email student
    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        from: FROM_EMAIL,
        subject: `You're behind on your apprenticeship hours — ${Math.round(deficit)} hours to catch up`,
        html: `
          <p>Hi ${profile.name},</p>
          <p>Your apprenticeship hours are behind the required pace for your program.</p>
          <table style="border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:4px 12px 4px 0;color:#666">Hours logged:</td><td style="font-weight:bold">${Math.round(actualOjl)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Expected by now:</td><td style="font-weight:bold">${Math.round(expectedOjl)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Deficit:</td><td style="font-weight:bold;color:#dc2626">${Math.round(deficit)} hours</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Weeks remaining:</td><td style="font-weight:bold">${Math.round(weeksRemaining)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#666">Hours needed per week:</td><td style="font-weight:bold;color:#d97706">${weeklyNeeded}</td></tr>
          </table>
          <p>To stay on track, you need to log at least <strong>${weeklyNeeded} hours per week</strong> for the remainder of your program.</p>
          <p>Please speak with your instructor or shop supervisor if you need help getting back on pace.</p>
          <p><a href="https://www.elevateforhumanity.org/apprentice/hours">View your hours →</a></p>
          <p>— Elevate for Humanity</p>
        `,
      }).catch((err) => logger.warn('[low-hours-pace] student email failed', { userId: enroll.user_id, err }));
    }
  }

  // Email admin summary if any at-risk
  if (atRiskList.length > 0) {
    const rows = atRiskList
      .map((a) => `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${a.name}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${a.programSlug}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${a.actualOjl}h / ${a.requiredOjl}h</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#dc2626">-${a.deficit}h (${a.deficitPct}%)</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${a.weeklyNeeded}h/wk needed</td>
      </tr>`)
      .join('');

    await sendEmail({
      to: ADMIN_EMAIL,
      from: FROM_EMAIL,
      subject: `⚠️ ${atRiskList.length} apprentice${atRiskList.length > 1 ? 's' : ''} behind on OJL hours`,
      html: `
        <p><strong>${atRiskList.length} apprentice${atRiskList.length > 1 ? 's are' : ' is'} behind on required OJL hours.</strong></p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <thead>
            <tr style="background:#f8fafc;text-align:left">
              <th style="padding:8px 12px">Name</th>
              <th style="padding:8px 12px">Program</th>
              <th style="padding:8px 12px">Hours</th>
              <th style="padding:8px 12px">Deficit</th>
              <th style="padding:8px 12px">Catch-up</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p><a href="https://www.elevateforhumanity.org/admin/student-hours">Review in Admin →</a></p>
      `,
    }).catch((err) => logger.warn('[low-hours-pace] admin email failed', { err }));
  }

  logger.info('[low-hours-pace] complete', { checked, atRisk: atRiskList.length });
  return NextResponse.json({ checked, atRisk: atRiskList.length, atRiskList });
});
