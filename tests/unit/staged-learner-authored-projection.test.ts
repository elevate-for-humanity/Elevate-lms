import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  db: null as any,
  lesson: null as any,
  run: null as any,
  owned: true,
  adminClient: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  signIn: vi.fn(),
  signedUpload: vi.fn(),
  saveRun: vi.fn(),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.adminClient }));
vi.mock('@/lib/supabase/public', () => ({
  createPublicClient: () => ({ auth: { signInWithPassword: mocks.signIn } }),
}));
vi.mock('@/lib/ultimate-course-builder/testing/test-run-access', () => ({
  loadOwnedLearnerTest: async (runId: string) => mocks.owned && mocks.run?.id === runId
    ? { run: mocks.run, db: mocks.db, user: { id: 'unit-qa-learner' } }
    : null,
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import { POST as createRun } from '@/apps/lms/app/api/learner-testing/runs/route';
import { GET as readRun } from '@/apps/lms/app/api/learner-testing/runs/[runId]/route';
import {
  bindAuthoredLessonPreservation,
  createAuthoredPreservation,
} from '@/lib/ultimate-course-builder/instructional/authored-experience';
import {
  contractHash,
  ULTIMATE_LESSON_CONTRACT_VERSION,
} from '@/lib/ultimate-course-builder/core/lesson-contract';
import { publicManufacturingSimulation } from '@/lib/lms/manufacturing-simulation';
import { simulationFixture } from '../fixtures/manufacturing-simulation';

const COURSE_ID = '832cf9d8-e676-4bfb-a623-ab13a7ddf847';
const LESSON_ID = 'efff8a53-06ea-5235-a015-5d68fe39952e';
const LESSON_BUILD_ID = '00000000-0000-4000-8000-000000000123';
const SECRET = 'unit-only-learner-projection-credential';
const VIDEO_URL = `/api/courses/${COURSE_ID}/lessons/${LESSON_ID}/playback`;
const MEDIA_HASH = 'a'.repeat(64);
const GRADING_KEY_ID = '30000000-0000-4000-8000-000000000001';
const publicSimulation = publicManufacturingSimulation({ ...simulationFixture, gradingKeyId: GRADING_KEY_ID });
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

/** Real source matching and projection certification, not a mocked accessor. */
function lessonFixture(authored = true, withSimulation = false) {
  const originalQuestion = {
    id: 'authored-question', question: 'Which record supports the authored decision?',
    options: ['An assumption', 'A blank form', 'The supplied inspection record'],
    correctAnswer: 2, explanation: 'PRIVATE_AUTHORED_ANSWER_EXPLANATION',
  };
  const source = {
    id: 'forklift-01', canonicalId: LESSON_ID, estimatedMinutes: 120,
    objectives: ['Explain the inspection decision.'],
    bodyMarkdown: 'Read the complete authored inspection lesson before completing the workbook.',
    workedExample: 'Compare the fictional inspection record with the stated acceptance criteria.',
    workbook: {
      brief: 'Create the authored inspection decision record.', inputs: ['Fictional inspection record'],
      submissionRequirements: ['Include the evidence and decision.'],
    },
    lmsPrompts: ['Explain which evidence supports the decision.'],
    practiceQuestions: [{
      prompt: originalQuestion.question, options: originalQuestion.options,
      correctIndex: originalQuestion.correctAnswer, explanation: originalQuestion.explanation,
    }],
  };
  const canonical = {
    id: LESSON_ID, course_id: COURSE_ID, learning_objectives: source.objectives, duration_minutes: 120, passing_score: 80,
    quiz_questions: [originalQuestion], content: { html: '<p>Complete authored inspection lesson.</p>' },
    rendered_html: '<p>Complete authored inspection lesson.</p>',
    content_json: {
      authoredLessonId: source.id,
      workbook: {
        brief: source.workbook.brief, inputs: source.workbook.inputs, prompts: source.lmsPrompts,
        submissionRequirements: source.workbook.submissionRequirements,
      },
      activityPlan: [{ task: 'Read and complete the workbook', minutes: 120 }],
      experience: {
        ...(withSimulation ? { manufacturingSimulation: clone(publicSimulation) } : {}),
        plannedMinutes: 120,
        narrationScript: `${source.bodyMarkdown}\n\n${source.workedExample}`,
        readingGuide: { body: source.bodyMarkdown },
        knowledgeChecks: [originalQuestion],
        exercises: [{
          id: `${source.id}-workbook`, instructions: source.workbook.brief,
          prompts: source.lmsPrompts, submissionRequirements: source.workbook.submissionRequirements,
        }],
        remediation: { instructions: 'Review the inspection evidence and try a different example.' },
      },
    },
  };
  const baseProfile: any = {
    id: `course:${COURSE_ID}`, title: 'Inspection decisions', authority: 'course-defined',
    standardVersion: 'course-defined', sourceDocuments: [],
    canonicalLessonIds: { [LESSON_ID]: LESSON_ID },
    competencies: [{
      id: LESSON_ID, title: 'Inspection decisions', description: source.objectives[0],
      type: 'decision', authorityRequirementIds: [], requiresDemonstration: false,
      requiresPracticalEvidence: false,
    }],
    instructionalSources: [{
      id: `syllabus:${COURSE_ID}:Authorized_Lessons_Part_1.txt`,
      text: `Canonical lesson ID: ${LESSON_ID}\n${JSON.stringify(source)}`,
    }],
  };
  const profile = authored ? bindAuthoredLessonPreservation(baseProfile, [canonical]) : baseProfile;
  const generatedAssessment = {
    passingScore: 80,
    questions: [{
      id: 'provider-question', prompt: 'Which provider example applies?', choices: ['First', 'Second'],
      answerIndex: 0, explanation: 'PRIVATE_PROVIDER_ANSWER_EXPLANATION',
      remediation: 'Review the provider example.', objectiveIds: ['objective-1'],
    }],
    reassessment: [{
      id: 'provider-reassessment', prompt: 'Which alternate example applies?', choices: ['First', 'Second'],
      answerIndex: 1, explanation: 'PRIVATE_REASSESSMENT_ANSWER_EXPLANATION',
      remediation: 'Review the alternate example.', objectiveIds: ['objective-1'],
    }],
  };
  const providerBlueprint = {
    competencyId: LESSON_ID,
    stages: [{ stage: 'concept_explanation', instruction: 'Provider teaching stays unchanged.', objectiveIds: ['objective-1'] }],
    activities: [{ id: 'provider-practice', type: 'guided_practice', prompt: 'Explain the provider example.', feedback: 'Review your reasoning.', objectiveIds: ['objective-1'] }],
    assessment: generatedAssessment,
    authoringEvidence: { version: 'source-grounded-teaching-1', sourceHash: 'unchanged-provider-source-hash' },
  };
  const artifacts: any = {
    learning_objectives: {
      blueprint: providerBlueprint,
      ...(authored ? { authoredSource: profile.authoredLessonPreservation![LESSON_ID] } : {}),
    },
    active_teaching: { activities: providerBlueprint.activities },
    synchronization: { timeline: { segments: [{ segmentId: 'scene-1', startSeconds: 0, endSeconds: 30, text: 'Inspection narration.' }] } },
    assessment_alignment: { assessment: generatedAssessment },
    lesson_film_render: { render: {
      videoUrl: 'https://unit-media.invalid/inspection.mp4', playbackUrl: VIDEO_URL,
      captionsUrl: 'https://unit-media.invalid/inspection.vtt', duration: 30,
    } },
    finished_media_qa: { mediaQA: { inspection: { mediaSha256: MEDIA_HASH } } },
  };
  if (authored) artifacts.assessment_alignment.authoredPreservation =
    createAuthoredPreservation(profile, LESSON_ID, artifacts, generatedAssessment);
  return {
    id: LESSON_BUILD_ID, competency_id: LESSON_ID, artifacts,
    canonicalLesson: canonical,
    ultimate_course_builds: { course_id: COURSE_ID, profile },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('ULTIMATE_LEARNER_RUNTHROUGH_SECRET', SECRET);
  mocks.lesson = lessonFixture();
  mocks.run = null;
  mocks.owned = true;
  mocks.createUser.mockResolvedValue({ data: { user: { id: 'unit-qa-learner' } }, error: null });
  mocks.deleteUser.mockResolvedValue({ error: null });
  mocks.signIn.mockResolvedValue({ data: { session: { access_token: 'unit-access-token', refresh_token: 'unit-refresh-token' } }, error: null });
  mocks.signedUpload.mockImplementation(async (path: string) => ({ data: { signedUrl: `https://unit-upload.invalid/${path}` }, error: null }));
  mocks.saveRun.mockImplementation(async (row: any) => {
    mocks.run = { ...clone(row), progress: {} };
    return { error: null };
  });
  mocks.db = {
    auth: { admin: { createUser: mocks.createUser, deleteUser: mocks.deleteUser } },
    storage: { from: () => ({ createSignedUploadUrl: mocks.signedUpload }) },
    from: (table: string) => {
      if (table === 'ultimate_learner_test_runs') return { insert: mocks.saveRun };
      if (table === 'course_lessons' || table === 'manufacturing_simulation_specs') {
        const row = table === 'course_lessons' ? mocks.lesson.canonicalLesson
          : { id: GRADING_KEY_ID, course_id: COURSE_ID, lesson_id: LESSON_ID, spec: simulationFixture };
        const filters: Array<[string, unknown]> = [];
        const query = {
          select: () => query, eq: (key: string, value: unknown) => { filters.push([key, value]); return query; },
          maybeSingle: async () => ({ data: row && filters.every(([key, value]) => (row as any)[key] === value) ? row : null, error: null }),
        };
        return query;
      }
      if (table !== 'ultimate_lesson_builds') throw new Error(`Unexpected table: ${table}`);
      const query = { select: () => query, eq: () => query, single: async () => ({ data: mocks.lesson, error: null }) };
      return query;
    },
  };
  mocks.adminClient.mockResolvedValue(mocks.db);
});
afterEach(() => vi.unstubAllEnvs());

function request(overrides: Record<string, unknown> = {}, token = SECRET) {
  return new NextRequest('https://app.elevateforhumanity.org/api/learner-testing/runs', {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: COURSE_ID, lessonId: LESSON_ID, lessonBuildId: LESSON_BUILD_ID,
      contractVersion: ULTIMATE_LESSON_CONTRACT_VERSION, artifactHash: contractHash(mocks.lesson.artifacts),
      videoUrl: VIDEO_URL, mediaSha256: MEDIA_HASH, ...overrides,
    }),
  });
}
function expectNoIdentityOrRun() {
  expect(mocks.createUser).not.toHaveBeenCalled();
  expect(mocks.saveRun).not.toHaveBeenCalled();
  expect(mocks.signIn).not.toHaveBeenCalled();
  expect(mocks.signedUpload).not.toHaveBeenCalled();
}

describe('staged learner QA consumes the certified authored projection', () => {
  it('carries the exact public simulation into the staged snapshot without changing provider evidence', async () => {
    mocks.lesson = lessonFixture(true, true);
    const before = clone(mocks.lesson);
    const response = await createRun(request());
    expect(response.status).toBe(200);
    const snapshot = (await response.json()).snapshot;
    expect(snapshot).toMatchObject({ courseId: COURSE_ID, lessonId: LESSON_ID, qaOnly: true });
    expect(snapshot.blueprint.manufacturingSimulation).toEqual(publicSimulation);
    expect(JSON.stringify(snapshot.blueprint.manufacturingSimulation)).not.toMatch(/"(?:expected|rationale)":/);
    expect(mocks.lesson).toEqual(before);
    const read = await readRun(new NextRequest('https://app.elevateforhumanity.org/api/learner-testing/runs/unit'), { params: Promise.resolve({ runId: mocks.run.id }) });
    expect(read.status).toBe(200);
    expect((await read.json()).snapshot.blueprint.manufacturingSimulation).toEqual(publicSimulation);
  });

  it('rejects a changed canonical simulation before creating a QA identity or run', async () => {
    mocks.lesson = lessonFixture(true, true);
    mocks.lesson.canonicalLesson.content_json.experience.manufacturingSimulation.tasks[0].critical = false;
    expect((await createRun(request())).status).toBe(500);
    expectNoIdentityOrRun();
  });

  it('rejects a grading reference bound to another canonical lesson before creating a QA identity', async () => {
    mocks.lesson = lessonFixture(true, true);
    mocks.lesson.ultimate_course_builds.profile.canonicalLessonIds[LESSON_ID] = '00000000-0000-4000-8000-000000000999';
    expect((await createRun(request())).status).toBe(500);
    expectNoIdentityOrRun();
  });

  it('saves authored reading, workbook, and questions while leaving provider artifacts and evidence unchanged', async () => {
    const before = clone(mocks.lesson);
    const response = await createRun(request());
    expect(response.status).toBe(200);
    const payload = await response.json();
    const certified = before.artifacts.assessment_alignment.authoredPreservation.learnerBlueprint;
    expect(payload.snapshot.blueprint).toEqual(certified);
    expect(mocks.run.snapshot.blueprint).toEqual(certified);
    expect(mocks.run.artifact_hash).toBe(contractHash(before.artifacts));
    expect(mocks.run.media_sha256).toBe(MEDIA_HASH);
    expect(certified.assessment.questions.map((question: any) => question.id)).toEqual(['authored-question']);
    expect(certified.activities).toContainEqual(expect.objectContaining({ id: 'forklift-01-workbook', prompt: expect.stringContaining('Create the authored inspection decision record.') }));
    expect(certified.stages).toContainEqual(expect.objectContaining({ stage: 'authored_reading', instruction: expect.stringContaining('complete authored inspection lesson') }));
    expect(mocks.lesson).toEqual(before);
    expect(mocks.lesson.artifacts.learning_objectives.blueprint.authoringEvidence).toEqual(before.artifacts.learning_objectives.blueprint.authoringEvidence);
  });

  it('redacts authored and reassessment answers through the actual learner-facing GET route', async () => {
    const created = await createRun(request());
    expect(created.status).toBe(200);
    const params = { params: Promise.resolve({ runId: mocks.run.id }) };
    const response = await readRun(new NextRequest('https://app.elevateforhumanity.org/api/learner-testing/runs/unit'), params);
    expect(response.status).toBe(200);
    const blueprint = (await response.json()).snapshot.blueprint;
    expect(blueprint.assessment.questions[0]).toEqual({
      id: 'authored-question', prompt: 'Which record supports the authored decision?',
      choices: ['An assumption', 'A blank form', 'The supplied inspection record'],
    });
    for (const question of [...blueprint.assessment.questions, ...blueprint.assessment.reassessment])
      expect(Object.keys(question).sort()).toEqual(['choices', 'id', 'prompt']);
    const serialized = JSON.stringify(blueprint);
    for (const privateField of ['answerIndex', 'correctAnswer', 'correctIndex', 'authoredExperience'])
      expect(serialized).not.toContain(privateField);
    for (const explanation of ['PRIVATE_AUTHORED_ANSWER_EXPLANATION', 'PRIVATE_PROVIDER_ANSWER_EXPLANATION', 'PRIVATE_REASSESSMENT_ANSWER_EXPLANATION'])
      expect(serialized).not.toContain(explanation);
    expect(mocks.run.snapshot.blueprint.assessment.questions[0].answerIndex).toBe(2);
    mocks.owned = false;
    expect((await readRun(new NextRequest('https://app.elevateforhumanity.org/api/learner-testing/runs/unit'), params)).status).toBe(401);
  });

  it('retains the provider blueprint for ordinary lessons without authored preservation', async () => {
    mocks.lesson = lessonFixture(false);
    const before = clone(mocks.lesson);
    expect((await createRun(request())).status).toBe(200);
    expect(mocks.run.snapshot.blueprint).toEqual(before.artifacts.learning_objectives.blueprint);
    expect(mocks.lesson).toEqual(before);
  });

  it.each(['missing', 'changed-question', 'changed-provider'])('rejects a %s preservation artifact before creating a QA identity', async mode => {
    if (mode === 'missing') delete mocks.lesson.artifacts.assessment_alignment.authoredPreservation;
    if (mode === 'changed-question') mocks.lesson.artifacts.assessment_alignment.authoredPreservation.learnerBlueprint.assessment.questions[0].answerIndex = 0;
    if (mode === 'changed-provider') mocks.lesson.artifacts.learning_objectives.blueprint.stages[0].instruction = 'Different provider teaching.';
    // Use the current outer artifact hash: the inner preservation certificate must still be validated.
    const response = await createRun(request());
    expect(response.status).toBe(500);
    expectNoIdentityOrRun();
  });

  it.each([
    { courseId: '00000000-0000-4000-8000-000000000999' },
    { lessonId: 'another-competency' },
    { contractVersion: 'stale-contract' },
    { artifactHash: 'stale-artifact-hash' },
    { videoUrl: 'https://unit-media.invalid/other.mp4' },
    { mediaSha256: 'b'.repeat(64) },
  ])('retains the existing lesson and media identity gate: %j', async override => {
    expect((await createRun(request(override))).status).toBe(409);
    expectNoIdentityOrRun();
  });

  it('requires the service credential before opening the database or creating a QA identity', async () => {
    expect((await createRun(request({}, 'wrong-unit-credential'))).status).toBe(401);
    expect(mocks.adminClient).not.toHaveBeenCalled();
    expectNoIdentityOrRun();
  });
});
