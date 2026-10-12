import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { syncProgramHolderDashboards } from '../../scripts/ops/sync-program-holder-dashboards';

function fixture(failRead = false, inactive = false) {
  const writes: string[] = [];
  const db = {
    from(table: string) {
      let slugs: string[] = [];
      let single = false;
      const query: any = {
        select: () => query,
        in: (_field: string, values: string[]) => { slugs = values; return query; },
        eq: () => query,
        limit: () => query,
        maybeSingle: () => { single = true; return query; },
        update: () => { writes.push(table); return query; },
        insert: () => { writes.push(table); return query; },
        upsert: () => { writes.push(table); return query; },
        throwOnError: async () => {
          if (failRead) throw new Error('database unavailable');
          if (table === 'programs') return { data: slugs.map(slug => ({ id: slug, slug })) };
          if (table === 'program_holders') return { data: single ? (inactive ? { id: 'archived-holder', organization_name: 'Archived holder', status: 'inactive' } : null) : [
            { id: 'legacy-holder', user_id: 'legacy-user', contact_email: 'holder@example.test' },
          ] };
          return { data: null };
        },
      };
      return query;
    },
    auth: { admin: { listUsers: async () => ({ data: { users: [] }, error: null }) } },
  };
  return { db: db as unknown as SupabaseClient, writes };
}

describe('holder repair failure and consent boundaries', () => {
  it('leaves inactive holders and partner account roles untouched', async () => {
    const { db, writes } = fixture(false, true);
    const provision = vi.spyOn(db.auth.admin, 'listUsers');
    await syncProgramHolderDashboards(db);
    expect(writes).toEqual([]);
    expect(provision).not.toHaveBeenCalled();
  });
  it('rejects a failed catalog read before making any writes', async () => {
    const { db, writes } = fixture(true);
    await expect(syncProgramHolderDashboards(db)).rejects.toThrow('database unavailable');
    expect(writes).toEqual([]);
  });
  it('rejects an incomplete catalog before making any writes', async () => {
    const { db, writes } = fixture();
    db.from = (() => ({ select: () => ({ in: () => ({ throwOnError: async () => ({ data: [] }) }) }) })) as any;
    await expect(syncProgramHolderDashboards(db)).rejects.toThrow('No holder mappings were changed');
    expect(writes).toEqual([]);
  });
  it('dry run flags missing signature evidence without writing profiles, mappings, or signatures', async () => {
    const { db, writes } = fixture();
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      await syncProgramHolderDashboards(db, true);
      expect(writes).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('MOU evidence missing for holder@example.test'));
    } finally { log.mockRestore(); warn.mockRestore(); }
  });
});
