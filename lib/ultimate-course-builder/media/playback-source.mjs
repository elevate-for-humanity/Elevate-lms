/** A stable authenticated endpoint is a valid delivery reference. The MP4
 * remains subject to decoded-stream, narration, caption and learner QA. */
export function renderPlaybackUrl(render) {
  for (const value of [render?.playbackUrl, render?.videoUrl]) {
    if (typeof value !== 'string' || !value.trim()) continue;
    if (/^\/api\/courses\/[^/?#]+\/lessons\/[^/?#]+\/playback$/.test(value)) return value;
    try { if (new URL(value).protocol === 'https:') return value; } catch { /* Not an absolute delivery URL. */ }
  }
  return null;
}

/** The worker inspects stored media before a learner endpoint is published.
 * Keep its source distinct from the authenticated delivery reference. */
export function renderMediaUrl(render) {
  for (const value of [render?.mediaUrl, render?.videoUrl, render?.playbackUrl]) {
    if (typeof value !== 'string') continue;
    try { if (new URL(value).protocol === 'https:') return value; } catch { /* Relative learner routes are not worker media sources. */ }
  }
  return null;
}
