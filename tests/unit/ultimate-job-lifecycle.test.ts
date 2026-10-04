import { describe, expect, it } from 'vitest';
import { UltimateJobQueue } from '@/lib/ultimate-course-builder/worker/job-queue';

function database(attempts: number) {
  const writes: Array<{ table: string; values: any; filters: any[] }> = [];
  const db: any = {
    from(table: string) {
      let write: any;
      const query: any = {
        select: () => query,
        eq: (...filter: any[]) => { write?.filters.push(filter); return query; },
        update: (values: any) => {
          write = { table, values, filters: [] }; writes.push(write); return query;
        },
        single: async () => ({ data: { attempts, max_attempts: 3, build_id: 'build' }, error: null }),
        then: (resolve: any) => Promise.resolve({ error: null }).then(resolve),
      };
      return query;
    },
  };
  return { db, writes };
}

describe('terminal Ultimate job lifecycle', () => {
  it('blocks the corresponding build when repair attempts are exhausted', async () => {
    const { db, writes } = database(3);
    await new UltimateJobQueue(db).fail('job', 'owner', 'missing source');
    expect(writes[0].values.status).toBe('failed');
    expect(writes[0].filters).toContainEqual(['lease_owner', 'owner']);
    expect(writes[1]).toMatchObject({ table: 'ultimate_course_builds', values: { status: 'blocked' }, filters: [['id', 'build']] });
  });
  it('keeps transient failures queued without blocking a resumable build', async () => {
    const { db, writes } = database(1);
    await new UltimateJobQueue(db).fail('job', 'owner', 'temporary network error');
    expect(writes).toHaveLength(1);
    expect(writes[0].values.status).toBe('queued');
  });
  it('blocks unresolved dependencies even before the retry budget is exhausted', async () => {
    const { db, writes } = database(1);
    await new UltimateJobQueue(db).fail('job', 'owner', 'dependencies unresolved', false);
    expect(writes[1].values.status).toBe('blocked');
  });
});
