import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  db: null as any, run: null as any, canonical: null as any, specRow: null as any,
  owned: true, identityRunId: '', failTable: '', conflict: false,
  queries: [] as any[], writes: [] as any[], evidence: [] as any[],
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => mocks.db }));
vi.mock('@/lib/ultimate-course-builder/testing/test-run-access', () => ({
  loadOwnedLearnerTest: async () => mocks.owned ? {
    db: mocks.db, run: structuredClone(mocks.run),
    user: { id: 'qa-user', app_metadata: { ultimate_learner_test: true, run_id: mocks.identityRunId } },
  } : null,
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/components/lms/InteractiveVideoPlayer', () => ({ default: () => <div>Authored lesson film</div> }));

import { GET, POST, PUT } from '@/apps/lms/app/api/learner-testing/runs/[runId]/route';
import StagedLesson from '@/apps/lms/app/learner-testing/[runId]/page';
import StagedLessonExperience from '@/components/lms/StagedLessonExperience';
import { contractHash } from '@/lib/ultimate-course-builder/core/lesson-contract';
import { publicBlueprint, signLearnerEvidence } from '@/lib/ultimate-course-builder/testing/learner-test-policy';
import { evaluateManufacturingSimulation, publicManufacturingSimulation } from '@/lib/lms/manufacturing-simulation';
import { simulationFixture, correctFixtureResponses } from '../fixtures/manufacturing-simulation';

const COURSE_ID = '832cf9d8-e676-4bfb-a623-ab13a7ddf847';
const LESSON_ID = 'efff8a53-06ea-5235-a015-5d68fe39952e';
const KEY_ID = '30000000-0000-4000-8000-000000000001';
const RUN_ID = '40000000-0000-4000-8000-000000000001';
const SECRET = 'unit-only-simulation-runner-credential';
const spec = { ...simulationFixture, gradingKeyId: KEY_ID };
const problem = publicManufacturingSimulation(spec);
const failedResponses = { ...correctFixtureResponses, safety: 'go' };
const clone = <T,>(value: T): T => structuredClone(value);
const params = { params: Promise.resolve({ runId: RUN_ID }) };
const url = `https://app.elevateforhumanity.org/api/learner-testing/runs/${RUN_ID}`;

function makeDb() {
  return {
    from(table: string) {
      if (!['course_lessons', 'manufacturing_simulation_specs', 'ultimate_learner_test_runs', 'ultimate_learner_test_evidence'].includes(table))
        throw new Error(`QA must not access a real learner progress table: ${table}`);
      const filters: Array<[string, unknown]> = [];
      let update: any;
      const query = {
        select: () => query,
        eq: (key: string, value: unknown) => { filters.push([key, value]); return query; },
        update: (value: any) => { update = clone(value); return query; },
        insert: async (value: any) => { mocks.evidence.push(clone(value)); return { error: null }; },
        maybeSingle: async () => {
          mocks.queries.push({ table, filters: clone(filters) });
          if (mocks.failTable === table) return { data: null, error: { message: 'PRIVATE_GRADING_DATABASE_ERROR' } };
          const row = table === 'course_lessons' ? mocks.canonical
            : table === 'manufacturing_simulation_specs' ? mocks.specRow : mocks.run;
          const matches = row && filters.every(([key, value]) => key === 'progress'
            ? JSON.stringify(row.progress ?? {}) === value : row[key] === value);
          if (!matches || (update && mocks.conflict)) return { data: null, error: null };
          if (update) {
            mocks.writes.push({ table, value: update, filters: clone(filters) });
            Object.assign(row, update);
          }
          return { data: clone(row), error: null };
        },
      };
      return query;
    },
  };
}

beforeEach(() => {
  vi.stubEnv('ULTIMATE_LEARNER_RUNTHROUGH_SECRET', SECRET);
  mocks.owned = true;
  mocks.identityRunId = RUN_ID;
  mocks.failTable = '';
  mocks.conflict = false;
  mocks.queries = [];
  mocks.writes = [];
  mocks.evidence = [];
  mocks.canonical = {
    id: LESSON_ID, course_id: COURSE_ID,
    content_json: { experience: { manufacturingSimulation: clone(problem) } },
    content: { experience: { manufacturingSimulation: clone(problem) } },
  };
  mocks.specRow = { id: KEY_ID, course_id: COURSE_ID, lesson_id: LESSON_ID, spec: clone(simulationFixture) };
  mocks.run = {
    id: RUN_ID, learner_id: 'qa-user', lesson_build_id: 'lesson-build', artifact_hash: 'bound-artifact', media_sha256: 'bound-media',
    snapshot: {
      qaOnly: true, courseId: COURSE_ID, lessonId: LESSON_ID, practicalRequired: false, title: 'Authored inspection',
      render: { videoUrl: '/unit.mp4', captionsUrl: '/unit.vtt' },
      blueprint: {
        stages: [], activities: [{ id: 'guided', type: 'guided_practice', prompt: 'Describe the inspection evidence.', feedback: 'Review the record.' }],
        mistakes: [{ mistake: 'Skip the record', correction: 'Review the record', reason: 'Use evidence' }],
        manufacturingSimulation: clone(problem),
        assessment: {
          questions: [{ id: 'q', prompt: 'Which record?', choices: ['A', 'B'], answerIndex: 0 }],
          reassessment: [{ id: 'r', prompt: 'Which alternate record?', choices: ['C', 'D'], answerIndex: 1 }],
          passingScore: 80,
        },
      },
    },
    progress: { duration: 100, watchedSeconds: 100, scenario: { passed: true }, assessment: { passed: true }, activities: { guided: { answer: 'Existing authored response.' } } },
  };
  mocks.db = makeDb();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); });

function request(body: unknown, method = 'POST', token?: string) {
  return new NextRequest(url, {
    method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}
const act = (body: unknown) => POST(request(body), params);
const submit = (responses: unknown = correctFixtureResponses, extra = {}) => act({ action: 'manufacturing_simulation', responses, ...extra });
const read = () => GET(new NextRequest(url), params);
function assertNoPrivateGrading(value: unknown) {
  expect(JSON.stringify(value)).not.toMatch(/"(?:expected|rationale|answerIndex|correctAnswer|gradingKey|spec)":/);
}
function workflow() {
  return {
    version: 'staged-manufacturing-qa-v1', simulationId: problem.id, gradingKeyId: KEY_ID,
    specHash: contractHash(problem), taskCount: problem.tasks.length, deniedBefore: true,
    deniedCritical: true, submittedThroughUI: true, score: 100, criticalMisses: 0,
    persisted: true, completionObserved: true,
  };
}
function evidenceRequest(override: any = {}, token = SECRET) {
  const evidence = { testRunId: 'signed-browser-test', lessonBuildId: mocks.run.lesson_build_id,
    artifactHash: mocks.run.artifact_hash, mediaSha256: mocks.run.media_sha256, manufacturingWorkflow: workflow(), ...override };
  return request({ evidence, signature: signLearnerEvidence(evidence, SECRET) }, 'PUT', token);
}

describe('real staged manufacturing server grading and isolated persistence', () => {
  it('requires simulation mastery after every other lesson requirement is already met', async () => {
    const response = await act({ action: 'complete' });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'MANUFACTURING_SIMULATION_REQUIRED' });
    expect(mocks.writes).toEqual([]);
  });

  it('enforces a critical hold at80%, ignores caller scores, then regrades a corrected attempt for completion', async () => {
    const failed = await submit(failedResponses, { score: 100, completed: true, gradingKeyId: 'spoofed' });
    expect(failed.status).toBe(200);
    const result = await failed.json();
    expect(result.attempt).toMatchObject({ score: 80, completed: false, attempts: 1, gradingKeyId: KEY_ID, feedback: { criticalMisses: 1 } });
    assertNoPrivateGrading(result);
    expect((await act({ action: 'complete' })).status).toBe(409);
    const corrected = await submit();
    expect(corrected.status).toBe(200);
    expect((await corrected.json()).attempt).toMatchObject({ score: 100, completed: true, attempts: 2, feedback: { criticalMisses: 0 } });
    expect((await act({ action: 'complete' })).status).toBe(200);
    expect(mocks.run.progress.completed).toBe(true);
    expect(mocks.run.progress.manufacturingSimulationHistory).toHaveLength(1);
    expect(mocks.writes.every(write => write.table === 'ultimate_learner_test_runs')).toBe(true);
    expect(mocks.writes.every(write => write.filters.some(([key]: [string]) => key === 'progress'))).toBe(true);
    const reads = mocks.queries.filter(query => query.table === 'manufacturing_simulation_specs');
    expect(reads.length).toBeGreaterThanOrEqual(4);
    for (const query of reads) expect(query.filters).toEqual([['id', KEY_ID], ['course_id', COURSE_ID], ['lesson_id', LESSON_ID]]);
  });

  it.each([
    { ...correctFixtureResponses, extra: 'unknown' },
    { ...correctFixtureResponses, measure: '25' },
    { ...correctFixtureResponses, safety: 'unrecognized' },
    { ...correctFixtureResponses, order: ['stop', 'stop'] },
    {},
  ])('rejects incomplete or unrecognized answers without a QA progress write', async responses => {
    expect((await submit(responses)).status).toBe(400);
    expect(mocks.writes).toEqual([]);
  });

  it('does not accept a cached pass flag when the actual saved critical answer fails', async () => {
    await submit(failedResponses);
    Object.assign(mocks.run.progress.manufacturingSimulation, { completed: true, score: 100 });
    expect((await act({ action: 'complete' })).status).toBe(409);
    expect(mocks.run.progress.completed).toBe(false);
  });

  it.each(['gradingKeyId', 'artifactHash', 'lessonBuildId', 'courseId', 'lessonId'])('rejects saved progress with a changed %s binding', async field => {
    await submit();
    mocks.run.progress.manufacturingSimulation[field] = 'different-binding';
    expect((await act({ action: 'complete' })).status).toBe(409);
  });

  it.each(['content_json', 'content'])('rejects a changed canonical simulation in the%s mirror', async mirror => {
    await submit();
    mocks.canonical[mirror].experience.manufacturingSimulation.tasks[0].critical = false;
    const writesBefore = mocks.writes.length;
    const response = await act({ action: 'complete' });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Learner action failed' });
    expect(mocks.writes).toHaveLength(writesBefore);
  });

  it.each(['course_lessons', 'manufacturing_simulation_specs'])('fails closed on%s service read errors', async table => {
    mocks.failTable = table;
    const response = await submit();
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('PRIVATE_GRADING_DATABASE_ERROR');
    expect(mocks.writes).toEqual([]);
  });

  it('rejects a private key belonging to another lesson', async () => {
    mocks.specRow.lesson_id = '00000000-0000-4000-8000-000000000999';
    expect((await submit()).status).toBe(500);
    expect(mocks.writes).toEqual([]);
  });

  it('keeps owner and marked QA gates before grading and protects concurrent progress updates', async () => {
    mocks.owned = false;
    expect((await submit()).status).toBe(401);
    mocks.owned = true;
    mocks.identityRunId = 'another-run';
    expect((await submit()).status).toBe(403);
    mocks.identityRunId = RUN_ID;
    mocks.run.snapshot.qaOnly = false;
    expect((await submit()).status).toBe(403);
    expect(mocks.queries).toEqual([]);
    mocks.run.snapshot.qaOnly = true;
    mocks.conflict = true;
    expect((await submit()).status).toBe(409);
    expect(mocks.writes).toEqual([]);
  });

  it('invalidates completed QA after a later failed attempt instead of falling back to an old pass', async () => {
    await submit();
    await act({ action: 'complete' });
    expect(mocks.run.progress.completed).toBe(true);
    await submit(failedResponses);
    expect(mocks.run.progress.completed).toBe(false);
    expect((await act({ action: 'complete' })).status).toBe(409);
  });

  it('redacts private grading fields from GET, attempt history, and the actual SSR page props', async () => {
    await submit();
    const privateGrade = evaluateManufacturingSimulation(spec, correctFixtureResponses)!;
    mocks.run.progress.manufacturingSimulation.feedback = privateGrade.feedback;
    mocks.run.progress.manufacturingSimulation.spec = spec;
    mocks.run.progress.manufacturingSimulationHistory = [clone(mocks.run.progress.manufacturingSimulation)];
    const response = await read();
    expect(response.status).toBe(200);
    assertNoPrivateGrading(await response.json());
    const page = await StagedLesson(params);
    const experience = page.props.children.find((child: any) => child?.type === StagedLessonExperience);
    expect(experience).toBeTruthy();
    assertNoPrivateGrading(experience.props);
  });

  it('requires signed observed workflow and server-regraded mastery before saving acceptance evidence', async () => {
    expect((await PUT(evidenceRequest({}, 'incorrect'), params)).status).toBe(401);
    await submit();
    await act({ action: 'complete' });
    expect((await PUT(evidenceRequest({ manufacturingWorkflow: undefined }), params)).status).toBe(409);
    expect((await PUT(evidenceRequest({ artifactHash: 'stale' }), params)).status).toBe(409);
    mocks.run.progress.manufacturingSimulation.answers.safety = 'go';
    expect((await PUT(evidenceRequest(), params)).status).toBe(409);
    expect(mocks.evidence).toEqual([]);
    mocks.run.progress.manufacturingSimulation.answers.safety = 'hold';
    expect((await PUT(evidenceRequest(), params)).status).toBe(200);
    expect(mocks.evidence).toHaveLength(1);
  });

  it('leaves ordinary staged lessons without simulations unchanged', async () => {
    delete mocks.run.snapshot.blueprint.manufacturingSimulation;
    expect((await act({ action: 'complete' })).status).toBe(200);
    expect(mocks.queries.some(query => query.table === 'manufacturing_simulation_specs')).toBe(false);
  });
});

it('uses actual simulation controls and staged server scoring through denial, critical hold, correction, completion and reload', async () => {
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) => init?.method === 'POST'
    ? POST(new NextRequest(new URL(input, url), init), params) : read());
  vi.stubGlobal('fetch', fetchMock);
  const mount = () => render(<StagedLessonExperience runId={RUN_ID}
    snapshot={{ ...mocks.run.snapshot, blueprint: publicBlueprint(mocks.run.snapshot.blueprint) }}
    initialProgress={clone(mocks.run.progress)} />);
  const first = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Complete lesson' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Pass the required virtual workplace practice');
  fireEvent.click(screen.getByRole('radio', { name: 'Continue', exact: true }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Enter the measured length.' }), { target: { value: '25' } });
  fireEvent.change(screen.getByRole('spinbutton', { name: 'How many known defects may be released?' }), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Move step 2 up' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm this sequence' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Lot identifier' }));
  fireEvent.click(screen.getByRole('button', { name: 'Check and save practice' }));
  expect(await screen.findByText('Review and retry · 80%')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Complete lesson' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Pass the required virtual workplace practice');
  fireEvent.click(screen.getByRole('radio', { name: 'Remove from service and report' }));
  fireEvent.click(screen.getByRole('button', { name: 'Check and save practice' }));
  expect(await screen.findByText('Practice passed · 100%')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Complete lesson' }));
  await screen.findByText('Lesson completed');
  expect(fetchMock.mock.calls.every(([endpoint]) => endpoint === `/api/learner-testing/runs/${RUN_ID}`)).toBe(true);
  expect(mocks.run.progress.manufacturingSimulation.answers).toEqual(correctFixtureResponses);
  first.unmount();
  const saved = await (await read()).json();
  render(<StagedLessonExperience runId={RUN_ID} snapshot={saved.snapshot} initialProgress={saved.progress} />);
  await waitFor(() => expect(screen.getByText('Lesson completed')).toBeInTheDocument());
  expect(screen.getByText('Saved attempt 2')).toBeInTheDocument();
  expect(screen.getByRole('spinbutton', { name: 'How many known defects may be released?' })).toHaveValue(0);
  expect(screen.getByRole('radio', { name: 'Remove from service and report' })).toBeChecked();
});
