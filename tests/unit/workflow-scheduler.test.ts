import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('@/lib/workflows/engine', () => ({ executeWorkflow: mocks.execute }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import { enqueueDueWorkflowSchedules, executeScheduledWorkflowEvent, parseWorkflowCron, SCHEDULE_DUE_EVENT } from '@/lib/workflows/scheduler';

const secret = 'test-only-schedule-proof-key';
const started = '2026-10-21T00:00:00.000Z';
const firstTick = new Date('2026-10-22T08:03:00.000Z');

type Operation = { table: string; kind: string; values?: any };

function database(cron = '*/5 * * * *') {
  const tables: Record<string, any[]> = {
    workflow_triggers: [{ id: 'trigger-1', workflow_id: 'workflow-1', trigger_type: 'schedule', enabled: true, cron_expr: cron, created_at: started, updated_at: started }],
    workflows: [{ id: 'workflow-1', status: 'active', tenant_id: 'tenant-1', created_at: started, updated_at: started }],
    platform_events: [],
    workflow_runs: [],
  };
  let counter = 0;
  let fail: ((operation: Operation) => boolean) | undefined;
  const db: any = {
    tables,
    failWhen(predicate?: (operation: Operation) => boolean) { fail = predicate; },
    from(table: string) {
      if (!tables[table]) throw new Error(`Unexpected table: ${table}`);
      const operation: Operation = { table, kind: 'select' };
      const filters: Array<(row: any) => boolean> = [];
      let maximum = Infinity;
      let one = false;
      let resolved: Promise<any> | undefined;
      const builder: any = {
        select() { return builder; },
        order() { return builder; },
        eq(key: string, value: unknown) {
          filters.push(row => key === 'payload->>proof' ? row.payload.proof === value : row[key] === value);
          return builder;
        },
        in(key: string, values: unknown[]) { filters.push(row => values.includes(row[key])); return builder; },
        limit(value: number) { maximum = value; return builder; },
        insert(values: any) { operation.kind = 'insert'; operation.values = values; return builder; },
        update(values: any) { operation.kind = 'update'; operation.values = values; return builder; },
        maybeSingle() { one = true; return builder; },
        single() { one = true; return builder; },
        then(resolve: any, reject: any) {
          resolved ??= Promise.resolve().then(() => {
            if (fail?.(operation)) return { data: null, error: { message: 'Simulated storage failure' } };
            let selected = tables[table].filter(row => filters.every(test => test(row))).slice(0, maximum);
            if (operation.kind === 'insert') {
              if (operation.values.idempotency_key && tables[table].some(row => row.idempotency_key === operation.values.idempotency_key)) {
                return { data: null, error: { code: '23505', message: 'Duplicate idempotency key' } };
              }
              const row = { id: `row-${++counter}`, ...structuredClone(operation.values) };
              tables[table].push(row);
              selected = [row];
            }
            if (operation.kind === 'update') selected.forEach(row => Object.assign(row, structuredClone(operation.values)));
            return { data: structuredClone(one ? selected[0] ?? null : selected), error: null };
          });
          return resolved.then(resolve, reject);
        },
      };
      return builder;
    },
  };
  return db;
}

const occurrences = (db: any) => db.tables.platform_events.filter((event: any) => event.event_type === SCHEDULE_DUE_EVENT);
const cursor = (db: any) => db.tables.platform_events.find((event: any) => event.event_type === 'workflow.schedule_cursor');

describe('UTC workflow cron contract', () => {
  it('supports ranges, steps, lists, UTC hours, and the Sunday alias', () => {
    const matches = parseWorkflowCron('5,15-25/5 9-17/2 * 1,10 0,7');
    expect(matches(new Date('2026-10-25T09:20:00Z'))).toBe(true);
    expect(matches(new Date('2026-10-25T10:20:00Z'))).toBe(false);
    expect(matches(new Date('2026-10-25T09:21:00Z'))).toBe(false);
    expect(matches(new Date('2026-11-01T09:20:00Z'))).toBe(false);
  });

  it('uses OR for restricted day-of-month/day-of-week and AND for wildcard steps', () => {
    const either = parseWorkflowCron('0 9 1 * 1');
    expect(either(new Date('2026-10-01T09:00:00Z'))).toBe(true);
    expect(either(new Date('2026-10-05T09:00:00Z'))).toBe(true);
    expect(either(new Date('2026-10-06T09:00:00Z'))).toBe(false);
    const stepped = parseWorkflowCron('0 9 */2 * *');
    expect(stepped(new Date('2026-10-01T09:00:00Z'))).toBe(true);
    expect(stepped(new Date('2026-10-02T09:00:00Z'))).toBe(false);
  });

  it.each(['@daily', '0 0 * *', '0 0 * * * *', '60 * * * *', '* 24 * * *', '*/0 * * * *', '1-0 * * * *', '0 0 * * MON', '0 0 ? * *'])('rejects unsupported or invalid syntax %s', cron => {
    expect(() => parseWorkflowCron(cron)).toThrow(/WORKFLOW_CRON/);
  });
});

describe('durable schedule enqueue', () => {
  it('starts at the current minute and does not replay old schedules on first observation', async () => {
    const db = database();
    expect(await enqueueDueWorkflowSchedules(db, firstTick, secret)).toMatchObject({ observed: 1, queued: 0, failed: 0 });
    expect(occurrences(db)).toHaveLength(0);
    expect(cursor(db)).toMatchObject({ processing_status: 'observed', payload: { observedThrough: firstTick.toISOString() } });
    expect(await enqueueDueWorkflowSchedules(db, new Date('2026-10-22T08:05:49Z'), secret)).toMatchObject({ queued: 1 });
    expect(occurrences(db)[0]).toMatchObject({ processing_status: 'pending', payload: { scheduledFor: '2026-10-22T08:05:00.000Z' } });
  });

  it('coalesces delayed ticks to the latest due occurrence and reports omitted occurrences', async () => {
    const db = database();
    await enqueueDueWorkflowSchedules(db, firstTick, secret);
    expect(await enqueueDueWorkflowSchedules(db, new Date('2026-10-22T08:17:00Z'), secret)).toMatchObject({ queued: 1, coalesced: 2, truncated: 0 });
    expect(occurrences(db).map((event: any) => event.payload.scheduledFor)).toEqual(['2026-10-22T08:15:00.000Z']);
  });

  it('bounds catchup to 24 hours and reports an exceeded observation window', async () => {
    const db = database('* * * * *');
    await enqueueDueWorkflowSchedules(db, firstTick, secret);
    expect(await enqueueDueWorkflowSchedules(db, new Date('2026-10-24T08:03:00Z'), secret)).toMatchObject({ queued: 1, coalesced: 1439, truncated: 1 });
    expect(occurrences(db)).toHaveLength(2);
  });

  it('deduplicates concurrent initial ticks using the durable unique key', async () => {
    const db = database('* * * * *');
    const results = await Promise.all([
      enqueueDueWorkflowSchedules(db, firstTick, secret),
      enqueueDueWorkflowSchedules(db, firstTick, secret),
    ]);
    expect(results.every(result => result.failed === 0)).toBe(true);
    expect(db.tables.platform_events).toHaveLength(2);
    expect(occurrences(db)).toHaveLength(1);
  });

  it('does not allow an older concurrent cursor update to overwrite a newer observation', async () => {
    const db = database('* * * * *');
    await enqueueDueWorkflowSchedules(db, firstTick, secret);
    await Promise.all([
      enqueueDueWorkflowSchedules(db, new Date('2026-10-22T08:05:00Z'), secret),
      enqueueDueWorkflowSchedules(db, new Date('2026-10-22T08:04:00Z'), secret),
    ]);
    expect(cursor(db).payload.observedThrough).toBe('2026-10-22T08:05:00.000Z');
  });

  it('retains the observation window when event insertion fails so a retry cannot lose a due occurrence', async () => {
    const db = database('* * * * *');
    db.failWhen((operation: Operation) => operation.kind === 'insert' && operation.values.event_type === SCHEDULE_DUE_EVENT);
    expect(await enqueueDueWorkflowSchedules(db, firstTick, secret)).toMatchObject({ queued: 0, failed: 1 });
    expect(cursor(db).payload.observedThrough).toBe('2026-10-22T08:02:00.000Z');
    db.failWhen();
    expect(await enqueueDueWorkflowSchedules(db, firstTick, secret)).toMatchObject({ queued: 1, failed: 0 });
    expect(occurrences(db)).toHaveLength(1);
  });

  it('does not enqueue disabled triggers or inactive workflows', async () => {
    const db = database('* * * * *');
    db.tables.workflow_triggers[0].enabled = false;
    expect(await enqueueDueWorkflowSchedules(db, firstTick, secret)).toMatchObject({ observed: 0, queued: 0 });
    db.tables.workflow_triggers[0].enabled = true;
    db.tables.workflows[0].status = 'paused';
    expect(await enqueueDueWorkflowSchedules(db, firstTick, secret)).toMatchObject({ observed: 0, queued: 0 });
  });

  it('resets the observation window after workflow reactivation instead of replaying paused work', async () => {
    const db = database();
    await enqueueDueWorkflowSchedules(db, firstTick, secret);
    db.tables.workflows[0].updated_at = '2026-10-22T08:16:00Z';
    expect(await enqueueDueWorkflowSchedules(db, new Date('2026-10-22T08:17:00Z'), secret)).toMatchObject({ queued: 0, coalesced: 0 });
  });

  it('makes invalid saved cron and untrusted cursors visible as failures', async () => {
    const invalid = database('@daily');
    expect(await enqueueDueWorkflowSchedules(invalid, firstTick, secret)).toMatchObject({ failed: 1, failures: [{ code: 'UNSUPPORTED_WORKFLOW_CRON' }] });
    const db = database();
    await enqueueDueWorkflowSchedules(db, firstTick, secret);
    cursor(db).payload.observedThrough = '2026-10-21T00:00:00Z';
    expect(await enqueueDueWorkflowSchedules(db, firstTick, secret)).toMatchObject({ failed: 1, failures: [{ code: 'WORKFLOW_SCHEDULE_CURSOR_AUTHORITY_INVALID' }] });
  });
});

describe('scheduled event execution authority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T09:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  async function queued() {
    const db = database('* * * * *');
    await enqueueDueWorkflowSchedules(db, firstTick, secret);
    return { db, event: occurrences(db)[0] };
  }

  it('executes only the signed saved schedule and persists the event/run correlation before actions', async () => {
    const { db, event } = await queued();
    event.payload.approved_by = 'forged-user';
    event.payload.role = 'admin';
    mocks.execute.mockImplementation(async () => {
      db.tables.workflow_runs.push({ id: 'run-1', platform_event_id: event.id, workflow_id: 'workflow-1', status: 'success' });
      return { runId: 'run-1', status: 'success' };
    });
    expect(await executeScheduledWorkflowEvent(db, event, secret)).toBe(1);
    expect(mocks.execute).toHaveBeenCalledWith('workflow-1', 'schedule', {
      scheduled_for: firstTick.toISOString(), schedule_trigger_id: 'trigger-1',
    }, 'trigger-1', event.id, 'tenant-1', undefined, { platformEventId: event.id });
    expect(await executeScheduledWorkflowEvent(db, event, secret)).toBe(0);
    expect(mocks.execute).toHaveBeenCalledTimes(1);
  });

  it.each(['proof', 'tenant', 'source', 'subject', 'occurrence'])('rejects a forged %s before loading or running workflow actions', async field => {
    const { db, event } = await queued();
    if (field === 'proof') event.payload.proof = '0'.repeat(64);
    if (field === 'tenant') event.tenant_id = 'other-tenant';
    if (field === 'source') event.source = 'user-input';
    if (field === 'subject') event.subject_id = 'other-trigger';
    if (field === 'occurrence') event.payload.scheduledFor = '2026-10-22T08:04:00.000Z';
    await expect(executeScheduledWorkflowEvent(db, event, secret)).rejects.toThrow('AUTHORITY_INVALID');
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it.each(['trigger-disabled', 'workflow-paused', 'schedule-edited', 'workflow-reactivated'])('rechecks %s immediately before dispatch', async change => {
    const { db, event } = await queued();
    if (change === 'trigger-disabled') db.tables.workflow_triggers[0].enabled = false;
    if (change === 'workflow-paused') db.tables.workflows[0].status = 'paused';
    if (change === 'schedule-edited') db.tables.workflow_triggers[0].cron_expr = '0 8 * * *';
    if (change === 'workflow-reactivated') db.tables.workflows[0].updated_at = '2026-10-22T08:04:00Z';
    expect(await executeScheduledWorkflowEvent(db, event, secret)).toBe(0);
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it.each(['failed', 'running'])('does not replay actions after an earlier %s run', async status => {
    const { db, event } = await queued();
    db.tables.workflow_runs.push({ id: 'earlier-run', platform_event_id: event.id, workflow_id: 'workflow-1', status });
    await expect(executeScheduledWorkflowEvent(db, event, secret)).rejects.toThrow('PRIOR_RUN_REQUIRES_REVIEW');
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it('does not report success if the engine completion receipt did not persist', async () => {
    const { db, event } = await queued();
    mocks.execute.mockResolvedValue({ runId: 'missing-run', status: 'success' });
    await expect(executeScheduledWorkflowEvent(db, event, secret)).rejects.toThrow('RESULT_NOT_PERSISTED');
  });
});
