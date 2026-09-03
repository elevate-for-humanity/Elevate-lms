import { afterEach, describe, expect, it, vi } from 'vitest';

describe('canonical AI provider authority', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('fails on the configured provider without calling a configured fallback', async () => {
    vi.stubEnv('AI_PROVIDER', 'elevate');
    vi.stubEnv('AI_PROVIDER_ORDER', 'elevate,cloudflare');
    vi.stubEnv('ELEVATE_LLM_URL', 'https://configured-provider.test');
    vi.stubEnv('ELEVATE_LLM_SECRET', 'test-secret');
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'fallback-account');
    vi.stubEnv('CLOUDFLARE_API_TOKEN', 'fallback-token');
    const request = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'provider unavailable' } }), {
        status: 503,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', request);

    const { aiChat } = await import('@/lib/ai/ai-service');
    await expect(aiChat({ messages: [{ role: 'user', content: 'test' }] }))
      .rejects.toThrow('Configured AI provider "elevate" failed');

    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls.every(([url]) => String(url).startsWith('https://configured-provider.test/'))).toBe(true);
  });

  it('rejects a caller attempting to override the configured provider', async () => {
    vi.stubEnv('AI_PROVIDER', 'elevate');
    vi.stubEnv('ELEVATE_LLM_URL', 'https://configured-provider.test');
    vi.stubEnv('ELEVATE_LLM_SECRET', 'test-secret');
    const { aiChat } = await import('@/lib/ai/ai-service');

    await expect(aiChat({
      provider: 'openai',
      messages: [{ role: 'user', content: 'test' }],
    })).rejects.toThrow('Provider override "openai" is not allowed');
  });
});
