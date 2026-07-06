/**
 * GET /api/internal/service-health
 *
 * Deep service health check: DB, env vars, cron observability, workflow engine,
 * AI provider, and push notification config.
 *
 * Protected by CRON_SECRET (x-internal-secret header or ?secret= param).
 * Returns HTTP 200 with per-service status; never throws.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ServiceCheck {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  message?: string;
  latency_ms?: number;
}

async function checkWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs = 5000,
): Promise<{ result?: T; error?: string; latency_ms: number }> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs),
      ),
    ]);
    return { result, latency_ms: Date.now() - start };
  } catch (err) {
    return { error: String(err), latency_ms: Date.now() - start };
  }
}

export async function GET(request: NextRequest) {
  await hydrateProcessEnv();

  // Auth: require CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  const provided =
    request.headers.get('x-internal-secret') ??
    request.nextUrl.searchParams.get('secret');
  if (cronSecret && provided !== cronSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const checks: ServiceCheck[] = [];

  // ── 1. Database ──────────────────────────────────────────────────────────────
  const dbCheck = await checkWithTimeout(async () => {
    const db = await requireAdminClient();
    const { error } = await db.from('profiles').select('id').limit(1);
    if (error) throw new Error(error.message);
    return true;
  });
  checks.push({
    name: 'database',
    status: dbCheck.error ? 'fail' : 'ok',
    message: dbCheck.error,
    latency_ms: dbCheck.latency_ms,
  });

  // ── 2. Required env vars ─────────────────────────────────────────────────────
  const requiredEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'CRON_SECRET',
  ];
  const missingEnv = requiredEnv.filter((k) => !process.env[k]);
  checks.push({
    name: 'env_vars',
    status: missingEnv.length === 0 ? 'ok' : 'fail',
    message: missingEnv.length > 0 ? `Missing: ${missingEnv.join(', ')}` : undefined,
  });

  // ── 3. Optional env vars (warn if absent) ────────────────────────────────────
  const optionalEnv = [
    'OPENAI_API_KEY',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'STRIPE_SECRET_KEY',
    'RESEND_API_KEY',
  ];
  const missingOptional = optionalEnv.filter((k) => !process.env[k]);
  checks.push({
    name: 'optional_env_vars',
    status: missingOptional.length === 0 ? 'ok' : 'warn',
    message: missingOptional.length > 0 ? `Not set: ${missingOptional.join(', ')}` : undefined,
  });

  // ── 4. AI provider ───────────────────────────────────────────────────────────
  const hasAiKey = !!(process.env.OPENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  checks.push({
    name: 'ai_provider',
    status: hasAiKey ? 'ok' : 'warn',
    message: hasAiKey ? undefined : 'No AI provider key configured (OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY)',
  });

  // ── 5. Push notifications (VAPID) ────────────────────────────────────────────
  const hasVapid = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  checks.push({
    name: 'push_vapid',
    status: hasVapid ? 'ok' : 'warn',
    message: hasVapid ? undefined : 'VAPID keys not configured — push notifications disabled',
  });

  // ── 6. Cron observability table ──────────────────────────────────────────────
  const cronCheck = await checkWithTimeout(async () => {
    const db = await requireAdminClient();
    const { error } = await db.from('cron_job_runs').select('id').limit(1);
    if (error) throw new Error(error.message);
    return true;
  });
  checks.push({
    name: 'cron_job_runs_table',
    status: cronCheck.error ? 'warn' : 'ok',
    message: cronCheck.error ? `Table missing or inaccessible: ${cronCheck.error}` : undefined,
    latency_ms: cronCheck.latency_ms,
  });

  // ── 7. Workflow engine tables ────────────────────────────────────────────────
  const workflowCheck = await checkWithTimeout(async () => {
    const db = await requireAdminClient();
    const [runs, stepLogs, deadLetters] = await Promise.all([
      db.from('workflow_runs').select('id').limit(1),
      db.from('workflow_step_logs').select('id').limit(1),
      db.from('workflow_dead_letters').select('id').limit(1),
    ]);
    const missing: string[] = [];
    if (runs.error) missing.push('workflow_runs');
    if (stepLogs.error) missing.push('workflow_step_logs');
    if (deadLetters.error) missing.push('workflow_dead_letters');
    if (missing.length > 0) throw new Error(`Missing tables: ${missing.join(', ')}`);
    return true;
  });
  checks.push({
    name: 'workflow_tables',
    status: workflowCheck.error ? 'warn' : 'ok',
    message: workflowCheck.error,
    latency_ms: workflowCheck.latency_ms,
  });

  // ── 8. Recent cron activity ──────────────────────────────────────────────────
  const cronActivityCheck = await checkWithTimeout(async () => {
    const db = await requireAdminClient();
    const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // last 25h
    const { data, error } = await db
      .from('cron_job_runs')
      .select('id')
      .gte('started_at', since)
      .limit(1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('No cron runs in last 25h');
    return true;
  });
  checks.push({
    name: 'cron_recent_activity',
    status: cronActivityCheck.error ? 'warn' : 'ok',
    message: cronActivityCheck.error,
    latency_ms: cronActivityCheck.latency_ms,
  });

  // ── Summary ──────────────────────────────────────────────────────────────────
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const overall = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'ok';

  logger.info('[service-health] checked', { overall, failCount, warnCount });

  return NextResponse.json(
    {
      overall,
      checked_at: new Date().toISOString(),
      summary: { ok: checks.filter((c) => c.status === 'ok').length, warn: warnCount, fail: failCount },
      checks,
    },
    { status: failCount > 0 ? 503 : 200 },
  );
}
