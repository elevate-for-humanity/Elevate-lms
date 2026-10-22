import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({fetch: vi.fn(), event: vi.fn()}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({from: () => ({insert: () => ({select: () => ({
    maybeSingle: async () => ({data: {id: 'tool-run'}, error: null}),
  })})})}),
}));
vi.mock('@/lib/platform/orchestration/events', () => ({emitPlatformEvent: mocks.event}));
vi.mock('@/lib/platform/platform-health', () => ({getPlatformHealth: vi.fn()}));
vi.mock('@/lib/secrets', () => ({getDecryptedPlatformSecret: vi.fn()}));
vi.mock('@/lib/logger', () => ({logger: {warn: vi.fn(), error: vi.fn(), info: vi.fn()}}));

import {executeRegisteredAITool} from '@/lib/ai/tools/executor';

const context = {
  agent: 'PARIS' as const, actorId: 'operator', actorRoles: ['admin'],
  adminOrigin: 'https://admin.example.test', appOrigin: 'https://app.example.test',
  requestHeaders: new Headers({cookie: 'session=audit-test'}),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.event.mockResolvedValue({id: 'event-1'});
  mocks.fetch.mockImplementation(async () => Response.json({status: 'observed', events: []}));
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => vi.unstubAllGlobals());

describe('PARIS supervision dispatch', () => {
  it('reads supervision from Admin and forwards the authenticated session', async () => {
    const result = await executeRegisteredAITool('paris.supervision', {}, context);
    expect(result).toMatchObject({ok: true, status: 'completed'});
    expect(mocks.fetch).toHaveBeenCalledWith('https://admin.example.test/api/paris/supervision', expect.anything());
    expect(mocks.fetch.mock.calls[0][1].headers.get('cookie')).toBe('session=audit-test');
  });

  it('does not dispatch supervision for a learner role', async () => {
    const result = await executeRegisteredAITool('paris.supervision', {}, {...context, actorRoles: ['student']});
    expect(result).toMatchObject({ok: false, status: 'blocked', httpStatus: 403});
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
