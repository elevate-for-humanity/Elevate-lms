import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Cloudflare Workers AI provider', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('requires the canonical model configuration', async () => {
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'configured-account');
    vi.stubEnv('CLOUDFLARE_AI_API_TOKEN', 'configured-token-value');
    vi.stubEnv('CLOUDFLARE_AI_MODEL', '');
    const { CloudflareProvider } = await import('@/lib/ai/providers/cloudflare');

    expect(new CloudflareProvider().isAvailable()).toBe(false);
  });

  it('calls only the configured Cloudflare model', async () => {
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'configured-account');
    vi.stubEnv('CLOUDFLARE_AI_API_TOKEN', 'configured-token-value');
    vi.stubEnv('CLOUDFLARE_AI_MODEL', '@cf/meta/llama-4-scout-17b-16e-instruct');
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      result: { response: '{"ok":true}' },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', request);
    const { CloudflareProvider } = await import('@/lib/ai/providers/cloudflare');

    const result = await new CloudflareProvider().chat({
      messages: [{ role: 'user', content: 'Return JSON' }],
      maxTokens: 2048,
    });

    expect(result.model).toBe('@cf/meta/llama-4-scout-17b-16e-instruct');
    expect(request).toHaveBeenCalledTimes(1);
    expect(String(request.mock.calls[0]?.[0])).toContain('/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct');
  });

  it('does not silently substitute a second model after failure', async () => {
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'configured-account');
    vi.stubEnv('CLOUDFLARE_AI_API_TOKEN', 'configured-token-value');
    vi.stubEnv('CLOUDFLARE_AI_MODEL', '@cf/meta/llama-4-scout-17b-16e-instruct');
    const request = vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 }));
    vi.stubGlobal('fetch', request);
    const { CloudflareProvider } = await import('@/lib/ai/providers/cloudflare');

    await expect(new CloudflareProvider().chat({
      messages: [{ role: 'user', content: 'test' }],
    })).rejects.toThrow('returned 503');
    expect(request).toHaveBeenCalledTimes(1);
  });
});
