import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { simulationFixture, correctFixtureResponses } from '../fixtures/manufacturing-simulation';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  access: vi.fn(),
  client: vi.fn(),
  rate: vi.fn(),
}));
vi.mock('@/lib/auth/requireAuth', () => ({ requireAuth: mocks.auth }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.client }));
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
  const tables: Record<string, Array<Record<string, any>>> = {
    course_lessons: [
      {
        id: lessonId,
        course_id: courseId,
        slug: 'fixture-inspection',
        title: 'Inspection',
        content_json: { experience: { manufacturingSimulation: simulationFixture } },
      },
    ],
    interaction_progress: [],
  };
  const accesses: string[] = [];
  const db = {
    from(table: string) {
      accesses.push(table);
      const filters: Array<[string, unknown]> = [];
      let payload: Record<string, any> | null = null;
      function execute(single = false) {
        if (!(table in tables)) throw new Error(`Unexpected table access ${table}`);
        if (payload) {
          const existing = tables[table].find(
            (row) =>
              row.learner_id === payload?.learner_id &&
              row.lesson_id === payload?.lesson_id &&
              row.interaction_id === payload?.interaction_id,
          );
          if (existing) Object.assign(existing, payload);
          else tables[table].push({ ...payload });
          return { data: payload, error: null };
        }
        const selected = tables[table].filter((row) =>
          filters.every(([key, value]) => row[key] === value),
        );
        return { data: single ? (selected[0] ?? null) : selected, error: null };
      }
      const query: any = {
        select: () => query,
        eq: (key: string, value: unknown) => {
          filters.push([key, value]);
          return query;
        },
        upsert: (row: Record<string, any>) => {
          payload = row;
          return query;
        },
        single: async () => execute(true),
        maybeSingle: async () => execute(true),
        then: (resolve: any, reject: any) => Promise.resolve(execute()).then(resolve, reject),
      };
      return query;
    },
  };
  return { tables, db, accesses };
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
  });
  it('preserves the lesson enrollment gate before data reads or writes', async () => {
    mocks.access.mockRejectedValue(new Error('Denied'));
    expect((await POST(request())).status).toBe(403);
    expect(mocks.client).not.toHaveBeenCalled();
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
    expect(fixture.tables.interaction_progress).toHaveLength(1);
    expect(new Set(fixture.accesses)).toEqual(new Set(['course_lessons', 'interaction_progress']));
  });
  it('returns the public problem without answer keys and reconstructs saved feedback from responses', async () => {
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
    expect(interaction.data.initialAttempt).toMatchObject({ score: 80, completed: false });
    expect(interaction.data.initialAttempt.feedback.criticalMisses).toBe(1);
  });
});
