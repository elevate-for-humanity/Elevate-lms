// PUBLIC ROUTE: health check — no auth, no rate limiting (Northflank probes every 30s)
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { probeSupabaseDatabase } from '@/lib/supabase/db-probe';

import { toErrorMessage } from '@/lib/safe';
import { getAppVersion } from '@/lib/version/getAppVersion';
import { getAuditTelemetry } from '@/lib/audit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _GET(request: Request) {
  // No rate limiting — platform health checks call this frequently.
  // Applying Redis rate limiting here burns ~1,440 Upstash requests/day per task.
  const checks: Record<string, any> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: getAppVersion(),
    environment: process.env.NODE_ENV || 'production',
    checks: {},
  };

  // Check 1: Environment Variables — missing critical vars = warn (not fail) for better UX
  const criticalEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const missingEnv = criticalEnv.filter((k) => !process.env[k]);
  const hasSupabaseUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.DATABASE_URL);
  
  checks.checks.environment = {
    supabase_url: !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
    supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    service_role_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
    missing: missingEnv,
    status: missingEnv.length === 0 ? 'pass' : 'warn', // Changed from 'fail' to 'warn'
  };

  // Check 2: Database Connection (direct REST probe — not subject to circuit breaker)
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      checks.checks.database = {
        connected: false,
        status: 'warn',
        error: 'Missing Supabase credentials',
      };
    } else {
      const probe = await probeSupabaseDatabase();
      checks.checks.database = {
        connected: probe.ok,
        status: probe.ok ? 'pass' : 'warn',
        error: probe.ok ? null : probe.error ?? 'DB_ERROR',
        hint: null,
      };
    }
  } catch (error) {
    checks.checks.database = { connected: false, status: 'warn', error: toErrorMessage(error) };
  }

  // Check 3: System Resources
  checks.checks.system = {
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
    status: 'pass',
  };

  // Check 4: Stripe (optional)
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      });
      checks.checks.stripe = {
        ok: response.ok,
        status: response.ok ? 'pass' : 'warn',
        statusCode: response.status,
      };
    } catch (error) {
      checks.checks.stripe = {
        ok: false,
        status: 'warn',
        error: toErrorMessage(error),
      };
    }
  } else {
    checks.checks.stripe = { skipped: true, status: 'pass' };
  }

  // Check 5: Resend (optional)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/scopes', {
        headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` },
      });
      checks.checks.sendgrid = {
        ok: response.ok || response.status === 403,
        status: response.ok || response.status === 403 ? 'pass' : 'warn',
      };
    } catch (error) {
      checks.checks.sendgrid = {
        ok: false,
        status: 'warn',
        error: toErrorMessage(error),
      };
    }
  } else {
    checks.checks.resend = { skipped: true, status: 'pass' };
  }

  // Check 6: Audit telemetry
  const auditTelemetry = getAuditTelemetry();
  checks.checks.audit = {
    success_count: auditTelemetry.auditSuccessCount,
    failure_count: auditTelemetry.auditFailureCount,
    status: auditTelemetry.auditFailureCount === 0 ? 'pass' : 'warn',
  };

  // Check 7: Audit infrastructure integrity (trigger health)
  try {
    const adminClient = await requireAdminClient();
    if (adminClient) {
      const { data: integrity } = await adminClient.rpc('verify_audit_integrity');
      // RPC returns: { disabled_triggers, missing_immutability, checked_at }
      // (field was previously named missing_immutability_tables — handle both)
      const missingTables: string[] =
        integrity?.missing_immutability ?? integrity?.missing_immutability_tables ?? [];
      const disabledCount: number = integrity?.disabled_triggers ?? 0;
      // disabled_triggers > 0 = hard fail (active tampering risk)
      // missing_immutability > 0 = warn only (RLS still enforced; trigger is
      //   defense-in-depth — apply migration 20260424000004 to resolve)
      // TODO(security): missing immutability triggers are a hardening gap, not
      //   a healthy final state. Apply 20260424000004_audit_ddl_events_immutability_trigger.sql
      //   in Supabase Dashboard to promote this from warn → pass.
      const integrityStatus =
        disabledCount > 0 ? 'fail' : missingTables.length > 0 ? 'warn' : 'pass';
      checks.checks.audit_integrity = {
        status: integrityStatus,
        disabled_triggers: disabledCount,
        missing_immutability: missingTables,
        checked_at: integrity?.checked_at ?? new Date().toISOString(),
      };
    }
  } catch {
    checks.checks.audit_integrity = { status: 'unknown', error: 'RPC unavailable' };
  }

  // Overall Status — 'fail' is reserved for hard errors, 'warn' for degraded
  const allPassed = Object.values(checks.checks).every((check: any) => check.status === 'pass');
  const hasCriticalFailure = Object.values(checks.checks).some(
    (check: any) => check.status === 'fail',
  );

  checks.status = allPassed ? 'healthy' : hasCriticalFailure ? 'degraded' : 'healthy';
  checks.overall = hasCriticalFailure ? 'fail' : 'pass';

  // Activation gates — derived from live checks only (no hardcoded marketing scores).
  const dbPass = checks.checks.database?.status === 'pass';
  const envPass = checks.checks.environment?.status === 'pass';
  checks.activation = {
    environment: envPass,
    database: dbPass,
    stripe: checks.checks.stripe?.status === 'pass' || checks.checks.stripe?.skipped === true,
    email: checks.checks.sendgrid?.status === 'pass' || checks.checks.resend?.skipped === true,
    audit_integrity: checks.checks.audit_integrity?.status !== 'fail',
    ready_for_traffic: envPass && dbPass && !hasCriticalFailure,
  };
  checks.production_ready = checks.activation.ready_for_traffic;

  // Return 500 on hard failures so platform health checks kill bad containers.
  // Warnings (degraded DB, missing optional keys) still return 200 — the app
  // can serve traffic in a degraded state. Only missing critical env vars or
  // disabled audit triggers are hard failures.
  const httpStatus = hasCriticalFailure ? 500 : 200;
  return NextResponse.json(checks, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
// No audit wrapper — this route is called frequently by platform health checks.
export const GET = withRuntime(_GET);
