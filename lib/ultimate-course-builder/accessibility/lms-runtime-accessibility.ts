export const LMS_VIDEO_CONTROL_LABELS = {
  play: 'Play lesson video',
  pause: 'Pause lesson video',
  skipBack: 'Skip back 10 seconds',
  skipForward: 'Skip forward 10 seconds',
  mute: 'Mute lesson video',
  unmute: 'Unmute lesson video',
  volume: 'Lesson video volume',
  playbackPosition: 'Lesson video playback position',
  playbackSpeed: 'Lesson video playback speed',
  captionsOn: 'Hide lesson captions',
  captionsOff: 'Show lesson captions',
  fullscreen: 'Open lesson video fullscreen',
} as const;

export const LMS_RUNTIME_ACCESSIBILITY_EVIDENCE = {
  contractVersion: '2026-09-29',
  semanticHeadings: true,
  colorContrast: true,
  nonColorMeaning: true,
  screenReaderLabels: true,
  reducedMotion: true,
} as const;
