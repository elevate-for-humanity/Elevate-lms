import { beforeEach, expect, it, vi } from 'vitest';
import { loadManufacturingSimulationSpec, assertManufacturingLessonSpecs } from '@/lib/lms/manufacturing-simulation-store';
import { manufacturingPracticeStore, fixtureGradingKey } from '../fixtures/manufacturing-practice-store';
import { simulationFixture } from '../fixtures/manufacturing-simulation';
import { publicManufacturingSimulation } from '@/lib/lms/manufacturing-simulation';
const { admin } = vi.hoisted(() => ({ admin: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: admin }));
import { cloneCanonicalCourse, cloneEditedCourseRevision } from '@/lib/course-builder/clone-service';
import { rollbackCourseVersion } from '@/lib/course-factory/versioning';

const courseId = '12345678-1234-4234-8234-123456789012';
const lessonId = '12345678-1234-4234-8234-123456789013';
beforeEach(() => vi.clearAllMocks());

it('loads a JSON-round-tripped public problem with optional fields omitted and harmless authoring metadata', async () => {
  const store = manufacturingPracticeStore(courseId, lessonId);
  const value = store.tables.course_lessons[0].content_json.experience.manufacturingSimulation;
  value.authoringNote = 'Internal author annotation';
  store.tables.manufacturing_simulation_specs[0].spec.authoringNote = value.authoringNote;
  const loaded = await loadManufacturingSimulationSpec(store.privateDb as any, courseId, lessonId, JSON.parse(JSON.stringify(value)));
  expect(loaded.tasks[0].expected).toBe(simulationFixture.tasks[0].expected);
  expect(loaded.gradingKeyId).toBe(fixtureGradingKey);
  expect(store.filters).toContainEqual(['id', fixtureGradingKey]);
  expect(store.filters).toContainEqual(['lesson_id', lessonId]);
  expect(store.filters).toContainEqual(['course_id', courseId]);
});

it('rejects answer-bearing public content, wrong lesson identity and mismatched public problems', async () => {
  const store = manufacturingPracticeStore(courseId, lessonId);
  await expect(loadManufacturingSimulationSpec(store.privateDb as any, courseId, lessonId,
    { ...simulationFixture, gradingKeyId: fixtureGradingKey })).rejects.toThrow('protected authoring');
  const value = publicManufacturingSimulation({ ...simulationFixture, gradingKeyId: fixtureGradingKey });
  await expect(loadManufacturingSimulationSpec(store.privateDb as any, courseId, 'another-lesson', value)).rejects.toThrow('does not match');
  await expect(loadManufacturingSimulationSpec(store.privateDb as any, courseId, lessonId,
    { ...value, brief: 'A different public problem.' })).rejects.toThrow('does not match');
});

it('preflights serialized content and every non-null mirror without hydrating the public lesson', async () => {
  const store = manufacturingPracticeStore(courseId, lessonId);
  const source = { ...store.tables.course_lessons[0], content: JSON.stringify(store.tables.course_lessons[0].content_json) };
  const original = JSON.stringify(source);
  await assertManufacturingLessonSpecs(store.privateDb as any, courseId, [source]);
  expect(JSON.stringify(source)).toBe(original);
  expect(store.accesses.filter((entry) => entry.table === 'manufacturing_simulation_specs')).toHaveLength(2);
  await assertManufacturingLessonSpecs({ from: () => { throw new Error('Unrelated lesson queried grading storage'); } } as any,
    courseId, [{ id: 'ordinary', content: '<p>HTML lesson</p>', content_json: { experience: { manufacturingSimulation: null } } }]);
});

function invalidReferenceDb() {
  const sourceLesson = manufacturingPracticeStore(courseId, lessonId).tables.course_lessons[0];
  const sourceCourse = { id: courseId, slug: 'example', title: 'Example course' };
  const mutations: string[] = [];
  const db = {
    from(table: string) {
      let lookupExistingRevision = false;
      const result = () => ({ data: table === 'courses' ? (lookupExistingRevision ? null : sourceCourse)
        : table === 'course_modules' ? [{ id: 'module', course_lessons: [sourceLesson] }]
          : table === 'course_versions' ? { version_number: 1, snapshot: { course: sourceCourse, modules: [], lessons: [sourceLesson] } }
            : null, error: null });
      const q: any = {
        select: () => q, eq: () => q, order: () => q,
        contains: () => { lookupExistingRevision = true; return q; },
        maybeSingle: async () => result(),
        insert: () => { mutations.push(table); throw new Error('Mutation occurred before grading validation'); },
        update: () => { mutations.push(table); throw new Error('Mutation occurred before grading validation'); },
        then: (resolve: any, reject: any) => Promise.resolve(result()).then(resolve, reject),
      };
      return q;
    },
  };
  return { db, sourceCourse, sourceLesson, mutations };
}

it('a missing grading reference prevents a canonical clone before creating course or modules', async () => {
  const fixture = invalidReferenceDb();
  admin.mockResolvedValue(fixture.db);
  await expect(cloneCanonicalCourse({ courseId })).rejects.toThrow('does not match');
  expect(fixture.mutations).toEqual([]);
});
it('a missing grading reference prevents an AI revision before creating records', async () => {
  const fixture = invalidReferenceDb();
  await expect(cloneEditedCourseRevision({ db: fixture.db, sourceCourse: fixture.sourceCourse,
    sourceLessons: [fixture.sourceLesson], sourceModules: [], lessonId, patch: { course: {}, lesson: {} },
    actorId: 'actor', requestId: 'request', uuid: () => 'unused' })).rejects.toThrow('does not match');
  expect(fixture.mutations).toEqual([]);
});
it('an invalid snapshot grading reference prevents rollback before publication state changes', async () => {
  const fixture = invalidReferenceDb();
  await expect(rollbackCourseVersion(fixture.db as any, courseId, 1, 'actor')).rejects.toThrow('does not match');
  expect(fixture.mutations).toEqual([]);
});
