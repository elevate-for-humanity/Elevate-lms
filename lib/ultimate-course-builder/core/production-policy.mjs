import {ACTIVE_LESSON_WORKER_CONTRACT} from '../worker/active-worker-contract.mjs';

/** Shared production rules, separated from occupation content and one-course repair orders. */
export const COURSE_PRODUCTION_POLICY_VERSION = 'approved-course-production-v1';
export const COURSE_PRODUCTION_INSTRUCTIONS = Object.freeze([
  'Use the approved first instructional lesson as the presentation standard only; never reuse its footage as another course teaching asset.',
  'Use task-relevant photographs and inspected licensed demonstration footage throughout spoken teaching. Synchronize picture changes, concise instructions, narration and captions; contain whole images without cropping hands, tools or heads.',
  'Use 3-4 meaningful distinct picture cues per teaching segment plus its recap where supported. No blank instructional intervals, text-card substitutes, repeated filler or unrelated footage.',
  'Teach every objective with explanation, source-grounded worked examples, guided and independent practice, mistakes and corrections, and freshly worded subject-specific recaps.',
  'Allow enough time to explain and demonstrate the topic. Do not rush substantive topics or pad duration with repetition, silent holds or duplicate narration.',
  'End every instructional lesson with subject-specific multiple-choice questions, correct answers, explanations and reassessment. Retain a cumulative final after the completed lessons; no fixed five-question recap count.',
  'Online pictures and quizzes do not replace practical demonstration evidence or qualified trainer verification required by the occupation standard.',
  'Publish completed lessons only after delivered-media, instructional, narration and learner checks pass. Preserve completed lessons and resume unfinished work from verified checkpoints.',
  'Keep a verified live worker on every currently runnable lesson stage. Queued role records and capacity waits do not satisfy active production; replace stale workers and keep dispatching until each runnable stage has a fresh claim.',
]);
const reference = Object.freeze({
  assetId:'17166b5b-e730-4b1e-a52c-6c467e38b234',
  storagePath:'generated-lessons/lesson-e1e53bfd-2504-46b0-a814-a31c74a0090a-mv93v9ru-a87df139-4b23-4c59-b6f6-b05cc22ea7ae.mp4',
  sha256:'6921ebb2f049e0183fa2f5cfebaa1a9a6e2a8242a672daebbdcb251ca0a96fc2',
  approvedAt:'2026-10-17',permittedUses:['presentation-reference'],
});
export function inheritCourseProductionPolicy(profile) {
  return {
    ...profile,
    productionPolicyVersion:COURSE_PRODUCTION_POLICY_VERSION,
    lessonPresentation:'approved-premium-v1',
    instructionalAuthoring:profile.instructionalAuthoring ?? {provider:'google',model:'gemini-3.8-flash',location:'us',version:'source-grounded-teaching-1'},
    parallelAutopilot:'three-role-v1',
    activeLessonWorkers:ACTIVE_LESSON_WORKER_CONTRACT,
    publishCompletedLessons:true,
    publicationPolicy:'automatic-quality-verified',
    lessonCompletionPolicy:'complete-before-advance-v1',
    presentationContract:{
      ...profile.presentationContract,
      version:COURSE_PRODUCTION_POLICY_VERSION,
      approvedReferenceVideo:profile.presentationContract?.approvedReferenceVideo ?? {...reference,permittedUses:[...reference.permittedUses]},
      visualStyle:{cropMode:'contain',transition:'crossfade'},
      instructions:[...new Set([...COURSE_PRODUCTION_INSTRUCTIONS,...(profile.presentationContract?.instructions ?? [])])],
    },
  };
}
