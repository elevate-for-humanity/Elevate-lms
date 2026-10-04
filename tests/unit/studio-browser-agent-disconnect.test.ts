import { afterEach, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ db: null as any, plan: vi.fn() }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: async () => ({ id: 'admin', effectiveRoles: ['admin'] }) }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => fixture.db }));
vi.mock('@/lib/devstudio/os/task-runner', () => ({ createAiTask: async () => ({ id: 'task' }) }));
vi.mock('@/lib/platform/resolve-tenant-for-user', () => ({ resolveTenantIdForUser: async () => 'tenant' }));
vi.mock('@/lib/ai/paid-inference-context', () => ({ runWithPaidInferenceContext: async (_id: string, run: () => unknown) => run() }));
vi.mock('@/lib/devstudio/browser-acquisition-checkpoint', () => ({ findAcquisitionBrowserCheckpoint: async () => null }));
vi.mock('@/lib/devstudio/browser-planner', () => ({
  browserActionRecords: (actions: unknown[]) => actions,
  browserTurnRequiresAuthentication: () => false,
  browserTaskMatches: () => true,
  planBrowserTurn: (...args: unknown[]) => fixture.plan(...args),
}));
import { POST } from '@/apps/admin/app/api/admin/dev-studio/browser/agent/route';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
const response = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
function setup() {
  const updates: any[] = [];
  const task: any = { id: 'task', status: 'queued', approval_status: 'approved', updated_at: '2026-01-01T00:00:00Z', result_json: {} };
  fixture.db = { from(table: string) {
    let mutation: any;
    const query: any = {
      select: () => query, eq: () => query, is: () => query,
      update: (value: unknown) => { mutation = value; return query; },
      insert: () => query,
      single: async () => ({ data: { ...task } }),
      maybeSingle: async () => { if (mutation && table === 'ai_tasks') Object.assign(task, mutation); return { data: { ...task } }; },
      then: (resolve: (value: unknown) => void) => { if (mutation && table === 'ai_tasks') { updates.push(structuredClone(mutation)); Object.assign(task, mutation); } return Promise.resolve({ error: null }).then(resolve); },
    };
    return query;
  } };
  vi.stubEnv('STUDIO_BROWSER_URL', 'http://worker.test');
  fixture.plan.mockReset();
  fixture.plan.mockResolvedValue({ status: 'action', actions: [{ type: 'click', ref: 'e1' }], summary: 'Click next', provider: 'fixture', model: 'fixture', usage: { totalTokens: 7 } });
  const aborted = new AbortController();
  const request: any = { signal: aborted.signal, json: async () => ({ task: 'Review course', sessionId: 'session', sessionToken: 'secret' }), headers: new Headers(), nextUrl: new URL('http://admin.test') };
  return { updates, task, request, aborted };
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it('checkpoints an in-flight worker action after reader cancellation and queues the same task without another inference', async () => {
  const { updates, request } = setup();
  const entered = deferred<void>(), action = deferred<Response>();
  let actionCalls = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/identity')) return response({ ownerId: 'admin' });
    if (url.endsWith('/snapshot')) return response({ url: 'http://fixture.test/lesson', controls: [] });
    if (url.endsWith('/actions')) { actionCalls++; entered.resolve(); return action.promise; }
    throw new Error('Unexpected fetch ' + url);
  }));
  const result = await POST(request);
  const reader = result.body!.getReader();
  await entered.promise;
  await reader.cancel();
  action.resolve(response({ url: 'http://fixture.test/next', durationMs: 10 }));
  await vi.waitFor(() => expect(updates.some(update => update.status === 'queued')).toBe(true));
  const checkpoint = updates.find(update => update.result_json?.checkpoint);
  expect(checkpoint.result_json.steps).toHaveLength(1);
  expect(checkpoint.result_json.history).toEqual([{ actions: [{ type: 'click', ref: 'e1' }], summary: 'Click next', url: 'http://fixture.test/next' }]);
  expect(updates.at(-1).result_json.steps).toHaveLength(1);
  expect(updates.at(-1).result_json.usage).toEqual({ totalTokens: 7 });
  expect(updates.some(update => update.status === 'failed')).toBe(false);
  expect(actionCalls).toBe(1);
  expect(fixture.plan).toHaveBeenCalledTimes(1);
});

it('request abort during snapshot queues its checkpoint before starting paid inference', async () => {
  const { updates, request, aborted } = setup();
  const entered = deferred<void>(), snapshot = deferred<Response>();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/identity')) return response({ ownerId: 'admin' });
    if (url.endsWith('/snapshot')) { entered.resolve(); return snapshot.promise; }
    throw new Error('Unexpected fetch ' + url);
  }));
  await POST(request);
  await entered.promise;
  aborted.abort();
  snapshot.resolve(response({ url: 'http://fixture.test', controls: [] }));
  await vi.waitFor(() => expect(updates.some(update => update.status === 'queued')).toBe(true));
  expect(fixture.plan).not.toHaveBeenCalled();
  expect(updates.some(update => update.status === 'failed')).toBe(false);
});

it('disconnect during paid planning records usage but never submits its planned actions', async () => {
  const { updates, request } = setup();
  const entered = deferred<void>(), plan = deferred<any>();
  fixture.plan.mockImplementation(() => { entered.resolve(); return plan.promise; });
  const fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith('/identity')) return response({ ownerId: 'admin' });
    if (url.endsWith('/snapshot')) return response({ url: 'http://fixture.test', controls: [] });
    throw new Error('Unexpected fetch ' + url);
  });
  vi.stubGlobal('fetch', fetchMock);
  const result = await POST(request);
  await entered.promise;
  await result.body!.cancel();
  plan.resolve({ status: 'action', actions: [{ type: 'click', ref: 'e1' }], summary: 'Next', provider: 'fixture', model: 'fixture', usage: { totalTokens: 9 } });
  await vi.waitFor(() => expect(updates.some(update => update.status === 'queued')).toBe(true));
  expect(updates.at(-1).result_json.usage).toEqual({ totalTokens: 9 });
  expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/actions'))).toBe(false);
  expect(fixture.plan).toHaveBeenCalledTimes(1);
});

it('does not requeue an administrator-cancelled task when the client disconnects mid-action', async () => {
  const { updates, task, request } = setup();
  const entered = deferred<void>(), action = deferred<Response>();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/identity')) return response({ ownerId: 'admin' });
    if (url.endsWith('/snapshot')) return response({ url: 'http://fixture.test', controls: [] });
    if (url.endsWith('/actions')) { entered.resolve(); return action.promise; }
    throw new Error('Unexpected fetch ' + url);
  }));
  const result = await POST(request);
  await entered.promise;
  task.status = 'cancelled';
  await result.body!.cancel();
  action.resolve(response({ url: 'http://fixture.test/next' }));
  await vi.waitFor(() => expect(updates.some(update => update.result_json?.checkpoint)).toBe(true));
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(task.status).toBe('cancelled');
  expect(updates.some(update => update.status === 'queued' || update.status === 'failed')).toBe(false);
  expect(fixture.plan).toHaveBeenCalledTimes(1);
});
