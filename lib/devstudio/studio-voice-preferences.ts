export type StudioVoiceMode = 'text' | 'voice';

const STORAGE_KEY = 'elevate-studio-voice-mode';

export function getStudioVoiceMode(): StudioVoiceMode {
  if (typeof window === 'undefined') return 'text';

  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'voice'
      ? 'voice'
      : 'text';
  } catch {
    return 'text';
  }
}

export function setStudioVoiceMode(mode: StudioVoiceMode): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Text mode remains the safe fallback.
  }
}

export function shouldStudioSpeak(): boolean {
  return getStudioVoiceMode() === 'voice';
}

// Speech playback is owned by the shared natural voice hook.
// Do not invoke browser SpeechSynthesis outside that provider.
