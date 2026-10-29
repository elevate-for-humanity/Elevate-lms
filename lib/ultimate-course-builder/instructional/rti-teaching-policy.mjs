import { COURSE_PRODUCTION_POLICY_VERSION } from '../core/production-policy.mjs';
/** Owner-scoped RTI delivery; no change to another occupation's skill checks. */
export function isCosmetologyRti(profile) {
  return profile?.id === 'course:a6b0b712-1cf0-475a-ba79-ee2023dea8ec';
}

export function usesSubjectTeachingPolicy(profile) {
  return isCosmetologyRti(profile) || profile?.productionPolicyVersion === COURSE_PRODUCTION_POLICY_VERSION;
}
export function subjectTeachingRequirements(profile) {
  if (isCosmetologyRti(profile)) return RTI_TEACHING_REQUIREMENTS;
  if (!usesSubjectTeachingPolicy(profile)) return '';
  return 'Teach this course subject using authorized sources, source-grounded examples, guided and independent practice, mistakes and corrections, and meaningful picture sequences synchronized to narration. Questions and recaps test subject concepts, decisions and safety, not LMS navigation or checkpoint mechanics. Keep assessment content and practical verification requirements specific to this occupation. Do not fabricate credentials, standards, hours or trainer signoff.';
}

/**
 * Optional RTI enrichment for future authoring runs.
 * Enabled by default for new authoring processes; set the flag to false to disable.
 * Prompt guidance only: no new schema fields, asset requirements, approval gates,
 * publication states, retries, or competency signoff.
 */
export function optionalCosmetologyRtiEnhancement(profile, enabled = process.env.ULTIMATE_COSMETOLOGY_RTI_ENRICHMENT !== 'false') {
  if (!enabled || !isCosmetologyRti(profile)) return '';
  return [
    'Where supported by the authorized instructional sources and relevant to this lesson, incorporate a concise real-world salon decision scenario, a visual subject-matter knowledge check, and a short From Theory to the Salon connection.',
    'Explain what the apprentice learns in RTI and what they can observe or practice only with their qualified host-shop trainer. The host-shop trainer verifies actual workplace skill; online quiz completion is not practical competency signoff.',
    'Use existing lesson stages, segments, activities and assessments; do not add segments, required media, new assessment gates, publishing prerequisites, fabricated work-process mappings, regulated hours or licensing claims.',
    'Keep lesson length and premium presentation standards unchanged. If source support or space is insufficient, omit this optional enrichment and complete the original authorized lesson.'
  ].join(' ');
}

export const RTI_TEACHING_REQUIREMENTS = `This is cosmetology related technical instruction (RTI), covering hair, skin, nails, makeup, safety and business. Preserve every substantive topic and the actual quizzes. Use 3-4 meaningful picture cues per teaching segment when supported by the content. Use source-grounded picture sequences as worked examples of procedures: show setup, action, safety checks and common mistakes, synchronized with narration. Hands-on performance is practiced and verified by the shop supervisor; viewing pictures or passing an online quiz is not practical signoff. Do not teach how to navigate the LMS, select multiple-choice options, submit a quiz, review module instructions or advance to the next lesson. Knowledge checks and recap questions must test cosmetology concepts, decisions and safety, not the purpose or mechanics of a checkpoint. Keep the required teaching stages focused on subject matter. A short cue to pause and answer an actual subject question is allowed. Give each topic enough explanation and examples without padding or rushing.`;

const navigationPatterns = [
  /\b(?:click|tap|press)\s+(?:on\s+)?(?:the\s+)?(?:next|continue|submit)\s+(?:button|link)\b/i,
  /\b(?:click|tap|press)\s+(?:on\s+)?(?:the\s+)?(?:start|play)\s+button\b[^.!?]{0,60}\b(?:lesson|video|player)\b/i,
  /\b(?:how to|steps? (?:for|to))\s+(?:answer|take|complete|submit)\s+(?:a\s+|the\s+)?(?:multiple[- ]choice|quiz|checkpoint assessment)\b/i,
  /\buse this assessment to verify your understanding before continuing\b/i,
  /\b(?:purpose|direct instruction|directive|objective)\s+(?:of|for)\s+(?:this|the)\s+(?:checkpoint|assessment lesson)\b/i,
  /\bread the (?:checkpoint|quiz) (?:prompt|question)s? carefully\b/i,
];

/** Reject identified filler before speech/media production, not by cutting audio. */
export function assertRtiSubjectTeaching(blueprint, profile) {
  if (!usesSubjectTeachingPolicy(profile)) return;
  const text = [
    ...(blueprint?.segments ?? []).flatMap(s => [s.text, s.recapText]),
    ...(blueprint?.assessment?.questions ?? []).map(q => q.prompt),
    ...(blueprint?.assessment?.reassessment ?? []).map(q => q.prompt),
  ].filter(Boolean).join('\n');
  if (navigationPatterns.some(pattern => pattern.test(text)))
    throw new Error('BLUEPRINT_RTI_NAVIGATION_FILLER');
}

/** Checkpoints assess their preceding module, not the placeholder directions. */
export function lessonInstructionalSources(profile, competency) {
  const selected = new Set([competency.id, ...competency.authorityRequirementIds]);
  const finalExam = usesSubjectTeachingPolicy(profile) && /\bfinal\s+exam(?:ination)?\b/i.test(competency.title ?? '');
  if (finalExam) {
    selected.delete(competency.id);
    for (const item of profile.competencies ?? []) {
      if (item.id === competency.id || /\bcheckpoint\b/i.test(item.title ?? '')) continue;
      selected.add(item.id);
      for (const id of item.authorityRequirementIds ?? []) selected.add(id);
    }
  }
  const checkpoint = usesSubjectTeachingPolicy(profile) && /\bcheckpoint\b/i.test(competency.title ?? '');
  if (checkpoint) {
    const items = profile.competencies ?? [];
    const index = items.findIndex(item => item.id === competency.id);
    if (index > 0) {
      selected.delete(competency.id);
      for (let i = index - 1; i >= 0; i--) {
        if (/\bcheckpoint\b/i.test(items[i].title ?? '')) break;
        selected.add(items[i].id);
        for (const id of items[i].authorityRequirementIds ?? []) selected.add(id);
      }
    }
  }
  return (profile.instructionalSources ?? []).filter(source =>
    [...selected].some(id => [id, `course-lesson:${id}`, `course:${id}`].includes(source.id)) ||
    (profile.instructionalAuthoring?.provider === 'google' && source.id.startsWith('syllabus:')));
}
