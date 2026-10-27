import {quoteStartSeconds} from './picture-timeline.mjs';

// Owner-approved presentation; this changes delivery, never Appendix A scope.
export const APPROVED_PREMIUM_PRESENTATION = 'approved-premium-v1';
// No course IDs are forced into a presentation template.
// Existing quality checks remain available for explicitly approved premium builds.
export function approvedPresentationForCourse(_courseId) {
  return undefined;
}
export function narrationSceneSeconds(seconds, premium = false, fps = 30) {
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('NARRATION_DURATION_REQUIRED');
  return premium ? Math.ceil(seconds * fps) / fps : Math.max(4, Math.ceil(seconds) + 1);
}
export function presentationBookendFrames(premium = false) {
  return premium ? { intro: 0, outro: 0 } : { intro: 90, outro: 60 };
}
export function assertNarratedScenes(scenes) {
  for (const scene of scenes) {
    if (!scene.narration?.trim() || !scene.audioSrc)
      throw new Error('PREMIUM_NARRATION_MISSING:' + scene.scene_number);
    if (!scene.clipUrl && !scene.imageUrl)
      throw new Error('PREMIUM_VISUAL_MISSING:' + scene.scene_number);
  }
}
export function assertPremiumSpeechSignal(output) {
  const peak = /max_volume:\s*(-?[\d.]+)\s*dB/i.exec(output);
  if (!peak || Number(peak[1]) < -40) throw new Error('PREMIUM_NARRATION_INAUDIBLE');
  if (/silence_start:/.test(output)) throw new Error('PREMIUM_NARRATION_SILENT_GAP');
}
// Alignment depends on the immutable narration transcript and presentation steps,
// not on the frame time. Avoid repeating transcript matching for every video frame.
const teachingTimingCache = new WeakMap();
export function measuredTeachingStep(steps, cues, seconds) {
  if (!Array.isArray(steps) || !Array.isArray(cues)) throw new Error('PREMIUM_TEACHING_CUES_REQUIRED');
  let bySteps = teachingTimingCache.get(cues);
  if (!bySteps) {
    bySteps = new WeakMap();
    teachingTimingCache.set(cues, bySteps);
  }
  let aligned = bySteps.get(steps);
  if (!aligned) {
    aligned = steps.map((step,index) => {
      if (!String(step.narrationQuote ?? '').trim()) return null;
      try { return quoteStartSeconds(step.narrationQuote,cues); }
      catch { throw new Error('PREMIUM_TEACHING_CUE_NOT_ALIGNED:' + index); }
    });
    bySteps.set(steps,aligned);
  }
  let active = 0;
  for (let index = 0; index < aligned.length; index++) {
    if (aligned[index] !== null && seconds >= aligned[index]) active = index;
  }
  return active;
}
