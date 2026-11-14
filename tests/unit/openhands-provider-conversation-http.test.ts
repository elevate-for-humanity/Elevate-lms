import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ hydrate: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: mocks.hydrate }));
import { sendOpenHandsMessage, getOpenHandsLifecycle } from '@/lib/devstudio/openhands/client';

const previousKey = process.env.OPENHANDS_API_KEY;
const previousOrigin = process.env.OPENHANDS_API_URL;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.resetAllMocks();
  process.env.OPENHANDS_API_KEY = 'test-value-not-a-real-secret';
  process.env.OPENHANDS_API_URL = 'https://provider.test';
  mocks.hydrate.mockResolvedValue(undefined);
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (previousKey === undefined) delete process.env.OPENHANDS_API_KEY;
  else process.env.OPENHANDS_API_KEY = previousKey;
  if (previousOrigin === undefined) delete process.env.OPENHANDS_API_URL;
  else process.env.OPENHANDS_API_URL = previousOrigin;
});

describe('OpenHands provider conversation contract (controlled HTTP)', () => {
  it('continues the original conversation with authenticated Bearer request and no new agent start', async () => {
    const requests: Array<{ path: string; method: string; auth: string | null; body: unknown }> = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({
        path: String(input), method: init?.method ?? 'GET',
        auth: new Headers(init?.headers).get('authorization'),
        body: JSON.parse(String(init?.body ?? '{}')),
      });
      return new Response(JSON.stringify({ success: true, sandbox_status: 'RUNNING' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;
    const result = await sendOpenHandsMessage('original-conversation-123', 'Continue the existing approved repair');
    expect(result.success).toBe(true);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      path: 'https://provider.test/api/v1/app-conversations/original-conversation-123/send-message',
      method: 'POST',
      auth: 'Bearer test-value-not-a-real-secret',
    });
    expect(requests[0].body).toMatchObject({
      content: [{ type: 'text', text: 'Continue the existing approved repair' }],
      role: 'user', run: true,
    });
    expect(requests.every(r => !r.path.endsWith('/api/v1/app-conversations'))).toBe(true);
  });

  it('fails closed on an unauthorized provider response and does not call a second endpoint', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ detail: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    }));
    globalThis.fetch = fetcher as typeof fetch;
    await expect(sendOpenHandsMessage('original-conversation-123', 'Continue')).rejects.toThrow('OpenHands API 401');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('requires an API credential before contacting the provider', async () => {
    delete process.env.OPENHANDS_API_KEY;
    const fetcher = vi.fn();
    globalThis.fetch = fetcher as typeof fetch;
    await expect(sendOpenHandsMessage('original-conversation-123', 'Continue')).rejects.toThrow('OpenHands API key is not configured');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
