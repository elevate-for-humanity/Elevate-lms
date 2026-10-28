// Transport acknowledges only successful API saves. This never awards credit.
export async function sendPlaybackEvent(payload, {
  fetchImpl = globalThis.fetch,
  wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchImpl('/api/video-playback-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
        keepalive: payload.eventType === 'pause' || payload.eventType === 'ended',
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.saved === true) return { saved: true };
      if (response.status < 500 || attempt === 2) {
        return { saved: false, status: response.status, code: body.code,
          error: body.error || 'Your playback could not be recorded. Check your connection and try again.' };
      }
    } catch {
      if (attempt === 2) return { saved: false, error: 'Your playback could not be recorded. Check your connection and try again.' };
    }
    await wait(250 * (attempt + 1));
  }
  return { saved: false, error: 'Your playback could not be recorded.' };
}
