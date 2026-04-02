import { createAdminClient } from '@/lib/supabase/admin';

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
  const db = createAdminClient();

  const checks: Promise<HealthCheckResult>[] = [
    // Real DB ping
    (async () => {
      const { latencyMs, error } = await timeCheck(async () => {
        const { error } = await db
          .from('profiles')
          .select('id', { count: 'exact', head: true });
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

    // Stripe
    (async () => {
      const configured = Boolean(process.env.STRIPE_SECRET_KEY);
      if (!configured) {
        return {
          name: 'Stripe',
          status: 'down' as HealthStatus,
          latencyMs: null,
          detail: 'STRIPE_SECRET_KEY not set',
        };
      }
      const { latencyMs, error } = await timeCheck(async () => {
        const res = await fetch('https://api.stripe.com/v1/balance', {
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      });
      if (error) {
        return {
          name: 'Stripe',
          status: 'degraded' as HealthStatus,
          latencyMs,
          detail: error instanceof Error ? error.message : 'API check failed',
        };
      }
      return {
        name: 'Stripe',
        status: 'healthy' as HealthStatus,
        latencyMs,
        detail: 'API key valid',
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

    // Resend (inbound key check only)
    (async () => {
      const configured = Boolean(process.env.RESEND_API_KEY);
      return {
        name: 'Resend (inbound)',
        status: (configured ? 'healthy' : 'degraded') as HealthStatus,
        latencyMs: null,
        detail: configured ? 'RESEND_API_KEY present' : 'RESEND_API_KEY not set — inbound email disabled',
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
