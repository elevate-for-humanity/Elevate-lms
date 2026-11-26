import { beforeEach, expect, it, vi } from 'vitest';
import { UltimateReleaseService } from '@/lib/ultimate-course-builder/release/release-service';
import { manufacturingPracticeStore, fixtureGradingKey } from '../fixtures/manufacturing-practice-store';
import { simulationFixture } from '../fixtures/manufacturing-simulation';

const { prepare } = vi.hoisted(() => ({ prepare: vi.fn() }));
// The certified publication contract is covered separately; this suite exercises
// the real release service and real protected-spec loader at the write boundary.
vi.mock('@/lib/ultimate-course-builder/release/prepare-publication', () => ({ prepareUltimatePublication: prepare }));

const courseId = '12345678-1234-4234-8234-123456789012';
const lessonId = '12345678-1234-4234-8234-123456789013';
const buildId = '12345678-1234-4234-8234-123456789014';
beforeEach(() => vi.clearAllMocks());

function scenario() {
  const store = manufacturingPracticeStore(courseId, lessonId);
  const original = structuredClone(store.tables.course_lessons[0].content_json);
  const prepared = [{ canonicalLessonId: lessonId, sourceLessonBuildId: 'lesson-build',
    row: { content_json: original } }];
  const pkg = { courseId, buildId, profile: { publishCompletedLessons: true }, lessons: [{
    canonicalLessonId: lessonId, sourceLessonBuildId: 'lesson-build',
    contractArtifacts: { assessment_alignment: { authoredPreservation: { snapshot: { content: JSON.stringify(original) } } } },
  }] };
  store.tables.ultimate_release_versions = [{ id: 'historical-release', course_id: courseId, build_id: buildId, version: 1, package: pkg }];
  const rpc = vi.fn(async (name: string) => ({ error: null, data: name === 'commit_ultimate_lesson_release'
    ? { scope: 'lesson', lessonIds: [lessonId], committedAt: '2026-11-24T18:00:00Z' }
    : [{ id: 'new-release', version: 3, status: 'released' }] }));
  const db = { ...store.privateDb, rpc };
  const service = new UltimateReleaseService(db as any);
  vi.spyOn(service, 'derive').mockResolvedValue(pkg as any);
  prepare.mockReturnValue(prepared);
  return { ...store, db, service, rpc, pkg, prepared, original };
}

it('historical rollback retains its exact protected key after a newer public revision, without hydrating public data', async () => {
  const f = scenario();
  f.tables.course_lessons[0].content_json.experience.manufacturingSimulation = { changed: 'newer live revision' };
  const before = JSON.stringify(f.pkg);
  const result = await f.service.rollback(courseId, 1, 'actor');
  expect(result).toMatchObject({ status: 'released' });
  expect(JSON.stringify(f.pkg)).toBe(before);
  expect(f.filters).toContainEqual(['id', fixtureGradingKey]);
  expect(f.filters).toContainEqual(['course_id', courseId]);
  expect(f.filters).toContainEqual(['lesson_id', lessonId]);
  expect(f.rpc).toHaveBeenCalledExactlyOnceWith('commit_ultimate_release', expect.objectContaining({
    p_rolled_back_from: 'historical-release', p_package: f.pkg, p_rows: f.prepared,
  }));
  expect(JSON.stringify(f.rpc.mock.calls)).not.toContain('rationale');
  expect(f.tables.manufacturing_simulation_specs).toHaveLength(1);
  expect(f.tables.manufacturing_simulation_progress).toEqual([]);
});

it.each(['missing', 'course', 'lesson', 'problem', 'answers'] as const)(
  '%s grading mismatch rejects rollback before any mutation', async (mutation) => {
    const f = scenario();
    if (mutation === 'missing') f.tables.manufacturing_simulation_specs = [];
    if (mutation === 'course') f.tables.manufacturing_simulation_specs[0].course_id = 'different-course';
    if (mutation === 'lesson') f.tables.manufacturing_simulation_specs[0].lesson_id = 'different-lesson';
    if (mutation === 'problem') f.prepared[0].row.content_json.experience.manufacturingSimulation.brief = 'Tampered problem';
    if (mutation === 'answers') f.prepared[0].row.content_json.experience.manufacturingSimulation = {
      ...simulationFixture, gradingKeyId: fixtureGradingKey,
    };
    await expect(f.service.rollback(courseId, 1, 'actor')).rejects.toThrow(/Virtual practice/);
    expect(f.rpc).not.toHaveBeenCalled();
    expect(f.tables.manufacturing_simulation_progress).toEqual([]);
  },
);

it('valid content_json does not conceal an invalid serialized historical content mirror', async () => {
  const f = scenario();
  const content = structuredClone(f.original);
  content.experience.manufacturingSimulation.gradingKeyId = '22222222-2222-4222-8222-222222222222';
  f.pkg.lessons[0].contractArtifacts.assessment_alignment.authoredPreservation.snapshot.content = JSON.stringify(content);
  await expect(f.service.rollback(courseId, 1, 'actor')).rejects.toThrow('does not match');
  expect(f.rpc).not.toHaveBeenCalled();
});

it.each(['publish', 'partial'] as const)('%s validates grading before a fenced canonical release', async (mode) => {
  const f = scenario(), fence = { jobId: 'job', workerId: 'worker', generation: 2 };
  if (mode === 'publish') await f.service.publish(buildId, 'actor', fence);
  else await f.service.applyPackage(f.pkg, 'actor', fence);
  expect(f.rpc).toHaveBeenCalledWith(mode === 'publish' ? 'commit_ultimate_release' : 'commit_ultimate_lesson_release',
    expect.objectContaining({ p_fence: fence }));
  f.rpc.mockClear();
  f.errors.manufacturing_simulation_specs = new Error('Storage unavailable');
  await expect(mode === 'publish' ? f.service.publish(buildId, 'actor', fence) : f.service.applyPackage(f.pkg, 'actor', fence))
    .rejects.toThrow('could not be verified');
  expect(f.rpc).not.toHaveBeenCalled();
});

it('ordinary lessons retain the existing release path without protected grading queries', async () => {
  const f = scenario();
  f.prepared[0].row.content_json = { experience: {} } as any;
  f.pkg.lessons[0].contractArtifacts.assessment_alignment.authoredPreservation.snapshot.content = '<p>Ordinary lesson</p>';
  await f.service.publish(buildId, 'actor');
  expect(f.accesses).toEqual([]);
  expect(f.rpc).toHaveBeenCalledOnce();
});
