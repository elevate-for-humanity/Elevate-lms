import { beforeEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  user: { id: 'learner' } as any,
  subject: { userId: 'learner', previewing: false },
  chain: null as any,
  db: { from: vi.fn(), rpc: vi.fn() },
  updated: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({ getCurrentUser: async () => mocks.user }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
vi.mock('@/lib/admin/portal-preview', () => ({
  resolvePortalPreviewSubject: async () => mocks.subject,
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
import { POST } from '../../apps/lms/app/api/apprentice/theory-schedule/route';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { id: 'learner' };
  mocks.subject = { userId: 'learner', previewing: false };
  const chain: any = {};
  for (const name of ['select', 'eq', 'order', 'limit']) chain[name] = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => ({
    data: {
      id: 'schedule',
      course_id: 'course',
      weekly_target_minutes: 180,
      weekly_max_minutes: 600,
    },
    error: null,
  }));
  chain.update = vi.fn((value) => {
    mocks.updated(value);
    return chain;
  });
  chain.single = vi.fn(async () => ({ data: { id: 'schedule' }, error: null }));
  mocks.chain = chain;
  mocks.db.from.mockReturnValue(chain);
});
const request = (extra: Record<string, unknown> = {}) =>
  new NextRequest('https://app.elevateforhumanity.org/api/apprentice/theory-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days: [1, 2, 3, 4], startTime: '18:00', endTime: '18:45', ...extra }),
  });
describe('theory schedule ownership', () => {
  it('rejects unauthenticated and signed read-only previews without a write', async () => {
    mocks.user = null;
    mocks.subject = { userId: '', previewing: false };
    expect((await POST(request())).status).toBe(401);
    mocks.subject = { userId: 'learner', previewing: true };
    expect((await POST(request())).status).toBe(403);
    expect(mocks.updated).not.toHaveBeenCalled();
  });
  it('saves only the authenticated subject availability and ignores attempts to change identity or budget', async () => {
    expect(
      (
        await POST(
          request({
            userId: 'another-learner',
            weekly_max_minutes: 2400,
            weekly_target_minutes: 1,
          }),
        )
      ).status,
    ).toBe(200);
    expect(mocks.chain.eq).toHaveBeenCalledWith('user_id', 'learner');
    expect(mocks.updated.mock.calls[0][0]).toMatchObject({
      days_of_week: [1, 2, 3, 4],
      start_time: '18:00',
      end_time: '18:45',
    });
    expect(mocks.updated.mock.calls[0][0]).not.toHaveProperty('user_id');
    expect(mocks.updated.mock.calls[0][0]).not.toHaveProperty('weekly_max_minutes');
  });
  it('rejects an oversized midnight-to-noon window before writing', async () => {
    expect((await POST(request({ startTime: '00:00', endTime: '12:00' }))).status).toBe(400);
    expect(mocks.updated).not.toHaveBeenCalled();
  });
});
