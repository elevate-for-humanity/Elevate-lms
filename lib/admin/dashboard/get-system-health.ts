import type { SupabaseClient } from '@/lib/supabase';

export interface SystemHealthAlert {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface DashboardSystemHealth {
  stripeWebhookOk: boolean;
  stripeIssuingOk: boolean;
  buildEnvOk: boolean;
  staleJobs: number;
  degraded: boolean;
  missingDocuments: number;
  missingCertifications: number;
  unresolvedFlags: number;
  alerts: SystemHealthAlert[];
}

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
];

// In-process cache for the Stripe Issuing check — avoids a live outbound HTTP
// call on every dashboard render. TTL: 5 minutes.
let _stripeIssuingCache: { result: { enabled: boolean; reason: string | null }; expiresAt: number } | null = null;

async function getCachedStripeIssuingStatus(): Promise<{ enabled: boolean; reason: string | null }> {
  const now = Date.now();
  if (_stripeIssuingCache && now < _stripeIssuingCache.expiresAt) {
    return _stripeIssuingCache.result;
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const result = { enabled: false, reason: 'no_key' };
    _stripeIssuingCache = { result, expiresAt: now + 5 * 60 * 1000 };
    return result;
  }
  try {
    const res = await fetch('https://api.stripe.com/v1/issuing/cardholders?limit=1', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const result =
      res.status === 200 ? { enabled: true, reason: null } :
      res.status === 403 ? { enabled: false, reason: 'not_approved' } :
      { enabled: false, reason: `stripe_${res.status}` };
    _stripeIssuingCache = { result, expiresAt: now + 5 * 60 * 1000 };
    return result;
  } catch {
    const result = { enabled: false, reason: 'fetch_error' };
    // Cache failures for 1 minute only — retry sooner on transient errors
    _stripeIssuingCache = { result, expiresAt: now + 60 * 1000 };
    return result;
  }
}

export async function getSystemHealth(db: SupabaseClient): Promise<DashboardSystemHealth> {
  const alerts: SystemHealthAlert[] = [];

  // Check required env vars
  const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
  const buildEnvOk = missingEnv.length === 0;
  if (!buildEnvOk) {
    alerts.push({
      code: 'missing_env_vars',
      severity: 'critical',
      message: `Missing env vars: ${missingEnv.join(', ')}`,
    });
  }

  const [stripeWebhook, stripeIssuing, staleJobs, missingDocs, unresolvedFlags] = await Promise.all([
    // Check Stripe webhook status via app_secrets or a known sentinel
    db.from('app_secrets').select('value').eq('key', 'STRIPE_WEBHOOK_SECRET').maybeSingle(),

    // Check Stripe Issuing — cached for 5 minutes to avoid blocking every dashboard load.
    // A live outbound fetch on every render adds 200-800ms of latency.
    getCachedStripeIssuingStatus(),

    // Stale jobs stuck in processing > 30 min
    db
      .from('job_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing')
      .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()),

    // Enrollments missing required documents
    db
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('enrollment_state', 'active')
      .eq('docs_verified', false),

    // Unresolved compliance flags (table may not exist — degrade gracefully)
    db.from('compliance_flags').select('id', { count: 'exact', head: true }).eq('resolved', false)
      .then(r => r.error ? { count: 0, error: null } : r),
  ]);

  // Check env var first (ECS injects it via SSM), then fall back to app_secrets table
  const stripeWebhookOk = !!process.env.STRIPE_WEBHOOK_SECRET || !!stripeWebhook.data?.value;
  if (!stripeWebhookOk) {
    alerts.push({
      code: 'stripe_webhook_secret_missing',
      severity: 'critical',
      message: 'STRIPE_WEBHOOK_SECRET not set — webhook events will be dropped.',
    });
  }

  const stripeIssuingOk = stripeIssuing.enabled;
  if (!stripeIssuingOk) {
    const reasonMsg =
      stripeIssuing.reason === 'not_approved'
        ? 'Stripe Issuing not yet approved for this account. Apply at dashboard.stripe.com/issuing.'
        : stripeIssuing.reason === 'no_key'
        ? 'STRIPE_SECRET_KEY missing — Stripe Issuing status unknown.'
        : `Stripe Issuing unavailable (${stripeIssuing.reason}).`;
    alerts.push({
      code: 'stripe_issuing_not_enabled',
      severity: stripeIssuing.reason === 'not_approved' ? 'warning' : 'info',
      message: reasonMsg,
    });
  }

  const staleJobCount = staleJobs.count ?? 0;
  if (staleJobCount > 0) {
    alerts.push({
      code: 'stale_jobs',
      severity: 'warning',
      message: `${staleJobCount} job${staleJobCount > 1 ? 's' : ''} stuck in processing for >30 min.`,
    });
  }

  return {
    stripeWebhookOk,
    stripeIssuingOk,
    buildEnvOk,
    staleJobs: staleJobCount,
    degraded: alerts.some((a) => a.severity === 'critical'),
    missingDocuments: missingDocs.count ?? 0,
    missingCertifications: 0,
    unresolvedFlags: unresolvedFlags.count ?? 0,
    alerts,
  };
}
