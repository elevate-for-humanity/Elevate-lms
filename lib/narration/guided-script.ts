export interface GuidedNarration {
  welcome: string;
  concept: string;
  example?: string;
  reflection?: string;
  nextStep: string;
}

/**
 * Keeps page narration focused on teaching instead of reading the interface.
 * Each script explains one idea, grounds it in an example, gives the learner
 * a moment to process it, and ends with one concrete action.
 */
export function buildGuidedNarration({
  welcome,
  concept,
  example,
  reflection = 'Take a moment to think about how that fits your goal.',
  nextStep,
}: GuidedNarration): string {
  return [welcome, concept, example, reflection, nextStep]
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .join(' ');
}

