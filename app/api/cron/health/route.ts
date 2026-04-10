/**
 * GET /api/cron/health
 *
 * Verifies that all cron-critical environment variables are present and
 * that the DB is reachable. Call this after deploying to confirm the
 * follow-up automation will actually fire.
 *
 * Protected by CRON_SECRET — same auth as the cron routes themselves.
 *
 * Returns:
 *   200 { ok: true, checks: [...] }  — all systems go
 *   200 { ok: false, checks: [...] } — one or more checks failed (not 500,
 *                                      so monitoring tools can read the body)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Check {
  name:    string;
  ok:      boolean;
  detail?: string;
}

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CRON_SECRET',
  'SENDGRID_API_KEY',
  'EMAIL_FROM',
] as const;

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checks: Check[] = [];

  // ── 1. Environment variables ──────────────────────────────────────────────
  for (const key of REQUIRED_ENV_VARS) {
    const val = process.env[key];
    checks.push({
      name:   `env:${key}`,
      ok:     Boolean(val && val.length > 0),
      detail: val ? `${val.slice(0, 8)}…` : 'MISSING',
    });
  }

  // ── 2. Supabase DB reachability ───────────────────────────────────────────
  try {
    const supabase = await getAdminClient();
    if (!supabase) throw new Error('Admin client returned null');

    const { error } = await supabase
      .from('school_applications')
      .select('id', { count: 'exact', head: true });

    checks.push({
      name:   'db:school_applications',
      ok:     !error,
      detail: error ? error.message : 'reachable',
    });
  } catch (err) {
    checks.push({
      name:   'db:school_applications',
      ok:     false,
      detail: err instanceof Error ? err.message : 'unknown error',
    });
  }

  // ── 3. Followups table reachability ───────────────────────────────────────
  try {
    const supabase = await getAdminClient();
    if (!supabase) throw new Error('Admin client returned null');

    const { error } = await supabase
      .from('school_application_followups')
      .select('id', { count: 'exact', head: true });

    checks.push({
      name:   'db:school_application_followups',
      ok:     !error,
      detail: error ? error.message : 'reachable',
    });
  } catch (err) {
    checks.push({
      name:   'db:school_application_followups',
      ok:     false,
      detail: err instanceof Error ? err.message : 'unknown error',
    });
  }

  // ── 4. Cron timezone check ────────────────────────────────────────────────
  const tzOffset = new Date().getTimezoneOffset();
  checks.push({
    name:   'runtime:timezone',
    ok:     true, // informational only
    detail: `UTC offset: ${tzOffset} min (Netlify runs UTC — cron 14:00 UTC = 9 AM ET)`,
  });

  // ── 5. Recent followup activity ───────────────────────────────────────────
  try {
    const supabase = await getAdminClient();
    if (supabase) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('school_application_followups')
        .select('sequence, sent_at')
        .gte('sent_at', yesterday)
        .order('sent_at', { ascending: false })
        .limit(5);

      checks.push({
        name:   'cron:recent_sends',
        ok:     !error,
        detail: error
          ? error.message
          : data?.length
            ? `${data.length} email(s) sent in last 24h — last: ${data[0].sequence} at ${data[0].sent_at}`
            : 'No emails sent in last 24h (expected if no applications in window)',
      });
    }
  } catch (err) {
    checks.push({
      name:   'cron:recent_sends',
      ok:     false,
      detail: err instanceof Error ? err.message : 'unknown error',
    });
  }

  const allOk = checks.every(c => c.ok);

  if (!allOk) {
    logger.error('[cron/health] one or more checks failed', { checks });
  }

  return NextResponse.json({
    ok:        allOk,
    timestamp: new Date().toISOString(),
    checks,
  });
}
