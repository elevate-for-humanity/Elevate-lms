import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ElevateProvider } from '@/lib/ai/providers/elevate';
import { retryRepairInference } from '@/lib/devstudio/repair-inference-retry.mjs';

beforeEach(() => {
  vi.stubEnv('ELEVATE_LLM_URL', 'https://owned-provider.example.test');
  vi.stubEnv('ELEVATE_LLM_SECRET', 'qa-only-token');
  vi.stubEnv('ELEVATE_LLM_CPU_URL', '');
  vi.stubEnv('ELEVATE_LLM_CPU_SECRET', '');
  vi.stubEnv('ELEVATE_LLM_GOOGLE_IAM', 'false');
  vi.stubEnv('PARIS_GPU_ENABLED', 'false');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const messages = [{ role: 'user' as const, content: 'Inspect the existing repair.' }];
const failure = (status: number) => new Response('upstream unavailable', { status });

it.each([408, 504])('checkpoints the real provider HTTP %i error without another request', async status => {
  const request = vi.fn(async () => failure(status));
  vi.stubGlobal('fetch', request);
  const sleep = vi.fn(async () => {});
  const provider = new ElevateProvider();
  await expect(retryRepairInference(signal => provider.chat({ messages, signal }), {
    timeoutMs: 210000, sleep,
  })).rejects.toThrow('PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE');
  expect(request).toHaveBeenCalledTimes(1);
  expect(sleep).not.toHaveBeenCalled();
});

it.each([502, 503])('recovers from the real provider HTTP %i error within bounded retry policy', async status => {
  let requests = 0;
  const request = vi.fn(async () => ++requests === 1 ? failure(status) : Response.json({
    choices: [{ message: { content: 'Validated repair plan' } }],
  }));
  vi.stubGlobal('fetch', request);
  const sleep = vi.fn(async () => {});
  const provider = new ElevateProvider();
  await expect(retryRepairInference(signal => provider.chat({ messages, signal }), {
    timeoutMs: 210000, sleep,
  })).resolves.toMatchObject({ content: 'Validated repair plan' });
  expect(request).toHaveBeenCalledTimes(2);
  expect(sleep).toHaveBeenCalledExactlyOnceWith(5000);
});

it('keeps the canonical aiChat wrapper on the no-replay checkpoint path for a real 504', async () => {
  vi.stubEnv('AI_PROVIDER', 'elevate');
  vi.stubEnv('AI_PROVIDER_ORDER', 'elevate,cloudflare');
  const request = vi.fn(async () => failure(504));
  vi.stubGlobal('fetch', request);
  const sleep = vi.fn(async () => {});
  const { aiChat } = await import('@/lib/ai/ai-service');
  await expect(retryRepairInference(signal => aiChat({ messages, signal }), {
    timeoutMs: 210000, sleep,
  })).rejects.toThrow('PARIS_INFERENCE_TEMPORARILY_UNAVAILABLE');
  expect(request).toHaveBeenCalledTimes(1);
  expect(sleep).not.toHaveBeenCalled();
});

it('does not transform an actual authorization rejection into a transient checkpoint', async () => {
  const request = vi.fn(async () => failure(403));
  vi.stubGlobal('fetch', request);
  const sleep = vi.fn(async () => {});
  await expect(retryRepairInference(signal => new ElevateProvider().chat({ messages, signal }), {
    timeoutMs: 210000, sleep,
  })).rejects.toThrow('HTTP 403');
  expect(request).toHaveBeenCalledTimes(1);
  expect(sleep).not.toHaveBeenCalled();
});
