/**
 * lib/platform/platform-health.ts
 *
 * Centralized platform health aggregation layer.
 *
 * Single entry point for all health checks. Callers (Mission Control,
 * admin dashboard, alerting) call getPlatformHealth() instead of
 * hitting 6 separate monitoring endpoints.
 *
 * Checks run in parallel with individual timeouts so one slow check
 * cannot block the others.
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

function checkStripe(): ServiceCheck {
  const key = process.env.STRIPE_SECRET_KEY;
  const configured = Boolean(key && key.startsWith('sk_'));
  return {
    name: 'Stripe',
    status: configured ? 'healthy' : 'unknown',
    configured,
    message: configured ? undefined : 'STRIPE_SECRET_KEY not set',
  };
}

function checkEmail(): ServiceCheck {
  const key = process.env.SENDGRID_API_KEY;
  const configured = Boolean(key && key.startsWith('SG.'));
  return {
    name: 'Email (SendGrid)',
    status: configured ? 'healthy' : 'unknown',
    configured,
    message: configured ? undefined : 'SENDGRID_API_KEY not set',
  };
}

function checkStorage(): ServiceCheck {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const configured = Boolean(url);
  return {
    name: 'Storage (Supabase)',
    status: configured ? 'healthy' : 'unknown',
    configured,
  };
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

  if (!services.stripe.configured) {
    alerts.push({ severity: 'warning', service: 'Stripe', message: 'Payments not configured' });
  }

  if (!services.email.configured) {
    alerts.push({ severity: 'warning', service: 'Email', message: 'Email delivery not configured' });
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

export async function getPlatformHealth(): Promise<PlatformHealthSnapshot> {
  const start = Date.now();

  try {
    const [database, redis] = await Promise.all([
      withTimeout(checkDatabase(), TIMEOUT_MS, DOWN_DB),
      withTimeout(checkRedis(), TIMEOUT_MS, DOWN_REDIS),
    ]);

    const stripe = checkStripe();
    const email = checkEmail();
    const storage = checkStorage();
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
        stripe: { name: 'Stripe', status: 'unknown', configured: false },
        email: { name: 'Email', status: 'unknown', configured: false },
        storage: { name: 'Storage', status: 'unknown', configured: false },
      },
      ai: { activeProvider: null, providers: [], anyConfigured: false },
      alerts: [{ severity: 'critical', service: 'Platform', message: 'Health check failed entirely' }],
    };
  }
}

export function getPlatformHealthSync(): Pick<PlatformHealthSnapshot, 'ai' | 'services'> {
  const stripe = checkStripe();
  const email = checkEmail();
  const storage = checkStorage();
  const ai = checkAIProviders();

  return {
    services: {
      database: { name: 'Database', status: 'unknown', configured: true },
      redis: {
        name: 'Redis',
        status: 'unknown',
        configured: Boolean(process.env.REDIS_URL),
        message: process.env.REDIS_URL ? undefined : 'REDIS_URL not configured',
      },
      stripe,
      email,
      storage,
    },
    ai,
  };
}
