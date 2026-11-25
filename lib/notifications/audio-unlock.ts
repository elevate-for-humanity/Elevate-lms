// Branch refreshed to pick up main (71e31a22): /apply/student E2E fix + Dockerfile.google-lms.
'use client';

/**
 * Mobile browsers suspend WebAudio until the first user gesture, so an inbound
 * ring produced only from a socket event is silently dropped. Prime a shared
 * AudioContext on the first interaction and ring through it. No asset needed.
 *
 * A ring requested while audio is still locked is kept pending: the next
 * gesture retries the unlock and starts the beep mid-call, and callers can
 * watch the ringtone status to show a hint and to fall back to the SIP
 * ringtone when the primary beep cannot start.
 */

type AudioContextCtor = typeof AudioContext;

export type RingtoneStatus = 'idle' | 'ringing' | 'pending' | 'unavailable';

let context: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;
let ringGeneration = 0;
const activeTones = new Set<OscillatorNode>();

// A ring requested while audio was still locked. Kept until the ring starts
// or is stopped, so the next gesture can start it mid-call.
let pendingVolume: number | null = null;
let ringStatus: RingtoneStatus = 'idle';
const statusListeners = new Set<(status: RingtoneStatus) => void>();

function setStatus(status: RingtoneStatus): void {
  if (status === ringStatus) return;
  ringStatus = status;
  for (const listener of statusListeners) listener(status);
}

/** Current ringtone state: idle, ringing, pending, or unavailable. */
export function getRingtoneStatus(): RingtoneStatus {
  return ringStatus;
}

/** Subscribe to ringtone state changes; returns a cleanup function. */
export function onRingtoneStatusChange(
  listener: (status: RingtoneStatus) => void,
): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    (window.AudioContext as AudioContextCtor | undefined) ??
    ((window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext);
  if (!Ctor) return null;
  if (!context) {
    try {
      context = new Ctor();
    } catch {
      return null;
    }
  }
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

function startBeepLoop(ctx: AudioContext, volume: number, generation: number): void {
  beep(ctx, volume);
  ringTimer = setInterval(() => {
    if (generation === ringGeneration) beep(ctx, volume);
  }, 1500);
}

/** Start a ring that was requested while audio was still locked. */
function retryPendingRingtone(): void {
  if (pendingVolume === null) return;
  const generation = ringGeneration;
  const volume = pendingVolume;
  void unlockAudio().then((ok) => {
    if (!ok || generation !== ringGeneration || pendingVolume === null) return;
    const ctx = audioContext();
    if (!ctx) return;
    pendingVolume = null;
    startBeepLoop(ctx, volume, generation);
    setStatus('ringing');
  }).catch(() => {
    // Stay pending: the next gesture retries again.
  });
}

/** Attach one-time gesture listeners that unlock audio; returns a cleanup fn. */
export function installAudioUnlock(): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => {
    void unlockAudio();
    // A call may already be ringing while audio was locked; start it now
    // that the operator has interacted with the page.
    retryPendingRingtone();
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

/**
 * Start a repeating ringtone. Resolves with the ring state: 'ringing' when the
 * beep is sounding, 'pending' when audio is still locked (the ring starts on
 * the next gesture), 'unavailable' when this browser has no audio. Safe to
 * call when audio is not yet unlocked.
 */
export function startRingtone(volume = 0.6): Promise<RingtoneStatus> {
  stopRingtone();
  const generation = ringGeneration;
  const ctx = audioContext();
  if (!ctx) {
    setStatus('unavailable');
    return Promise.resolve('unavailable');
  }
  if (ctx.state === 'running') {
    startBeepLoop(ctx, volume, generation);
    setStatus('ringing');
    return Promise.resolve('ringing');
  }
  // Audio is suspended (no gesture yet): keep the ring pending so the next
  // gesture starts it, and give the one-shot resume a chance to latch.
  pendingVolume = volume;
  setStatus('pending');
  void unlockAudio().then((ok) => {
    if (!ok || generation !== ringGeneration || pendingVolume === null) return;
    const live = audioContext();
    if (!live) return;
    pendingVolume = null;
    startBeepLoop(live, volume, generation);
    setStatus('ringing');
  }).catch(() => {
    // Stay pending: the gesture handler retries on the next interaction.
  });
  return Promise.resolve('pending');
}

export function stopRingtone(): void {
  // Invalidate an outstanding resume() before it can start a late ringtone.
  ringGeneration += 1;
  pendingVolume = null;
  setStatus('idle');
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
