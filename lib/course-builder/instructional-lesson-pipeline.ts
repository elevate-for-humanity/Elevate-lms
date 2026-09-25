/**
 * Canonical Course Builder instructional lesson pipeline.
 *
 * A lesson is teaching, not a video-generation request. These stages are
 * sequential and blocking. No stage may be skipped and render/publish cannot
 * begin until every preceding stage has persisted passing evidence.
 */
export const INSTRUCTIONAL_LESSON_PIPELINE_VERSION = 'instructional-lesson-v1';

export const INSTRUCTIONAL_LESSON_STEPS = [
  ['standards','Read credential, exam, DOL/OJL, state and syllabus standards.'],
  ['objectives','Define measurable learner outcomes and required evidence.'],
  ['prerequisites','Resolve prerequisite knowledge and prior skills.'],
  ['teaching_sequence','Build introduction, relevance, concepts, tools, safety, explanation, demonstration, mistakes, correction, practice, check and recap.'],
  ['instructional_script','Write plain-language teaching: what, why, how, observable success, hazards and failure modes.'],
  ['storyboard','Map every teaching segment to a distinct scene in instructional order.'],
  ['visual_assignment','Assign relevant moving instructional media to every scene; reject decorative or repeated footage.'],
  ['scene_build','Build each scene with narration, moving visual, callouts, captions, timing and transition.'],
  ['natural_narration','Generate instructor-quality speech with natural cadence, pauses, emphasis and technical pronunciation.'],
  ['synchronization','Synchronize spoken instruction, visual action and captions.'],
  ['active_teaching','Add observation prompts, guided examples, decisions or learner practice.'],
  ['mistakes_and_corrections','Teach incorrect execution, why it fails, and the correct method.'],
  ['assessment_alignment','Assess the exact objectives and skills taught in this lesson.'],
  ['render','Render the complete assembled lesson only after steps 1-13 pass.'],
  ['finished_media_qa','Inspect the decoded MP4 for distinct moving scenes, ordering, transitions, skips, missing frames, freezes, black frames, repeated clips, audio continuity and caption sync.'],
  ['instructional_qa','Verify the finished artifact itself teaches every objective, procedure, safety point, mistake/correction and required competency.'],
  ['narration_qa','Reject robotic cadence, monotone delivery, bad pauses, chopped sentences, rushed speech and technical mispronunciation.'],
  ['learner_runthrough','Run the actual LMS lesson: playback, captions, interactions, continue, completion, progress save/resume and mobile.'],
  ['selective_repair','Repair only failed components and return to the failed stage; never destructively rebuild passing work.'],
  ['publish','Publish only when all prior stages have passing persisted evidence.'],
] as const;

export type InstructionalLessonStep = (typeof INSTRUCTIONAL_LESSON_STEPS)[number][0];

export function instructionalLessonSteps() {
  return INSTRUCTIONAL_LESSON_STEPS.map(([gate, requirement], index) => ({
    order: index + 1,
    gate,
    requirement,
  }));
}

export function assertInstructionalLessonPipeline(evidence: Partial<Record<InstructionalLessonStep, boolean>>, through: InstructionalLessonStep) {
  const target = INSTRUCTIONAL_LESSON_STEPS.findIndex(([gate]) => gate === through);
  if (target < 0) throw new Error(`UNKNOWN_INSTRUCTIONAL_STAGE:${through}`);
  const failures = INSTRUCTIONAL_LESSON_STEPS.slice(0, target + 1)
    .filter(([gate]) => evidence[gate] !== true)
    .map(([gate]) => gate);
  if (failures.length) throw new Error(`INSTRUCTIONAL_PIPELINE_BLOCKED:${failures.join(',')}`);
}
