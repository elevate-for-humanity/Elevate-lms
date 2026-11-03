import { beforeEach, expect, it, vi } from 'vitest';
const h = vi.hoisted(() => ({ queue: [] as any[], active: [] as any[], writes: [] as any[], token: true, claimLost: false, sourceError: false, stageLookups: [] as any[] }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/ai/runtime/repair-reconciliation', () => ({ reconcileRecoveredRepairs: vi.fn() }));
vi.mock('@/lib/ai/runtime/repair-events', () => ({ readRecentRepairEvents: async () => [] }));
vi.mock('@/lib/devstudio/workflow-github-context', () => ({ currentWorkflowGitHubToken: () => h.token ? 'workflow-only-test' : null }));
vi.mock('@/lib/devstudio/github-token', () => ({ getGitHubHeaders: async () => ({}) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from(table: string) {
  const filters: Record<string, any> = {};
  let values: any;
  const q: any = {
    select: () => q, order: () => q, limit: () => q, gte: () => q,
    eq: (key: string, value: any) => { filters[key] = value; return q; },
    in: (key: string, value: any) => { filters[key] = value; return q; },
    update: (update: any) => { values = update; return q; },
    single: () => q, maybeSingle: () => q,
    then(resolve: any) {
      let data: any = [];
      if (table === 'paris_autopilot_policy') data = { enabled: true, actor_id: 'owner' };
      if (table === 'profiles') data = { role: 'admin' };
      if (table === 'paris_code_repairs') {
        if (values) {
          h.writes.push({ values, filters: { ...filters } });
          data = values.status === 'dispatched' && !h.claimLost ? { id: filters.id } : null;
        } else if (filters.status === 'queued') data = h.queue;
        else if (Array.isArray(filters.status) && filters.status.includes('patching')) data = h.active;
      }
      if (table === 'ultimate_build_jobs' && filters.id) {
        if (h.sourceError) return Promise.resolve(resolve({ data: null, error: new Error('source lookup failed') }));
        data = { id: filters.id, build_id: filters.id, job_type: 'lesson_autopilot:test:media', status: 'failed', last_error: 'quality failure' };
      } else if (table === 'ultimate_build_jobs' && filters.build_id) {
        h.stageLookups.push({...filters});
        data = { id: filters.build_id, build_id: filters.build_id, status: 'failed' };
      }
      if (table === 'ultimate_course_builds') data = { id: filters.id, status: 'building', profile: { ownerPaused: filters.id === 'paused' }, findings: [] };
      return Promise.resolve(resolve({ data, error: null }));
    },
  };
  return q;
} }) }));
import { tickParisCodeRepairs } from '@/lib/ai/runtime/code-repair';
beforeEach(() => {
  h.queue = []; h.active = []; h.writes = []; h.stageLookups = []; h.token = true; h.claimLost = false; h.sourceError = false;
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ object: { sha: 'a'.repeat(40) } }))));
});
it('advances past a paused source to the next eligible repair without dispatching the paused build', async () => {
  h.queue = [{ id: 'paused-repair', attempt_count: 0, source_job_id: 'paused' }, { id: 'eligible', attempt_count: 1, source_job_id: null }];
  expect(await tickParisCodeRepairs({ workflowOwnedDispatch: true })).toMatchObject({ dispatchRequired: true, repairId: 'eligible' });
  expect(h.writes[0]).toMatchObject({ values: { status: 'blocked', error_code: 'SOURCE_REPAIR_INELIGIBLE_CURRENT_STATE' }, filters: { id: 'paused-repair', status: 'queued', attempt_count: 0 } });
  expect(h.writes[1]).toMatchObject({ values: { status: 'dispatched', attempt_count: 2 }, filters: { id: 'eligible', status: 'queued', attempt_count: 1 } });
});
it('returns without dispatch when every scanned source is paused', async () => {
  h.queue = [{ id: 'paused-repair', attempt_count: 0, source_job_id: 'paused' }];
  expect(await tickParisCodeRepairs({ workflowOwnedDispatch: true })).toMatchObject({ dispatched: 0, reason: 'NO_ELIGIBLE_REPAIR_IN_SCANNED_QUEUE' });
  expect(h.writes.every(w => w.values.status === 'blocked')).toBe(true);
});
it('cannot dispatch after losing the compare-and-set claim', async () => {
  h.queue = [{ id: 'eligible', attempt_count: 0, source_job_id: 'failed' }]; h.claimLost = true;
  expect(await tickParisCodeRepairs({ workflowOwnedDispatch: true })).not.toHaveProperty('dispatchRequired');
});
it('preserves an active repair and refuses a background call without workflow authority', async () => {
  h.active = [{ id: 'active', status: 'dispatched', updated_at: new Date().toISOString() }];
  expect(await tickParisCodeRepairs({ workflowOwnedDispatch: true })).toMatchObject({ active: true });
  expect(h.writes).toEqual([]);
  h.token = false;
  expect(await tickParisCodeRepairs({ workflowOwnedDispatch: true })).toMatchObject({ awaitingWorkflow: true });
  expect(h.writes).toEqual([]);
});
it('propagates source failures instead of treating missing evidence as eligibility', async () => {
  h.queue = [{ id: 'unknown', attempt_count: 0, source_job_id: 'failed' }]; h.sourceError = true;
  await expect(tickParisCodeRepairs({ workflowOwnedDispatch: true })).rejects.toThrow('source lookup failed');
  expect(h.writes).toEqual([]);
});

it('matches a source repair to its exact lesson stage, not an unrelated sibling in the build', async () => {
 h.queue = [{ id: 'eligible', attempt_count: 0, source_job_id: 'failed' }];
 expect(await tickParisCodeRepairs({ workflowOwnedDispatch: true })).toMatchObject({ dispatchRequired: true, repairId: 'eligible' });
 expect(h.stageLookups).toContainEqual(expect.objectContaining({build_id:'failed',job_type:'lesson_autopilot:test:media'}));
});
