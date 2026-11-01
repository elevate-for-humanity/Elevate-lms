import { hasActiveMediaTransfer } from './course-video-download.mjs';

const DISPOSABLE_QA_IDLE_MS = 60_000;

export function browserSessionExpired(session, { ttlMs, now = Date.now() }) {
  if (hasActiveMediaTransfer(session.downloads, now)) return false;
  if (session.disposableQa !== true) return session.lastSeen < now - ttlMs;
  // Active QA is as real as any other browser: never interrupt its stream,
  // restoration, input queue, or downloads to make room for another test.
  if (session.restoring || session.streams?.size || session.activeActions > 0) return false;
  return session.lastSeen < now - Math.min(ttlMs, DISPOSABLE_QA_IDLE_MS);
}
