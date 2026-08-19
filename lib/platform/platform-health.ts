/**
 * lib/platform/platform-health.ts
 *
 * Centralized platform health aggregation layer.
 *
 * Single entry point for all health checks. Callers (Mission Control,
 * admin dashboard, alerting) call getPlatformHealth() instead of
 * hitting separate monitoring endpoints.
 *
 * Checks run in parallel with individual timeouts so one slow dependency
 * cannot block the rest of the health snapshot.
 */

import { logger } from '@/lib/logger';

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export type ServiceCheck = {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  configured: boolean;
};

export type AIProviderCheck = {
  name: string;
  configured: boolean;
  active: boolean;
};

export type PlatformHealthSnapshot = {
  overall: HealthStatus;
  timestamp: string;
  responseTimeMs: number;
  services: {
    database: ServiceCheck;
    redis: ServiceCheck;
    stripe: ServiceCheck;
    email: ServiceCheck;
    storage: ServiceCheck;
  };
  ai: {
    activeProvider: string | null;
    providers: AIProviderCheck[];
    anyConfigured: boolean;
  };
  alerts: PlatformAlert[];
};

export type PlatformAlert = {
  severity: 'critical' | 'warning' | 'info';
  service: string;
  message: string;
};

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const db = createAdminClient();
    const { error } = await db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const latencyMs = Date.now() - start;
    if (error) throw error;

    return {
      name: 'Database',
      status: latencyMs > 3000 ? 'degraded' : 'healthy',
      latencyMs,
      configured: true,
    };
  } catch (err) {
    return {
      name: 'Database',
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Connection failed',
      configured: true,
    };
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  const url = process.env.REDIS_URL?.trim();

  if (!url) {
    return {
      name: 'Redis',
      status: 'unknown',
      configured: false,
      message: 'REDIS_URL not configured',
    };
  }

  const start = Date.now();
  let redis: import('ioredis').Redis | null = null;
  try {
    const { Redis } = await import('ioredis');
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5_000,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    await redis.connect();
    const pong = await redis.ping();
    if (pong !== 'PONG') throw new Error(`Unexpected Redis ping response: ${String(pong)}`);

    return {
      name: 'Redis',
      status: 'healthy',
      latencyMs: Date.now() - start,
      configured: true,
    };
  } catch (err) {
    return {
      name: 'Redis',
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Ping failed',
      configured: true,
    };
  } finally {
    if (redis) {
      try {
        redis.disconnect();
      } catch {
        // Health checks must not fail while cleaning up a probe connection.
      }
    }
  }
}

async function checkStripe(): Promise<ServiceCheck> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const configured = Boolean(key && key.startsWith('sk_'));
  if (!configured) {
    return {
      name: 'Stripe',
      status: 'unknown',
      configured: false,
      message: 'STRIPE_SECRET_KEY not set',
    };
  }

  const start = Date.now();
  try {
    const { getStripeServer } = await import('@/lib/stripe/get-stripe-server');
    const stripe = await getStripeServer();
    await stripe.balance.retrieve();
    const latencyMs = Date.now() - start;
    return {
      name: 'Stripe',
      status: latencyMs > 3000 ? 'degraded' : 'healthy',
      latencyMs,
      configured: true,
    };
  } catch (err) {
    return {
      name: 'Stripe',
      status: 'down',
      latencyMs: Date.now() - start,
      configured: true,
      message: err instanceof Error ? err.message : 'Stripe API probe failed',
    };
  }
}

async function checkEmail(): Promise<ServiceCheck> {
  const key = process.env.SENDGRID_API_KEY?.trim();
  const configured = Boolean(key && key.startsWith('SG.'));
  if (!configured) {
    return {
      name: 'Email (SendGrid)',
      status: 'unknown',
      configured: false,
      message: 'SENDGRID_API_KEY not set',
    };
  }

  const start = Date.now();
  try {
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`SendGrid API returned HTTP ${response.status}`);
    }
    const latencyMs = Date.now() - start;
    return {
      name: 'Email (SendGrid)',
      status: latencyMs > 3000 ? 'degraded' : 'healthy',
      latencyMs,
      configured: true,
    };
  } catch (err) {
    return {
      name: 'Email (SendGrid)',
      status: 'down',
      latencyMs: Date.now() - start,
      configured: true,
      message: err instanceof Error ? err.message : 'SendGrid API probe failed',
    };
  }
}

async function checkStorage(): Promise<ServiceCheck> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const configured = Boolean(url && serviceKey);
  if (!configured) {
    return {
      name: 'Storage (Supabase)',
      status: 'unknown',
      configured: false,
      message: 'Supabase URL or service-role key not configured',
    };
  }

  const start = Date.now();
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const db = createAdminClient();
    const { error } = await db.storage.listBuckets();
    if (error) throw error;
    const latencyMs = Date.now() - start;
    return {
      name: 'Storage (Supabase)',
      status: latencyMs > 3000 ? 'degraded' : 'healthy',
      latencyMs,
      configured: true,
    };
  } catch (err) {
    return {
      name: 'Storage (Supabase)',
      status: 'down',
      latencyMs: Date.now() - start,
      configured: true,
      message: err instanceof Error ? err.message : 'Storage API probe failed',
    };
  }
}

function checkAIProviders(): PlatformHealthSnapshot['ai'] {
  const providers: AIProviderCheck[] = [
    { name: 'openai', configured: Boolean(process.env.OPENAI_API_KEY), active: false },
    { name: 'groq', configured: Boolean(process.env.GROQ_API_KEY), active: false },
    { name: 'gemini', configured: Boolean(process.env.GEMINI_API_KEY), active: false },
    { name: 'anthropic', configured: Boolean(process.env.ANTHROPIC_API_KEY), active: false },
  ];

  const active = providers.find(p => p.configured);
  if (active) active.active = true;

  return {
    activeProvider: active?.name ?? null,
    providers,
    anyConfigured: providers.some(p => p.configured),
  };
}

function generateAlerts(
  services: PlatformHealthSnapshot['services'],
  ai: PlatformHealthSnapshot['ai'],
): PlatformAlert[] {
  const alerts: PlatformAlert[] = [];

  if (services.database.status === 'down') {
    alerts.push({ severity: 'critical', service: 'Database', message: services.database.message ?? 'Database is unreachable' });
  } else if (services.database.status === 'degraded') {
    alerts.push({ severity: 'warning', service: 'Database', message: `High latency: ${services.database.latencyMs}ms` });
  }

  if (services.redis.status === 'down') {
    alerts.push({ severity: 'warning', service: 'Redis', message: services.redis.message ?? 'Rate limiting unavailable — Redis is down' });
  } else if (!services.redis.configured) {
    alerts.push({ severity: 'warning', service: 'Redis', message: 'Rate limiting unavailable — REDIS_URL is not configured' });
  }

  for (const service of [services.stripe, services.email, services.storage]) {
    if (!service.configured) {
      alerts.push({
        severity: 'warning',
        service: service.name,
        message: service.message ?? `${service.name} is not configured`,
      });
    } else if (service.status === 'down') {
      alerts.push({
        severity: 'warning',
        service: service.name,
        message: service.message ?? `${service.name} is unreachable`,
      });
    } else if (service.status === 'degraded') {
      alerts.push({
        severity: 'warning',
        service: service.name,
        message: `High latency: ${service.latencyMs}ms`,
      });
    }
  }

  if (!ai.anyConfigured) {
    alerts.push({ severity: 'critical', service: 'AI', message: 'No AI provider configured — all AI features offline' });
  }

  return alerts;
}

function determineOverall(
  services: PlatformHealthSnapshot['services'],
  alerts: PlatformAlert[],
): HealthStatus {
  if (services.database.status === 'down') return 'down';
  if (alerts.some(a => a.severity === 'critical')) return 'degraded';
  if (alerts.some(a => a.severity === 'warning')) return 'degraded';
  return 'healthy';
}

const TIMEOUT_MS = 5000;

const DOWN_DB: ServiceCheck = { name: 'Database', status: 'down', configured: true, message: 'Timed out' };
const DOWN_REDIS: ServiceCheck = { name: 'Redis', status: 'down', configured: true, message: 'Timed out' };
const DOWN_STRIPE: ServiceCheck = { name: 'Stripe', status: 'down', configured: true, message: 'Timed out' };
const DOWN_EMAIL: ServiceCheck = { name: 'Email (SendGrid)', status: 'down', configured: true, message: 'Timed out' };
const DOWN_STORAGE: ServiceCheck = { name: 'Storage (Supabase)', status: 'down', configured: true, message: 'Timed out' };

export async function getPlatformHealth(): Promise<PlatformHealthSnapshot> {
  const start = Date.now();

  try {
    const [database, redis, stripe, email, storage] = await Promise.all([
      withTimeout(checkDatabase(), TIMEOUT_MS, DOWN_DB),
      withTimeout(checkRedis(), TIMEOUT_MS, DOWN_REDIS),
      withTimeout(checkStripe(), TIMEOUT_MS, DOWN_STRIPE),
      withTimeout(checkEmail(), TIMEOUT_MS, DOWN_EMAIL),
      withTimeout(checkStorage(), TIMEOUT_MS, DOWN_STORAGE),
    ]);

    const ai = checkAIProviders();
    const services = { database, redis, stripe, email, storage };
    const alerts = generateAlerts(services, ai);
    const overall = determineOverall(services, alerts);

    return {
      overall,
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      services,
      ai,
      alerts,
    };
  } catch (err) {
    logger.error('[platform-health] Health check failed', err);
    return {
      overall: 'down',
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      services: {
        database: DOWN_DB,
        redis: DOWN_REDIS,
        stripe: DOWN_STRIPE,
        email: DOWN_EMAIL,
        storage: DOWN_STORAGE,
      },
      ai: { activeProvider: null, providers: [], anyConfigured: false },
      alerts: [{ severity: 'critical', service: 'Platform', message: 'Health check failed entirely' }],
    };
  }
}

/**
 * Configuration-only snapshot for server components that explicitly cannot
 * perform network probes. This must never be presented as operational health.
 */
export function getPlatformHealthSync(): Pick<PlatformHealthSnapshot, 'ai' | 'services'> {
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.startsWith('sk_'));
  const emailConfigured = Boolean(process.env.SENDGRID_API_KEY?.startsWith('SG.'));
  const storageConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const ai = checkAIProviders();

  return {
    services: {
      database: { name: 'Database', status: 'unknown', configured: true, message: 'Not probed' },
      redis: {
        name: 'Redis',
        status: 'unknown',
        configured: Boolean(process.env.REDIS_URL),
        message: process.env.REDIS_URL ? 'Not probed' : 'REDIS_URL not configured',
      },
      stripe: {
        name: 'Stripe',
        status: 'unknown',
        configured: stripeConfigured,
        message: stripeConfigured ? 'Not probed' : 'STRIPE_SECRET_KEY not set',
      },
      email: {
        name: 'Email (SendGrid)',
        status: 'unknown',
        configured: emailConfigured,
        message: emailConfigured ? 'Not probed' : 'SENDGRID_API_KEY not set',
      },
      storage: {
        name: 'Storage (Supabase)',
        status: 'unknown',
        configured: storageConfigured,
        message: storageConfigured ? 'Not probed' : 'Supabase URL or service-role key not configured',
      },
    },
    ai,
  };
}
