/** Renderer-authored labels and examples are separate from licensed stock.
 * The stock provides the scene context; it is never presumed to contain UI,
 * a training record, a quiz, or an instructional diagram. */
export interface TeachingVisual {
  kind: 'sequence' | 'record' | 'choices' | 'comparison' | 'terms';
  steps: Array<{ label: string; value: string; narrationQuote: string }>;
}
/** Fill an omitted visual plan from the exact authored narration. This is a
 * renderer-owned teaching layer, never a claim that stock demonstrates an
 * action. Preserve every word, in order; do not invent a record or approval. */
export function produceTeachingVisual(narration: string, stage: string): TeachingVisual {
  const words = narration.trim().split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let chunk = '';
  for (const word of words) {
    if (word.length > 160) throw new Error('BLUEPRINT_TEACHING_VISUAL_TEXT_TOO_LONG');
    if (chunk && `${chunk} ${word}`.length > 160) {
      chunks.push(chunk);
      chunk = '';
    }
    chunk = chunk ? `${chunk} ${word}` : word;
  }
  if (chunk) chunks.push(chunk);
  const plan: TeachingVisual = {
    kind: 'sequence',
    steps: chunks.map((value, index) => ({
      label: `${stage.replace(/_/g, ' ').slice(0, 40)} ${index + 1}`,
      value,
      narrationQuote: value,
    })),
  };
  validateTeachingVisual(plan, narration);
  return plan;
}
export function validateTeachingVisual(plan: TeachingVisual, narration: string) {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  if (
    !['sequence', 'record', 'choices', 'comparison', 'terms'].includes(plan?.kind) ||
    !plan.steps?.length ||
    plan.steps.length > 32
  )
    throw new Error('BLUEPRINT_TEACHING_VISUAL_REQUIRED');
  for (const step of plan.steps) {
    if (
      !step.label?.trim() ||
      !step.value?.trim() ||
      step.label.length > 55 ||
      step.value.length > 160 ||
      !step.narrationQuote?.trim() ||
      normalize(step.value) !== normalize(step.narrationQuote) ||
      !normalize(narration).includes(normalize(step.narrationQuote))
    )
      throw new Error('BLUEPRINT_TEACHING_VISUAL_NOT_SCRIPT_BOUND');
  }
}
/** The same timing is used by the compositor and the decoded-frame inspector. */
export function teachingVisualStepIndex(seconds: number, durationSeconds: number, count: number) {
  return Math.min(count - 1, Math.max(0, Math.floor(seconds / (durationSeconds / count))));
}
