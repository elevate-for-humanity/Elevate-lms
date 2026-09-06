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
    await expect(aiChat({ messages: [{ role: 'user', content: 'test' }] })).rejects.toThrow(
      'Configured AI provider "elevate" failed',
    );

    expect(request).toHaveBeenCalledTimes(2);
    expect(
      request.mock.calls.every(([url]) =>
        String(url).startsWith('https://configured-provider.test/'),
      ),
    ).toBe(true);
  });

  it('rejects a caller attempting to override the configured provider', async () => {
    vi.stubEnv('AI_PROVIDER', 'elevate');
    vi.stubEnv('ELEVATE_LLM_URL', 'https://configured-provider.test');
    vi.stubEnv('ELEVATE_LLM_SECRET', 'test-secret');
    const { aiChat } = await import('@/lib/ai/ai-service');

    await expect(
      aiChat({
        provider: 'openai',
        messages: [{ role: 'user', content: 'test' }],
      }),
    ).rejects.toThrow('Provider override "openai" is not allowed');
  });

  it('routes owned-only work to Elevate even when the canonical provider is commercial', async () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'commercial-key-must-not-be-used');
    vi.stubEnv('ELEVATE_LLM_URL', 'https://owned-provider.test');
    vi.stubEnv('ELEVATE_LLM_SECRET', 'owned-secret');
    const request = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: 'elevate-local',
          choices: [{ message: { content: 'owned response' } }],
          usage: { prompt_tokens: 2, completion_tokens: 2, total_tokens: 4 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', request);
    const { aiChat } = await import('@/lib/ai/ai-service');

    const result = await aiChat({
      providerPolicy: 'owned-only',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result.provider).toBe('elevate');
    expect(request).toHaveBeenCalledTimes(1);
    expect(String(request.mock.calls[0]?.[0])).toMatch(/^https:\/\/owned-provider\.test\//);
  });

  it('fails closed when owned-only inference is not configured', async () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'commercial-key-must-not-be-used');
    vi.stubEnv('ELEVATE_LLM_URL', '');
    vi.stubEnv('ELEVATE_LLM_SECRET', '');
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    const { aiChat } = await import('@/lib/ai/ai-service');

    await expect(
      aiChat({
        providerPolicy: 'owned-only',
        messages: [{ role: 'user', content: 'test' }],
      }),
    ).rejects.toThrow('Elevate-owned AI is unavailable');
    expect(request).not.toHaveBeenCalled();
  });
});
