/** Restore synthesis feedback from the saved, measured delivered-audio failure.
 * A generic missing-checkpoint finding cannot tell the producer how to fix pace.
 */
export function measuredNarrationRepair(qa, previous) {
  if (qa?.source !== 'delivered-mp4' || !qa.mediaSha256 || qa.pass !== false ||
      !Array.isArray(qa.failures) || !qa.failures.includes('PACE_OUT_OF_RANGE') ||
      qa.metrics?.wordsPerMinute?.measured !== true ||
      !Number.isFinite(qa.metrics.wordsPerMinute.value) || !previous?.narration) return null;
  return {
    version: 'verified-repair-v1', target: 'natural_narration', failedStep: 'narration_qa', attempt: 1,
    previous,
    requirements: [{code:'PACE_OUT_OF_RANGE', message:'Delivered narration failed PACE_OUT_OF_RANGE: '+
      JSON.stringify({metrics:qa.metrics,unknown:qa.unknown ?? []})}],
    instructions:'Correct the measured narration pace using the saved synthesis feedback, then render and independently inspect the delivered audio again.',
  };
}
