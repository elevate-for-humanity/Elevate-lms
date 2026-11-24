import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  db: null as any,
  authorize: vi.fn(),
  adminClient: vi.fn(),
  enqueue: vi.fn(),
  dispatch: vi.fn(),
  dispatchEvidence: vi.fn(),
  registeredSupports: vi.fn(),
}));

vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: mocks.authorize }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.adminClient }));
vi.mock('@/lib/ultimate-course-builder/worker/job-queue', () => ({
  UltimateJobQueue: class { enqueue = mocks.enqueue; },
}));
vi.mock('@/lib/gcp/course-worker-launch', () => ({ requestCourseWorker: mocks.dispatch }));
vi.mock('@/lib/ultimate-course-builder/worker/dispatch-evidence', () => ({
  recordCourseDispatch: mocks.dispatchEvidence,
}));
vi.mock('@/lib/ultimate-course-builder/credential/appendix-a-source', () => ({
  UltimateAppendixAStandardsSource: class {
    supports = mocks.registeredSupports;
    async load() { throw new Error('This course has no registered Appendix A profile'); }
  },
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

// Deliberately retain the real buildUltimateProfile and source hydration. In
// particular, these draft bodies must not become implicitly authorized sources.
import { POST } from '../../apps/admin/app/api/admin/ultimate-course-builder/route';

const COURSE_ID = '832cf9d8-e676-4bfb-a623-ab13a7ddf847';
const ACTOR_ID = 'course-preparation-admin';
const canonicalLessons = [
  ['forklift-01', 'efff8a53-06ea-5235-a015-5d68fe39952e'],
  ['forklift-02', '08987762-5591-579e-adfb-40762b4aea7d'],
  ['forklift-03', '58631552-deff-596c-878b-3fa39771d6e6'],
  ['forklift-04', '06eb0367-357c-5d36-a4ae-3f4c237326cc'],
  ['ASM-01', '7fa70909-98cc-5785-8d60-c299f51ea4d8'],
  ['ASM-02', '476ec102-2049-5552-b5cf-d5135483d785'],
  ['ASM-03', '10bcc989-8f23-5df8-a71b-681c2402915c'],
  ['ASM-04', 'b967603f-e5ee-597d-9a39-069e1736f408'],
  ['ASM-05', '909a6e62-90d6-5679-81e5-1f7525f3756f'],
  ['ASM-06', '0f1c4377-176b-5011-8830-87044f1cf4ec'],
  ['ASM-07', '2db48f12-144a-5c9d-9743-e232b8aec601'],
  ['ASM-08', 'a6ee556e-a76b-549e-b5b5-0df17755e326'],
  ['QLT-01', '5b506b98-b2c9-57c8-8a90-7f1426188084'],
  ['QLT-02', '5b4ab1c9-13ad-5fc7-aac3-7f93b1faf6d6'],
  ['QLT-03', '56ed4b95-8836-5022-9ec4-d9816ba8854f'],
  ['QLT-04', '040c8b64-5350-55e5-b598-cd90c718037c'],
  ['QLT-05', 'c6d20430-0780-598c-bf5e-4bdf13f69e6d'],
  ['QLT-06', '32128971-5a34-5641-a327-e5ef91bb1022'],
  ['QLT-07', '9eabf922-f241-535d-9215-b32b894b186d'],
  ['QLT-08', 'a7d65da9-a246-5025-a267-7c8770d73e06'],
  ['QLT-09', '4f01aa3d-9357-52ab-982e-742545a09987'],
  ['QLT-10', '37a2ea6f-51e3-56db-ad96-67a3e2316fa1'],
  ['QLT-11', '65a63129-e8cf-54f0-8d63-f8c13b825591'],
  ['QLT-12', '44c6f1a3-de9d-5640-b247-56e5ec03d671'],
] as const;

type Row = Record<string, any>;
type Operation = 'select' | 'insert' | 'update';
type QueryRecord = { table: string; operation: Operation; columns: string; values?: Row };
type Failure = { table: string; operation: Operation; columns?: string };
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

/** Stateful PostgREST-shaped fake: filters, ordering, optimistic JSON equality,
 * and unique IDs affect actual stored rows instead of returning canned builds. */
function createMemoryDb() {
  const tables: Record<string, Row[]> = {
    courses: [{
      id: COURSE_ID,
      title: 'Forklift, Assembly, and Quality Training',
      slug: 'forklift-manufacturing-training',
      description: 'An existing 24-lesson draft course.',
      program_id: 'forklift-program',
      status: 'draft',
      is_active: false,
      is_published: false,
      duration_hours: 48,
    }],
    programs: [{ id: 'forklift-program', slug: 'forklift' }],
    course_lessons: canonicalLessons.map(([key, id], index) => ({
      id,
      course_id: COURSE_ID,
      slug: key.toLowerCase(),
      title: `Lesson ${key}`,
      order_index: index + 1,
      learning_objectives: [`Explain the objective for ${key}.`],
      content: { html: `<p>Unapproved draft teaching for ${key}.</p>` },
      content_json: { competencyId: key },
      approved: false,
      is_published: false,
      status: 'draft',
      duration_minutes: 120,
    })),
    apprenticeship_standard_versions: [],
    ultimate_course_builds: [],
  };
  const queries: QueryRecord[] = [];
  const mutations: QueryRecord[] = [];
  const failures: Failure[] = [];
  const from = vi.fn((table: string) => {
    if (!Object.hasOwn(tables, table)) throw new Error(`Unexpected table: ${table}`);
    let operation: Operation = 'select';
    let columns = '*';
    let values: Row | undefined;
    let maxRows = Infinity;
    let sort: { column: string; ascending: boolean } | undefined;
    const filters: Array<(row: Row) => boolean> = [];
    let execution: { data: Row[] | Row | null; error: Row | null } | undefined;

    function execute(single: boolean) {
      if (execution) return execution;
      const record = { table, operation, columns, ...(values ? { values: clone(values) } : {}) };
      queries.push(record);
      if (operation !== 'select') mutations.push(record);
      if (failures.some(failure => failure.table === table && failure.operation === operation &&
        (!failure.columns || columns === failure.columns))) {
        return execution = { data: null, error: { code: 'XX000', message: 'private-database-error' } };
      }

      let rows = tables[table].filter(row => filters.every(filter => filter(row)));
      if (sort) {
        const { column, ascending } = sort;
        rows.sort((a, b) => (a[column] < b[column] ? -1 : a[column] > b[column] ? 1 : 0) *
          (ascending ? 1 : -1));
      }
      rows = rows.slice(0, maxRows);
      if (operation === 'insert') {
        const row = clone({
          id: `legacy-build-${tables[table].length + 1}`,
          created_at: '2026-11-24T00:00:00.000Z',
          updated_at: '2026-11-24T00:00:00.000Z',
          ...values,
        });
        if (tables[table].some(existing => existing.id === row.id)) {
          return execution = { data: null, error: { code: '23505', message: 'Duplicate primary key' } };
        }
        tables[table].push(row);
        rows = [row];
      } else if (operation === 'update') {
        rows.forEach(row => Object.assign(row, clone(values)));
      }
      return execution = { data: clone(single ? rows[0] ?? null : rows), error: null };
    }

    const query = {
      select(value = '*') { columns = value; return query; },
      eq(column: string, value: unknown) {
        filters.push(row => column === 'profile' && typeof value === 'string'
          ? JSON.stringify(row[column]) === value
          : row[column] === value);
        return query;
      },
      or(expression: string) {
        if (expression !== 'content_json->>sourceOnly.is.null,content_json->>sourceOnly.neq.true') {
          throw new Error(`Unexpected filter: ${expression}`);
        }
        filters.push(row => row.content_json?.sourceOnly !== true);
        return query;
      },
      order(column: string, options?: { ascending?: boolean }) {
        sort = { column, ascending: options?.ascending !== false };
        return query;
      },
      limit(value: number) { maxRows = value; return query; },
      insert(value: Row) { operation = 'insert'; values = value; return query; },
      update(value: Row) { operation = 'update'; values = value; return query; },
      async single() { return execute(true); },
      async maybeSingle() { return execute(true); },
      then(resolve: (result: ReturnType<typeof execute>) => unknown) {
        return Promise.resolve(execute(false)).then(resolve);
      },
    };
    return query;
  });
  return { from, tables, queries, mutations, failures };
}

let db: ReturnType<typeof createMemoryDb>;

beforeEach(() => {
  vi.clearAllMocks();
  db = createMemoryDb();
  mocks.db = db;
  mocks.authorize.mockResolvedValue({ id: ACTOR_ID, error: null });
  mocks.adminClient.mockImplementation(async () => mocks.db);
  mocks.registeredSupports.mockReturnValue(false);
  mocks.enqueue.mockResolvedValue({ id: 'unexpected-job' });
  mocks.dispatch.mockResolvedValue({ dispatched: true });
  mocks.dispatchEvidence.mockResolvedValue(true);
});

function request(body: Row) {
  return new NextRequest('https://admin.elevateforhumanity.org/api/admin/ultimate-course-builder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function prepare(overrides: Row = {}) {
  return POST(request({ action: 'create', courseId: COURSE_ID, ...overrides }));
}

function expectNoGeneration() {
  expect(mocks.enqueue).not.toHaveBeenCalled();
  expect(mocks.dispatch).not.toHaveBeenCalled();
  expect(mocks.dispatchEvidence).not.toHaveBeenCalled();
}

describe('canonical course preparation through the authenticated Ultimate API', () => {
  it('saves a paused build with all 24 canonical draft identities without changing the course or lessons', async () => {
    const coursesBefore = clone(db.tables.courses);
    const lessonsBefore = clone(db.tables.course_lessons);
    const response = await prepare();
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result).toMatchObject({ ok: true, reused: false, queued: false, dispatched: false });
    expect(db.tables.ultimate_course_builds).toHaveLength(1);
    expect(result.buildId).toBe(db.tables.ultimate_course_builds[0].id);
    expect(result.build).toMatchObject({
      id: result.buildId, course_id: COURSE_ID, status: 'initializing', current_step: 'standards_lock',
      profile: { ownerPaused: true, mediaAcquisitionOwnerId: ACTOR_ID, authority: 'course-defined' },
    });
    const profile = result.build.profile;
    expect(profile.competencies.map((competency: Row) => competency.id)).toEqual(canonicalLessons.map(([, id]) => id));
    expect(profile.competencies.map((competency: Row) => competency.description)).toEqual(
      lessonsBefore.map(lesson => lesson.learning_objectives.join('; ')),
    );
    expect(profile.canonicalLessonIds).toEqual(Object.fromEntries(canonicalLessons.map(([, id]) => [id, id])));
    expect(profile.instructionalSources ?? []).toEqual([]);
    expect(profile.sourceDocuments).toEqual([]);
    expect(mocks.registeredSupports).toHaveBeenCalledWith({ programSlug: 'forklift' });
    expect(db.queries).toContainEqual(expect.objectContaining({
      table: 'course_lessons', columns: expect.stringContaining('approved,is_published,status'),
    }));
    expect(db.mutations).toEqual([expect.objectContaining({ table: 'ultimate_course_builds', operation: 'insert' })]);
    expect(db.tables.courses).toEqual(coursesBefore);
    expect(db.tables.course_lessons).toEqual(lessonsBefore);
    expectNoGeneration();
  });

  it('reuses preparation without changing the saved profile or inserting another build', async () => {
    const first = await (await prepare()).json();
    const before = clone(db.tables.ultimate_course_builds[0]);
    db.mutations.length = 0;
    const response = await prepare({
      title: 'A later request must not replace the locked title',
      instructionalAuthoring: { provider: 'google', model: 'gemini-another-model', location: 'eu' },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true, reused: true, buildId: first.buildId, build: before, queued: false, dispatched: false,
    });
    expect(db.tables.ultimate_course_builds).toEqual([before]);
    expect(db.mutations).toEqual([]);
    expectNoGeneration();
  });

  it('preserves the latest existing build even when it is already published', async () => {
    const existing = {
      id: 'existing-published-build', course_id: COURSE_ID, status: 'published', current_step: 'release',
      profile: { ownerPaused: false, title: 'Saved contract', instructionalSources: [{ id: 'kept', text: 'Reviewed source' }] },
      created_at: '2026-11-24T02:00:00.000Z',
    };
    db.tables.ultimate_course_builds.push(
      { ...clone(existing), id: 'older-build', status: 'failed', created_at: '2026-11-23T00:00:00.000Z' },
      clone(existing),
    );
    const response = await prepare();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, reused: true, buildId: existing.id, build: existing });
    expect(db.tables.ultimate_course_builds).toHaveLength(2);
    expect(db.tables.ultimate_course_builds[1]).toEqual(existing);
    expect(db.mutations).toEqual([]);
    expect(mocks.registeredSupports).not.toHaveBeenCalled();
    expectNoGeneration();
  });

  it('converges simultaneous preparations on one build without overwriting its profile', async () => {
    const responses = await Promise.all([prepare(), prepare()]);
    expect(responses.map(response => response.status)).toEqual([200, 200]);
    const results = await Promise.all(responses.map(response => response.json()));
    expect(db.tables.ultimate_course_builds).toHaveLength(1);
    expect(results[0].buildId).toBe(results[1].buildId);
    expect(results.map(result => result.reused).sort()).toEqual([false, true]);
    expect(results[0].build.profile).toEqual(results[1].build.profile);
    expect(db.mutations.filter(mutation => mutation.operation === 'insert')).toHaveLength(2);
    expect(db.mutations.every(mutation => mutation.table === 'ultimate_course_builds' && mutation.operation === 'insert')).toBe(true);
    expectNoGeneration();
  });

  it('attaches all 24 exact sources in successive batches before starting any generation', async () => {
    const prepared = await (await prepare()).json();
    const courseBefore = clone(db.tables.courses);
    const lessonsBefore = clone(db.tables.course_lessons);
    const identityBefore = clone(prepared.build.profile.canonicalLessonIds);
    const sources = canonicalLessons.map(([key, id]) => ({
      id: `course-lesson:${id}`,
      text: `Authorized course content: ${JSON.stringify({ html: `<p>Reviewed source for ${key}.</p>` })}`,
    }));
    for (const batch of [sources.slice(0, 12), sources.slice(12)]) {
      const response = await POST(request({
        action: 'configure-contract', buildId: prepared.buildId, instructionalSources: batch,
      }));
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ ok: true, buildId: prepared.buildId });
    }
    const saved = db.tables.ultimate_course_builds[0];
    expect(saved.profile.instructionalSources).toEqual(sources);
    expect(saved.profile.canonicalLessonIds).toEqual(identityBefore);
    expect(saved).toMatchObject({ status: 'initializing', current_step: 'standards_lock', profile: { ownerPaused: true } });
    expect(db.mutations.map(mutation => [mutation.table, mutation.operation])).toEqual([
      ['ultimate_course_builds', 'insert'], ['ultimate_course_builds', 'update'], ['ultimate_course_builds', 'update'],
    ]);
    expect(db.tables.courses).toEqual(courseBefore);
    expect(db.tables.course_lessons).toEqual(lessonsBefore);
    expectNoGeneration();
  });

  it('retains an explicitly selected valid Google authoring model without starting it', async () => {
    const authoring = { provider: 'google', model: 'gemini-validation-model', location: 'eu' };
    const response = await prepare({ instructionalAuthoring: authoring });
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.build.profile.instructionalAuthoring).toEqual({ ...authoring, version: 'source-grounded-teaching-1' });
    expect(result.build.profile.ownerPaused).toBe(true);
    expectNoGeneration();
  });

  it.each([
    { provider: 'other', model: 'gemini-validation-model', location: 'us' },
    { provider: 'google', model: 'not-a-gemini-model', location: 'us' },
    { provider: 'google', model: 'gemini-validation-model', location: 'unsupported-region' },
  ])('rejects invalid authoring configuration before inserting: %j', async instructionalAuthoring => {
    const response = await prepare({ instructionalAuthoring });
    expect(response.status).toBe(400);
    expect(db.tables.ultimate_course_builds).toEqual([]);
    expect(db.mutations).toEqual([]);
    expectNoGeneration();
  });

  it('requires an existing course and never inserts a build for a missing course', async () => {
    expect((await prepare({ courseId: '' })).status).toBe(400);
    expect((await prepare({ courseId: 'missing-course' })).status).toBe(404);
    expect(db.tables.ultimate_course_builds).toEqual([]);
    expect(db.mutations).toEqual([]);
    expectNoGeneration();
  });

  it.each<Failure>([
    { table: 'courses', operation: 'select' },
    { table: 'programs', operation: 'select' },
    { table: 'ultimate_course_builds', operation: 'select' },
    { table: 'apprenticeship_standard_versions', operation: 'select' },
    { table: 'course_lessons', operation: 'select', columns: 'id,title,learning_objectives' },
    { table: 'course_lessons', operation: 'select', columns: 'id,slug,title,learning_objectives,content,content_json,approved,is_published,status' },
    { table: 'course_lessons', operation: 'select', columns: 'id' },
  ])('does not save a partial build when a required read fails: %j', async failure => {
    db.failures.push(failure);
    const response = await prepare();
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('private-database-error');
    expect(db.tables.ultimate_course_builds).toEqual([]);
    expect(db.mutations).toEqual([]);
    expectNoGeneration();
  });

  it('reports a failed insert without returning a successful build', async () => {
    db.failures.push({ table: 'ultimate_course_builds', operation: 'insert' });
    const response = await prepare();
    expect(response.status).toBe(500);
    const result = await response.json();
    expect(result.ok).not.toBe(true);
    expect(result.error).not.toContain('private-database-error');
    expect(db.tables.ultimate_course_builds).toEqual([]);
    expectNoGeneration();
  });

  it.each(['create', 'configure-contract'])('rejects unauthorized %s before opening the database', async action => {
    mocks.authorize.mockResolvedValue({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) });
    const response = await POST(request({ action, courseId: COURSE_ID, buildId: 'any-build' }));
    expect(response.status).toBe(403);
    expect(mocks.adminClient).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
    expect(db.mutations).toEqual([]);
    expectNoGeneration();
  });

  it('preserves the legacy create contract when callers supply a raw profile', async () => {
    const profile = { id: 'legacy-profile', title: 'Existing integration', competencies: [], sourceDocuments: [], ownerPaused: true };
    const response = await prepare({ profile });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      build: { course_id: COURSE_ID, status: 'initializing', profile: { ...profile, mediaAcquisitionOwnerId: ACTOR_ID } },
    });
    expect(db.tables.ultimate_course_builds).toHaveLength(1);
    expect(db.queries.every(query => query.table === 'ultimate_course_builds')).toBe(true);
    expect(mocks.registeredSupports).not.toHaveBeenCalled();
    expectNoGeneration();
  });
});
