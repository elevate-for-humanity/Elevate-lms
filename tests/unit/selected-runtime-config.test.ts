// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  legacy: {} as Record<string, string>, canonical: {} as Record<string, string>,
  reads: [] as { table: string; keys?: string[] }[], failure: false, hang: false,
  fetch: null as null | ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@supabase/supabase-js', () => ({ createClient: (_url: string, _key: string, options: { global: { fetch: typeof fetch } }) => {
  state.fetch = options.global.fetch;
  function result(table: string, keys?: string[], signal?: AbortSignal) {
    state.reads.push({ table, keys });
    if (state.hang) return new Promise((_, reject) => {
      if (signal?.aborted) reject(signal.reason);
      else signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
    if (state.failure) return { error: { message: 'private backend failure' }, data: null };
    const values = table === 'app_secrets' ? state.legacy : state.canonical;
    return { error: null, data: Object.entries(values).filter(([key]) => !keys || keys.includes(key)).map(([key, value]) => ({ key, value, scope: 'runtime' })) };
  }
  return {
    from: (table: string) => {
      let keys: string[] | undefined, signal: AbortSignal | undefined;
      const query = {
        select: () => query, eq: () => query,
        in: (_column: string, selected: string[]) => { keys = selected; return query; },
        abortSignal: (value: AbortSignal) => { signal = value; return query; },
        then: (resolve: (v: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(result(table, keys, signal)).then(resolve, reject),
      };
      return query;
    },
    rpc: (_name: string, { p_key }: { p_key: string }) => {
      const query = {
        abortSignal: () => query,
        then: (resolve: (v: unknown) => unknown) => resolve({ error: null, data: state.canonical[p_key] }),
      };
      return query;
    },
  };
} }));

beforeEach(() => {
  vi.resetModules(); state.legacy = {}; state.canonical = {}; state.reads = []; state.failure = false; state.hang = false; state.fetch = null;
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.invalid');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'private-service-fixture');
  vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', '');
  vi.stubEnv('OWNED_MODEL_RUNTIME_CONFIG_PROVIDER', '');
  vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER', '');
  vi.stubEnv('TEST_HEALTH_KEY', 'deployment-value');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('scoped diagnostic secret reads', () => {
  it('preserves canonical precedence without hydrating env or poisoning the complete cache', async () => {
    state.legacy = { TEST_HEALTH_KEY: 'legacy-value', TEST_OTHER_KEY: 'legacy-other' };
    state.canonical = { TEST_HEALTH_KEY: 'canonical-value', TEST_OTHER_KEY: 'canonical-other' };
    const secrets = await import('@/lib/secrets');
    expect(await secrets.getSelectedRuntimeSecrets(['TEST_HEALTH_KEY'])).toEqual({ TEST_HEALTH_KEY: 'canonical-value' });
    expect(process.env.TEST_HEALTH_KEY).toBe('deployment-value');
    expect(state.reads).toEqual([{ table: 'app_secrets', keys: ['TEST_HEALTH_KEY'] }, { table: 'platform_secrets', keys: ['TEST_HEALTH_KEY'] }]);
    state.canonical.TEST_HEALTH_KEY = 'new-canonical-value';
    expect(await secrets.getSecrets(['TEST_OTHER_KEY'])).toEqual({ TEST_OTHER_KEY: 'canonical-other' });
    const reads = state.reads.length;
    expect(await secrets.getSelectedRuntimeSecrets(['TEST_HEALTH_KEY'])).toEqual({ TEST_HEALTH_KEY: 'new-canonical-value' });
    expect(state.reads).toHaveLength(reads);
    expect(process.env.TEST_HEALTH_KEY).toBe('deployment-value');
  });

  it('does not cache a failing scoped read as missing and recovers on the next request', async () => {
    const secrets = await import('@/lib/secrets');
    state.failure = true;
    await expect(secrets.getSelectedRuntimeSecrets(['TEST_HEALTH_KEY'])).rejects.toThrow('RUNTIME_SECRET_READ_UNAVAILABLE');
    state.failure = false; state.canonical.TEST_HEALTH_KEY = 'recovered-value';
    expect(await secrets.getSelectedRuntimeSecrets(['TEST_HEALTH_KEY'])).toEqual({ TEST_HEALTH_KEY: 'recovered-value' });
    expect(process.env.TEST_HEALTH_KEY).toBe('deployment-value');
  });

  it('cancels scoped reads without changing later or unrelated runtime consumers', async () => {
    const secrets = await import('@/lib/secrets');
    const controller = new AbortController();
    state.hang = true;
    const pending = secrets.getSelectedRuntimeSecrets(['TEST_HEALTH_KEY'], { signal: controller.signal });
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await Promise.resolve(); await Promise.resolve();
    controller.abort(); await rejected;
    state.hang = false; state.canonical.TEST_HEALTH_KEY = 'recovered-value';
    expect(await secrets.getSecrets(['TEST_HEALTH_KEY'])).toEqual({ TEST_HEALTH_KEY: 'recovered-value' });
    expect(process.env.TEST_HEALTH_KEY).toBe('deployment-value');
  });

  it('preserves scoped Google authority rather than reading retired database values', async () => {
    vi.stubEnv('OWNED_MODEL_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager');
    vi.stubEnv('ELEVATE_LLM_CPU_SECRET', 'bound-owned-value');
    state.canonical.ELEVATE_LLM_CPU_SECRET = 'stale-owned-value';
    const secrets = await import('@/lib/secrets');
    expect(await secrets.getSelectedRuntimeSecrets(['ELEVATE_LLM_CPU_SECRET'])).toEqual({ ELEVATE_LLM_CPU_SECRET: 'bound-owned-value' });
    expect(state.reads).toEqual([]);
  });

  it('composes caller cancellation with the bootstrap fetch timeout', async () => {
    const request = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.signal?.aborted).toBe(true);
      throw init?.signal?.reason;
    });
    vi.stubGlobal('fetch', request);
    const secrets = await import('@/lib/secrets');
    await secrets.getSelectedRuntimeSecrets(['TEST_HEALTH_KEY']);
    const controller = new AbortController(); controller.abort();
    await expect(state.fetch!('https://fixture.invalid/rest/v1/test', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(request).toHaveBeenCalledOnce();
  });
});
