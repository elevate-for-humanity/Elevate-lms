/** Only explicit native lifecycle rejections permit another session admission. */
export function retryableBrowserSessionRejection(status: number, payload: unknown): boolean {
  if (status !== 503 || !payload || typeof payload !== 'object') return false;
  const rejection = payload as { error?: unknown; retryable?: unknown };
  return rejection.retryable === true &&
    (rejection.error === 'browser_unavailable' || rejection.error === 'browser_recycling');
}

export async function startStudioBrowserSession<T extends object = Record<string, unknown>>({
  body,
  request = fetch,
  isCurrent = () => true,
  sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)),
}: {
  body: Record<string, unknown>;
  request?: typeof fetch;
  isCurrent?: () => boolean;
  sleep?: (ms: number) => Promise<void>;
}): Promise<{ response: Response; payload: T } | null> {
  const serializedBody = JSON.stringify(body);
  const delays = [500, 1500];
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!isCurrent()) return null;
    // An unknown transport outcome is never replayed. Native owner-scoped
    // admission deduplicates only the explicitly rejected requests below.
    const response = await request('/api/admin/dev-studio/browser/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: serializedBody,
    });
    const payload = await response.json() as T & { retryable?: unknown };
    if (!isCurrent()) return null;
    if (response.status !== 503 || payload?.retryable !== true || attempt === 2)
      return { response, payload };
    await sleep(delays[attempt]);
  }
  return null;
}
