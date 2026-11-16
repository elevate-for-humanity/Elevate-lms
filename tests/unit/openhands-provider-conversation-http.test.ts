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
  it('recovers a missing sandbox only from the original matching start receipt',async()=>{
    const fetcher=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>Response.json(String(input).includes('/start-tasks?')?
      {id:'start-123',app_conversation_id:'conversation-123',sandbox_id:'sandbox-123'}:
      {id:'conversation-123',sandbox_status:'PAUSED',selected_repository:'elevate-for-humanity/Elevate-lms'}));
    globalThis.fetch=fetcher as typeof fetch;
    expect(await getOpenHandsLifecycle({startTaskId:'start-123',conversationId:'conversation-123'})).toMatchObject({sandboxId:'sandbox-123',sandboxStatus:'PAUSED'});
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.every(([,init])=>!init||init.method==='GET')).toBe(true);
  });
  it.each([
    {id:'start-other',app_conversation_id:'conversation-123',sandbox_id:'sandbox-other'},
    {id:'start-123',app_conversation_id:'conversation-other',sandbox_id:'sandbox-other'},
  ])('rejects a mismatched sandbox receipt',async(receipt)=>{
    globalThis.fetch=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>Response.json(String(input).includes('/start-tasks?')?receipt:{id:'conversation-123',sandbox_status:'PAUSED'})) as typeof fetch;
    await expect(getOpenHandsLifecycle({startTaskId:'start-123',conversationId:'conversation-123'})).rejects.toThrow('receipt mismatch');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
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
it.each(['finished','running'])('does not make %s lifecycle depend on an unused start receipt',async(execution_status)=>{
 globalThis.fetch=vi.fn(async()=>Response.json({id:'conversation-123',execution_status,sandbox_status:'RUNNING'})) as typeof fetch;
 expect(await getOpenHandsLifecycle({startTaskId:'start-123',conversationId:'conversation-123'})).toMatchObject({status:execution_status==='finished'?'completed':'running'});
 expect(fetch).toHaveBeenCalledTimes(1);
});
it('uses the canonical saved sandbox receipt before querying the startup endpoint',async()=>{
 globalThis.fetch=vi.fn(async()=>Response.json({id:'conversation-123',sandbox_status:'PAUSED'})) as typeof fetch;
 expect(await getOpenHandsLifecycle({startTaskId:'start-123',conversationId:'conversation-123',recordedSandboxId:'saved-sandbox'})).toMatchObject({sandboxId:'saved-sandbox'});
 expect(fetch).toHaveBeenCalledTimes(1);
});
