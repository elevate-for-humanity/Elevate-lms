import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import {
  assertAuthoredExperienceArtifacts, assertPreservationRecord,
  bindAuthoredLessonPreservation, learnerBlueprintFromArtifacts,
} from '@/lib/ultimate-course-builder/instructional/authored-experience';
import { hydrateUltimateProfileSources } from '@/lib/ultimate-course-builder/core/course-profile';
import { createProductionHandlers } from '@/lib/ultimate-course-builder/core/production-handlers';
import { UltimateBuildRunner } from '@/lib/ultimate-course-builder/core/build-runner';
import {
  artifactPayload, assertCompleteLesson, contractHash, currentEvidence, stepInputHash,
  ULTIMATE_LESSON_CONTRACT_VERSION, validateStepOutput,
} from '@/lib/ultimate-course-builder/core/lesson-contract';
import { ULTIMATE_BUILD_STEPS } from '@/lib/ultimate-course-builder/core/types';
import { prepareUltimatePublication } from '@/lib/ultimate-course-builder/release/prepare-publication';
import { publicBlueprint, scoreLessonQuestions } from '@/lib/ultimate-course-builder/testing/learner-test-policy';
import { publicManufacturingSimulation } from '@/lib/lms/manufacturing-simulation';
import { simulationFixture } from '../fixtures/manufacturing-simulation';
import { fixtureArtifact } from '../fixtures/ultimate-contract';

const COURSE_ID = '832cf9d8-e676-4bfb-a623-ab13a7ddf847';
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
type Row = Record<string, any>;

/** Synthetic authored lessons with the imported course's exact data shape and
 * cardinalities. No provider/media/learner evidence here is a production claim. */
function authoredFixture() {
  const sourceLessons: Row[] = [];
  const lessons = Array.from({ length: 24 }, (_, index) => {
    const id = `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    const key = `authored-${index + 1}`;
    const source = {
      id: key, canonicalId: id, title: `Authored lesson ${index + 1}`, estimatedMinutes: 120,
      objectives: [`Explain the authored process ${index + 1}.`],
      bodyMarkdown: `Read the authored process ${index + 1}; the literal string "{record}" is part of the reading.`,
      workedExample: `Worked example ${index + 1}: record the observed condition.`,
      workbook: { brief: `Complete workbook ${index + 1}.`, inputs: { lot: `L${index + 1}` },
        questions: ['What should the record contain?'], submissionRequirements: ['A traceable record.'] },
      lmsPrompts: [`Document the decision for lot ${index + 1}.`],
      practiceQuestions: Array.from({ length: index < 4 ? 4 : 3 }, (_, question) => ({
        prompt: `Authored question ${index + 1}.${question + 1}?`,
        options: ['Stop and record', 'Continue without a record', 'Guess'],
        correctIndex: question % 3, explanation: `Authored explanation ${index + 1}.${question + 1}.`,
      })),
      // Sources may contain the original private rubric. It must never be
      // copied into the canonical/public learner experience.
      ...(index < 10 ? { manufacturingSimulation: clone(simulationFixture) } : {}),
    };
    sourceLessons.push(source);
    const questions = source.practiceQuestions.map((question, q) => ({
      id: `${key}-q${q + 1}`, question: question.prompt, prompt: question.prompt,
      options: question.options, correctAnswer: question.correctIndex, explanation: question.explanation,
    }));
    const publicSpec = publicManufacturingSimulation({ ...simulationFixture,
      gradingKeyId: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}` });
    publicSpec.tasks = Array.from({ length: index === 9 ? 6 : 7 }, (_, task) => ({
      ...publicSpec.tasks[task % publicSpec.tasks.length], id: `task-${task + 1}`,
    }));
    const experience = {
      version: 1,
      narrationScript: `${source.bodyMarkdown}\n\n${source.workedExample}`,
      readingGuide: { title: source.title, body: source.bodyMarkdown }, knowledgeChecks: questions,
      exercises: [{ id: `${key}-workbook`, title: 'Apply the lesson', instructions: source.workbook.brief,
        prompts: source.lmsPrompts, submissionRequirements: source.workbook.submissionRequirements }],
      remediation: { passingScore: 80, instructions: 'Read the original explanation and correct the reasoning.' },
      plannedMinutes: 120, actualHoursAwardedByContent: false,
      ...(index < 10 ? { manufacturingSimulation: publicSpec } : {}),
    };
    return { id, course_id: COURSE_ID, slug: key, title: source.title, order_index: index + 1,
      learning_objectives: source.objectives, content: { html: `<p>${source.bodyMarkdown}</p>` },
      rendered_html: `<article>${source.bodyMarkdown}</article>`, quiz_questions: questions,
      duration_minutes: 120, passing_score: 80, approved: false, is_published: false, status: 'draft',
      content_json: { authoredLessonId: key, experience,
        workbook: { brief: source.workbook.brief, inputs: source.workbook.inputs,
          prompts: source.lmsPrompts, submissionRequirements: source.workbook.submissionRequirements },
        activityPlan: [{ label: 'Authored practice', minutes: 120 }] } };
  });
  const profile: any = {
    id: `course:${COURSE_ID}`, title: 'Authored source preservation fixture', authority: 'course-defined',
    standardVersion: 'course-defined', sourceDocuments: [],
    canonicalLessonIds: Object.fromEntries(lessons.map(lesson => [lesson.id, lesson.id])),
    competencies: lessons.map(lesson => ({ id: lesson.id, title: lesson.title, description: lesson.title,
      type: 'knowledge', authorityRequirementIds: [], requiresDemonstration: false, requiresPracticalEvidence: false })),
    instructionalSources: [0, 1, 2].map(part => ({
      id: `syllabus:${COURSE_ID}:part-${part + 1}.txt`,
      text: sourceLessons.slice(part * 8, part * 8 + 8).map(source =>
        `=== LESSON: ${source.title} ===\nCanonical lesson ID: ${source.canonicalId}\n${JSON.stringify(source, null, 2)}\n`).join('\n'),
    })),
  };
  return { profile, lessons, sourceLessons };
}

function readOnlyDb(lessons: Row[]) {
  const queries: string[] = [];
  return { queries, from(table: string) {
    if (table !== 'course_lessons') throw new Error(`Unexpected table ${table}`);
    let columns = '';
    const query = {
      select(value: string) { columns = value; queries.push(value); return query; },
      eq(key: string, value: string) { expect([key, value]).toEqual(['course_id', COURSE_ID]); return query; },
      async order(key: string) {
        expect(key).toBe('order_index');
        return { data: clone(lessons.map(lesson => Object.fromEntries(columns.split(',').map(column => [column, lesson[column]])))), error: null };
      },
    };
    return query;
  } };
}

function providerFixture() {
  const question = { id: 'generated-question', prompt: 'Generated question?', choices: ['First', 'Second'],
    answerIndex: 0, explanation: 'Generated explanation.', remediation: 'Review the generated concept.', objectiveIds: ['o'] };
  const assessment = { questions: [question], reassessment: [{ ...question, id: 'generated-reassessment' }], passingScore: 80 };
  return { assessment, blueprint: {
    objectives: [{ id: 'o', text: 'Explain the generated concept.', sourceRequirementIds: ['r'] }],
    stages: [{ stage: 'introduction', instruction: 'Generated introduction.', objectiveIds: ['o'] }],
    activities: [{ id: 'generated-practice', type: 'guided_practice', prompt: 'Generated practice.', feedback: 'Generated feedback.', objectiveIds: ['o'] }],
    assessment,
    authoringEvidence: { provider: 'google', model: 'test-model', responseHash: 'unchanged-provider-response' },
  } };
}

async function runContract(profile: any, competencyId: string, complete = true) {
  const provider = providerFixture();
  const blueprint = vi.fn(async () => provider.blueprint);
  const generate = vi.fn(async () => provider.assessment);
  const production = createProductionHandlers({
    instructional: { blueprint, objectives: async () => provider.blueprint.objectives },
    assessment: { generate },
  } as any);
  const handlers = Object.fromEntries(ULTIMATE_BUILD_STEPS.map(step => [step, async () => ({ artifacts: fixtureArtifact(step) })]));
  handlers.learning_objectives = production.learning_objectives;
  handlers.assessment_alignment = production.assessment_alignment;
  // Synthetic contract fixture only: the actual browser workflow is covered
  // separately by the staged endpoint/UI and browser-runner tests.
  handlers.learner_runthrough = async (context: any) => {
    const artifact = fixtureArtifact('learner_runthrough');
    const simulation = context.artifacts.assessment_alignment?.authoredPreservation?.experience?.manufacturingSimulation;
    if (simulation) artifact.learnerRuntimeEvidence.evidence.manufacturingWorkflow = {
      version: 'staged-manufacturing-qa-v1', simulationId: simulation.id, gradingKeyId: simulation.gradingKeyId,
      specHash: contractHash(publicManufacturingSimulation(simulation)), taskCount: simulation.tasks.length,
      deniedBefore: true, deniedCritical: true, submittedThroughUI: true, score: 100, criticalMisses: 0,
      persisted: true, completionObserved: true,
    };
    return { artifacts: artifact };
  };
  const context: any = { buildId: `fixture:${competencyId}`, courseId: COURSE_ID, profile, artifacts: {}, findings: [], passedSteps: new Set(),
    ...(!complete ? { stopAfterStep: 'assessment_alignment' } : {}) };
  await new UltimateBuildRunner(handlers).run(context);
  return { context, provider, blueprint, generate };
}

function publication(profile: any, competencyId: string, artifacts: any) {
  const script = { activities: providerFixture().blueprint.activities };
  return { profile, courseId: COURSE_ID, buildId: 'build', contractVersion: ULTIMATE_LESSON_CONTRACT_VERSION,
    lessons: [{ competencyId, canonicalLessonId: competencyId, sourceLessonBuildId: 'lesson-build', slug: 'lesson', title: 'Lesson', orderIndex: 1,
      objectives: ['Generated objective'], videoUrl: artifacts.lesson_film_render.render.videoUrl,
      script: 'Generated narration', storyboard: artifacts.storyboard.storyboard, practicalRequired: false,
      content: script, assessment: artifacts.assessment_alignment.assessment,
      segments: [{ stage: 'introduction', text: 'Generated introduction.' }], timeline: artifacts.synchronization.timeline,
      contractArtifacts: artifacts }] };
}

describe('source-bound authored Ultimate experience', () => {
  it('hydrates all 24 exact identities while excluding unapproved drafts from implicit teaching sources', async () => {
    const { profile, lessons } = authoredFixture();
    delete profile.instructionalSources;
    const before = clone(lessons);
    const hydrated = await hydrateUltimateProfileSources(readOnlyDb(lessons) as any, COURSE_ID, profile);
    expect(hydrated.instructionalSources).toBeUndefined();
    expect(Object.keys(hydrated.authoredLessonRequirements!)).toEqual(lessons.map(lesson => lesson.id));
    expect(hydrated.authoredLessonPreservation).toEqual({});
    expect(lessons).toEqual(before);
    const blueprint = vi.fn();
    const handlers = createProductionHandlers({ instructional: { blueprint } } as any);
    await expect(handlers.learning_objectives({ profile: hydrated, buildId: `build:${lessons[0].id}` } as any)).rejects.toThrow('ULTIMATE_AUTHORED_SOURCE_CHANGED');
    expect(blueprint).not.toHaveBeenCalled();
  });

  it('binds three explicit source parts to 24 immutable snapshots, 76 questions, 69 public tasks and 2,880 minutes', async () => {
    const { profile, lessons } = authoredFixture();
    const before = clone(lessons);
    const hydrated = await hydrateUltimateProfileSources(readOnlyDb(lessons) as any, COURSE_ID, profile);
    const records = Object.values(hydrated.authoredLessonPreservation!);
    expect(records).toHaveLength(24);
    expect(records.reduce((n, record) => n + record.snapshot.quizQuestions.length, 0)).toBe(76);
    expect(records.reduce((n, record) => n + record.snapshot.durationMinutes!, 0)).toBe(2880);
    expect(records.filter(record => record.snapshot.experience.manufacturingSimulation)).toHaveLength(10);
    expect(records.reduce((n, record) => n + (record.snapshot.experience.manufacturingSimulation?.tasks.length ?? 0), 0)).toBe(69);
    for (const lesson of lessons) {
      const record = hydrated.authoredLessonPreservation![lesson.id];
      assertPreservationRecord(hydrated, lesson.id, record);
      expect(record.snapshot.experience).toEqual(lesson.content_json.experience);
      expect(record.snapshot.workbook).toEqual(lesson.content_json.workbook);
      expect(record.snapshot.learningObjectives).toEqual(lesson.learning_objectives);
      expect(record.sourceHash).toBe(createHash('sha256').update(profile.instructionalSources.find((s: any) => s.id === record.sourceId).text).digest('hex'));
    }
    expect(lessons).toEqual(before);
    lessons[0].content_json.workbook.inputs.lot = 'mutated outside the profile';
    lessons[0].quiz_questions[0].correctAnswer = 2;
    expect(hydrated.authoredLessonPreservation![lessons[0].id].snapshot.workbook).toEqual(before[0].content_json.workbook);
    expect(hydrated.authoredLessonPreservation![lessons[0].id].snapshot.quizQuestions).toEqual(before[0].quiz_questions);
  });

  it.each(['reading', 'question', 'workbook', 'duration', 'objective', 'identity', 'missing-part', 'duplicate-source'])('refuses incomplete or mismatched explicit authorization: %s', variant => {
    const { profile, lessons } = authoredFixture();
    if (variant === 'reading') lessons[0].content_json.experience.readingGuide.body = 'Changed reading';
    if (variant === 'question') lessons[0].quiz_questions[0].correctAnswer = 2;
    if (variant === 'workbook') lessons[0].content_json.workbook.inputs.lot = 'Changed lot';
    if (variant === 'duration') lessons[0].duration_minutes = 5;
    if (variant === 'objective') lessons[0].learning_objectives = ['Changed objective'];
    if (variant === 'identity') lessons[0].content_json.authoredLessonId = 'Another authored lesson';
    if (variant === 'missing-part') profile.instructionalSources.pop();
    if (variant === 'duplicate-source') profile.instructionalSources.push({ ...profile.instructionalSources[0], id: 'duplicate' });
    expect(() => bindAuthoredLessonPreservation(profile, lessons)).toThrow('ULTIMATE_AUTHORED_SOURCE_AUTHORIZATION_REQUIRED');
  });

  it('never imports private simulation answer keys from reviewed teaching sources', () => {
    const { profile, lessons } = authoredFixture();
    expect(profile.instructionalSources[0].text).toContain('"expected"');
    const bound = bindAuthoredLessonPreservation(profile, lessons);
    const simulation = bound.authoredLessonPreservation![lessons[0].id].snapshot.experience.manufacturingSimulation;
    expect(simulation.gradingKeyId).toBe(lessons[0].content_json.experience.manufacturingSimulation!.gradingKeyId);
    expect(JSON.stringify(simulation)).not.toContain('"expected"');
    expect(JSON.stringify(simulation)).not.toContain('"rationale"');
    lessons[0].content_json.experience.manufacturingSimulation = { ...simulationFixture, gradingKeyId: simulation.gradingKeyId } as any;
    expect(() => bindAuthoredLessonPreservation(profile, lessons)).toThrow('ULTIMATE_AUTHORED_PROTECTED_SIMULATION_REQUIRED');
  });

  it('composes authored reading/workbook/questions before later QA hashes without altering provider evidence', async () => {
    const { profile, lessons } = authoredFixture();
    const bound = bindAuthoredLessonPreservation(profile, lessons);
    const id = lessons[0].id;
    const { context, provider } = await runContract(bound, id, false);
    expect(context.findings).toEqual([]);
    const artifacts = context.artifacts;
    const preserved = artifacts.assessment_alignment.authoredPreservation;
    for (const [key, value] of Object.entries(lessons[0].content_json.experience)) expect(preserved.experience[key]).toEqual(value);
    expect(artifacts.learning_objectives.blueprint).toEqual(provider.blueprint);
    expect(artifacts.learning_objectives.blueprint.authoringEvidence).toEqual(provider.blueprint.authoringEvidence);
    expect(preserved.learnerBlueprint).not.toHaveProperty('authoringEvidence');
    expect(preserved.learnerBlueprint).not.toHaveProperty('authoredExperience');
    expect(preserved.learnerBlueprint.projection.providerBlueprintHash).toBe(contractHash(provider.blueprint));
    expect(preserved.learnerBlueprint.manufacturingSimulation).toEqual(lessons[0].content_json.experience.manufacturingSimulation);
    expect(preserved.learnerBlueprint.stages.at(-1).instruction).toContain(lessons[0].content_json.experience.readingGuide.body);
    expect(preserved.learnerBlueprint.activities.at(-1).prompt).toContain(lessons[0].content_json.workbook.prompts[0]);
    expect(preserved.learnerBlueprint.assessment.questions[0].answerIndex).toBe(0);
    expect(artifacts.assessment_alignment.assessment).toEqual(provider.assessment);
    expect(currentEvidence(artifacts.assessment_alignment, stepInputHash('assessment_alignment', bound, artifacts))).toBe(true);
    expect(validateStepOutput('assessment_alignment', artifacts.assessment_alignment)).toEqual([]);
    expect(learnerBlueprintFromArtifacts(artifacts, bound, id)).toEqual(preserved.learnerBlueprint);
    expect(scoreLessonQuestions(preserved.learnerBlueprint.assessment.questions,
      lessons[0].quiz_questions.map(question => question.correctAnswer), 80)).toMatchObject({ score: 100, passed: true });
    const publicView = publicBlueprint(preserved.learnerBlueprint);
    expect(publicView.assessment.questions[0]).toEqual({ id: lessons[0].quiz_questions[0].id,
      prompt: lessons[0].quiz_questions[0].prompt, choices: lessons[0].quiz_questions[0].options });
    expect(() => assertCompleteLesson(artifacts, bound, id)).toThrow('ULTIMATE_CURRENT_CONTRACT_EVIDENCE_REQUIRED:lesson_film_render');
  });

  it('publishes the same certified projection and original objectives after all existing contract gates', async () => {
    const { profile, lessons } = authoredFixture();
    const bound = bindAuthoredLessonPreservation(profile, lessons);
    const id = lessons[0].id;
    const { context } = await runContract(bound, id);
    expect(context.findings).toEqual([]);
    assertCompleteLesson(context.artifacts, bound, id);
    const prepared = prepareUltimatePublication(publication(bound, id, context.artifacts), 'real-actor');
    expect(prepared[0].row.content_json.experience).toEqual(context.artifacts.assessment_alignment.authoredPreservation.experience);
    expect(prepared[0].row.learning_objectives).toEqual(lessons[0].learning_objectives);
    expect(prepared[0].canonicalLessonId).toBe(id);
    expect(prepared[0].row.content_json.experience.plannedMinutes).toBe(120);
    expect(prepared[0].row).not.toHaveProperty('duration_minutes');
    expect(prepared[0].row.published_by).toBe('real-actor');
  });

  it('does not accept a generic browser scenario as the authored simulation release evidence', async () => {
    const { profile, lessons } = authoredFixture();
    const bound = bindAuthoredLessonPreservation(profile, lessons);
    const id = lessons[0].id;
    const { context } = await runContract(bound, id);
    assertCompleteLesson(context.artifacts, bound, id);
    delete context.artifacts.learner_runthrough.learnerRuntimeEvidence.evidence.manufacturingWorkflow;
    expect(() => assertCompleteLesson(context.artifacts, bound, id)).toThrow('ULTIMATE_MANUFACTURING_BROWSER_EVIDENCE_REQUIRED');
    expect(() => prepareUltimatePublication(publication(bound, id, context.artifacts), 'actor')).toThrow('ULTIMATE_MANUFACTURING_BROWSER_EVIDENCE_REQUIRED');
  });

  it.each(['snapshot', 'source', 'profile-record', 'projection', 'provider-blueprint'])('rejects %s changes instead of recertifying a changed source after QA', async variant => {
    const { profile, lessons } = authoredFixture();
    const bound: any = bindAuthoredLessonPreservation(profile, lessons);
    const id = lessons[0].id;
    const { context } = await runContract(bound, id);
    const oldQaHash = stepInputHash('learner_runthrough', bound, context.artifacts);
    if (variant === 'snapshot') bound.authoredLessonPreservation[id].snapshot.experience.readingGuide.body += ' Changed';
    if (variant === 'source') bound.instructionalSources[0].text += '\nChanged authorized source';
    if (variant === 'profile-record') bound.authoredLessonPreservation[id].sourceId = 'another-source';
    if (variant === 'projection') {
      const artifact = context.artifacts.assessment_alignment;
      artifact.authoredPreservation.experience.knowledgeChecks = [];
      // A local recomputed output digest cannot replace source authorization.
      artifact.authoredPreservation.experienceHash = contractHash(artifact.authoredPreservation.experience);
      artifact.contractEvidence.outputHash = contractHash(artifactPayload(artifact));
    }
    if (variant === 'provider-blueprint') context.artifacts.learning_objectives.blueprint.stages[0].instruction = 'Changed provider output';
    expect(stepInputHash('learner_runthrough', bound, context.artifacts)).not.toBe(oldQaHash);
    expect(() => assertAuthoredExperienceArtifacts(context.artifacts, bound, id)).toThrow();
    expect(() => prepareUltimatePublication(publication(bound, id, context.artifacts), 'actor')).toThrow();
  });

  it('does not allow a recomputed snapshot hash to authorize different question content', () => {
    const { profile, lessons } = authoredFixture();
    const bound = bindAuthoredLessonPreservation(profile, lessons);
    const id = lessons[0].id;
    const record = bound.authoredLessonPreservation![id];
    (record.snapshot.quizQuestions[0] as any).correctAnswer = 2;
    record.snapshotHash = contractHash(record.snapshot);
    expect(() => assertPreservationRecord(bound, id, record)).toThrow('ULTIMATE_AUTHORED_SOURCE_AUTHORIZATION_REQUIRED');
  });

  it('keeps a locked snapshot unchanged on resume so attachment can detect a concurrent canonical edit', () => {
    const { profile, lessons } = authoredFixture();
    const bound = bindAuthoredLessonPreservation(profile, lessons);
    const before = clone(bound.authoredLessonPreservation);
    lessons[0].content_json.experience.remediation.instructions = 'Concurrent canonical edit';
    const resumed = bindAuthoredLessonPreservation(bound, lessons);
    expect(resumed.authoredLessonPreservation).toEqual(before);
  });

  it('keeps ordinary course generation unchanged and refuses unbound preservation injection', async () => {
    const { profile, lessons } = authoredFixture();
    const ordinary: any = { ...profile, instructionalSources: [], competencies: [profile.competencies[0]] };
    const { context, provider } = await runContract(ordinary, lessons[0].id);
    expect(context.findings).toEqual([]);
    expect(context.artifacts.learning_objectives).not.toHaveProperty('authoredSource');
    expect(context.artifacts.assessment_alignment).not.toHaveProperty('authoredPreservation');
    expect(learnerBlueprintFromArtifacts(context.artifacts, ordinary, lessons[0].id)).toEqual(provider.blueprint);
    context.artifacts.assessment_alignment.authoredPreservation = { learnerBlueprint: { stages: ['unbound'] } };
    expect(() => learnerBlueprintFromArtifacts(context.artifacts, ordinary, lessons[0].id)).toThrow('ULTIMATE_AUTHORED_SOURCE_ARTIFACT_REQUIRED');
  });
});
