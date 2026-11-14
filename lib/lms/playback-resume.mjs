/** Restore durable position even when metadata loaded before React hydration.
 * A seek is not watched-time evidence and this function never starts playback.
 */
export function installPlaybackResume(media, savedPosition, onRestored) {
  let disposed = false, restored = false, requested = false, target = 0;
  const saved = Number(savedPosition);
  const finish = () => {
    if (disposed || restored) return;
    restored = true;
    onRestored?.();
  };
  const restore = () => {
    if (disposed || restored) return;
    if (!Number.isFinite(saved) || saved <= 0) { finish(); return; }
    if (!media || media.readyState < 1 || !Number.isFinite(media.duration) || media.duration <= 0) return;
    target = Math.min(saved, Math.max(0, media.duration - 0.25));
    if (!requested) {
      try { media.currentTime = target; requested = true; } catch { return; }
    }
    if (!media.seeking && Math.abs(media.currentTime - target) <= 0.25) finish();
  };
  const retry = () => { if (!media.seeking) requested = false; restore(); };
  const events = [['loadedmetadata', restore], ['loadeddata', retry], ['canplay', retry], ['seeked', restore]];
  for (const [name, handler] of events) media?.addEventListener(name, handler);
  restore();
  return () => {
    disposed = true;
    for (const [name, handler] of events) media?.removeEventListener(name, handler);
  };
}
