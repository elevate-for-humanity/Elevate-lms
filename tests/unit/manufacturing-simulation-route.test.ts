import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { correctFixtureResponses } from '../fixtures/manufacturing-simulation';
import { manufacturingPracticeStore, fixtureGradingKey } from '../fixtures/manufacturing-practice-store';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  access: vi.fn(),
  client: vi.fn(),
  privateClient: vi.fn(),
  rate: vi.fn(),
}));
vi.mock('@/lib/auth/requireAuth', () => ({ requireAuth: mocks.auth }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.client }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.privateClient }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.rate }));
vi.mock('@/lib/lms/access-control', () => ({
  assertLessonAccess: mocks.access,
  accessErrorResponse: () => ({ body: { error: 'Enrollment required' }, status: 403 }),
}));
vi.mock('@/lib/course-factory/learning-objects', () => ({ buildLessonLearningObjects: () => [] }));
import { GET, POST } from '@/apps/lms/app/api/learner/interactions/route';

const courseId = '3cc76f20-2dbf-4e9d-8cc9-a9a90879d102';
const lessonId = '26c4873c-57a7-4e5f-a512-a7d7eb2aeb08';
const learnerId = '0d9fb23e-c834-43d1-a990-6397d24a1b3a';
const requestBody = {
  courseId,
  lessonId,
  interactionId: 'fixture-inspection-manufacturing',
  interactionType: 'manufacturing-simulation',
  responses: correctFixtureResponses,
};
function request(body = requestBody) {
  return new NextRequest('https://app.example.test/api/learner/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function databaseFixture() {
  const fixture = manufacturingPracticeStore(courseId, lessonId);
  mocks.privateClient.mockResolvedValue(fixture.privateDb);
  return { ...fixture, db: fixture.learnerDb };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: learnerId }, error: null });
  mocks.access.mockResolvedValue(undefined);
  mocks.rate.mockResolvedValue(null);
});

describe('manufacturing simulation API', () => {
  it('rejects an unauthenticated attempt before querying data', async () => {
    mocks.auth.mockResolvedValue({ user: null, error: new Error('Unauthorized') });
    expect((await POST(request())).status).toBe(401);
    expect(mocks.client).not.toHaveBeenCalled();
    expect(mocks.privateClient).not.toHaveBeenCalled();
  });
  it('preserves the lesson enrollment gate before data reads or writes', async () => {
    mocks.access.mockRejectedValue(new Error('Denied'));
    expect((await POST(request())).status).toBe(403);
    expect(mocks.client).not.toHaveBeenCalled();
    expect(mocks.privateClient).not.toHaveBeenCalled();
  });
  it('binds the posted lesson to the posted course', async () => {
    const fixture = databaseFixture();
    mocks.client.mockResolvedValue(fixture.db);
    expect(
      (await POST(request({ ...requestBody, courseId: '559383b3-8332-4783-aa1f-c6db594dd670' })))
        .status,
    ).toBe(404);
    expect(fixture.tables.interaction_progress).toHaveLength(0);
  });
  it('rejects client scores, fabricated interaction IDs, and incomplete answers', async () => {
    const fixture = databaseFixture();
    mocks.client.mockResolvedValue(fixture.db);
    expect((await POST(request({ ...requestBody, score: 100 } as any))).status).toBe(400);
    expect(
      (await POST(request({ ...requestBody, interactionId: 'other-lesson-manufacturing' }))).status,
    ).toBe(400);
    expect(
      (await POST(request({ ...requestBody, responses: { safety: 'hold' } } as any))).status,
    ).toBe(400);
    expect(fixture.tables.interaction_progress).toHaveLength(0);
  });
  it('saves server-scored practice and a later retry without touching completion or hours', async () => {
    const fixture = databaseFixture();
    mocks.client.mockResolvedValue(fixture.db);
    const failed = await POST(
      request({ ...requestBody, responses: { ...correctFixtureResponses, safety: 'go' } }),
    );
    expect((await failed.json()).attempt).toMatchObject({
      score: 80,
      completed: false,
      attempts: 1,
      interaction_type: 'simulation',
    });
    const passed = await POST(request());
    expect(passed.headers.get('Cache-Control')).toBe('private, no-store');
    expect((await passed.json()).attempt).toMatchObject({
      score: 100,
      completed: true,
      attempts: 2,
      learner_id: learnerId,
    });
    expect(fixture.tables.interaction_progress).toHaveLength(0);
    expect(fixture.tables.manufacturing_simulation_progress).toHaveLength(1);
    expect(fixture.tables.manufacturing_simulation_progress[0].spec_id).toBe(fixtureGradingKey);
    expect(fixture.accesses.filter((entry) => entry.role === 'learner').every((entry) => entry.table === 'course_lessons')).toBe(true);
    expect(new Set(fixture.accesses.map((entry) => entry.table))).toEqual(new Set(['course_lessons', 'manufacturing_simulation_specs', 'manufacturing_simulation_progress']));
  });
  it('ignores forged generic progress and returns no answer key before a server submission', async () => {
    const fixture = databaseFixture();
    mocks.client.mockResolvedValue(fixture.db);
    fixture.tables.interaction_progress.push({
      learner_id: learnerId,
      course_id: courseId,
      lesson_id: lessonId,
      lesson_slug: 'fixture-inspection',
      interaction_id: requestBody.interactionId,
      score: 100,
      completed: true,
      attempts: 1,
      answers: { ...correctFixtureResponses, safety: 'go' },
      feedback: { fabricated: true },
    });
    const response = await GET(
      new NextRequest(
        `https://app.example.test/api/learner/interactions?courseId=${courseId}&lessonId=${lessonId}`,
      ),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    const interaction = body.interactions.find(
      (item: any) => item.type === 'manufacturing-simulation',
    );
    expect(interaction.data.tasks[0]).not.toHaveProperty('expected');
    expect(body.experience.manufacturingSimulation.tasks[0]).not.toHaveProperty('rationale');
    expect(interaction.data.initialAttempt).toBeNull();
    expect(interaction.completed).toBe(false);
    expect(JSON.stringify(body)).not.toContain('expected');
  });
  it('restores only accepted server feedback and derives current interaction state from grading', async () => {
    const fixture = databaseFixture();
    mocks.client.mockResolvedValue(fixture.db);
    await POST(request({ ...requestBody, responses: { ...correctFixtureResponses, safety: 'go' } }));
    // Even a stale internal display flag must not replace canonical grading.
    Object.assign(fixture.tables.manufacturing_simulation_progress[0], { score: 100, completed: true });
    const response = await GET(new NextRequest(`https://app.example.test/api/learner/interactions?courseId=${courseId}&lessonId=${lessonId}`));
    const body = await response.json();
    const interaction = body.interactions.find((item: any) => item.type === 'manufacturing-simulation');
    expect(interaction).toMatchObject({ score: 80, completed: false, attempts: 1 });
    expect(interaction.data.initialAttempt).toMatchObject({ score: 80, completed: false });
    expect(interaction.data.initialAttempt.feedback.criticalMisses).toBe(1);
  });
  it('does not reveal a revised key from an attempt submitted against an older grading version', async () => {
    const fixture = databaseFixture();
    mocks.client.mockResolvedValue(fixture.db);
    await POST(request());
    const newKey = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    fixture.tables.manufacturing_simulation_specs.push({ ...fixture.tables.manufacturing_simulation_specs[0], id: newKey });
    fixture.tables.course_lessons[0].content_json.experience.manufacturingSimulation.gradingKeyId = newKey;
    const response = await GET(new NextRequest(`https://app.example.test/api/learner/interactions?courseId=${courseId}&lessonId=${lessonId}`));
    const body = await response.json();
    const interaction = body.interactions.find((item: any) => item.type === 'manufacturing-simulation');
    expect(interaction.data.initialAttempt).toBeNull();
    expect(interaction.completed).toBe(false);
    expect(JSON.stringify(body)).not.toContain('expected');
    const retry = await POST(request());
    expect((await retry.json()).attempt).toMatchObject({ spec_id: newKey, completed: true, attempts: 1 });
  });
  it('fails closed when the protected spec is missing or does not match the public lesson', async () => {
    const fixture = databaseFixture();
    mocks.client.mockResolvedValue(fixture.db);
    fixture.tables.manufacturing_simulation_specs[0].spec.brief += ' Different scenario.';
    expect((await POST(request())).status).toBe(500);
    expect(fixture.tables.manufacturing_simulation_progress).toHaveLength(0);
    fixture.tables.manufacturing_simulation_specs = [];
    expect((await POST(request())).status).toBe(500);
  });

});
