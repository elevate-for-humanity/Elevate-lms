// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { HvacSimulationAction, HvacSimulationRequest } from '@/lib/lms/hvac-simulation-types';

type Row = Record<string, unknown>;
type DatabaseError = { code?: string; message: string };
const m = vi.hoisted(() => ({
  user: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as { id: string } | null,
  access: vi.fn(),
  capacity: 'learner' as 'learner' | 'instructor' | 'denied',
  rate: vi.fn(),
  client: vi.fn(),
  admin: vi.fn(),
  rows: [] as Row[],
  lesson: null as Row | null,
  sessionReady: true,
  sessionError: null as DatabaseError | null,
  readError: null as DatabaseError | null,
  saveError: null as DatabaseError | null,
  conflict: false,
  insertRace: false,
  writes: [] as { table: string; mode: string; values: Row; filters: [string, unknown][] }[],
}));

vi.mock('@/lib/lms/hvac-access-mode', () => ({
  getHvacAccessMode: async () => ({
    mode: m.capacity,
    licenseReference: m.capacity === 'instructor' ? 'licensed' : null,
  }),
}));

vi.mock('@/lib/auth/requireAuth', () => ({
  requireAuth: async () => ({ user: m.user, error: null }),
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: m.rate }));
vi.mock('@/lib/supabase/server', () => ({ createClient: m.client }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: m.admin }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/lms/access-control', () => ({
  assertLessonAccess: m.access,
  accessErrorResponse: (error: unknown) => ({
    status: error instanceof Error && error.message === 'LESSON_NOT_FOUND' ? 404 : 403,
    body: { error: 'Lesson access denied' },
  }),
}));

// The transport test deliberately uses a tiny deterministic engine. The actual
// curriculum engine has its own full-catalog tests; these cases isolate trusted
// persistence, authorization, optimistic concurrency and replay/reset behavior.
vi.mock('@/lib/lms/hvac-course-simulations', () => {
  type State = { mode: string; observed: boolean; finished: boolean; mistakes: number };
  const definition = {
    id: 'hvac-sim:chapter-01:v1',
    version: 'v1',
    lessonId: 'f1d32b7f-7cd4-44c4-9858-6b756ef21b89',
  };
  function apply(_definition: unknown, state: State, action: HvacSimulationAction): State {
    const next = { ...state };
    if (state.finished) throw new Error('Finished attempt');
    if (action.type === 'set-control') {
      if (action.controlId !== 'mode' || !['run', 'stop'].includes(String(action.value)))
        throw new Error('Invalid control');
      next.mode = String(action.value);
      next.observed = false;
    } else if (action.type === 'observe') {
      next.observed = true;
    } else {
      if (
        action.stageId !== 'diagnose' ||
        !['safe', 'unsafe'].includes(action.optionId) ||
        !state.observed
      )
        throw new Error('Invalid sequence');
      if (action.optionId === 'safe' && state.mode === 'run') next.finished = true;
      else next.mistakes++;
    }
    return next;
  }
  return {
    getHvacSimulationDefinition: (lessonId: string) =>
      lessonId === definition.lessonId ? definition : undefined,
    replayHvacSimulation: (def: unknown, actions: HvacSimulationAction[]) =>
      actions.reduce((state, action) => apply(def, state, action), {
        mode: 'stop',
        observed: false,
        finished: false,
        mistakes: 0,
      }),
    applyHvacSimulationAction: apply,
    buildHvacSimulationView: (_def: unknown, state: State) => ({
      ...definition,
      chapter: 1,
      title: 'Deterministic fixture',
      scenario: 'Choose a safe diagnostic action.',
      objective: 'Use evidence',
      panel: 'workflow',
      controls: [
        {
          id: 'mode',
          label: 'Mode',
          type: 'select',
          value: state.mode,
          options: [
            { value: 'run', label: 'Run' },
            { value: 'stop', label: 'Stop' },
          ],
        },
      ],
      readings: [{ id: 'state', label: 'Machine state', value: state.mode, status: 'neutral' }],
      stage: state.finished
        ? null
        : {
            id: 'diagnose',
            title: 'Diagnose',
            prompt: 'Choose a response',
            options: [
              { id: 'safe', label: 'Safe' },
              { id: 'unsafe', label: 'Unsafe' },
            ],
            observationRequired: true,
          },
      stageNumber: state.finished ? 1 : 0,
      stageCount: 1,
      observed: state.observed,
      finished: state.finished,
      passed: state.finished && state.mistakes <= 1,
      score: state.finished ? Math.max(0, 100 - state.mistakes * 20) : null,
      feedback: null,
      sources: [],
    }),
  };
});

import { GET, POST } from '@/apps/lms/app/api/learner/hvac-simulations/route';
const courseId = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
const lessonId = 'f1d32b7f-7cd4-44c4-9858-6b756ef21b89';
const simulationId = 'hvac-sim:chapter-01:v1';
const url = 'https://app.elevateforhumanity.org/api/learner/hvac-simulations';
const learnerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function matches(row: Row, filters: [string, unknown][]) {
  return filters.every(([column, value]) => {
    const [field, key] = column.split('->>');
    if (key) return String((row[field] as Row)?.[key]) === String(value);
    return row[field] === value;
  });
}

function database(privileged: boolean) {
  return {
    rpc: vi.fn(async (name: string) => {
      expect(name).toBe('hvac_simulation_session_ready');
      expect(privileged).toBe(false);
      return { data: m.sessionReady, error: m.sessionError };
    }),
    from(table: string) {
      let mode = 'read';
      let values: Row = {};
      const filters: [string, unknown][] = [];
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          filters.push([column, value]);
          return query;
        },
        insert: (input: Row) => {
          mode = 'insert';
          values = input;
          return query;
        },
        update: (input: Row) => {
          mode = 'update';
          values = input;
          return query;
        },
        async maybeSingle() {
          if (mode === 'read') {
            if (m.readError) return { data: null, error: m.readError };
            const row =
              table === 'course_lessons'
                ? m.lesson
                : m.rows.find((entry) => matches(entry, filters));
            return {
              data: row && matches(row, filters) ? structuredClone(row) : null,
              error: null,
            };
          }
          expect(privileged).toBe(true);
          m.writes.push({ table, mode, values: structuredClone(values), filters: [...filters] });
          if (m.saveError) return { data: null, error: m.saveError };
          if (m.conflict) return { data: null, error: null };
          if (mode === 'insert') {
            const row = { id: randomUUID(), ...structuredClone(values) };
            m.rows.push(row);
            if (m.insertRace)
              return {
                data: null,
                error: { code: '23505', message: 'Competing identical request committed first' },
              };
            return { data: row, error: null };
          }
          const index = m.rows.findIndex((row) => matches(row, filters));
          if (index < 0) return { data: null, error: null };
          m.rows[index] = { ...m.rows[index], ...structuredClone(values) };
          return { data: structuredClone(m.rows[index]), error: null };
        },
      };
      return query;
    },
  };
}

function get(query = { courseId, lessonId }) {
  return GET(new NextRequest(`${url}?${new URLSearchParams(query)}`));
}
function request(
  action: HvacSimulationRequest['action'],
  expectedRevision = 0,
  overrides: Record<string, unknown> = {},
) {
  return {
    courseId,
    lessonId,
    simulationId,
    expectedRevision,
    requestId: randomUUID(),
    action,
    ...overrides,
  };
}
function post(body: unknown) {
  return POST(
    new NextRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}
async function pass() {
  for (const [index, action] of [
    { type: 'set-control', controlId: 'mode', value: 'run' },
    { type: 'observe' },
    { type: 'choose', stageId: 'diagnose', optionId: 'safe' },
  ].entries())
    expect((await post(request(action as HvacSimulationAction, index))).status).toBe(200);
}

beforeEach(() => {
  vi.clearAllMocks();
  m.user = { id: learnerId };
  m.capacity = 'learner';
  m.access.mockResolvedValue(undefined);
  m.rate.mockResolvedValue(null);
  m.sessionReady = true;
  m.sessionError = null;
  m.readError = null;
  m.saveError = null;
  m.conflict = false;
  m.insertRace = false;
  m.writes = [];
  m.lesson = { id: lessonId, course_id: courseId, slug: 'hvac-orientation', is_published: true };
  m.rows = [
    {
      id: randomUUID(),
      learner_id: learnerId,
      course_id: courseId,
      lesson_id: lessonId,
      interaction_id: 'hvac-orientation-kc',
      interaction_type: 'knowledge-check',
      score: 80,
      completed: true,
      answers: [1, 2],
    },
  ];
  m.client.mockImplementation(async () => database(false));
  m.admin.mockImplementation(async () => database(true));
});

describe('authorized HVAC visual-simulation API', () => {
  it('requires sign-in before accessing lessons or progress', async () => {
    m.user = null;
    expect((await get()).status).toBe(401);
    expect((await post(request({ type: 'observe' }))).status).toBe(401);
    expect(m.access).not.toHaveBeenCalled();
    // Authorization now needs privileged reads; denied requests must still
    // perform zero privileged writes.
    expect(m.writes).toEqual([]);
  });

  it('rate-limits by account before querying course data', async () => {
    m.rate.mockResolvedValue(new Response('{}', { status: 429 }));
    const response = await get();
    expect(response.status).toBe(429);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(m.access).not.toHaveBeenCalled();
  });

  it('denies revoked enrollment or a locked lesson before reading data or privileged writes', async () => {
    m.access.mockRejectedValue(new Error('ACCESS_DENIED'));
    expect((await get()).status).toBe(403);
    expect((await post(request({ type: 'observe' }))).status).toBe(403);
    expect(m.client).not.toHaveBeenCalled();
    // Authorization now needs privileged reads; denied requests must still
    // perform zero privileged writes.
    expect(m.writes).toEqual([]);
  });

  it('preserves the authenticated session MFA gate, including on first save', async () => {
    m.sessionReady = false;
    expect((await get()).status).toBe(403);
    expect((await post(request({ type: 'observe' }))).status).toBe(403);
    // Authorization now needs privileged reads; denied requests must still
    // perform zero privileged writes.
    expect(m.writes).toEqual([]);
  });

  it('fails closed when the security migration is unavailable', async () => {
    m.sessionError = { message: 'Function not found' };
    const response = await post(request({ type: 'observe' }));
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe('SIMULATION_STORAGE_NOT_READY');
    // Authorization now needs privileged reads; denied requests must still
    // perform zero privileged writes.
    expect(m.writes).toEqual([]);
  });

  it('rejects a different course, mismatched course membership, and unpublished lessons', async () => {
    expect((await get({ courseId: '11111111-1111-4111-8111-111111111111', lessonId })).status).toBe(
      404,
    );
    m.lesson = { ...m.lesson, course_id: '11111111-1111-4111-8111-111111111111' };
    expect((await get()).status).toBe(404);
    m.lesson = { ...m.lesson, course_id: courseId, is_published: false };
    expect((await get()).status).toBe(404);
    // Authorization now needs privileged reads; denied requests must still
    // perform zero privileged writes.
    expect(m.writes).toEqual([]);
  });

  it('does not replace separate practice exams with unconfigured simulations', async () => {
    const examId = 'e47bab32-5d13-5d53-b525-135c6ecd4d48';
    m.lesson = { ...m.lesson, id: examId };
    const response = await get({ courseId, lessonId: examId });
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe('SIMULATION_NOT_CONFIGURED');
    expect(m.writes).toHaveLength(0);
  });

  it('returns a fresh safe view without recording progress, awarding hours, or exposing answer keys', async () => {
    const response = await get();
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.progress).toEqual({
      revision: 0,
      attemptCount: 0,
      mastered: false,
      bestScore: null,
      lastSavedAt: null,
    });
    expect(payload.simulation.controls[0].value).toBe('stop');
    expect(JSON.stringify(payload)).not.toMatch(/correctAnswer|isCorrect|correct_steps|learner_id/);
    expect(m.writes).toHaveLength(0);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it.each([{ score: 100 }, { learner_id: 'someone-else' }, { completed: true }, { hours: 48 }])(
    'rejects client authority fields %j',
    async (extra) => {
      expect((await post(request({ type: 'observe' }, 0, extra))).status).toBe(400);
      // Authorization now needs privileged reads; denied requests must still
      // perform zero privileged writes.
      expect(m.writes).toEqual([]);
    },
  );

  it('rejects invalid controls, cross-lesson simulation IDs and out-of-order choices', async () => {
    expect(
      (
        await post(
          request({ type: 'observe' }, 0, { action: { type: 'set-control', controlId: 'mode' } }),
        )
      ).status,
    ).toBe(400);
    expect(
      (await post(request({ type: 'set-control', controlId: 'score', value: 100 }))).status,
    ).toBe(400);
    expect(
      (await post(request({ type: 'observe' }, 0, { simulationId: 'hvac-sim:chapter-02:v1' })))
        .status,
    ).toBe(400);
    expect(
      (await post(request({ type: 'choose', stageId: 'diagnose', optionId: 'safe' }))).status,
    ).toBe(400);
    expect(
      (await post(request({ type: 'choose', stageId: 'forged-stage', optionId: 'safe' }))).status,
    ).toBe(400);
    expect(m.writes).toHaveLength(0);
  });

  it('saves from the first action and restores controls and observed state on GET', async () => {
    const originalKnowledgeCheck = structuredClone(m.rows[0]);
    const first = await post(request({ type: 'set-control', controlId: 'mode', value: 'run' }));
    expect(first.status).toBe(200);
    expect((await first.json()).progress).toMatchObject({
      revision: 1,
      attemptCount: 1,
      mastered: false,
    });
    expect((await post(request({ type: 'observe' }, 1))).status).toBe(200);
    const payload = await (await get()).json();
    expect(payload.simulation.controls[0].value).toBe('run');
    expect(payload.simulation.observed).toBe(true);
    expect(payload.progress.revision).toBe(2);
    expect(m.rows[0]).toEqual(originalKnowledgeCheck);
    expect(
      m.writes.every(
        (write) =>
          write.table === 'interaction_progress' &&
          write.values.learner_id === learnerId &&
          write.values.interaction_id === simulationId,
      ),
    ).toBe(true);
    expect(m.writes[1].filters).toContainEqual(['answers->>revision', '1']);
  });

  it('retains server mastery, best score, prior action history and completion timestamp on reset', async () => {
    await pass();
    const prior = await (await get()).json();
    expect(prior.progress).toMatchObject({
      mastered: true,
      bestScore: 100,
      revision: 3,
      attemptCount: 1,
    });
    const completedAt = m.rows[1].completed_at;
    const response = await post(request({ type: 'reset' }, 3));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.progress).toMatchObject({
      mastered: true,
      bestScore: 100,
      revision: 4,
      attemptCount: 2,
    });
    expect(payload.simulation.finished).toBe(false);
    expect(payload.simulation.controls[0].value).toBe('stop');
    expect(m.rows[1].completed).toBe(true);
    expect(m.rows[1].completed_at).toBe(completedAt);
    expect((m.rows[1].answers as Row).events as unknown[]).toHaveLength(4);
  });

  it('does not erase a passing attempt by recording a later weaker practice result', async () => {
    await pass();
    await post(request({ type: 'reset' }, 3));
    await post(request({ type: 'set-control', controlId: 'mode', value: 'run' }, 4));
    await post(request({ type: 'observe' }, 5));
    await post(request({ type: 'choose', stageId: 'diagnose', optionId: 'unsafe' }, 6));
    await post(request({ type: 'choose', stageId: 'diagnose', optionId: 'unsafe' }, 7));
    const response = await post(
      request({ type: 'choose', stageId: 'diagnose', optionId: 'safe' }, 8),
    );
    const payload = await response.json();
    expect(payload.simulation).toMatchObject({ finished: true, passed: false, score: 60 });
    expect(payload.progress).toMatchObject({ mastered: true, bestScore: 100, attemptCount: 2 });
  });

  it('handles a retried request exactly once, including after a later action', async () => {
    const first = request({ type: 'set-control', controlId: 'mode', value: 'run' });
    expect((await post(first)).status).toBe(200);
    expect((await post(first)).status).toBe(200);
    expect(m.writes).toHaveLength(1);
    await post(request({ type: 'observe' }, 1));
    const repeated = await post(first);
    expect((await repeated.json()).progress.revision).toBe(2);
    expect(m.writes).toHaveLength(2);
    const reused = await post({ ...first, action: { type: 'observe' } });
    expect(reused.status).toBe(409);
    expect((await reused.json()).code).toBe('REQUEST_ID_REUSED');
  });

  it('rejects stale revisions before trying a privileged write', async () => {
    await post(request({ type: 'observe' }));
    const response = await post(request({ type: 'observe' }, 0));
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe('REVISION_CONFLICT');
    expect(m.writes).toHaveLength(1);
  });

  it('uses compare-and-set so a competing update cannot overwrite a later revision', async () => {
    await post(request({ type: 'observe' }));
    m.conflict = true;
    const response = await post(
      request({ type: 'set-control', controlId: 'mode', value: 'run' }, 1),
    );
    expect(response.status).toBe(409);
    expect((m.rows[1].answers as Row).revision).toBe(1);
    expect(m.writes[1].filters).toContainEqual(['answers->>revision', '1']);
  });

  it('recovers a concurrent first-insert retry through the unique identity without double credit', async () => {
    m.insertRace = true;
    const response = await post(request({ type: 'observe' }));
    expect(response.status).toBe(200);
    expect((await response.json()).progress).toMatchObject({ revision: 1, attemptCount: 1 });
    expect(m.rows.filter((row) => row.interaction_id === simulationId)).toHaveLength(1);
  });

  it('fails clearly on read/write errors and never reports a failed save as successful', async () => {
    m.readError = { message: 'Database unavailable' };
    expect((await get()).status).toBe(500);
    m.readError = null;
    m.saveError = { message: 'Write unavailable' };
    const response = await post(request({ type: 'observe' }));
    expect(response.status).toBe(500);
    expect((await response.json()).code).toBe('PERSISTENCE_ERROR');
    expect(m.rows.filter((row) => row.interaction_id === simulationId)).toHaveLength(0);
  });

  it('does not reinterpret invalid or mismatched-version saved history as a fresh attempt', async () => {
    await post(request({ type: 'observe' }));
    const row = m.rows[1];
    (row.answers as Row).contentVersion = 'v0';
    expect((await get()).status).toBe(409);
    (row.answers as Row).contentVersion = 'v1';
    (row.answers as Row).revision = 20;
    const response = await get();
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe('INVALID_SAVED_STATE');
    expect(m.writes).toHaveLength(1);
  });
});

it('denies unsigned teaching access even if the generic lesson RPC would allow it', async () => {
  m.capacity = 'denied';
  expect((await get()).status).toBe(403);
  expect(m.access).not.toHaveBeenCalled();
  expect(m.writes).toEqual([]);
});
it('allows licensed demonstration without learner credit gates', async () => {
  m.capacity = 'instructor';
  expect((await get()).status).toBe(200);
  expect(m.access).not.toHaveBeenCalled();
});
