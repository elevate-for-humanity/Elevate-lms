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
        gt: (...filter: any[]) => { write?.filters.push(['gt',...filter]); return query; },
        update: (values: any) => {
          write = { table, values, filters: [] }; writes.push(write); return query;
        },
        single: async () => ({ data: { attempts, max_attempts: 3, build_id: 'build' }, error: null }),
        then: (resolve: any) => Promise.resolve({ data:[{id:'job'}],error: null }).then(resolve),
      };
      return query;
    },
  };
  return { db, writes };
}

describe('terminal Ultimate job lifecycle', () => {
  it('hands terminal failure to the atomic database transition when repairs are exhausted', async () => {
    const { db, writes } = database(3);
    await new UltimateJobQueue(db).fail('job', 'owner', 'missing source', 1);
    expect(writes[0].values.status).toBe('failed');
    expect(writes[0].filters).toContainEqual(['lease_owner', 'owner']);
    expect(writes[0].filters).toContainEqual(['execution_generation', 1]);
    expect(writes).toHaveLength(1); // DB trigger owns build status and pending wakeups.
  });
  it('keeps transient failures queued without blocking a resumable build', async () => {
    const { db, writes } = database(1);
    await new UltimateJobQueue(db).fail('job', 'owner', 'temporary network error', 1);
    expect(writes).toHaveLength(1);
    expect(writes[0].values.status).toBe('queued');
  });
  it('blocks unresolved dependencies even before the retry budget is exhausted', async () => {
    const { db, writes } = database(1);
    await new UltimateJobQueue(db).fail('job', 'owner', 'dependencies unresolved', 1, false);
    expect(writes[0].values.status).toBe('failed');
    expect(writes).toHaveLength(1);
  });
  it('preserves failure history and fences dependency waits to the current generation',async()=>{
    const {db,writes}=database(2);
    await new UltimateJobQueue(db).waitForDependency('job','owner','Google permission required',7);
    expect(writes[0].values).not.toHaveProperty('attempts');
    expect(writes[0].values).not.toHaveProperty('pending_dependency_resume');
    expect(writes[0].values.status).toBe('failed');
    expect(writes[0].values.last_error).toBe('Google permission required');
    expect(writes[0].filters).toContainEqual(['lease_owner','owner']);
    expect(writes[0].filters).toContainEqual(['execution_generation',7]);
    expect(writes[0].filters.some(f=>f[0]==='gt'&&f[1]==='lease_expires_at')).toBe(true);
  });
});


it('routes media arrivals through the atomic existing-queue RPC and surfaces failures', async () => {
  const calls: any[] = [];
  const db: any = { rpc: async (...args: any[]) => { calls.push(args); return { data: [{ id: 'active-job' }], error: null }; } };
  const payload = { dependencyResume: 'licensed_media_attached', lessonIds: ['lesson'], assetIds: ['asset'] };
  expect(await new UltimateJobQueue(db).enqueue('build', payload)).toEqual({ id: 'active-job' });
  expect(calls).toEqual([['wake_ultimate_media_dependency', { p_build: 'build', p_payload: payload }]]);
  db.rpc = async () => ({ error: new Error('migration not applied') });
  await expect(new UltimateJobQueue(db).enqueue('build', payload)).rejects.toThrow('migration not applied');
});

it('treats publication racing a media arrival as already complete, not an import failure', async () => {
  const q: any = { select: () => q, eq: () => q, single: async () => ({ data: { status: 'published' }, error: null }) };
  const db: any = { rpc: async () => ({ data: [], error: null }), from: () => q };
  expect(await new UltimateJobQueue(db).enqueue('build', { dependencyResume: 'licensed_media_attached' })).toBeNull();
});
