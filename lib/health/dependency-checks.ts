type ProbeResult = {
  configured: boolean;
  healthy: boolean;
  latencyMs?: number;
};

export type DependencyHealth = {
  supabase: boolean;
  redis: boolean;
  sendgrid: boolean;
  configured: {
    supabase: boolean;
    redis: boolean;
    sendgrid: boolean;
  };
  latencyMs: Partial<Record<'supabase' | 'redis' | 'sendgrid', number>>;
};

const PROBE_TIMEOUT_MS = 5_000;

async function timedProbe(configured: boolean, probe: () => Promise<boolean>): Promise<ProbeResult> {
  if (!configured) return { configured: false, healthy: false };
  const started = Date.now();
  try {
    return {
      configured: true,
      healthy: await probe(),
      latencyMs: Date.now() - started,
    };
  } catch {
    return { configured: true, healthy: false, latencyMs: Date.now() - started };
  }
}

async function probeSupabase(): Promise<ProbeResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();
  return timedProbe(Boolean(url && key), async () => {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key || '' },
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return response.ok;
  });
}

async function probeRedis(): Promise<ProbeResult> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const redisUrl = process.env.REDIS_URL?.trim();

  if (restUrl && restToken) {
    return timedProbe(true, async () => {
      const response = await fetch(`${restUrl.replace(/\/$/, '')}/ping`, {
        headers: { Authorization: `Bearer ${restToken}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      });
      return response.ok;
    });
  }

  return timedProbe(Boolean(redisUrl), async () => {
    const module = await import('ioredis');
    const RedisCtor = module.default ?? module.Redis;
    if (typeof RedisCtor !== 'function') return false;
    const redis = new RedisCtor(redisUrl!, {
      maxRetriesPerRequest: 1,
      connectTimeout: PROBE_TIMEOUT_MS,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    try {
      await redis.connect();
      return (await redis.ping()) === 'PONG';
    } finally {
      redis.disconnect();
    }
  });
}

async function probeSendGrid(): Promise<ProbeResult> {
  const key = process.env.SENDGRID_API_KEY?.trim();
  return timedProbe(Boolean(key?.startsWith('SG.')), async () => {
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return response.ok;
  });
}

export async function checkDependencies(): Promise<DependencyHealth> {
  await hydrateProcessEnv().catch(() => undefined);

  const [supabase, redis, sendgrid] = await Promise.all([
    probeSupabase(),
    probeRedis(),
    probeSendGrid(),
  ]);

  return {
    supabase: supabase.healthy,
    redis: redis.healthy,
    sendgrid: sendgrid.healthy,
    configured: {
      supabase: supabase.configured,
      redis: redis.configured,
      sendgrid: sendgrid.configured,
    },
    latencyMs: {
      ...(supabase.latencyMs === undefined ? {} : { supabase: supabase.latencyMs }),
      ...(redis.latencyMs === undefined ? {} : { redis: redis.latencyMs }),
      ...(sendgrid.latencyMs === undefined ? {} : { sendgrid: sendgrid.latencyMs }),
    },
  };
}
import { hydrateProcessEnv } from '@/lib/secrets';
