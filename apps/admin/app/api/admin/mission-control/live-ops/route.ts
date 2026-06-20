import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/dashboard/live-ops
 *
 * Returns the full operational picture for Mission Control:
 *   - Active clock-ins + recent completions
 *   - Platform event alerts (warning/error/critical)
 *   - admin_alerts (missed clock-outs, low-hour apprentices, payment failures)
 *   - Stripe payment failures (barber_subscriptions past_due/suspended)
 *   - RAPIDS missing (apprentices enrolled but not registered in RAPIDS)
 *   - Recent lesson completions (24h)
 *
 * Polled every 30s by MissionControlClient. All queries run in parallel.
 */
export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = createAdminClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    clockInsRes,
    eventsRes,
    lessonProgressRes,
    adminAlertsRes,
    stripeFailuresRes,
  ] = await Promise.all([
    db
      .from('progress_entries')
      .select('id, apprentice_id, clock_in_at, clock_out_at, work_date, hours_worked, program_id')
      .gte('clock_in_at', since24h)
      .order('clock_in_at', { ascending: false })
      .limit(30),

    db
      .from('platform_events')
      .select('id, event_type, category, severity, message, created_at, payload, resolved')
      .gte('created_at', since24h)
      .in('severity', ['warning', 'error', 'critical'])
      .order('created_at', { ascending: false })
      .limit(20),

    db
      .from('lesson_progress')
      .select('id, user_id, lesson_id, completed_at, created_at')
      .gte('created_at', since24h)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(20),

    // admin_alerts: unresolved in last 7 days
    db
      .from('admin_alerts')
      .select('id, alert_type, severity, message, metadata, created_at, resolved_at, apprentice_id')
      .is('resolved_at', null)
      .gte('created_at', since7d)
      .order('created_at', { ascending: false })
      .limit(30),

    // Stripe failures: barber_subscriptions past_due or suspended
    db
      .from('barber_subscriptions')
      .select('id, user_id, payment_status, failed_payment_at, suspension_deadline, plan_type')
      .in('payment_status', ['past_due', 'suspended'])
      .order('failed_payment_at', { ascending: false })
      .limit(20),
  ]);

  // RAPIDS missing: active enrollments with no rapids_registrations row
  const { data: rapidsEnrollments } = await db
    .from('program_enrollments')
    .select('id, user_id, program_id, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(200);

  const { data: rapidsRegistered } = await db
    .from('rapids_registrations')
    .select('student_id');

  const registeredIds = new Set((rapidsRegistered ?? []).map((r: any) => r.student_id));
  const rapidsMissingEnrollments = (rapidsEnrollments ?? []).filter(
    (e: any) => !registeredIds.has(e.user_id),
  ).slice(0, 20);

  // ── Enrich clock-ins ──────────────────────────────────────────────────────
  const clockIns = clockInsRes.data ?? [];
  const apprenticeIds = [...new Set(clockIns.map((c: any) => c.apprentice_id).filter(Boolean))];
  const { data: clockProfiles } = apprenticeIds.length
    ? await db.from('profiles').select('id, full_name').in('id', apprenticeIds)
    : { data: [] };
  const clockProfileMap = Object.fromEntries((clockProfiles ?? []).map((p: any) => [p.id, p.full_name]));

  const enrichedClockIns = clockIns.map((c: any) => ({
    ...c,
    student_name: clockProfileMap[c.apprentice_id] ?? 'Unknown',
    is_active: !c.clock_out_at,
    duration_min: c.clock_in_at && !c.clock_out_at
      ? Math.round((Date.now() - new Date(c.clock_in_at).getTime()) / 60000)
      : null,
  }));

  // ── Enrich lesson completions ─────────────────────────────────────────────
  const lessonProgress = lessonProgressRes.data ?? [];
  const learnerIds = [...new Set(lessonProgress.map((l: any) => l.user_id).filter(Boolean))];
  const { data: learnerProfiles } = learnerIds.length
    ? await db.from('profiles').select('id, full_name').in('id', learnerIds)
    : { data: [] };
  const learnerMap = Object.fromEntries((learnerProfiles ?? []).map((p: any) => [p.id, p.full_name]));
  const enrichedProgress = lessonProgress.map((l: any) => ({
    ...l,
    student_name: learnerMap[l.user_id] ?? 'Unknown',
  }));

  // ── Enrich Stripe failures ────────────────────────────────────────────────
  const stripeFailures = stripeFailuresRes.data ?? [];
  const stripeUserIds = [...new Set(stripeFailures.map((s: any) => s.user_id).filter(Boolean))];
  const { data: stripeProfiles } = stripeUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', stripeUserIds)
    : { data: [] };
  const stripeProfileMap = Object.fromEntries((stripeProfiles ?? []).map((p: any) => [p.id, p]));
  const enrichedStripeFailures = stripeFailures.map((s: any) => ({
    ...s,
    full_name: stripeProfileMap[s.user_id]?.full_name ?? 'Unknown',
    email: stripeProfileMap[s.user_id]?.email ?? '',
  }));

  // ── Enrich RAPIDS missing ─────────────────────────────────────────────────
  const rapidsUserIds = [...new Set(rapidsMissingEnrollments.map((e: any) => e.user_id).filter(Boolean))];
  const { data: rapidsProfiles } = rapidsUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', rapidsUserIds)
    : { data: [] };
  const rapidsProfileMap = Object.fromEntries((rapidsProfiles ?? []).map((p: any) => [p.id, p]));
  const enrichedRapidsMissing = rapidsMissingEnrollments.map((e: any) => ({
    ...e,
    full_name: rapidsProfileMap[e.user_id]?.full_name ?? 'Unknown',
    email: rapidsProfileMap[e.user_id]?.email ?? '',
  }));

  // ── Categorise admin_alerts ───────────────────────────────────────────────
  const adminAlerts = adminAlertsRes.data ?? [];
  const lowHourAlerts    = adminAlerts.filter((a: any) => a.alert_type === 'low_hours_pace');
  const missedClockOuts  = adminAlerts.filter((a: any) => a.alert_type === 'missed_clock_out');
  const paymentAlerts    = adminAlerts.filter((a: any) =>
    ['payment_failed', 'invoice_payment_failed'].includes(a.alert_type),
  );

  const activeClockIns   = enrichedClockIns.filter((c: any) => c.is_active).length;
  const unresolvedAlerts = (eventsRes.data ?? []).filter((e: any) => !e.resolved).length;

  return NextResponse.json({
    clockIns: enrichedClockIns,
    alerts: eventsRes.data ?? [],
    adminAlerts,
    lowHourAlerts,
    missedClockOuts,
    paymentAlerts,
    stripeFailures: enrichedStripeFailures,
    rapidsMissing: enrichedRapidsMissing,
    recentLessonActivity: enrichedProgress,
    summary: {
      activeClockIns,
      unresolvedAlerts,
      lessonCompletions24h: enrichedProgress.length,
      adminAlertCount: adminAlerts.length,
      lowHourCount: lowHourAlerts.length,
      stripeFailureCount: enrichedStripeFailures.length,
      rapidsMissingCount: enrichedRapidsMissing.length,
    },
  });
}
