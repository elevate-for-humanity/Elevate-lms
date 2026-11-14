import type { SupabaseClient } from '@/lib/supabase';
import { hydrateProcessEnv } from '@/lib/secrets';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';
import { loadBillingProviderConfig } from '@/lib/billing/config';

export interface SystemHealthAlert {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}
export interface DashboardSystemHealth {
  quickBooksWebhookOk: boolean;
  quickBooksBillingOk: boolean;
  buildEnvOk: boolean;
  staleJobs: number;
  degraded: boolean;
  missingDocuments: number;
  missingCertifications: number;
  unresolvedFlags: number;
  alerts: SystemHealthAlert[];
}

const REQUIRED_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SENDGRID_API_KEY'];

export async function getSystemHealth(db: SupabaseClient): Promise<DashboardSystemHealth> {
  await hydrateProcessEnv();
  const alerts: SystemHealthAlert[] = [];
  const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
  const buildEnvOk = missingEnv.length === 0;
  if (!buildEnvOk)
    alerts.push({
      code: 'missing_env_vars',
      severity: 'critical',
      message: `Missing env vars: ${missingEnv.join(', ')}`,
    });

  const [
    billingConfig,
    staleJobs,
    courseJobs,
    missingDocs,
    missingCertifications,
    unresolvedFlags,
  ] = await Promise.all([
    Promise.all([loadQuickBooksConfig(db), loadBillingProviderConfig(db)])
      .then(async ([config, provider]) => {
        if (provider.primary !== 'quickbooks' || !config.clientId || !config.clientSecret ||
            !config.refreshToken || !config.realmId) return false;
        const company = await quickBooksRequest<{ CompanyInfo?: { CompanyName?: string } }>(
          db, config, `companyinfo/${config.realmId}`, { signal: AbortSignal.timeout(4_000) },
        );
        return typeof company?.CompanyInfo?.CompanyName === 'string' && Boolean(company.CompanyInfo.CompanyName.trim());
      })
      .catch(() => false),
    db
      .from('job_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing')
      .lt('updated_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()),
    db
      .from('ultimate_build_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'running')
      .or(
        `lease_expires_at.is.null,lease_expires_at.lt.${new Date().toISOString()},heartbeat_at.is.null,heartbeat_at.lt.${new Date(Date.now() - 90_000).toISOString()}`,
      ),
    db
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('enrollment_state', 'active')
      .or('docs_verified.is.null,docs_verified.eq.false'),
    db
      .from('credential_verification')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending'),
    db.from('compliance_flags').select('id', { count: 'exact', head: true }).eq('resolved', false),
  ]);

  const quickBooksBillingOk = billingConfig;
  const quickBooksWebhookOk = Boolean(process.env.QB_WEBHOOK_VERIFIER_TOKEN?.trim() || process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN?.trim());
  if (!quickBooksBillingOk)
    alerts.push({
      code: 'quickbooks_billing_not_ready',
      severity: 'critical',
      message: 'QuickBooks company authorization could not be verified.',
    });
  if (!quickBooksWebhookOk)
    alerts.push({
      code: 'quickbooks_webhook_config_missing',
      severity: 'critical',
      message: 'QuickBooks webhook verifier is not configured.',
    });
  for (const [name, result] of [
    ['job_queue', staleJobs],
    ['ultimate_build_jobs', courseJobs],
    ['documents', missingDocs],
    ['certifications', missingCertifications],
    ['compliance_flags', unresolvedFlags],
  ] as const) {
    if (result.error)
      alerts.push({
        code: `${name}_health_unavailable`,
        severity: 'critical',
        message: `Unable to verify ${name} health.`,
      });
  }
  const staleJobCount = (staleJobs.count ?? 0) + (courseJobs.count ?? 0);
  if (staleJobCount > 0)
    alerts.push({
      code: 'stale_jobs',
      severity: 'warning',
      message: `${staleJobCount} job${staleJobCount > 1 ? 's' : ''} with stale processing or missing/expired worker leases.`,
    });
  return {
    quickBooksWebhookOk,
    quickBooksBillingOk,
    buildEnvOk,
    staleJobs: staleJobCount,
    degraded: alerts.some((a) => a.severity === 'critical'),
    missingDocuments: missingDocs.count ?? 0,
    missingCertifications: missingCertifications.count ?? 0,
    unresolvedFlags: unresolvedFlags.count ?? 0,
    alerts,
  };
}
