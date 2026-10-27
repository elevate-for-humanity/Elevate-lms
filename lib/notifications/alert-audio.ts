'use client';
import { playNaturalVoiceNotification } from '@/components/voice/useNaturalVoice';
import { ALERT_PHRASES, type PwaAlertSettings } from './pwa-alert-settings';
let context: AudioContext | undefined;
export async function playAlert(
  settings: PwaAlertSettings,
  kind: keyof typeof ALERT_PHRASES = 'email',
) {
  if (settings.sound === 'silent' || settings.volume === 0) return;
  if (settings.sound === 'voice') {
    const played = await playNaturalVoiceNotification(ALERT_PHRASES[kind], settings.volume);
    if (!played)
      throw Error('Spoken alerts are unavailable on this device. Choose a chime instead.');
    return;
  }
  if (!('AudioContext' in window)) throw Error('Audio alerts are unavailable on this device.');
  context ??= new AudioContext();
  await context.resume();
  if (context.state !== 'running') throw Error('Tap Test sound to allow audio on this device.');
  const notes =
    settings.sound === 'bell'
      ? [880, 660]
      : settings.sound === 'soft'
        ? [440, 550]
        : [660, 880, 990];
  notes.forEach((frequency, index) => {
    const oscillator = context!.createOscillator(),
      gain = context!.createGain(),
      start = context!.currentTime + index * 0.18;
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(settings.volume * 0.18, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
    oscillator.connect(gain);
    gain.connect(context!.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.34);
  });
}
