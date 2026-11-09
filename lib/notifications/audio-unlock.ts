'use client';

/**
 * Mobile browsers suspend WebAudio until the first user gesture, so an inbound
 * ring produced only from a socket event is silently dropped. Prime a shared
 * AudioContext on the first interaction and ring through it. No asset needed.
 */

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    (window.AudioContext as AudioContextCtor | undefined) ??
    ((window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext);
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  return context;
}

/** Resume the shared context. Returns true only when it is actually running. */
export async function unlockAudio(): Promise<boolean> {
  const ctx = audioContext();
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

/** Attach one-time gesture listeners that unlock audio; returns a cleanup fn. */
export function installAudioUnlock(): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => {
    void unlockAudio();
  };
  const events = ['pointerdown', 'keydown', 'touchstart'] as const;
  for (const name of events) window.addEventListener(name, handler, { once: true, passive: true });
  return () => {
    for (const name of events) window.removeEventListener(name, handler);
  };
}

function beep(ctx: AudioContext, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(Math.min(1, Math.max(0, volume)), now + 0.02);
  gain.gain.linearRampToValueAtTime(0, now + 0.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.42);
}

/** Start a repeating ringtone. Safe to call when audio is not yet unlocked. */
export function startRingtone(volume = 0.6): void {
  void unlockAudio().then((ok) => {
    if (!ok) return;
    const ctx = audioContext();
    if (!ctx) return;
    beep(ctx, volume);
    if (ringTimer) clearInterval(ringTimer);
    ringTimer = setInterval(() => beep(ctx, volume), 1500);
  });
}

export function stopRingtone(): void {
  if (ringTimer) {
    clearInterval(ringTimer);
    ringTimer = null;
  }
}
