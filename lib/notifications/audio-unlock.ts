'use client';

/**
 * Mobile browsers suspend WebAudio until the first user gesture, so an inbound
 * ring produced only from a socket event is silently dropped. Prime a shared
 * AudioContext on the first interaction and ring through it. No asset needed.
 */

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;
let ringGeneration = 0;
const activeTones = new Set<OscillatorNode>();

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
  try {
    const ctx = audioContext();
    if (!ctx) return false;
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
  activeTones.add(osc);
  osc.onended = () => {
    activeTones.delete(osc);
    osc.disconnect();
    gain.disconnect();
  };
  osc.start(now);
  osc.stop(now + 0.42);
}

/** Start a repeating ringtone. Safe to call when audio is not yet unlocked. */
export function startRingtone(volume = 0.6): void {
  stopRingtone();
  const generation = ringGeneration;
  void unlockAudio().then((ok) => {
    if (!ok || generation !== ringGeneration) return;
    const ctx = audioContext();
    if (!ctx) return;
    beep(ctx, volume);
    ringTimer = setInterval(() => {
      if (generation === ringGeneration) beep(ctx, volume);
    }, 1500);
  }).catch(() => {
    if (generation === ringGeneration) stopRingtone();
  });
}

export function stopRingtone(): void {
  // Invalidate an outstanding resume() before it can start a late ringtone.
  ringGeneration += 1;
  if (ringTimer) {
    clearInterval(ringTimer);
    ringTimer = null;
  }
  for (const tone of activeTones) {
    try { tone.stop(); } catch { /* The tone may already have ended. */ }
    tone.disconnect();
  }
  activeTones.clear();
}
