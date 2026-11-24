import { createHash } from 'node:crypto';
import { contractHash } from '../core/lesson-contract';
import type { UltimateCredentialProfile } from '../core/types';
import { parsePublicManufacturingSimulation } from '@/lib/lms/manufacturing-simulation';

export const AUTHORED_EXPERIENCE_VERSION = 'authored-experience-v1';
type JsonObject = Record<string, any>;
export type AuthoredLessonPreservation = {
  version: typeof AUTHORED_EXPERIENCE_VERSION;
  lessonId: string;
  authoredLessonId: string;
  sourceId: string;
  sourceHash: string;
  snapshotHash: string;
  snapshot: {
    experience: JsonObject;
    workbook: unknown;
    activityPlan: unknown;
    quizQuestions: unknown[];
    content: unknown;
    renderedHtml: string | null;
    learningObjectives: string[];
    durationMinutes: number | null;
    passingScore: number | null;
  };
};
const object = (value: unknown): value is JsonObject => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const equal = (left: unknown, right: unknown) => contractHash(left) === contractHash(right);
const sourceHash = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

/** Read one complete JSON object without treating source prose as executable instructions. */
function leadingObject(text: string): JsonObject | null {
  const start = text.search(/\S/);
  if (start < 0 || text[start] !== '{') return null;
  let depth = 0, quoted = false, escaped = false;
  for (let index = start; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === '{') depth++;
    else if (character === '}' && --depth === 0) {
      try { const value = JSON.parse(text.slice(start, index + 1)); return object(value) ? value : null; }
      catch { return null; }
    }
  }
  return null;
}

function sourceLessons(source: { id: string; text: string }, lessonId: string) {
  const matches: JsonObject[] = [];
  for (const match of source.text.matchAll(/Canonical lesson ID:\s*([0-9a-f-]{36})\s*\r?\n/gi)) {
    if (match[1] !== lessonId) continue;
    const value = leadingObject(source.text.slice(match.index! + match[0].length));
    if (value?.canonicalId === lessonId) matches.push(value);
  }
  // Also accept the canonical, explicitly attached per-lesson source envelope.
  if (source.id === `course-lesson:${lessonId}`) {
    const marker = 'Authorized course content: ';
    const offset = source.text.indexOf(marker);
    if (offset >= 0) {
      const value = leadingObject(source.text.slice(offset + marker.length));
      if (value?.canonicalId === lessonId) matches.push(value);
    }
  }
  return matches;
}

function questionIdentity(question: JsonObject) {
  return {
    prompt: question.prompt ?? question.question,
    options: question.options ?? question.choices,
    correctIndex: question.correctIndex ?? question.correctAnswer ?? question.correct ?? question.answerIndex,
    explanation: question.explanation,
  };
}

function matchesAuthoredSource(lesson: JsonObject, source: JsonObject): boolean {
  const json = lesson.content_json;
  const experience = json.experience;
  const questions = source.practiceQuestions;
  if (source.id !== json.authoredLessonId || source.canonicalId !== lesson.id ||
      typeof source.bodyMarkdown !== 'string' || !source.bodyMarkdown.trim() ||
      !object(source.workbook) || !Array.isArray(questions) || !questions.length ||
      !equal(source.objectives, lesson.learning_objectives) ||
      source.estimatedMinutes !== lesson.duration_minutes ||
      experience.readingGuide?.body !== source.bodyMarkdown ||
      experience.narrationScript !== `${source.bodyMarkdown}\n\n${source.workedExample}` ||
      !Array.isArray(experience.knowledgeChecks) || !Array.isArray(lesson.quiz_questions)) return false;
  const expected = questions.map(questionIdentity);
  if (!equal(experience.knowledgeChecks.map(questionIdentity), expected) ||
      !equal(lesson.quiz_questions.map(questionIdentity), expected)) return false;
  const workbook = {
    brief: source.workbook.brief, inputs: source.workbook.inputs,
    prompts: source.lmsPrompts, submissionRequirements: source.workbook.submissionRequirements,
  };
  if (!equal(json.workbook, workbook) || !Array.isArray(experience.exercises) || experience.exercises.length !== 1) return false;
  const exercise = experience.exercises[0];
  return exercise.id === `${source.id}-workbook` && exercise.instructions === workbook.brief &&
    equal(exercise.prompts, workbook.prompts) && equal(exercise.submissionRequirements, workbook.submissionRequirements);
}

function assertPublicSimulation(experience: JsonObject) {
  if (experience.manufacturingSimulation === undefined) return;
  const publicSpec = parsePublicManufacturingSimulation(experience.manufacturingSimulation);
  if (!publicSpec?.gradingKeyId) throw new Error('ULTIMATE_AUTHORED_PROTECTED_SIMULATION_REQUIRED');
}

/** A marker is not source authorization. The exact authored lesson must also
 * occur in an explicitly attached source; unapproved drafts never become sources. */
export function bindAuthoredLessonPreservation(
  profile: UltimateCredentialProfile,
  lessons: JsonObject[],
): UltimateCredentialProfile {
  const required = { ...profile.authoredLessonRequirements };
  const preserved = { ...profile.authoredLessonPreservation };
  let found = false;
  for (const lesson of lessons) {
    const authoredLessonId = lesson.content_json?.authoredLessonId;
    if (typeof authoredLessonId !== 'string' || !authoredLessonId.trim()) continue;
    const competencies = profile.competencies.filter(competency =>
      competency.id === lesson.id || profile.canonicalLessonIds?.[competency.id] === lesson.id);
    if (!competencies.length) continue;
    found = true;
    if (!object(lesson.content_json.experience)) throw new Error('ULTIMATE_AUTHORED_EXPERIENCE_REQUIRED');
    assertPublicSimulation(lesson.content_json.experience);
    for (const competency of competencies) {
      required[competency.id] = { lessonId: lesson.id, authoredLessonId };
      const saved = preserved[competency.id];
      if (saved) {
        assertPreservationRecord(profile, competency.id, saved);
        if (saved.lessonId !== lesson.id || saved.authoredLessonId !== authoredLessonId)
          throw new Error('ULTIMATE_AUTHORED_SOURCE_CHANGED');
        continue; // Never replace a locked source snapshot while resuming.
      }
      const sources = profile.instructionalSources ?? [];
      if (!sources.length) continue; // Preparation may precede explicit source attachment.
      const matches = sources.flatMap(source => sourceLessons(source, lesson.id)
        .filter(value => matchesAuthoredSource(lesson, value)).map(() => source));
      if (matches.length !== 1) throw new Error(`ULTIMATE_AUTHORED_SOURCE_AUTHORIZATION_REQUIRED:${lesson.id}`);
      const source = matches[0];
      const snapshot: AuthoredLessonPreservation['snapshot'] = copy({
        experience: copy(lesson.content_json.experience),
        workbook: lesson.content_json.workbook ?? null,
        activityPlan: lesson.content_json.activityPlan ?? null,
        quizQuestions: lesson.quiz_questions ?? [],
        content: lesson.content ?? null,
        renderedHtml: lesson.rendered_html ?? null,
        learningObjectives: lesson.learning_objectives ?? [],
        durationMinutes: lesson.duration_minutes ?? null,
        passingScore: lesson.passing_score ?? null,
      });
      preserved[competency.id] = {
        version: AUTHORED_EXPERIENCE_VERSION, lessonId: lesson.id, authoredLessonId,
        sourceId: source.id, sourceHash: sourceHash(source.text), snapshotHash: contractHash(snapshot), snapshot,
      };
    }
  }
  return found ? { ...profile, authoredLessonRequirements: required, authoredLessonPreservation: preserved } : profile;
}

export function assertPreservationRecord(profile: UltimateCredentialProfile, competencyId: string, record?: AuthoredLessonPreservation) {
  const required = profile.authoredLessonRequirements?.[competencyId];
  if (!record && !required) return;
  const source = profile.instructionalSources?.find(item => item.id === record?.sourceId);
  if (!record || !required || record.version !== AUTHORED_EXPERIENCE_VERSION || !object(record.snapshot?.experience) ||
      record.lessonId !== (profile.canonicalLessonIds?.[competencyId] ?? competencyId) ||
      (required && (required.lessonId !== record.lessonId || required.authoredLessonId !== record.authoredLessonId)) ||
      !source || sourceHash(source.text) !== record.sourceHash || contractHash(record.snapshot) !== record.snapshotHash)
    throw new Error('ULTIMATE_AUTHORED_SOURCE_CHANGED');
  assertPublicSimulation(record.snapshot.experience);
  const lesson = {
    id: record.lessonId, learning_objectives: record.snapshot.learningObjectives,
    duration_minutes: record.snapshot.durationMinutes, quiz_questions: record.snapshot.quizQuestions,
    content_json: { authoredLessonId: record.authoredLessonId, experience: record.snapshot.experience, workbook: record.snapshot.workbook },
  };
  if (sourceLessons(source, record.lessonId).filter(value => matchesAuthoredSource(lesson, value)).length !== 1)
    throw new Error('ULTIMATE_AUTHORED_SOURCE_AUTHORIZATION_REQUIRED');
}

function learnerQuestion(question: JsonObject, experience: JsonObject) {
  const normalized = questionIdentity(question);
  if (typeof question.id !== 'string' || !question.id || typeof normalized.prompt !== 'string' ||
      !normalized.prompt.trim() || !Array.isArray(normalized.options) || normalized.options.length < 2 ||
      !Number.isInteger(normalized.correctIndex) || normalized.correctIndex < 0 || normalized.correctIndex >= normalized.options.length ||
      typeof normalized.explanation !== 'string' || !normalized.explanation.trim())
    throw new Error('ULTIMATE_AUTHORED_QUESTION_INVALID');
  // Only the assessment schema is projected: carrying legacy correctAnswer or
  // correct fields through publicBlueprint would expose the answer on QA pages.
  return { id: question.id, prompt: normalized.prompt, choices: normalized.options, answerIndex: normalized.correctIndex,
    explanation: normalized.explanation, objectiveIds: question.objectiveIds ?? [],
    remediation: question.remediation ?? experience.remediation?.instructions ?? normalized.explanation };
}

function exercisePrompt(exercise: JsonObject): string {
  return [exercise.instructions, exercise.prompts, exercise.submissionRequirements]
    .flatMap(value => Array.isArray(value) ? value : [value]).filter(value => typeof value === 'string' && value.trim()).join('\n\n');
}

/** Deterministic learner projection. Never edits or re-certifies the provider blueprint. */
export function createAuthoredPreservation(profile: UltimateCredentialProfile, competencyId: string, artifacts: JsonObject, assessment: JsonObject) {
  const record = profile.authoredLessonPreservation?.[competencyId];
  assertPreservationRecord(profile, competencyId, record);
  if (!record) return undefined;
  const blueprint = artifacts.learning_objectives?.blueprint;
  if (!blueprint || !equal(artifacts.learning_objectives?.authoredSource, record))
    throw new Error('ULTIMATE_AUTHORED_SOURCE_ARTIFACT_REQUIRED');
  const activities = artifacts.active_teaching?.activities ?? [];
  const timeline = artifacts.synchronization?.timeline;
  const generated: JsonObject = {
    learningActivities: activities,
    knowledgeChecks: assessment.questions.map((question: JsonObject) => ({ ...question, question: question.prompt, options: question.choices, correct: question.answerIndex })),
    reassessment: assessment.reassessment.map((question: JsonObject) => ({ ...question, question: question.prompt, options: question.choices, correct: question.answerIndex })),
    interactiveVideo: { transcript: (timeline?.segments ?? []).map((segment: JsonObject) => ({ start: segment.startSeconds, end: segment.endSeconds, text: segment.text })) },
    instructionalTimeline: { scenes: (timeline?.segments ?? []).map((segment: JsonObject) => ({ id: segment.segmentId, startTime: segment.startSeconds, endTime: segment.endSeconds, narration: segment.text })), events: [] },
  };
  const experience = copy({ ...generated, ...record.snapshot.experience });
  const { authoringEvidence: _providerEvidence, ...providerProjection } = copy(blueprint);
  const reading = experience.readingGuide;
  const readingText = [reading?.body, ...(reading?.sections ?? []).map((section: JsonObject) => section.body)].filter(Boolean).join('\n\n');
  const authoredActivities = (experience.exercises ?? []).map((exercise: JsonObject) => {
    const prompt = exercisePrompt(exercise);
    if (!exercise.id || !prompt) throw new Error('ULTIMATE_AUTHORED_WORKBOOK_INVALID');
    return { id: exercise.id, type: 'independent_practice', prompt,
      feedback: exercise.expectedArtifact ?? experience.remediation?.instructions ?? '', objectiveIds: [] };
  });
  const learnerBlueprint = {
    ...providerProjection,
    projection: { producer: AUTHORED_EXPERIENCE_VERSION, providerBlueprintHash: contractHash(blueprint), snapshotHash: record.snapshotHash },
    stages: [...(blueprint.stages ?? []), ...(readingText ? [{ stage: 'authored_reading', instruction: readingText, objectiveIds: [] }] : [])],
    activities: [...(blueprint.activities ?? []).filter((activity: JsonObject) => !authoredActivities.some((authored: JsonObject) => authored.id === activity.id)), ...authoredActivities],
    assessment: { ...assessment,
      questions: experience.knowledgeChecks.map((question: JsonObject) => learnerQuestion(question, experience)),
      reassessment: (experience.reassessment ?? []).map((question: JsonObject) => learnerQuestion(question, experience)),
      passingScore: record.snapshot.passingScore ?? assessment.passingScore,
    },
  };
  if (!learnerBlueprint.assessment.questions.length || !learnerBlueprint.assessment.reassessment.length ||
      !Number.isFinite(learnerBlueprint.assessment.passingScore) || learnerBlueprint.assessment.passingScore <= 0 || learnerBlueprint.assessment.passingScore > 100)
    throw new Error('ULTIMATE_AUTHORED_ASSESSMENT_REQUIRED');
  return { ...copy(record), experience, experienceHash: contractHash(experience), learnerBlueprint, learnerBlueprintHash: contractHash(learnerBlueprint) };
}

export function assertAuthoredExperienceArtifacts(artifacts: JsonObject, profile: UltimateCredentialProfile, competencyId: string) {
  const record = profile.authoredLessonPreservation?.[competencyId];
  assertPreservationRecord(profile, competencyId, record);
  if (!record) {
    if (artifacts.learning_objectives?.authoredSource || artifacts.assessment_alignment?.authoredPreservation)
      throw new Error('ULTIMATE_AUTHORED_SOURCE_ARTIFACT_REQUIRED');
    return;
  }
  const saved = artifacts.assessment_alignment?.authoredPreservation;
  if (!saved || !equal(saved, createAuthoredPreservation(profile, competencyId, artifacts, artifacts.assessment_alignment?.assessment)))
    throw new Error('ULTIMATE_AUTHORED_EXPERIENCE_CONTRACT_CHANGED');
}

export function learnerBlueprintFromArtifacts(artifacts: JsonObject, profile: UltimateCredentialProfile, competencyId: string) {
  assertAuthoredExperienceArtifacts(artifacts, profile, competencyId);
  return artifacts.assessment_alignment?.authoredPreservation?.learnerBlueprint ?? artifacts.learning_objectives?.blueprint;
}
