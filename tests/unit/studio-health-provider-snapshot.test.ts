// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ active: vi.fn(), hydrate: vi.fn(), secrets: vi.fn(), owned: vi.fn() }));
vi.mock('@/lib/ai/ai-service', () => ({ getActiveProviderName: mocks.active }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: mocks.hydrate, getSecrets: mocks.secrets, getSelectedRuntimeSecrets: vi.fn() }));
vi.mock('@/lib/ai/providers/owned-model-health.mjs', () => ({ probeOwnedModel: mocks.owned }));
import { resolveAIRuntimeState } from '@/lib/ai/provider-runtime';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.owned.mockResolvedValue({ configured: true, verified: true, status: 'reachable' });
  mocks.active.mockReturnValue('elevate');
  mocks.hydrate.mockResolvedValue(undefined);
  mocks.secrets.mockResolvedValue({});
});
afterEach(() => vi.unstubAllEnvs());

it('uses a scoped snapshot without hydrating env or selecting an inference provider', async () => {
  vi.stubEnv('ELEVATE_LLM_CPU_URL', 'https://stale.example.test');
  vi.stubEnv('AI_PROVIDER', 'elevate');
  const result = await resolveAIRuntimeState({ secrets: {
    AI_PROVIDER: 'groq', GROQ_API_KEY: 'private-groq-fixture',
    ELEVATE_LLM_CPU_URL: 'https://canonical.example.test', ELEVATE_LLM_CPU_SECRET: 'private-owned-fixture',
  } });
  expect(result).toMatchObject({ activeProvider: 'not_tested', configuredProvider: 'groq', anyConfigured: true, elevate: true });
  expect(mocks.active).not.toHaveBeenCalled();
  expect(mocks.hydrate).not.toHaveBeenCalled();
  expect(mocks.secrets).not.toHaveBeenCalled();
  expect(mocks.owned).toHaveBeenCalledWith(expect.objectContaining({ env: expect.objectContaining({ ELEVATE_LLM_CPU_URL: 'https://canonical.example.test' }) }));
  expect(process.env.ELEVATE_LLM_CPU_URL).toBe('https://stale.example.test');
  expect(process.env.AI_PROVIDER).toBe('elevate');
  expect(JSON.stringify(result)).not.toContain('private-');
});

it('does not echo an invalid provider setting into diagnostic metadata', async () => {
  expect(await resolveAIRuntimeState({ secrets: { AI_PROVIDER: 'private-invalid-provider-value' } })).toMatchObject({ configuredProvider: 'invalid', activeProvider: 'not_tested' });
});

it('retains existing hydrated provider resolution for ordinary runtime callers', async () => {
  expect(await resolveAIRuntimeState()).toMatchObject({ activeProvider: 'elevate', configuredProvider: 'elevate' });
  expect(mocks.hydrate).toHaveBeenCalledOnce();
  expect(mocks.active).toHaveBeenCalledOnce();
});
