
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { validateEnrollmentIntegrity } from '@/lib/enrollment-integrity-audit';
import { trySendEmail } from '@/lib/email/sendgrid';
import { hydrateProcessEnv } from '@/lib/secrets';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

// SLA thresholds in hours
const SLA_HOURS: Record<string, number> = {
  submitted:  48,
  in_review:  72,
  approved:   24,
};

export async function GET(request: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const db = await getAdminClient();
  if (!supabase || !db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: rows, error } = await db
    .from('applications')
    .select('id, status, program_slug, updated_at, created_at');

  if (error) return safeInternalError(error, 'Failed to load applications');

  const now = new Date();

  // Counts by status
  const counts: Record<string, number> = {};
  // Avg hours in current status per stage
  const totalHours: Record<string, number> = {};
  const stageCounts: Record<string, number> = {};
  // Stuck: in a non-terminal status past SLA threshold
  const stuck: Array<{ id: string; status: string; program_slug: string | null; hours_in_status: number; sla_hours: number }> = [];

  for (const row of rows ?? []) {
    const status = row.status ?? 'unknown';
    counts[status] = (counts[status] ?? 0) + 1;

    const since = new Date(row.updated_at ?? row.created_at).getTime();
    const hoursInStatus = (now.getTime() - since) / (1000 * 60 * 60);

    if (SLA_HOURS[status] !== undefined) {
      totalHours[status] = (totalHours[status] ?? 0) + hoursInStatus;
      stageCounts[status] = (stageCounts[status] ?? 0) + 1;

      if (hoursInStatus > SLA_HOURS[status]) {
        stuck.push({
          id: row.id,
          status,
          program_slug: row.program_slug,
          hours_in_status: Math.round(hoursInStatus),
          sla_hours: SLA_HOURS[status],
        });
      }
    }
  }

  // Avg time per stage
  const avg_hours_by_stage: Record<string, number> = {};
  for (const stage of Object.keys(totalHours)) {
    avg_hours_by_stage[stage] = Math.round(totalHours[stage] / stageCounts[stage]);
  }

  // Program bottlenecks: programs with most stuck applications
  const bottlenecks: Record<string, number> = {};
  for (const s of stuck) {
    const slug = s.program_slug ?? 'unknown';
    bottlenecks[slug] = (bottlenecks[slug] ?? 0) + 1;
  }
  const top_bottlenecks = Object.entries(bottlenecks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([program_slug, stuck_count]) => ({ program_slug, stuck_count }));

  // Deadman check: log this run and alert if the previous run is stale.
  // If health checks stop running, the entire detection chain silently fails.
  const DEADMAN_INTERVAL_HOURS = 2;

  const { data: lastRun } = await db
    .from('health_check_log')
    .select('ran_at')
    .eq('route', 'enrollment-health')
    .order('ran_at', { ascending: false })
    .limit(1)
    .single();

  if (lastRun?.ran_at) {
    const hoursSinceLast = (now.getTime() - new Date(lastRun.ran_at).getTime()) / 3_600_000;
    if (hoursSinceLast > DEADMAN_INTERVAL_HOURS) {
      const alertTo = process.env.ALERT_EMAIL_TO || process.env.ADMIN_ALERT_EMAIL;
      const slackWebhook = process.env.SLACK_WEBHOOK_URL;
      const msg = `Health check gap: enrollment-health last ran ${hoursSinceLast.toFixed(1)}h ago (threshold: ${DEADMAN_INTERVAL_HOURS}h). Detection chain may have been silent.`;
      if (alertTo) {
        await trySendEmail({
          to: alertTo,
          subject: `[ALERT] Enrollment health check gap — ${hoursSinceLast.toFixed(1)}h since last run`,
          html: `<p>${msg}</p><p>If this was intentional downtime, no action needed. Otherwise investigate why the health route stopped running.</p>`,
        });
      }
      if (slackWebhook) {
        await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `⚠️ *HEALTH_CHECK_GAP* — ${msg}` }),
        }).catch(() => {});
      }
    }
  }

  // Enrollment integrity audit — failures here are deployment blockers
  const integrity = await validateEnrollmentIntegrity(db);

  // PRIVILEGED_BYPASS_DETECTED is page-worthy: fire an alert immediately.
  // Detection is after the fact — the alert is the consequence attached to the signal.
  if (integrity.failures.includes('PRIVILEGED_BYPASS_DETECTED')) {
    const bypassCount = integrity.counts.PRIVILEGED_BYPASS_DETECTED;
    const alertTo = process.env.ALERT_EMAIL_TO || process.env.ADMIN_ALERT_EMAIL;
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;

    // Email alert
    if (alertTo) {
      await trySendEmail({
        to: alertTo,
        subject: `[SECURITY] Enrollment bypass detected — ${bypassCount} unauthorized write(s)`,
        html: `
          <p><strong>PRIVILEGED_BYPASS_DETECTED</strong></p>
          <p>${bypassCount} enrollment row(s) were written to <code>program_enrollments</code>
          outside the <code>enroll_application</code> RPC.</p>
          <p>This means a privileged caller (service_role or postgres) inserted directly,
          bypassing all enrollment invariant gates.</p>
          <p>Check <code>enrollment_insert_audit</code> where <code>via_rpc = false</code>
          for full context: enrollment_id, user_id, program_slug, db_user, inserted_at.</p>
          <p>If this was an approved maintenance operation, register it in
          <code>enrollment_bypass_allowlist</code> with a sunset date.
          If it was not approved, treat this as a security incident.</p>
        `,
      });
    }

    // Slack alert
    if (slackWebhook) {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *PRIVILEGED_BYPASS_DETECTED* — ${bypassCount} enrollment row(s) written outside the RPC. Check \`enrollment_insert_audit\` where \`via_rpc = false\`. Treat as security incident if not an approved maintenance write.`,
        }),
      }).catch(() => {}); // Slack failure must never block the health response
    }
  }

  // Log this run for deadman tracking — fire and forget, never block response
  db.from('health_check_log').insert({
    route:    'enrollment-health',
    ran_at:   now.toISOString(),
    clean:    integrity.clean,
    failures: integrity.failures,
  }).then(() => {}).catch(() => {});

  return NextResponse.json({
    generated_at: now.toISOString(),
    total: rows?.length ?? 0,
    counts_by_status: counts,
    avg_hours_by_stage,
    sla_thresholds_hours: SLA_HOURS,
    stuck_count: stuck.length,
    top_bottlenecks,
    stuck,
    enrollment_integrity: {
      clean: integrity.clean,
      failures: integrity.failures,
      counts: integrity.counts,
    },
    deadman: {
      last_run_at:            lastRun?.ran_at ?? null,
      interval_threshold_hours: DEADMAN_INTERVAL_HOURS,
    },
  });
}
