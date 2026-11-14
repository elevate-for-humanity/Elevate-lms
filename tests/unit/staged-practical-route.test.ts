import { afterEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({
  db: null as any,
  run: null as any,
  identity: null as any,
  owned: true,
  filters: [] as any[],
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => fixture.db }));
vi.mock('@/lib/ultimate-course-builder/testing/test-run-access', () => ({
  loadOwnedLearnerTest: async () =>
    fixture.owned
      ? {
          run: structuredClone(fixture.run),
          db: fixture.db,
          user: { id: 'learner', app_metadata: { ultimate_learner_test: true, run_id: 'run' } },
        }
      : null,
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
import { PATCH, POST } from '@/apps/lms/app/api/learner-testing/runs/[runId]/route';
import { submitStagedPractical } from '@/lib/ultimate-course-builder/testing/staged-practical';
const params = { params: Promise.resolve({ runId: 'run' }) };
const request = (input: unknown, token = 'test-secret'): any => ({
  headers: new Headers({ authorization: 'Bearer ' + token }),
  json: async () => input,
});
function setup() {
  vi.stubEnv('ULTIMATE_LEARNER_RUNTHROUGH_SECRET', 'test-secret');
  fixture.owned = true;
  fixture.filters = [];
  fixture.identity = { app_metadata: { ultimate_learner_test: true, run_id: 'run' } };
  fixture.run = {
    id: 'run',
    learner_id: 'learner',
    lesson_build_id: 'build',
    artifact_hash: 'hash',
    snapshot: {
      qaOnly: true,
      practicalRequired: true,
      practicalLesson: { content_json: { competencyId: 'skill' } },
      blueprint: { activities: [], mistakes: [{}] },
    },
    progress: {
      duration: 10,
      watchedSeconds: 10,
      scenario: { passed: true },
      assessment: { passed: true },
      qaPracticalArtifacts: [
        {
          id: 'file',
          path: 'run/practical/a.png',
          sha256: 'sha',
          runId: 'run',
          lessonBuildId: 'build',
          artifactHash: 'hash',
          syntheticQA: true,
        },
      ],
    },
  };
  fixture.db = {
    auth: { admin: { getUserById: async () => ({ data: { user: fixture.identity } }) } },
    from: (table: string) => {
      expect(table).toBe('ultimate_learner_test_runs');
      let mutation: any;
      const query: any = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          fixture.filters.push([key, value]);
          return query;
        },
        gt: (key: string, value: unknown) => {
          fixture.filters.push([key, value]);
          return query;
        },
        update: (value: any) => {
          mutation = value;
          return query;
        },
        maybeSingle: async () => {
          if (mutation) {
            Object.assign(fixture.run, mutation);
            return { data: { id: 'run' } };
          }
          return { data: structuredClone(fixture.run) };
        },
      };
      return query;
    },
  };
  fixture.run.progress = submitStagedPractical(fixture.run, {
    evidenceId: 'file',
    learnerAttestation: true,
  });
}
const review = () => ({
  lessonBuildId: 'build',
  artifactHash: 'hash',
  submissionId: fixture.run.progress.practical.id,
  revision: fixture.run.progress.practical.revision,
  decision: 'approved',
  competencyResults: { skill: true },
  comments: 'Synthetic QA only',
});
afterEach(() => vi.unstubAllEnvs());
it('review requires both service credential and the exact marked QA run identity', async () => {
  setup();
  expect((await PATCH(request(review(), 'wrong'), params)).status).toBe(401);
  fixture.identity.app_metadata.run_id = 'other';
  expect((await PATCH(request(review()), params)).status).toBe(403);
  fixture.identity.app_metadata.run_id = 'run';
  fixture.identity.app_metadata.ultimate_learner_test = false;
  expect((await PATCH(request(review()), params)).status).toBe(403);
  fixture.identity.app_metadata.ultimate_learner_test = true;
  fixture.run.snapshot.qaOnly = false;
  expect((await PATCH(request(review()), params)).status).toBe(403);
});
it('rejects completion before review, persists scoped review, then permits only QA completion', async () => {
  setup();
  expect((await POST(request({ action: 'complete' }), params)).status).toBe(409);
  const approved = await PATCH(request(review()), params);
  expect(approved.status).toBe(200);
  expect(await approved.json()).toMatchObject({ syntheticQA: true, realCompetencyAwarded: false });
  expect(fixture.filters.some(([key]) => key === 'expires_at')).toBe(true);
  expect(fixture.filters.some(([key]) => key === 'progress')).toBe(true);
  expect((await POST(request({ action: 'complete' }), params)).status).toBe(200);
  expect(fixture.run.progress.completed).toBe(true);
  expect(fixture.run.progress.practical.course_practical_reviews[0].reviewer_id).toBe(
    'qa-service:run',
  );
});
it('rejects stale review version without mutating the stored submission', async () => {
  setup();
  const before = structuredClone(fixture.run.progress);
  const result = await PATCH(request({ ...review(), revision: 999 }), params);
  expect(result.status).toBe(409);
  expect(fixture.run.progress).toEqual(before);
});
it('stores uploaded PNG bytes with server-generated scoped hash before allowing submission', async () => {
  setup();
  delete fixture.run.progress.practical;
  const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
  const file = new File([bytes], 'synthetic-qa.png', { type: 'image/png' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => bytes.buffer });
  const upload = vi.fn(async () => ({ error: null }));
  fixture.db.storage = {
    from: (bucket: string) => {
      expect(bucket).toBe('ultimate-learner-evidence');
      return { upload, remove: vi.fn() };
    },
  };
  const result = await POST(
    {
      headers: new Headers({ 'Content-Type': 'multipart/form-data' }),
      formData: async () => ({ get: () => file }),
    } as any,
    params,
  );
  expect(result.status).toBe(200);
  const { artifact } = await result.json();
  expect(artifact).toMatchObject({
    syntheticQA: true,
    runId: 'run',
    lessonBuildId: 'build',
    artifactHash: 'hash',
    bytes: bytes.length,
  });
  expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(artifact.path).toMatch(/^run\/practical\/[a-f0-9-]+\.png$/);
  expect(upload).toHaveBeenCalledWith(artifact.path, Buffer.from(bytes), {
    contentType: 'image/png',
    upsert: false,
  });
  expect(
    (
      await POST(
        request({ action: 'practical_submit', evidenceId: artifact.id, learnerAttestation: true }),
        params,
      )
    ).status,
  ).toBe(200);
  expect(fixture.run.progress.practical.artifact.sha256).toBe(artifact.sha256);
});
