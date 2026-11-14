import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ clientCalls: 0 }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => {
    state.clientCalls++;
    const canonical: Record<string, string> = {
      AI_PROVIDER: 'xai',
      ELEVATE_LLM_CPU_URL: 'https://legacy.example.test',
      PBX_JWT_SECRET: 'database-pbx-token',
      OWNED_MODEL_RUNTIME_CONFIG_PROVIDER: 'database',
    };
    return {
      from: (table: string) => ({
        select: () => ({
          eq: async () => ({
            error: null,
            data: table === 'app_secrets'
              ? [{ key: 'SMTP_HOST', value: 'legacy-mail.example.test' }]
              : Object.keys(canonical).map(key => ({ key, scope: 'runtime' })),
          }),
        }),
      }),
      rpc: async (_name: string, { p_key }: { p_key: string }) => ({
        error: null, data: canonical[p_key],
      }),
    };
  },
}));

beforeEach(() => {
  vi.resetModules();
  state.clientCalls = 0;
  for (const [key, value] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL: 'https://database.example.test',
    SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-role',
    ELEVATE_RUNTIME_CONFIG_PROVIDER: '',
    OWNED_MODEL_RUNTIME_CONFIG_PROVIDER: '',
    PBX_RUNTIME_CONFIG_PROVIDER: '',
    AI_PROVIDER: 'elevate',
    ELEVATE_LLM_CPU_URL: 'https://owned.example.test',
    SMTP_HOST: 'bound-mail.example.test',
    PBX_JWT_SECRET: 'bound-pbx-token',
  })) vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());

describe('runtime secret authority', () => {
  it('preserves legacy runtime precedence when owned-model authority is unset', async () => {
    const secrets = await import('../../lib/secrets');
    await secrets.hydrateProcessEnv();
    expect(process.env.AI_PROVIDER).toBe('xai');
    expect(process.env.ELEVATE_LLM_CPU_URL).toBe('https://legacy.example.test');
    expect(process.env.SMTP_HOST).toBe('legacy-mail.example.test');
  });

  it('keeps owned-model bindings authoritative across every secret access path', async () => {
    vi.stubEnv('OWNED_MODEL_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager');
    const secrets = await import('../../lib/secrets');
    await secrets.hydrateProcessEnv();
    expect(process.env.AI_PROVIDER).toBe('elevate');
    expect(process.env.ELEVATE_LLM_CPU_URL).toBe('https://owned.example.test');
    expect(process.env.OWNED_MODEL_RUNTIME_CONFIG_PROVIDER).toBe('google-secret-manager');
    expect(await secrets.getSecret('AI_PROVIDER')).toBe('elevate');
    expect(await secrets.getSecrets(['AI_PROVIDER', 'SMTP_HOST'])).toEqual({
      AI_PROVIDER: 'elevate', SMTP_HOST: 'legacy-mail.example.test',
    });
    expect(secrets.getCachedSecret('AI_PROVIDER')).toBe('elevate');
    expect(await secrets.getDecryptedPlatformSecret('AI_PROVIDER')).toBe('elevate');
    expect(process.env.SMTP_HOST).toBe('legacy-mail.example.test');
    expect(process.env.PBX_JWT_SECRET).toBe('database-pbx-token');
  });

  it('retains complete Google-runtime authority without reading the legacy stores', async () => {
    vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager');
    const secrets = await import('../../lib/secrets');
    await secrets.hydrateProcessEnv();
    expect(await secrets.getSecret('AI_PROVIDER')).toBe('elevate');
    expect(process.env.SMTP_HOST).toBe('bound-mail.example.test');
    expect(state.clientCalls).toBe(0);
  });

  it('retains the existing independent PBX authority', async () => {
    vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager');
    const secrets = await import('../../lib/secrets');
    await secrets.hydrateProcessEnv();
    expect(process.env.PBX_JWT_SECRET).toBe('bound-pbx-token');
    expect(process.env.AI_PROVIDER).toBe('xai');
    expect(process.env.SMTP_HOST).toBe('legacy-mail.example.test');
  });
});
