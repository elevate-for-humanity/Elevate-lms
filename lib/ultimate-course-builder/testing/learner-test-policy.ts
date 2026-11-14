import { createHmac, timingSafeEqual } from 'node:crypto';
import { contractHash } from '../core/lesson-contract';

export function validTestCredential(actual: string, expected: string | undefined) {
  if (!expected || !actual) return false;
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function signLearnerEvidence(evidence: unknown, secret: string) {
  return createHmac('sha256', secret).update(contractHash(evidence)).digest('hex');
}
export function scoreLessonQuestions(questions: any[], responses: number[], threshold: number) {
  if (!questions.length || responses.length !== questions.length ||
      responses.some((answer, i) => !Number.isInteger(answer) || answer < 0 || answer >= questions[i].choices.length))
    throw new Error('LESSON_ANSWERS_INVALID');
  const missed = questions.filter((q, i) => q.answerIndex !== responses[i]);
  const score = Math.round(100 * (questions.length - missed.length) / questions.length);
  return { score, passed: score >= threshold, missed: missed.map(q => ({ id: q.id, remediation: q.remediation, objectiveIds: q.objectiveIds })) };
}
export function publicBlueprint(blueprint: any) {
  const redact = (q: any) => ({ id: q.id, prompt: q.prompt, choices: q.choices });
  return { ...blueprint, assessment: { ...blueprint.assessment,
    questions: blueprint.assessment.questions.map(redact),
    reassessment: blueprint.assessment.reassessment.map(redact) } };
}
