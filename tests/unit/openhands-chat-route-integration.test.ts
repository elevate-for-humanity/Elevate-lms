import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  auth: vi.fn(), rate: vi.fn(), owned: vi.fn(), send: vi.fn(), dispatch: vi.fn(),
  refresh: vi.fn(), allowed: vi.fn(), config: vi.fn(), context: vi.fn(),
}));
vi.mock('next/server', () => ({
  NextResponse: { json: (body: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } }) },
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: state.rate }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: state.auth }));
vi.mock('@/lib/rbac/role-matrix', () => ({
  normalizeRoles: (roles: string[]) => roles,
  hasPermission: state.allowed,
}));
vi.mock('@/lib/devstudio/openhands/client', () => ({
  getHydratedOpenHandsConfig: state.config,
  sendOpenHandsMessage: state.send,
}));
vi.mock('@/lib/devstudio/openhands/runtime', () => ({
  dispatchOpenHandsTask: state.dispatch,
  refreshOpenHandsTask: state.refresh,
}));
vi.mock('@/lib/devstudio/openhands/task-access', () => ({ findOwnedOpenHandsTask: state.owned }));
vi.mock('@/lib/devstudio/openhands/public-lifecycle', () => ({ publicOpenHandsLifecycle: (v: unknown) => v }));
vi.mock('@/lib/devstudio/openhands/context', () => ({ buildOpenHandsContextPrompt: state.context }));

import { POST, GET } from '@/apps/admin/app/api/admin/dev-studio/openhands/chat/route';

function post(body: Record<string, unknown>) {
  return POST(new Request('https://admin.example.test/api/admin/dev-studio/openhands/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }) as never);
}

describe('OpenHands authenticated conversation endpoint (real route, mocked external boundary)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    state.rate.mockResolvedValue(null);
    state.auth.mockResolvedValue({ userId: 'original-owner', effectiveRoles: ['engineer'], error: null });
    state.allowed.mockReturnValue(true);
    state.config.mockResolvedValue({ configured: true, origin: 'https://provider.example.test' });
    state.context.mockResolvedValue('approved scope');
    state.owned.mockResolvedValue({
      taskId: 'original-task', status: 'running', conversationId: 'existing-conversation',
      startTaskId: 'existing-start',
    });
    state.send.mockResolvedValue({ success: true, sandbox_status: 'RUNNING' });
    state.dispatch.mockResolvedValue({
      taskId: 'original-task', startTaskId: 'existing-start',
      conversationId: 'existing-conversation', status: 'running',
    });
    state.refresh.mockResolvedValue({ status: 'running', conversationId: 'existing-conversation' });
  });

  it('continues the exact owned conversation, never dispatching another agent', async () => {
    const response = await post({ taskId: 'original-task', conversationId: 'existing-conversation', message: 'Follow up' });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ taskId: 'original-task', conversationId: 'existing-conversation' });
    expect(state.owned).toHaveBeenCalledWith({
      actorId: 'original-owner', taskId: 'original-task', conversationId: 'existing-conversation',
    });
    expect(state.send).toHaveBeenCalledTimes(1);
    expect(state.send).toHaveBeenCalledWith('existing-conversation', 'Follow up');
    expect(state.dispatch).not.toHaveBeenCalled();
  });

  it('blocks cross-owner/nonexistent conversations before contacting provider', async () => {
    state.owned.mockResolvedValue(null);
    const response = await post({ taskId: 'different-owner-task', conversationId: 'stolen-id', message: 'No' });
    expect(response.status).toBe(404);
    expect(state.send).not.toHaveBeenCalled();
    expect(state.dispatch).not.toHaveBeenCalled();
  });

  it('does not resume approval-gated or terminal tasks', async () => {
    state.owned.mockResolvedValue({ taskId: 'original-task', status: 'awaiting_approval' });
    const response = await post({ taskId: 'original-task', conversationId: 'existing-conversation', message: 'No' });
    expect(response.status).toBe(409);
    expect(state.send).not.toHaveBeenCalled();
  });

  it('requires exact conversation identifier when the task ID is supplied', async () => {
    const response = await post({ taskId: 'original-task', message: 'No' });
    expect(response.status).toBe(400);
    expect(state.dispatch).not.toHaveBeenCalled();
  });

  it('rejects unauthorized roles before querying tasks or provider', async () => {
    state.allowed.mockReturnValue(false);
    const response = await post({ taskId: 'original-task', conversationId: 'existing-conversation', message: 'No' });
    expect(response.status).toBe(403);
    expect(state.owned).not.toHaveBeenCalled();
    expect(state.send).not.toHaveBeenCalled();
  });

  it('owner-scopes reconciliation GET and does not refresh an unowned task', async () => {
    state.owned.mockResolvedValue(null);
    const response = await GET(new Request('https://admin.example.test/api/admin/dev-studio/openhands/chat?taskId=unowned') as never);
    expect(response.status).toBe(404);
    expect(state.refresh).not.toHaveBeenCalled();
  });
});
