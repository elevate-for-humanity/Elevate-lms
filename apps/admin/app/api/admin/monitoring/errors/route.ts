import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin error surface for Lizzy — Sentry config, audit pipeline failures, shell wiring.
 */
export async function GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const admin = await requireAdminClient();
  const supabase = admin ?? (await createClient());

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: auditFailures, error: auditError } = await supabase
    .from('audit_failures')
    .select('id, endpoint, error_message, created_at, resolved')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(25);

  if (auditError) {
    logger.warn('[monitoring/errors] audit_failures query failed', auditError);
  }

  let health: Record<string, unknown> = {};
  try {
    const healthRes = await fetch(new URL('/api/devstudio/health', request.url), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    });
    if (healthRes.ok) {
      health = (await healthRes.json()) as Record<string, unknown>;
    }
  } catch (err) {
    logger.warn('[monitoring/errors] devstudio health fetch failed', err);
  }

  const sentryDsn =
    process.env.SENTRY_DSN ||
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    process.env.SENTRY_ADMIN_DSN ||
    '';

  const rows = auditFailures ?? [];

  // MonitoringClient (/admin/monitoring) expects `errors` with API-error row shape
  const errors = rows.map((row) => ({
    id: row.id,
    timestamp: row.created_at,
    endpoint: row.endpoint ?? 'audit_pipeline',
    error: row.error_message ?? 'Audit write failed',
    statusCode: 500,
    ip: '—',
  }));

  return NextResponse.json({
    sentry: {
      configured: Boolean(sentryDsn),
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'unknown',
    },
    shell: health.shell ?? {
      STUDIO_SHELL_WS_URL: process.env.STUDIO_SHELL_WS_URL ? 'configured' : 'MISSING',
      STUDIO_SHELL_SECRET: process.env.STUDIO_SHELL_SECRET ? 'configured' : 'MISSING',
    },
    intake: {
      idempotencyTtlSeconds: Number(process.env.APPLICATION_INTAKE_IDEMPOTENCY_TTL_SECONDS || '86400'),
    },
    auditFailures: rows,
    errors,
    auditFailuresDegraded: Boolean(auditError),
    generatedAt: new Date().toISOString(),
  });
}
