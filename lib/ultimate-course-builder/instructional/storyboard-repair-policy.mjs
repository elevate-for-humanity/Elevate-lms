/** Cue identifiers are diagnostics, not permission to rewrite recorded teaching. */
export function restoreRecordedStoryboardSource(directive) {
  return directive?.target === 'storyboard' &&
    Array.isArray(directive.requirements) && directive.requirements.length > 0 &&
    directive.requirements.every(finding =>
      finding.code === 'ULTIMATE_VIDEO_RENDER_FAILED' &&
      /^(?:ULTIMATE_VIDEO_RENDER_FAILED:)?(?:ULTIMATE_RENDER_APPROVED_AUDIO_REQUIRED|PICTURE_CUE_NOT_ALIGNED_TO_SPEECH|PREMIUM_TEACHING_CUE_NOT_ALIGNED)(?::[^\r\n]+)?$/.test(finding.message));
}
