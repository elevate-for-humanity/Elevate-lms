import 'server-only';
import { contractHash } from '../core/lesson-contract';
import {
  evaluateManufacturingSimulation,
  parsePublicManufacturingSimulation,
  publicManufacturingSimulation,
  type SimulationResult,
} from '@/lib/lms/manufacturing-simulation';
import { loadManufacturingSimulationSpec } from '@/lib/lms/manufacturing-simulation-store';
import { normalizeStoredLessonContent, resolveStoredLessonExperience } from '@/lib/course-factory/mastery-policy';

type JsonObject = Record<string, any>;
const uuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** The QA snapshot contains the public problem only. Its key must still belong
 * to the same canonical lesson, whose current public problem must be unchanged. */
export async function loadStagedManufacturingSimulation(db: any, snapshot: JsonObject) {
  const value = snapshot.blueprint?.manufacturingSimulation;
  if (value === undefined) return null;
  const problem = parsePublicManufacturingSimulation(value);
  if (snapshot.qaOnly !== true || !uuid(snapshot.courseId) || !uuid(snapshot.lessonId) || !problem?.gradingKeyId)
    throw new Error('STAGED_MANUFACTURING_BINDING_INVALID');
  const { data: lesson, error } = await db.from('course_lessons')
    .select('id,course_id,content_json,content').eq('id', snapshot.lessonId).eq('course_id', snapshot.courseId).maybeSingle();
  if (error || !lesson) throw new Error('STAGED_MANUFACTURING_CANONICAL_UNAVAILABLE');
  const current = resolveStoredLessonExperience(lesson.content_json, lesson.content)?.manufacturingSimulation;
  const problemHash = contractHash(publicManufacturingSimulation(problem));
  const matches = (candidate: unknown) => {
    const parsed = parsePublicManufacturingSimulation(candidate);
    return parsed && contractHash(publicManufacturingSimulation(parsed)) === problemHash;
  };
  if (!matches(current)) throw new Error('STAGED_MANUFACTURING_CANONICAL_CHANGED');
  for (const mirror of [lesson.content_json, normalizeStoredLessonContent(lesson.content)]) {
    const candidate = mirror?.experience?.manufacturingSimulation;
    if (candidate !== undefined && !matches(candidate)) throw new Error('STAGED_MANUFACTURING_CANONICAL_CHANGED');
  }
  return loadManufacturingSimulationSpec(db, snapshot.courseId, snapshot.lessonId, problem);
}

/** Feedback confirms the submitted decisions without delivering the protected
 * expected values, rationales, or a private grading specification to a browser. */
function publicFeedback(feedback: SimulationResult['feedback']) {
  return {
    practiceOnly: true as const,
    correctCount: feedback.correctCount,
    taskCount: feedback.taskCount,
    masteryThreshold: feedback.masteryThreshold,
    criticalMisses: feedback.criticalMisses,
    tasks: feedback.tasks.map(({ taskId, correct, critical }) => ({ taskId, correct, critical })),
    reviewMessage: feedback.reviewMessage,
  };
}

function binding(run: JsonObject, spec: { id: string; gradingKeyId?: string }) {
  return {
    courseId: run.snapshot.courseId, lessonId: run.snapshot.lessonId,
    lessonBuildId: run.lesson_build_id, artifactHash: run.artifact_hash,
    gradingKeyId: spec.gradingKeyId, simulationId: spec.id,
  };
}
function matchesBinding(run: JsonObject, spec: { id: string; gradingKeyId?: string }, attempt: JsonObject | undefined) {
  return attempt && Object.entries(binding(run, spec)).every(([key, value]) => attempt[key] === value);
}

export async function submitStagedManufacturingSimulation(db: any, run: JsonObject, responses: unknown) {
  const spec = await loadStagedManufacturingSimulation(db, run.snapshot);
  if (!spec) return null;
  const grade = evaluateManufacturingSimulation(spec, responses);
  if (!grade) return null;
  const previous = run.progress?.manufacturingSimulation;
  const attempts = matchesBinding(run, spec, previous) && Number.isSafeInteger(previous.attempts) && previous.attempts >= 0
    ? previous.attempts : 0;
  return {
    ...binding(run, spec), answers: structuredClone(responses), attempts: attempts + 1,
    score: grade.score, completed: grade.completed, feedback: publicFeedback(grade.feedback),
  };
}

/** Completion is regraded from the saved answers, never a cached pass flag or
 * caller-supplied score. No real learner progress table is read or written. */
export async function stagedManufacturingComplete(db: any, run: JsonObject) {
  const spec = await loadStagedManufacturingSimulation(db, run.snapshot);
  if (!spec) return true;
  const attempt = run.progress?.manufacturingSimulation;
  return Boolean(matchesBinding(run, spec, attempt) &&
    evaluateManufacturingSimulation(spec, attempt.answers)?.completed === true);
}

export function publicStagedProgress(progress: JsonObject = {}) {
  const project = (attempt: JsonObject) => ({
    courseId: attempt.courseId, lessonId: attempt.lessonId, lessonBuildId: attempt.lessonBuildId,
    artifactHash: attempt.artifactHash, gradingKeyId: attempt.gradingKeyId, simulationId: attempt.simulationId,
    answers: attempt.answers, attempts: attempt.attempts, score: attempt.score, completed: attempt.completed,
    ...(attempt.feedback ? { feedback: publicFeedback(attempt.feedback) } : {}),
  });
  return {
    ...progress,
    ...(progress.manufacturingSimulation ? { manufacturingSimulation: project(progress.manufacturingSimulation) } : {}),
    ...(Array.isArray(progress.manufacturingSimulationHistory) ? {
      manufacturingSimulationHistory: progress.manufacturingSimulationHistory.map(project),
    } : {}),
  };
}
