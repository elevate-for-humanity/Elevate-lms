'use client';

/**
 * Session idle timeout — logs user out after 30 minutes of inactivity.
 * Required for government/WIOA compliance (NIST 800-63B).
 */

const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

let timeoutId: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function resetTimer(onTimeout: () => void, timeoutMs: number) {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(onTimeout, timeoutMs);
}

export function initIdleTimeout(onTimeout: () => void, timeoutMs = DEFAULT_IDLE_TIMEOUT_MS) {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  const handler = () => resetTimer(onTimeout, timeoutMs);

  events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
  resetTimer(onTimeout, timeoutMs);

  return () => {
    events.forEach((e) => window.removeEventListener(e, handler));
    if (timeoutId) clearTimeout(timeoutId);
    initialized = false;
  };
}
