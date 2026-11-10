import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type { OpenHandsLifecycle } from '@/lib/devstudio/openhands/client';
import { publicOpenHandsEvidence, publicOpenHandsLifecycle } from '@/lib/devstudio/openhands/public-lifecycle';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), owned: vi.fn(), refresh: vi.fn(), dispatch: vi.fn(), limit: vi.fn(), permission: vi.fn(),
  db: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.limit }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: mocks.auth }));
vi.mock('@/lib/rbac/role-matrix', () => ({ hasPermission: mocks.permission, normalizeRoles: (roles: string[]) => roles }));
vi.mock('@/lib/devstudio/openhands/context', () => ({ buildOpenHandsContextPrompt: async () => 'Isolated context' }));
vi.mock('@/lib/devstudio/openhands/client', () => ({
  getHydratedOpenHandsConfig: async () => ({ configured: true }), sendOpenHandsMessage: vi.fn(),
}));
vi.mock('@/lib/devstudio/openhands/task-access', () => ({ findOwnedOpenHandsTask: mocks.owned }));
vi.mock('@/lib/devstudio/openhands/runtime', () => ({ refreshOpenHandsTask: mocks.refresh, dispatchOpenHandsTask: mocks.dispatch }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.db }));

import { GET as agentGet, POST as agentPost } from '../../apps/admin/app/api/admin/dev-studio/openhands/agent/route';
import { GET as chatGet, POST as chatPost } from '../../apps/admin/app/api/admin/dev-studio/openhands/chat/route';
import { GET as taskGet } from '../../apps/admin/app/api/admin/dev-studio/tasks/[id]/route';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.limit.mockResolvedValue(null);
  mocks.auth.mockResolvedValue({ userId: 'owner', effectiveRoles: ['admin'] });
  mocks.permission.mockReturnValue(true);
  mocks.owned.mockResolvedValue({ taskId: 'owned-task', startTaskId: 'original-start', conversationId: 'conversation-1' });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

for (const [name, get] of [['agent', agentGet], ['chat', chatGet]] as const) {
  it(`${name} returns only safe lifecycle fields without mutating server evidence`, async () => {
    const marker = 'DO_NOT_PUBLISH_PROVIDER_SESSION';
    const lifecycle = Object.freeze({
      status: 'completed' as const, startTaskId: 'original-start', conversationId: 'conversation-1',
      sandboxStatus: 'RUNNING', executionStatus: 'finished', repository: 'elevate-for-humanity/Elevate-lms',
      branch: 'studio/original-branch', prNumbers: [42], error: null,
      raw: Object.freeze({ session_api_key: marker, nested: { access_token: marker } }),
      unexpectedProviderField: marker,
    });
    mocks.refresh.mockResolvedValue(lifecycle);
    const response = await get(new NextRequest('https://admin.example.test/status?taskId=owned-task'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.lifecycle).toEqual({
      status: 'completed', startTaskId: 'original-start', conversationId: 'conversation-1',
      sandboxStatus: 'RUNNING', executionStatus: 'finished', repository: 'elevate-for-humanity/Elevate-lms',
      branch: 'studio/original-branch', prNumbers: [42], error: null,
    });
    expect(JSON.stringify(body)).not.toContain(marker);
    expect(lifecycle.raw.session_api_key).toBe(marker);
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });

  it(`${name} does not echo provider errors and requires the existing owner and role`, async () => {
    mocks.refresh.mockRejectedValue(new Error('DO_NOT_PUBLISH_PROVIDER_ERROR'));
    const request = () => new NextRequest('https://admin.example.test/status?taskId=owned-task');
    const failed = await get(request());
    expect(failed.status).toBe(502);
    expect(await failed.text()).not.toContain('DO_NOT_PUBLISH');
    mocks.refresh.mockClear();
    mocks.owned.mockResolvedValue(null);
    expect((await get(request())).status).toBe(404);
    expect(mocks.refresh).not.toHaveBeenCalled();
    mocks.permission.mockReturnValue(false);
    expect((await get(request())).status).toBe(403);
    mocks.auth.mockResolvedValue({ error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) });
    expect((await get(request())).status).toBe(401);
  });
}

for (const [name, post, field] of [['agent', agentPost, 'task'], ['chat', chatPost, 'message']] as const) {
  it(`${name} start errors never echo upstream response contents`, async () => {
    mocks.dispatch.mockRejectedValue(new Error('DO_NOT_PUBLISH_PROVIDER_ERROR'));
    const response = await post(new NextRequest('https://admin.example.test/agent', {
      method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': 'isolated-test' },
      body: JSON.stringify({ [field]: 'Isolated test' }),
    }));
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('DO_NOT_PUBLISH');
  });
}

it('rejects unexpected scalar shapes and never publishes provider error details', () => {
  const result = publicOpenHandsLifecycle({
    status: 'unexpected', conversationId: { session_api_key: 'DO_NOT_PUBLISH' },
    repository: 'https://provider.example.test/?token=DO_NOT_PUBLISH', branch: { token: 'DO_NOT_PUBLISH' },
    sandboxStatus: { token: 'DO_NOT_PUBLISH' }, executionStatus: 'finished?token=DO_NOT_PUBLISH',
    prNumbers: [1, -1, 1.5, '2'], error: 'DO_NOT_PUBLISH', raw: { session_api_key: 'DO_NOT_PUBLISH' },
  } as unknown as OpenHandsLifecycle);
  expect(result).toMatchObject({ status: 'failed', conversationId: null, repository: null, branch: null,
    sandboxStatus: null, executionStatus: null, prNumbers: [1], error: 'OpenHands provider reported an error.' });
  expect(JSON.stringify(result)).not.toContain('DO_NOT_PUBLISH');
});

it('the actual Cloud client never returns raw conversation credentials to persistence callers', async () => {
  const marker = 'DO_NOT_PUBLISH_PROVIDER_SESSION';
  vi.stubEnv('OPENHANDS_API_KEY', 'isolated-fixture-key');
  vi.stubEnv('OPENHANDS_API_URL', 'https://provider.example.test');
  const fetchMock = vi.fn(async () => Response.json([{
    id: 'conversation-1', sandbox_status: 'RUNNING', execution_status: 'finished',
    selected_repository: 'elevate-for-humanity/Elevate-lms', selected_branch: 'studio/owned',
    session_api_key: marker, private_provider_field: { credential: marker },
  }]));
  vi.stubGlobal('fetch', fetchMock);
  const client = await vi.importActual<typeof import('@/lib/devstudio/openhands/client')>('@/lib/devstudio/openhands/client');
  const lifecycle = await client.getOpenHandsLifecycle({ conversationId: 'conversation-1' });
  expect(lifecycle).toMatchObject({ status: 'completed', conversationId: 'conversation-1',
    repository: 'elevate-for-humanity/Elevate-lms', branch: 'studio/owned' });
  expect(lifecycle).not.toHaveProperty('raw');
  expect(JSON.stringify(lifecycle)).not.toContain(marker);
  expect(fetchMock).toHaveBeenCalledOnce();
});

it('legacy task details omit raw provider data in tasks and step arrays while retaining the original history', async () => {
  const marker = 'DO_NOT_PUBLISH_LEGACY_SESSION';
  const lifecycle = Object.freeze({ status: 'completed', conversationId: 'conversation-1',
    raw: Object.freeze({ session_api_key: marker, unexpected: marker }) });
  const task = Object.freeze({ id: 'owned-task', tool_name: 'openhands.execute', status: 'running',
    requires_approval: false, approval_status: 'not_required', result: { lifecycle } });
  const steps = [Object.freeze({ id: 'original-step', output_json: { lifecycle } })];
  mocks.db.mockResolvedValue({ from: (table: string) => {
    const query = {
      select: () => query, eq: () => query, order: () => query, limit: () => query,
      maybeSingle: async () => ({ data: task, error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: table === 'ai_task_steps' ? steps : [], error: null }).then(resolve),
    };
    return query;
  } });
  const response = await taskGet(new NextRequest('https://admin.example.test/tasks/owned-task'),
    { params: Promise.resolve({ id: 'owned-task' }) });
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(body.task).toMatchObject({ status: 'running', requires_approval: false, approval_status: 'not_required' });
  expect(body.steps[0].id).toBe('original-step');
  expect(JSON.stringify(body)).not.toContain(marker);
  expect(lifecycle.raw.session_api_key).toBe(marker);
  expect(publicOpenHandsEvidence({ results: [{ session_api_key: marker }] }))
    .toEqual({ results: [{ session_api_key: '[REDACTED]' }] });
});
