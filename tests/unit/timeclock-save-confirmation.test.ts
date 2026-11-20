import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  persisted: [] as Array<Record<string, unknown>>,
  notified: [] as Array<Record<string, unknown>>,
  keys: new Set<string>(),
}));
vi.mock('@/lib/audit/withApiAudit', () => ({
  withApiAudit: (_path: string, handler: unknown) => handler,
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/barber/suspension', () => ({ checkBarberSuspension: async () => null }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'learner', email: 'learner@example.test' } } }),
    },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: mocks.from }) }));
vi.mock('@/lib/email/service', () => ({ sendEmail: vi.fn().mockResolvedValue(true) }));
vi.mock('@/lib/events/emit', () => ({ emitEvent: vi.fn().mockResolvedValue(undefined) }));
import { POST } from '@/apps/lms/app/api/timeclock/action/route';
beforeEach(() => {
  mocks.persisted.length = 0;
  mocks.notified.length = 0;
  mocks.keys.clear();
  mocks.from.mockImplementation((table: string) => {
    let admins = false;
    let inserting: Record<string, unknown> | undefined;
    const response = () => {
      const data =
        table === 'profiles'
          ? admins
            ? [{ id: 'admin-one' }, { id: 'admin-two' }]
            : { full_name: 'Learner' }
          : table === 'apprentices'
            ? { id: 'apprentice', shop_id: 'shop', created_at: '2026-08-29', program_id: 'program' }
            : table === 'apprentice_sites'
              ? {
                  id: 'site',
                  shop_id: 'shop',
                  partner_id: 'partner',
                  latitude: 41,
                  longitude: -86,
                  radius_meters: 100,
                  name: 'Assigned shop',
                }
              : table === 'program_enrollments'
                ? { program_id: 'program' }
                : table === 'progress_entries' && inserting
                  ? { id: 'saved-shift' }
                  : table === 'documents'
                    ? []
                    : null;
      return { data, error: null };
    };
    const chain: Record<string, unknown> = {};
    for (const method of [
      'or',
      'select',
      'eq',
      'is',
      'not',
      'order',
      'limit',
      'lt',
      'gte',
      'lte',
      'update',
    ])
      chain[method] = () => chain;
    chain.in = (field: string) => {
      if (table === 'profiles' && field === 'role') admins = true;
      return chain;
    };
    chain.maybeSingle = async () => response();
    chain.single = async () => response();
    chain.then = (resolve: (result: object) => unknown) =>
      Promise.resolve(response()).then(resolve);
    chain.insert = (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
      if (table === 'progress_entries') {
        inserting = values as Record<string, unknown>;
        mocks.persisted.push(inserting);
        return chain;
      }
      if (table === 'notifications') {
        const rows = Array.isArray(values) ? values : [values];
        const batchKeys = rows.map((row) => String(row.idempotency_key));
        const invalidType = rows.some(
          (row) => !['ojt', 'info', 'warning'].includes(String(row.type)),
        );
        const duplicate =
          new Set(batchKeys).size !== batchKeys.length ||
          batchKeys.some((key) => mocks.keys.has(key));
        if (invalidType || duplicate)
          return Promise.resolve({ error: { code: invalidType ? '23514' : '23505' } });
        for (const key of batchKeys) mocks.keys.add(key);
        mocks.notified.push(...rows);
        return Promise.resolve({ error: null });
      }
      return chain;
    };
    return chain;
  });
});
describe('saved clock punch and confirmation', () => {
  it('saves a punch and delivers valid distinct notifications to the learner and two admins', async () => {
    const response = await POST(
      new Request('https://lms.example.test/api/timeclock/action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'clock_in',
          apprentice_id: 'apprentice',
          program_id: 'program',
          site_id: 'site',
          lat: 41,
          lng: -86,
          accuracy_m: 5,
        }),
      }) as Parameters<typeof POST>[0],
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      progress_entry_id: 'saved-shift',
    });
    expect(mocks.persisted).toHaveLength(1);
    expect(mocks.notified.map((row) => row.user_id)).toEqual(['learner', 'admin-one', 'admin-two']);
    expect(new Set(mocks.notified.map((row) => row.idempotency_key)).size).toBe(3);
  });
});
