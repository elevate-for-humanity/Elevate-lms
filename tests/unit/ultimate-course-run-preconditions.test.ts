import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  adminClient: vi.fn(),
  rateLimit: vi.fn(),
  enqueue: vi.fn(),
  dispatch: vi.fn(),
  dispatchEvidence: vi.fn(),
}));

vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: mocks.authorize }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.adminClient }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.rateLimit }));
vi.mock('@/lib/ultimate-course-builder/worker/job-queue', () => ({
  UltimateJobQueue: class { enqueue = mocks.enqueue; },
}));
vi.mock('@/lib/gcp/course-worker-launch', () => ({ requestCourseWorker: mocks.dispatch }));
vi.mock('@/lib/ultimate-course-builder/worker/dispatch-evidence', () => ({
  recordCourseDispatch: mocks.dispatchEvidence,
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

// Keep generation-control and the shared course reactivation helper real. These
// tests must exercise the policy reads rather than stub a successful assertion.
import { POST } from '../../apps/admin/app/api/admin/ultimate-course-builder/run/route';

const COURSE_ID = '832cf9d8-e676-4bfb-a623-ab13a7ddf847';
const OTHER_COURSE_ID = '00000000-0000-4000-8000-000000000099';
const BUILD_ID = 'aeeeeeee-1111-4111-8111-111111111111';
const LESSON_ID = 'efff8a53-06ea-5235-a015-5d68fe39952e';
const ACTOR_ID = 'authenticated-course-owner';
const REVISION = '2026-11-24T00:00:00.000Z';
const PAUSE_KEY = 'course_builder_generation_paused';
type Row = Record<string, any>;
type QueryRecord = { table: string; operation: 'select' | 'update'; columns: string; values?: Row };
type Failure = { table: string; operation: 'select' | 'update'; columns?: string };
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function createMemoryDb() {
  const tables: Record<string, Row[]> = {
    system_settings: [{ key: PAUSE_KEY, value: false }],
    courses: [{
      id: COURSE_ID, status: 'draft', is_active: false, generation_paused: false,
      title: 'Forklift, Assembly, and Quality Training', duration_hours: 48,
      description: 'Authored course description', updated_at: REVISION,
      metadata: { authored_lessons: 24, workbook_required: true },
    }],
    ultimate_course_builds: [{
      id: BUILD_ID, course_id: COURSE_ID, status: 'initializing',
      current_step: 'standards_lock', updated_at: REVISION,
      profile: {
        ownerPaused: true,
        mediaAcquisitionOwnerId: 'original-source-owner',
        competencies: [{ id: LESSON_ID, title: 'Safety and authorization' }],
        canonicalLessonIds: { [LESSON_ID]: LESSON_ID },
        instructionalAuthoring: { provider: 'google', model: 'gemini-validation-model', location: 'us' },
        instructionalSources: [{ id: `course-lesson:${LESSON_ID}`, text: 'Complete reviewed source text.' }],
      },
    }],
    course_lessons: [{
      id: LESSON_ID, course_id: COURSE_ID, status: 'draft', approved: false,
      is_published: false, duration_minutes: 120,
      content: { html: '<p>Existing authored lesson.</p>' },
      content_json: {
        workbook: { brief: 'Keep the authored workbook activity.' },
        experience: {
          plannedMinutes: 120,
          knowledgeChecks: [{ id: 'authored-question', question: 'Existing question?' }],
          manufacturingSimulation: { version: 1, id: 'existing-simulation' },
        },
      },
    }],
  };
  const events: string[] = [];
  const queries: QueryRecord[] = [];
  const writes: QueryRecord[] = [];
  const failures: Failure[] = [];
  const hooks = { beforeUpdate: undefined as undefined | ((table: string) => void) };

  const from = vi.fn((table: string) => {
    if (!Object.hasOwn(tables, table)) throw new Error(`Unexpected database table: ${table}`);
    let operation: QueryRecord['operation'] = 'select';
    let columns = '*';
    let values: Row | undefined;
    const filters: Array<(row: Row) => boolean> = [];
    let result: { data: Row | Row[] | null; error: Row | null } | undefined;

    function execute(single: boolean) {
      if (result) return result;
      const record: QueryRecord = { table, operation, columns, ...(values ? { values: clone(values) } : {}) };
      queries.push(record);
      events.push(`${operation}:${table}`);
      if (operation === 'update') writes.push(record);
      if (failures.some(failure => failure.table === table && failure.operation === operation &&
        (!failure.columns || failure.columns === columns))) {
        return result = { data: null, error: { code: 'XX000', message: 'private-database-failure' } };
      }
      if (operation === 'update') hooks.beforeUpdate?.(table);
      const rows = tables[table].filter(row => filters.every(filter => filter(row)));
      if (operation === 'update') rows.forEach(row => Object.assign(row, clone(values)));
      // Honor projections so omitting course_id from the build SELECT cannot
      // accidentally pass because the fake returned unselected columns.
      const projected = rows.map(row => columns === '*' ? clone(row) : clone(Object.fromEntries(
        columns.split(',').map(column => column.trim()).map(column => [column, row[column]]),
      )));
      return result = { data: single ? projected[0] ?? null : projected, error: null };
    }

    const query = {
      select(value = '*') { columns = value; return query; },
      eq(column: string, value: unknown) { filters.push(row => row[column] === value); return query; },
      in(column: string, values: unknown[]) { filters.push(row => values.includes(row[column])); return query; },
      update(value: Row) { operation = 'update'; values = value; return query; },
      async single() { return execute(true); },
      async maybeSingle() { return execute(true); },
      then(resolve: (value: ReturnType<typeof execute>) => unknown) {
        return Promise.resolve(execute(false)).then(resolve);
      },
    };
    return query;
  });
  return { from, tables, events, queries, writes, failures, hooks };
}

let db: ReturnType<typeof createMemoryDb>;

beforeEach(() => {
  vi.resetAllMocks();
  db = createMemoryDb();
  mocks.authorize.mockResolvedValue({ id: ACTOR_ID, error: null });
  mocks.rateLimit.mockResolvedValue(null);
  mocks.adminClient.mockResolvedValue(db);
  mocks.enqueue.mockImplementation(async () => {
    db.events.push('enqueue');
    return { id: 'saved-job', status: 'queued', attempts: 0, max_attempts: 3 };
  });
  mocks.dispatch.mockImplementation(async () => {
    db.events.push('dispatch');
    return { dispatched: true };
  });
  mocks.dispatchEvidence.mockImplementation(async () => {
    db.events.push('dispatch-evidence');
    return true;
  });
});

function run(body: Row = {}) {
  return POST(new NextRequest('https://admin.elevateforhumanity.org/api/admin/ultimate-course-builder/run', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buildId: BUILD_ID, ...body }),
  }));
}

function expectNoQueueOrDispatch() {
  expect(mocks.enqueue).not.toHaveBeenCalled();
  expect(mocks.dispatch).not.toHaveBeenCalled();
  expect(mocks.dispatchEvidence).not.toHaveBeenCalled();
}

function expectUntouched(before: Record<string, Row[]>) {
  expect(db.writes).toEqual([]);
  expect(db.tables).toEqual(before);
  expect(mocks.rateLimit).not.toHaveBeenCalled();
  expectNoQueueOrDispatch();
}

describe('Ultimate run policy before reactivation and worker dispatch', () => {
  it.each([true, false])('denies a global pause without changing ownerPaused=%s', async ownerPaused => {
    db.tables.system_settings[0].value = true;
    db.tables.courses[0].status = 'archived';
    db.tables.ultimate_course_builds[0].profile.ownerPaused = ownerPaused;
    const before = clone(db.tables);
    expect((await run()).status).toBe(409);
    expectUntouched(before);
  });

  it('uses the saved build course rather than a caller-supplied allowlisted course', async () => {
    db.tables.system_settings[0].value = { paused: true, allowedCourseIds: [OTHER_COURSE_ID] };
    db.tables.courses[0].status = 'archived';
    const before = clone(db.tables);
    expect((await run({ courseId: OTHER_COURSE_ID })).status).toBe(409);
    expectUntouched(before);
  });

  it('allows the correctly allowlisted course while preserving its saved source contract', async () => {
    db.tables.system_settings[0].value = { paused: true, allowedCourseIds: [COURSE_ID] };
    const profileBefore = clone(db.tables.ultimate_course_builds[0].profile);
    const courseBefore = clone(db.tables.courses);
    const lessonsBefore = clone(db.tables.course_lessons);
    const response = await run({ actorId: 'spoofed-actor', requestedBy: 'spoofed-actor' });
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ ok: true, queued: true, dispatched: true, buildId: BUILD_ID });
    expect(db.tables.ultimate_course_builds[0].profile).toEqual({
      ...profileBefore,
      ownerPaused: false,
      pauseResumeAudit: {
        previousPauseFlag: true,
        resumedBy: ACTOR_ID,
        resumedAt: expect.any(String),
        action: 'explicit-admin-resume',
      },
    });
    expect(db.tables.courses).toEqual(courseBefore);
    expect(db.tables.course_lessons).toEqual(lessonsBefore);
    expect(mocks.enqueue).toHaveBeenCalledExactlyOnceWith(BUILD_ID, { requestedBy: ACTOR_ID });
    expect(mocks.dispatchEvidence).toHaveBeenCalledExactlyOnceWith(db, 'saved-job', { dispatched: true }, ACTOR_ID);
  });

  it.each([
    { globallyPaused: false, ownerPaused: false },
    { globallyPaused: false, ownerPaused: true },
    { globallyPaused: true, ownerPaused: false },
    { globallyPaused: true, ownerPaused: true },
  ])('never lets an allowlist or owner flag bypass the course pause: %j', async ({ globallyPaused, ownerPaused }) => {
    db.tables.system_settings[0].value = { paused: globallyPaused, allowedCourseIds: [COURSE_ID] };
    db.tables.courses[0].generation_paused = true;
    db.tables.courses[0].status = 'archived';
    db.tables.ultimate_course_builds[0].profile.ownerPaused = ownerPaused;
    const before = clone(db.tables);
    expect((await run()).status).toBe(409);
    expectUntouched(before);
  });

  it.each<Failure>([
    { table: 'system_settings', operation: 'select', columns: 'value' },
    { table: 'courses', operation: 'select', columns: 'generation_paused' },
    { table: 'courses', operation: 'select', columns: 'id,status' },
  ])('fails closed on a required policy or course read error: %j', async failure => {
    db.tables.courses[0].status = 'archived';
    db.failures.push(failure);
    const before = clone(db.tables);
    const response = await run();
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('private-database-failure');
    expectUntouched(before);
  });

  it('does not unpause a build whose mapped course is missing', async () => {
    db.tables.courses = [];
    const before = clone(db.tables);
    expect((await run()).status).toBe(409);
    expectUntouched(before);
  });

  it.each([null, undefined, ''])('rejects a build without a canonical course ID: %j', async courseId => {
    db.tables.ultimate_course_builds[0].course_id = courseId;
    const before = clone(db.tables);
    expect((await run({ courseId: COURSE_ID })).status).toBe(409);
    expectUntouched(before);
  });

  it('reactivates an allowed archived course before owner unpause, enqueue and dispatch', async () => {
    db.tables.courses[0].status = 'archived';
    const before = clone(db.tables);
    const response = await run();
    expect(response.status).toBe(202);
    expect(db.events.filter(event => event.startsWith('update:') || !event.startsWith('select:'))).toEqual([
      'update:courses', 'update:ultimate_course_builds', 'enqueue', 'dispatch', 'dispatch-evidence',
    ]);
    expect(db.events.indexOf('select:system_settings')).toBeLessThan(db.events.indexOf('update:courses'));
    expect(db.tables.courses[0]).toEqual({
      ...before.courses[0], status: 'draft', is_active: true, updated_at: expect.any(String),
    });
    expect(Object.keys(db.writes[0].values ?? {}).sort()).toEqual(['is_active', 'status', 'updated_at']);
    expect(db.tables.course_lessons).toEqual(before.course_lessons);
    const savedProfile = db.tables.ultimate_course_builds[0].profile;
    expect(savedProfile).toMatchObject({
      ...before.ultimate_course_builds[0].profile,
      ownerPaused: false,
      pauseResumeAudit: { resumedBy: ACTOR_ID, previousPauseFlag: true },
    });
    expect(savedProfile.instructionalSources).toEqual(before.ultimate_course_builds[0].profile.instructionalSources);
    expect(mocks.enqueue).toHaveBeenCalledExactlyOnceWith(BUILD_ID, { requestedBy: ACTOR_ID });
    expect(mocks.dispatch).toHaveBeenCalledTimes(1);
  });

  it('leaves an already unpaused draft and all authored data unchanged while dispatching', async () => {
    db.tables.ultimate_course_builds[0].profile.ownerPaused = false;
    const before = clone(db.tables);
    expect((await run()).status).toBe(202);
    expect(db.writes).toEqual([]);
    expect(db.tables).toEqual(before);
    expect(mocks.enqueue).toHaveBeenCalledExactlyOnceWith(BUILD_ID, { requestedBy: ACTOR_ID });
    expect(mocks.dispatch).toHaveBeenCalledTimes(1);
  });

  it('does not unpause or dispatch if archived course reactivation fails', async () => {
    db.tables.courses[0].status = 'archived';
    db.failures.push({ table: 'courses', operation: 'update' });
    const before = clone(db.tables);
    const response = await run();
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('private-database-failure');
    expect(db.writes).toEqual([expect.objectContaining({ table: 'courses', operation: 'update' })]);
    expect(db.tables).toEqual(before);
    expectNoQueueOrDispatch();
  });

  it('does not overwrite or dispatch a course changed after its archived status was read', async () => {
    db.tables.courses[0].status = 'archived';
    const buildBefore = clone(db.tables.ultimate_course_builds);
    const lessonsBefore = clone(db.tables.course_lessons);
    db.hooks.beforeUpdate = table => {
      if (table === 'courses') db.tables.courses[0].status = 'published';
    };
    const response = await run();
    expect(response.status).toBe(409);
    expect(db.tables.courses[0].status).toBe('published');
    expect(db.tables.courses[0].is_active).toBe(false);
    expect(db.tables.ultimate_course_builds).toEqual(buildBefore);
    expect(db.tables.course_lessons).toEqual(lessonsBefore);
    expect(db.writes).toEqual([expect.objectContaining({ table: 'courses', operation: 'update' })]);
    expectNoQueueOrDispatch();
  });

  it('rejects unauthorized requests before opening the database or applying the run limiter', async () => {
    mocks.authorize.mockResolvedValue({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) });
    expect((await run()).status).toBe(403);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.adminClient).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
    expectNoQueueOrDispatch();
  });

  it('applies the authenticated actor rate limit after policy reads and before any writes', async () => {
    db.tables.courses[0].status = 'archived';
    const before = clone(db.tables);
    mocks.rateLimit.mockResolvedValue(NextResponse.json({ error: 'Try again later' }, { status: 429 }));
    expect((await run({ actorId: 'spoofed-actor' })).status).toBe(429);
    expect(mocks.rateLimit).toHaveBeenCalledWith(expect.any(NextRequest), 'strict', { key: `course-resume:${ACTOR_ID}` });
    expect(mocks.adminClient).toHaveBeenCalledTimes(1);
    expect(db.queries).toContainEqual({ table: 'system_settings', operation: 'select', columns: 'value' });
    expect(db.queries).toContainEqual({ table: 'courses', operation: 'select', columns: 'generation_paused' });
    expect(db.writes).toEqual([]);
    expect(db.tables).toEqual(before);
    expectNoQueueOrDispatch();
  });
});
