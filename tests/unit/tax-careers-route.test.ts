import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), admin: vi.fn(), limit: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: mocks.auth } }),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.limit }));
import { GET, POST } from '@/apps/marketing/app/api/tax/careers/route';
function request(body: unknown) {
  return new NextRequest('https://example.com/api/tax/careers', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
function database(notes: object, progress: object[] = []) {
  const writes = vi.fn();
  const filters = vi.fn();
  const db = {
    from: vi.fn((table: string) => {
      const result =
        table === 'job_applications'
          ? {
              id: 'app',
              status: 'submitted',
              notes: JSON.stringify(notes),
              updated_at: '2026-01-01',
            }
          : progress;
      const chain: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'in', 'gte', 'not', 'order'])
        chain[method] = (...args: unknown[]) => {
          filters(method, ...args);
          return chain;
        };
      chain.maybeSingle = async () => ({ data: result, error: null });
      chain.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: result, error: null }).then(resolve);
      chain.insert = writes;
      chain.update = writes;
      chain.upsert = writes;
      return chain;
    }),
  };
  mocks.admin.mockResolvedValue(db);
  return { db, writes, filters };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ data: { user: { id: 'signed-in-user' } } });
  mocks.limit.mockResolvedValue(null);
});
describe('private tax recruiting API', () => {
  it('rejects unauthenticated access before using privileged database access', async () => {
    mocks.auth.mockResolvedValue({ data: { user: null } });
    expect((await GET()).status).toBe(401);
    expect((await POST(request({ action: 'pretest', answers: [0] }))).status).toBe(401);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it('requires the initial test before training', async () => {
    const { writes } = database({});
    const response = await POST(
      request({ action: 'module', moduleId: '66c02600-0000-4000-8000-000000000001', answers: [0] }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: 'PRETEST_REQUIRED' });
    expect(writes).not.toHaveBeenCalled();
  });
  it('requires all completed modules before the final test', async () => {
    const { writes } = database({ pretest: { score: 60 } });
    const response = await POST(request({ action: 'final', answers: Array(10).fill(0) }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: 'COMPLETE_TRAINING_FIRST' });
    expect(writes).not.toHaveBeenCalled();
  });
  it('rejects browser supplied scores and hiring status', async () => {
    const { writes } = database({});
    expect(
      (
        await POST(
          request({ action: 'pretest', answers: [0, 1, 2, 1, 1], score: 100, status: 'hired' }),
        )
      ).status,
    ).toBe(400);
    expect(writes).not.toHaveBeenCalled();
  });
  it('returns only candidate-safe notes, scoped to the signed-in account', async () => {
    const { filters } = database({
      application: { name: 'Applicant' },
      internalReview: 'private hiring note',
    });
    const response = await GET();
    const body = await response.json();
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(body.application.internalReview).toBeUndefined();
    expect(body.pretest.every((q: Record<string, unknown>) => !('answer' in q))).toBe(true);
    expect(body.modules).toEqual([]);
    expect(filters).toHaveBeenCalledWith('eq', 'user_id', 'signed-in-user');
  });
});
