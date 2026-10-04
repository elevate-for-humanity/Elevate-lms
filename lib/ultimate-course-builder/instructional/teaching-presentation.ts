import { teachingVisualStepIndex, type TeachingVisual } from './teaching-visual';

/** One bounded page of the authored teaching plan. The compositor and decoded
 * movie inspector share this state; no status, answer or approval is invented. */
export function teachingPresentation(plan: TeachingVisual, seconds: number, duration: number) {
  if (!Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0 || !plan.steps.length)
    throw new Error('TEACHING_PRESENTATION_TIMING_REQUIRED');
  const activeIndex = teachingVisualStepIndex(seconds, duration, plan.steps.length);
  const pageSize = plan.kind === 'sequence' ? 1 : 2;
  const pageStart = Math.floor(activeIndex / pageSize) * pageSize;
  const rows = plan.steps.slice(pageStart, activeIndex + 1).map((step, offset) => ({
    ...step, index: pageStart + offset, active: pageStart + offset === activeIndex,
  }));
  return {
    kind: plan.kind, activeIndex, rows,
    expectedText: rows.map(row => `${row.label} ${row.value}`).join(' '),
  };
}
