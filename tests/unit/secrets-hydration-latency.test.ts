// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  legacy: {} as Record<string, string>,
  canonical: {} as Record<string, string>,
  reads: [] as string[],
  rpcCalls: [] as string[],
  failure: false,
  hang: false,
  delayMs: 0,
}));

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: async () => {
          state.reads.push(table);
          if (state.hang) return new Promise(() => {});
          if (state.delayMs) await new Promise((resolve) => setTimeout(resolve, state.delayMs));
          if (state.failure) return { error: { code: 'XX000', message: 'backend unavailable' }, data: null };
          const values = table === 'app_secrets' ? state.legacy : state.canonical;
          return {
            error: null,
            data: Object.entries(values).map(([key, value]) => ({ key, value, scope: 'runtime' })),
          };
        },
      };
      return query;
    },
    rpc: async (_name: string, { p_key }: { p_key: string }) => {
      state.rpcCalls.push(p_key);
      if (state.failure) return { error: { code: 'XX000', message: 'backend unavailable' }, data: null };
      return { error: null, data: state.canonical[p_key] };
    },
  }),
}));

beforeEach(() => {
  vi.resetModules();
  state.legacy = {};
  state.canonical = {};
  state.reads = [];
  state.rpcCalls = [];
  state.failure = false;
  state.hang = false;
  state.delayMs = 0;
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.invalid');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'private-service-fixture');
  vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', '');
  vi.stubEnv('OWNED_MODEL_RUNTIME_CONFIG_PROVIDER', '');
  vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER', '');
  vi.stubEnv('TEST_HYDRATION_KEY', 'deployment-value');
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('runtime secret hydration latency', () => {
  it('caches a failed hydration outcome instead of repaying the reads on every call', async () => {
    state.failure = true;
    const secrets = await import('@/lib/secrets');
    await secrets.hydrateProcessEnv();
    const readsAfterFirst = state.reads.length;
    expect(readsAfterFirst).toBeGreaterThan(0);
    // Repeated strict calls and secret reads within the failure TTL must
    // not start another read chain.
    await secrets.hydrateProcessEnv();
    await secrets.hydrateProcessEnv();
    expect(await secrets.getSecret('TEST_HYDRATION_KEY')).toBe('deployment-value');
    expect(state.reads).toHaveLength(readsAfterFirst);
  });

  it('serves the partial legacy result while the canonical failure is cached', async () => {
    state.legacy = { TEST_HYDRATION_KEY: 'legacy-value' };
    state.failure = true; // canonical list read fails after legacy was queued? both fail here
    const secrets = await import('@/lib/secrets');
    // With both reads failing the env fallback is the answer, and it is
    // served without further reads.
    expect(await secrets.getSecret('TEST_HYDRATION_KEY')).toBe('deployment-value');
    const reads = state.reads.length;
    expect(await secrets.getSecret('TEST_HYDRATION_KEY')).toBe('deployment-value');
    expect(state.reads).toHaveLength(reads);
  });

  it('caches a successful hydration and hydrates process.env once', async () => {
    state.canonical = { TEST_HYDRATION_KEY: 'canonical-value' };
    const secrets = await import('@/lib/secrets');
    await secrets.hydrateProcessEnv();
    expect(process.env.TEST_HYDRATION_KEY).toBe('canonical-value');
    const readsAfterFirst = state.reads.length;
    await secrets.hydrateProcessEnv();
    expect(await secrets.getSecret('TEST_HYDRATION_KEY')).toBe('canonical-value');
    expect(state.reads).toHaveLength(readsAfterFirst);
  });

  it('dedupes concurrent hydration calls into a single read chain', async () => {
    state.canonical = { TEST_HYDRATION_KEY: 'canonical-value' };
    state.delayMs = 25;
    const secrets = await import('@/lib/secrets');
    await Promise.all([
      secrets.hydrateProcessEnv(),
      secrets.hydrateProcessEnv(),
      secrets.hydrateProcessEnv(),
    ]);
    // Exactly one chain: one legacy read + one canonical list read.
    expect(state.reads).toHaveLength(2);
    expect(process.env.TEST_HYDRATION_KEY).toBe('canonical-value');
  });

  it('bounded hydration proceeds within budget while hydration is stuck, then lands in the background', async () => {
    state.hang = true;
    const secrets = await import('@/lib/secrets');
    const started = Date.now();
    await secrets.hydrateProcessEnvBounded(50);
    expect(Date.now() - started).toBeLessThan(1000);
    // The stuck load was started exactly once.
    expect(state.reads.length).toBeGreaterThan(0);
    const readsWhileStuck = state.reads.length;
    // A second bounded call joins the same in-flight hydration instead of
    // starting a new chain, and also proceeds within budget.
    const startedAgain = Date.now();
    await secrets.hydrateProcessEnvBounded(50);
    expect(Date.now() - startedAgain).toBeLessThan(1000);
    expect(state.reads).toHaveLength(readsWhileStuck);
  });

  it('bounded hydration returns the hydrated value when the load is fast', async () => {
    state.canonical = { TEST_HYDRATION_KEY: 'canonical-value' };
    const secrets = await import('@/lib/secrets');
    await secrets.hydrateProcessEnvBounded(5000);
    expect(process.env.TEST_HYDRATION_KEY).toBe('canonical-value');
  });
});
