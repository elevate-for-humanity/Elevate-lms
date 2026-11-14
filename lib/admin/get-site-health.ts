import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';
import { loadPayPalConfig, verifyPayPalConnection } from '@/lib/integrations/paypal-client';
import { resolveAIRuntimeState } from '@/lib/ai/provider-runtime';

export type HealthStatus = 'healthy' | 'degraded' | 'down';

export type HealthCheckResult = {
  name: string;
  status: HealthStatus;
  latencyMs: number | null;
  detail: string;
};

export type SiteHealthSnapshot = {
  overallStatus: HealthStatus;
  checkedAt: string;
  services: HealthCheckResult[];
};

function worstStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.includes('down')) return 'down';
  if (statuses.includes('degraded')) return 'degraded';
  return 'healthy';
}

async function timeCheck<T>(
  fn: () => Promise<T>,
): Promise<{ latencyMs: number; result?: T; error?: unknown }> {
  const start = Date.now();
  try {
    const result = await fn();
    return { latencyMs: Date.now() - start, result };
  } catch (error) {
    return { latencyMs: Date.now() - start, error };
  }
}

export async function getSiteHealthSnapshot(): Promise<SiteHealthSnapshot> {
  const db = await requireAdminClient();

  // Hydrate runtime secrets so AI provider keys are visible in process.env
  await hydrateProcessEnv();

  const checks: Promise<HealthCheckResult>[] = [
    // Real DB ping
    (async () => {
      const { latencyMs, error } = await timeCheck(async () => {
        const { error } = await db.from('profiles').select('id', { count: 'exact', head: true });
        if (error) throw error;
      });
      if (error) {
        return {
          name: 'Supabase Database',
          status: 'down' as HealthStatus,
          latencyMs,
          detail: error instanceof Error ? error.message : 'Query failed',
        };
      }
      return {
        name: 'Supabase Database',
        status: (latencyMs > 1500 ? 'degraded' : 'healthy') as HealthStatus,
        latencyMs,
        detail: latencyMs > 1500 ? 'Slow response' : 'OK',
      };
    })(),

    // Supabase env config
    (async () => {
      const ok =
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
        Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
      return {
        name: 'Supabase Config',
        status: (ok ? 'healthy' : 'down') as HealthStatus,
        latencyMs: null,
        detail: ok ? 'All Supabase env vars present' : 'Missing Supabase environment variables',
      };
    })(),

    // SendGrid
    (async () => {
      const configured = Boolean(process.env.SENDGRID_API_KEY);
      if (!configured) {
        return {
          name: 'SendGrid',
          status: 'down' as HealthStatus,
          latencyMs: null,
          detail: 'SENDGRID_API_KEY not set',
        };
      }
      // Live ping to SendGrid
      const { latencyMs, error } = await timeCheck(async () => {
        const res = await fetch('https://api.sendgrid.com/v3/user/account', {
          headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` },
          redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      });
      if (error) {
        return {
          name: 'SendGrid',
          status: 'degraded' as HealthStatus,
          latencyMs,
          detail: error instanceof Error ? error.message : 'API check failed',
        };
      }
      return {
        name: 'SendGrid',
        status: 'healthy' as HealthStatus,
        latencyMs,
        detail: 'API key valid, account reachable',
      };
    })(),

    // QuickBooks invoice and accounting connection
    (async () => {
      const { latencyMs: configLatency, result: config, error: configError } = await timeCheck(() => loadQuickBooksConfig(db));
      if (configError || !config) {
        return { name: 'QuickBooks', status: 'degraded' as HealthStatus, latencyMs: configLatency, detail: 'QuickBooks configuration unavailable' };
      }
      const configured = Boolean(config.clientId && config.clientSecret && (config.accessToken || config.refreshToken) && config.realmId);
      if (!configured) {
        return {
          name: 'QuickBooks',
          status: 'down' as HealthStatus,
          latencyMs: null,
          detail: 'QuickBooks connection needs authorization',
        };
      }
      const { latencyMs, error } = await timeCheck(async () => {
        await quickBooksRequest(db, config, `companyinfo/${config.realmId}`);
      });
      if (error) {
        return {
          name: 'QuickBooks',
          status: 'degraded' as HealthStatus,
          latencyMs,
          detail: error instanceof Error ? error.message : 'API check failed',
        };
      }
      return {
        name: 'QuickBooks',
        status: 'healthy' as HealthStatus,
        latencyMs,
        detail: 'Company connection responding',
      };
    })(),

    // PayPal recurring-payment authorization connection
    (async () => {
      const { latencyMs: configLatency, result: config, error: configError } = await timeCheck(loadPayPalConfig);
      if (configError || !config) {
        return { name: 'PayPal Billing', status: 'degraded' as HealthStatus, latencyMs: configLatency, detail: 'PayPal configuration unavailable' };
      }
      if (!config.clientId || !config.clientSecret || !config.billingWebhookId) {
        return {
          name: 'PayPal Billing',
          status: 'down' as HealthStatus,
          latencyMs: null,
          detail: 'PayPal billing credentials or webhook ID missing',
        };
      }
      const { latencyMs, error } = await timeCheck(verifyPayPalConnection);
      return {
        name: 'PayPal Billing',
        status: (error ? 'degraded' : 'healthy') as HealthStatus,
        latencyMs,
        detail: error ? (error instanceof Error ? error.message : 'Connection check failed') : 'Authentication responding',
      };
    })(),

    // Redis / Upstash
    (async () => {
      const configured =
        Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
        Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);
      if (!configured) {
        return {
          name: 'Redis / Queue',
          status: 'degraded' as HealthStatus,
          latencyMs: null,
          detail: 'UPSTASH_REDIS_REST_URL or TOKEN not set',
        };
      }
      const { latencyMs, error } = await timeCheck(async () => {
        const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
          redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      });
      if (error) {
        return {
          name: 'Redis / Queue',
          status: 'degraded' as HealthStatus,
          latencyMs,
          detail: error instanceof Error ? error.message : 'Ping failed',
        };
      }
      return {
        name: 'Redis / Queue',
        status: 'healthy' as HealthStatus,
        latencyMs,
        detail: 'Ping OK',
      };
    })(),

    // Read-only authentication does not certify email delivery. Sending-only
    // keys cannot list domains; report that as unverified, never as healthy.
    (async () => {
      const key = process.env.RESEND_API_KEY?.trim();
      if (!key) return { name: 'Resend', status: 'down' as HealthStatus,
        latencyMs: null, detail: 'Resend is not configured.' };
      const { latencyMs, error } = await timeCheck(async () => {
        const response = await fetch('https://api.resend.com/domains?limit=1', {
          headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
          redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000),
        });
        const body = response.ok ? await response.json() : null;
        if (!response.ok || body?.object !== 'list' || !Array.isArray(body.data))
          throw new Error('Resend authentication could not be verified.');
      });
      return {
        name: 'Resend', status: (error ? 'degraded' : 'healthy') as HealthStatus, latencyMs,
        detail: error
          ? 'Read-only authentication is unverified. A sending-only key requires delivery evidence.'
          : 'Read-only API authentication verified; message delivery is not certified.',
      };
    })(),

    // Resolve the actual selected provider rather than a historical key order.
    (async () => {
      const { latencyMs, result, error } = await timeCheck(resolveAIRuntimeState);
      const verified = result?.activeProvider === 'elevate' && result.elevate;
      return {
        name: 'AI Provider', latencyMs,
        status: (verified ? 'healthy' : !error && result?.anyConfigured ? 'degraded' : 'down') as HealthStatus,
        detail: verified
          ? 'Selected Elevate model authenticated discovery passed; inference completion is separate.'
          : 'Selected provider is unverified. Saved API keys do not prove working inference.',
      };
    })(),
  ];

  const services = await Promise.all(checks);
  const overallStatus = worstStatus(services.map((s) => s.status));

  return {
    overallStatus,
    checkedAt: new Date().toISOString(),
    services,
  };
}
