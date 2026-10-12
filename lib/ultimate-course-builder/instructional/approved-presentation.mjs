// Owner-approved presentation; this changes delivery, never Appendix A scope.
export const APPROVED_PREMIUM_PRESENTATION = 'approved-premium-v1';
const courses = new Set([
  '2c723bfa-8c40-4acc-b961-98d917710ffc',
  '9ca9fb50-7119-46ea-ab81-9b0193c29c31',
]);
export function approvedPresentationForCourse(courseId) {
  return courses.has(courseId) ? APPROVED_PREMIUM_PRESENTATION : undefined;
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
const words = value => String(value ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
export function measuredTeachingStep(steps, cues, seconds) {
  const transcript = cues.flatMap(cue => words(cue.text).map(word => ({word,start:cue.startSeconds})));
  let active = 0;
  for (const [index,step] of steps.entries()) {
    const quote = words(step.narrationQuote);
    if (!quote.length) continue;
    const start = transcript.findIndex((_,i)=>quote.every((word,j)=>transcript[i+j]?.word===word));
    if (start < 0) throw new Error('PREMIUM_TEACHING_CUE_NOT_ALIGNED:' + index);
    if (seconds >= transcript[start].start) active=index;
  }
  return active;
}
