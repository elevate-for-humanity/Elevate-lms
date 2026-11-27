import { afterEach, describe, expect, it, vi } from 'vitest';

describe('canonical AI provider authority', () => {
  it('blocks external streaming outside the paid inference authorization boundary', async () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'external-key');
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    const { aiChatStream } = await import('@/lib/ai/ai-service');
    await expect(aiChatStream({ messages: [{ role: 'user', content: 'Hello' }] }).next())
      .rejects.toThrow('PAID_INFERENCE_AUTHORIZATION_REQUIRED');
    expect(request).not.toHaveBeenCalled();
  });

  it('honors owned-only streaming even when the canonical provider is commercial', async () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'must-not-be-used');
    vi.stubEnv('ELEVATE_LLM_URL', 'https://owned-provider.test');
    vi.stubEnv('ELEVATE_LLM_SECRET', 'owned-secret');
    const request = vi.fn().mockResolvedValue(new Response(
      'data: {"choices":[{"delta":{"content":"Owned response"}}]}\n\ndata: [DONE]\n\n',
      { headers: { 'content-type': 'text/event-stream' } },
    ));
    vi.stubGlobal('fetch', request);
    const { aiChatStream } = await import('@/lib/ai/ai-service');
    const chunks: string[] = [];
    for await (const chunk of aiChatStream({ providerPolicy: 'owned-only', messages: [{ role: 'user', content: 'Hello' }] })) chunks.push(chunk);
    expect(chunks).toEqual(['Owned response']);
    expect(request.mock.calls[0][0]).toBe('https://owned-provider.test/v1/chat/completions');
  });
  it('allows canonical Elevate inference without a paid authorization context', async () => {
    vi.stubEnv('AI_PROVIDER', 'elevate');
    vi.stubEnv('ELEVATE_LLM_URL', 'https://owned-provider.test');
    vi.stubEnv('ELEVATE_LLM_SECRET', 'owned-secret');
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: 'elevate-local', choices: [{ message: { content: 'owned response' } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', request);
    const { aiChat } = await import('@/lib/ai/ai-service');
    const result = await aiChat({ messages: [{ role: 'user', content: 'test' }] });
    expect(result.provider).toBe('elevate');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('blocks canonical external inference without paid authorization', async () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'external-key');
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    const { aiChat } = await import('@/lib/ai/ai-service');
    await expect(aiChat({ messages: [{ role: 'user', content: 'test' }] }))
      .rejects.toThrow('PAID_INFERENCE_AUTHORIZATION_REQUIRED');
    expect(request).not.toHaveBeenCalled();
  });

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
    const { runWithPaidInferenceContext } = await import('@/lib/ai/paid-inference-context');
    await expect(runWithPaidInferenceContext('test-provider-failure', () => aiChat({ messages: [{ role: 'user', content: 'test' }] }))).rejects.toThrow(
      'Configured AI provider "elevate" failed',
    );

    expect(request).toHaveBeenCalledTimes(2);
    expect(
      request.mock.calls.every(([url]) =>
        String(url).startsWith('https://configured-provider.test/'),
      ),
    ).toBe(true);
  });

  it('does not repeat a timed-out private model request or invoke an external fallback', async () => {
    vi.stubEnv('AI_PROVIDER', 'elevate');
    vi.stubEnv('AI_PROVIDER_ORDER', 'elevate,cloudflare');
    vi.stubEnv('ELEVATE_LLM_URL', 'https://configured-provider.test');
    vi.stubEnv('ELEVATE_LLM_SECRET', 'test-secret');
    const request = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'request exceeded deadline' } }), {
        status: 504,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', request);
    const { aiChat } = await import('@/lib/ai/ai-service');
    await expect(aiChat({ messages: [{ role: 'user', content: 'test' }] }))
      .rejects.toThrow('Elevate LLM worker HTTP 504');
    expect(request).toHaveBeenCalledTimes(1);
    expect(String(request.mock.calls[0]?.[0])).toContain('configured-provider.test');
  });

  it('clamps numeric owned CPU inference timeouts for chat and streaming', async () => {
    vi.stubEnv('AI_PROVIDER', 'elevate');
    vi.stubEnv('AI_PROVIDER_ORDER', 'elevate');
    vi.stubEnv('ELEVATE_LLM_TIMEOUT_MS', '300000');
    vi.stubEnv('ELEVATE_LLM_URL', 'https://owned-provider.test');
    vi.stubEnv('ELEVATE_LLM_SECRET', 'owned-secret');
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        model: 'elevate-local', choices: [{ message: { content: 'owned response' } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(
        'data: {"choices":[{"delta":{"content":"owned stream"}}]}\n\ndata: [DONE]\n\n',
        { status: 200, headers: { 'content-type': 'text/event-stream' } },
      ));
    vi.stubGlobal('fetch', request);
    try {
      const { aiChat, aiChatStream } = await import('@/lib/ai/ai-service');
      await expect(aiChat({ messages: [{ role: 'user', content: 'test' }] }))
        .resolves.toMatchObject({ provider: 'elevate' });
      const chunks: string[] = [];
      for await (const chunk of aiChatStream({ messages: [{ role: 'user', content: 'test' }] })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(['owned stream']);
      expect(timeoutSpy.mock.calls.filter(([ms]) => ms === 270_000)).toHaveLength(2);
      expect(request).toHaveBeenCalledTimes(2);
    } finally {
      timeoutSpy.mockRestore();
    }
  });

  it('serves a mismatched provider preference from the configured provider instead of failing', async () => {
    vi.stubEnv('AI_PROVIDER', 'elevate');
    vi.stubEnv('ELEVATE_LLM_URL', 'https://configured-provider.test');
    vi.stubEnv('ELEVATE_LLM_SECRET', 'test-secret');
    vi.stubEnv('OPENAI_API_KEY', 'external-key-must-not-be-used');
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: 'elevate-local', choices: [{ message: { content: 'owned response' } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', request);
    const { aiChat } = await import('@/lib/ai/ai-service');

    const result = await aiChat({
      provider: 'openai',
      messages: [{ role: 'user', content: 'test' }],
    });

    // The configured canonical provider serves the request; the receipt
    // names the provider that actually answered, and the preferred
    // external provider is never called.
    expect(result.provider).toBe('elevate');
    expect(result.content).toBe('owned response');
    expect(request).toHaveBeenCalledTimes(1);
    expect(String(request.mock.calls[0]?.[0])).toContain('configured-provider.test');
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
    const { runWithPaidInferenceContext } = await import('@/lib/ai/paid-inference-context');

    const result = await runWithPaidInferenceContext('test-owned-provider', () => aiChat({
      providerPolicy: 'owned-only',
      messages: [{ role: 'user', content: 'test' }],
    }));

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
    const { runWithPaidInferenceContext } = await import('@/lib/ai/paid-inference-context');

    await expect(
      runWithPaidInferenceContext('test-owned-unavailable', () => aiChat({
        providerPolicy: 'owned-only',
        messages: [{ role: 'user', content: 'test' }],
      })),
    ).rejects.toThrow('Elevate-owned AI is unavailable');
    expect(request).not.toHaveBeenCalled();
  });
});
