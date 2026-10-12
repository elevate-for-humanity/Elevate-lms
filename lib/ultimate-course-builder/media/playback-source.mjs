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
