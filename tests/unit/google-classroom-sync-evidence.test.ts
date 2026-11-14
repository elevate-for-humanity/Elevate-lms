// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ list: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/integrations/google-classroom', () => ({
  getGoogleClassroomCredentials: async () => ({}),
  listGoogleClassroomCourses: api.list,
  refreshGoogleClassroomAccessToken: api.refresh,
}));
import { readConnectedClassroomCourses, synchronizeGoogleClassroom } from '@/lib/integrations/google-classroom-sync';
import { summarizeSyncEvidence } from '@/lib/integrations/sync-evidence';
function fixture(failTable?: string, expired = false) {
  const writes: Array<{ table: string; operation: string; value: unknown }> = [];
  const db = { from(table: string) {
    let operation = 'read';
    const query = {
      select: () => query, eq: () => query,
      maybeSingle: async () => ({ data: { access_token: 'private-access', refresh_token: 'private-refresh',
        expires_at: new Date(Date.now() + (expired ? -1000 : 3600000)).toISOString() }, error: null }),
      update(value: unknown) { operation = 'update'; writes.push({ table, operation, value }); return query; },
      upsert(value: unknown) { operation = 'upsert'; writes.push({ table, operation, value }); return query; },
      insert(value: unknown) { operation = 'insert'; writes.push({ table, operation, value }); return query; },
      then(resolve: (result: unknown) => unknown) {
        return Promise.resolve({ data: table === 'integration_tokens' ? [{ id: 'token-row' }] : null,
          error: table === failTable ? { message: 'private-db-error' } : null }).then(resolve);
      },
    };
    return query;
  } };
  return { db: db as never, writes };
}
beforeEach(() => { vi.clearAllMocks(); api.list.mockResolvedValue([{ id: 'course-1', name: 'Class' }]);
  api.refresh.mockResolvedValue({ access_token: 'new-access', expires_in: 3600 }); });
afterEach(() => vi.unstubAllGlobals());

it('records real course counts only after durable idempotent course persistence', async () => {
  const f = fixture(); expect(await synchronizeGoogleClassroom(f.db, 'owner')).toMatchObject({ success: true, coursesSynchronized: 1 });
  expect(f.writes.map(x => x.table)).toEqual(['google_classroom_sync', 'integrations', 'integration_sync_log']);
  const receipt = f.writes.at(-1)!.value as { records: unknown; created_at: string };
  expect(summarizeSyncEvidence([{ ...receipt, action: 'sync', status: 'success' }])).toMatchObject({ contacts: null, leads: null, resources: { courses: 1 } });
  expect(JSON.stringify(receipt)).not.toContain('private-access');
});

it.each(['google_classroom_sync', 'integrations', 'integration_sync_log'])('never reports success after a %s write failure', async table => {
  const f = fixture(table);
  await expect(synchronizeGoogleClassroom(f.db, 'owner')).rejects.toThrow();
  if (table !== 'integration_sync_log') expect(f.writes.some(x => x.table === 'integration_sync_log')).toBe(false);
});

it('does not use refreshed credentials unless their fenced persistence succeeds', async () => {
  const f = fixture('integration_tokens', true);
  await expect(synchronizeGoogleClassroom(f.db, 'owner')).rejects.toThrow('could not be saved');
  expect(api.list).not.toHaveBeenCalled();
});

it('keeps a provider failure separate from a committed sync', async () => {
  const f = fixture(); api.list.mockRejectedValue(new Error('provider unavailable'));
  await expect(readConnectedClassroomCourses(f.db, 'owner')).rejects.toThrow();
  expect(f.writes).toEqual([]);
});

it('counts zero courses as a real completed empty synchronization without inventing contacts', async () => {
  const f = fixture(); api.list.mockResolvedValue([]);
  expect(await synchronizeGoogleClassroom(f.db, 'owner')).toMatchObject({ coursesSynchronized: 0 });
  expect(f.writes.some(x => x.table === 'google_classroom_sync')).toBe(false);
  expect((f.writes.at(-1)!.value as { records: unknown }).records).toMatchObject({ resources: { courses: 0 } });
});
