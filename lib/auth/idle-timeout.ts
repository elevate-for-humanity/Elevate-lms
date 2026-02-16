'use client';

/**
 * Session idle timeout — logs user out after 30 minutes of inactivity.
 * Required for government/WIOA compliance (NIST 800-63B).
 */

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

let timeoutId: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function resetTimer(onTimeout: () => void) {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(onTimeout, IDLE_TIMEOUT_MS);
}

export function initIdleTimeout(onTimeout: () => void) {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  const handler = () => resetTimer(onTimeout);

  events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
  resetTimer(onTimeout);

  return () => {
    events.forEach((e) => window.removeEventListener(e, handler));
    if (timeoutId) clearTimeout(timeoutId);
    initialized = false;
  };
}
