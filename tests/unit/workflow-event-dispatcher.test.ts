import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ db: vi.fn(), execute: vi.fn(), scheduled: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.db }));
vi.mock('@/lib/workflows/engine', () => ({ executeWorkflow: mocks.execute }));
vi.mock('@/lib/workflows/scheduler', () => ({ executeScheduledWorkflowEvent: mocks.scheduled, SCHEDULE_DUE_EVENT: 'workflow.schedule_due' }));
vi.mock('@/lib/jobs/queue', () => ({ enqueueJob: vi.fn() }));
vi.mock('@/lib/workspace/tier-limits', () => ({ normalizeWorkspaceTier: vi.fn() }));
vi.mock('@/lib/platform/organization-features', () => ({ getOrganizationFeatures: vi.fn() }));
vi.mock('@/lib/platform/orchestration/events', () => ({ emitPlatformEvent: vi.fn(), PlatformEventType: { PROVISIONING_REQUESTED: 'provisioning.requested' } }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
import { processPendingPlatformEvents } from '@/lib/platform/orchestration/dispatcher';

const now = new Date('2026-10-22T12:00:00.000Z');
const fresh = new Date(now.getTime() - 30 * 60_000).toISOString();
const old = new Date(now.getTime() - 48 * 60 * 60_000).toISOString();
const event = (overrides = {}) => ({ id: 'event-1', event_type: 'workflow.triggered', category: 'workflow', severity: 'info',
  tenant_id: 'tenant-1', payload: {}, processing_status: 'pending', attempts: 0,
  created_at: fresh, available_at: fresh, ...overrides });
type Operation = { table: string; kind: string; count: boolean; values?: any };

function database(events = [event()]) {
  const tables: Record<string, any[]> = {
    platform_events: events,
    workflow_triggers: [{ id: 'trigger-1', workflow_id: 'workflow-1', trigger_type: 'event', enabled: true, event_filter: { event_type: 'workflow.triggered' } }],
    workflows: [{ id: 'workflow-1', tenant_id: 'tenant-1', status: 'active' }], workflow_runs: [],
  };
  const writes: Operation[] = [];
  let fail: ((operation: Operation) => boolean) | undefined;
  const db: any = {
    tables, writes,
    failWhen(predicate?: (operation: Operation) => boolean) { fail = predicate; },
    rpc: vi.fn(async (_name: string, args: { p_limit: number }) => ({ data: structuredClone(tables.platform_events.slice(0, args.p_limit)), error: null })),
    from(table: string) {
      const filters: Array<(row: any) => boolean> = [];
      let one = false;
      const operation: Operation = { table, kind: 'select', count: false };
      const result = () => {
        if (fail?.(operation)) return { data: null, count: null, error: { message: 'Database unavailable' } };
        const selected = tables[table].filter(row => filters.every(filter => filter(row)));
        if (operation.kind === 'update') {
          selected.forEach(row => Object.assign(row, structuredClone(operation.values)));
          writes.push(operation);
        }
        return { data: operation.count ? null : structuredClone(one ? selected[0] ?? null : selected), count: operation.count ? selected.length : null, error: null };
      };
      const query: any = {
        select(_fields: string, options?: { count?: string }) { operation.count = Boolean(options?.count); return query; },
        eq(key: string, expected: unknown) { filters.push(row => row[key] === expected); return query; },
        in(key: string, expected: unknown[]) { filters.push(row => expected.includes(row[key])); return query; },
        lt(key: string, expected: any) { filters.push(row => row[key] != null && row[key] < expected); return query; },
        lte(key: string, expected: any) { filters.push(row => row[key] != null && row[key] <= expected); return query; },
        update(values: any) { operation.kind = 'update'; operation.values = values; return query; },
        maybeSingle() { one = true; return query; },
        then(resolve: any, reject: any) { return Promise.resolve().then(result).then(resolve, reject); },
      };
      return query;
    },
  };
  mocks.db.mockResolvedValue(db);
  mocks.execute.mockImplementation(async (workflowId: string, _source: string, _context: unknown, _trigger: string, _trace: string, _tenant: string, _studio: unknown, execution: any) => {
    const run = { id: 'run-1', workflow_id: workflowId, platform_event_id: execution?.platformEventId, status: 'success' };
    tables.workflow_runs.push(run);
    return { runId: run.id, status: run.status };
  });
  return db;
}

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(now); });
afterEach(() => vi.useRealTimers());

describe('canonical event workflow dispatch', () => {
  it('passes the event ID into the initial run insert and requires a matching persisted success', async () => {
    const db = database();
    expect(await processPendingPlatformEvents()).toMatchObject({ claimed: 1, processed: 1, failed: 0, workflowRuns: 1 });
    expect(mocks.execute).toHaveBeenCalledWith('workflow-1', 'event', expect.any(Object), 'trigger-1', 'event-1', 'tenant-1', undefined, { platformEventId: 'event-1' });
    expect(db.writes.some((write: Operation) => write.table === 'workflow_runs')).toBe(false);
    expect(db.tables.platform_events[0].processing_status).toBe('processed');
  });

  it.each(['failed', 'running'])('does not mark an event processed or repeat actions after a prior %s workflow run', async status => {
    const db = database();
    db.tables.workflow_runs.push({ id: 'existing-run', workflow_id: 'workflow-1', platform_event_id: 'event-1', status });
    expect(await processPendingPlatformEvents()).toMatchObject({ processed: 0, failed: 1 });
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(db.tables.platform_events[0]).toMatchObject({ processing_status: 'failed', last_error: 'WORKFLOW_EVENT_PRIOR_RUN_REQUIRES_REVIEW' });
  });

  it('acknowledges a successful existing run without repeating actions', async () => {
    const db = database();
    db.tables.workflow_runs.push({ id: 'existing-run', workflow_id: 'workflow-1', platform_event_id: 'event-1', status: 'success' });
    expect(await processPendingPlatformEvents()).toMatchObject({ processed: 1, failed: 0, workflowRuns: 0 });
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it('fails closed when the prior run cannot be read', async () => {
    const db = database();
    db.failWhen((operation: Operation) => operation.table === 'workflow_runs' && operation.kind === 'select');
    expect(await processPendingPlatformEvents()).toMatchObject({ processed: 0, failed: 1 });
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it('rejects an unpersisted successful return from the engine', async () => {
    const db = database();
    mocks.execute.mockResolvedValue({ runId: 'missing-run', status: 'success' });
    expect(await processPendingPlatformEvents()).toMatchObject({ processed: 0, failed: 1 });
    expect(db.tables.platform_events[0].last_error).toBe('WORKFLOW_EVENT_RESULT_NOT_PERSISTED');
  });

  it('does not fan a tenantless event out to tenant-owned workflows', async () => {
    database([event({ tenant_id: null })]);
    expect(await processPendingPlatformEvents()).toMatchObject({ workflowRuns: 0 });
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it('preserves explicitly global workflows and matching tenant workflows', async () => {
    const db = database([event({ tenant_id: null })]);
    db.tables.workflows[0].tenant_id = null;
    expect(await processPendingPlatformEvents()).toMatchObject({ workflowRuns: 1 });
    expect(mocks.execute).toHaveBeenCalledTimes(1);
  });

  it('does not run a workflow owned by a different tenant', async () => {
    database([event({ tenant_id: 'different-tenant' })]);
    expect(await processPendingPlatformEvents()).toMatchObject({ workflowRuns: 0 });
    expect(mocks.execute).not.toHaveBeenCalled();
  });
});

describe('historical event replay release gate', () => {
  it.each(['pending', 'failed'])('blocks old eligible %s work before claims or any mutation', async status => {
    const db = database([event({ created_at: old, processing_status: status })]);
    const before = structuredClone(db.tables);
    expect(await processPendingPlatformEvents()).toEqual({ claimed: 0, processed: 0, failed: 0, workflowRuns: 0, eventIds: [],
      blocked: 'historical_backlog_review_required', backlogCount: 1, cutoff: '2026-10-21T12:00:00.000Z' });
    expect(db.rpc).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(db.writes).toHaveLength(0);
    expect(db.tables).toEqual(before);
  });

  it('also blocks a historical run whose processing lease has expired', async () => {
    const db = database([event({ created_at: old, processing_status: 'processing', locked_at: fresh })]);
    expect(await processPendingPlatformEvents()).toMatchObject({ blocked: 'historical_backlog_review_required', backlogCount: 1 });
    expect(db.rpc).not.toHaveBeenCalled();
    expect(db.writes).toHaveLength(0);
  });

  it.each([
    { processing_status: 'observed' }, { processing_status: 'processed' },
    { attempts: 5 }, { available_at: '2026-10-23T12:00:00.000Z' },
    { processing_status: 'processing', locked_at: now.toISOString() },
  ])('does not block a batch for ineligible historical rows %j', async overrides => {
    const db = database([event({ created_at: old, ...overrides })]);
    db.rpc.mockResolvedValue({ data: [], error: null });
    expect(await processPendingPlatformEvents()).toMatchObject({ claimed: 0, processed: 0, failed: 0 });
    expect(db.rpc).toHaveBeenCalledTimes(1);
  });

  it('cannot claim any work when historical eligibility cannot be checked', async () => {
    const db = database();
    db.failWhen((operation: Operation) => operation.count);
    await expect(processPendingPlatformEvents()).rejects.toMatchObject({ message: 'Database unavailable' });
    expect(db.rpc).not.toHaveBeenCalled();
    expect(db.writes).toHaveLength(0);
  });

  it('does not execute an old event that becomes eligible between preflight and claim', async () => {
    const db = database();
    db.rpc.mockResolvedValue({ data: [event({ created_at: old })], error: null });
    expect(await processPendingPlatformEvents()).toMatchObject({ processed: 0, failed: 1, workflowRuns: 0 });
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(db.writes.every((write: Operation) => write.values.processing_status !== 'processed')).toBe(true);
  });
});
