import { afterEach, expect, test, vi } from 'vitest';
import { ElevateProvider } from '@/lib/ai/providers/elevate';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
test('the caller can cancel an owned model chat request before the provider timeout', async () => {
  vi.stubEnv('ELEVATE_LLM_URL', 'https://owned-model.example.test');
  vi.stubEnv('ELEVATE_LLM_SECRET', 'test-only-token');
  const controller = new AbortController();
  const request = vi.fn(async (_url: string, options: RequestInit) => {
    controller.abort(new Error('CALLER_DEADLINE'));
    options.signal?.throwIfAborted();
    return Response.json({ choices: [{ message: { content: 'unused' } }] });
  });
  vi.stubGlobal('fetch', request);
  await expect(
    new ElevateProvider().chat({
      messages: [{ role: 'user', content: 'Hello' }],
      signal: controller.signal,
    }),
  ).rejects.toThrow('CALLER_DEADLINE');
  expect(request).toHaveBeenCalledTimes(1);
});
