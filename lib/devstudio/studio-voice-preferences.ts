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

  if (mode === 'text') stopStudioSpeech();
}

export function shouldStudioSpeak(): boolean {
  return getStudioVoiceMode() === 'voice';
}

export function stopStudioSpeech(): void {
  if (typeof window === 'undefined') return;

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakStudioResponse(text: string): void {
  if (typeof window === 'undefined') return;
  if (!shouldStudioSpeak()) return;
  if (!('speechSynthesis' in window)) return;

  const content = text.trim();
  if (!content) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(content);
  utterance.lang = 'en-US';
  utterance.rate = 1;

  window.speechSynthesis.speak(utterance);
}
